import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Search, Package, Images, AlertTriangle, Upload, X, Check, Grid3x3 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ProductImageManager } from '@/components/admin/ProductImageManager';
import { VariantGenerator } from '@/components/inventory/VariantGenerator';

type VariantWithImages = Pick<Tables<'product_variants'>, 'id' | 'price' | 'compare_at_price' | 'stock_quantity' | 'color' | 'size' | 'sku' | 'low_stock_threshold' | 'is_active'> & {
  product_images: Pick<Tables<'product_images'>, 'id' | 'image_url' | 'is_primary' | 'display_order' | 'variant_id' | 'alt_text'>[];
};

type Product = Tables<'products'> & {
  product_variants: VariantWithImages[];
  categories?: { id: string; name: string } | null;
};

type Category = { id: string; name: string; slug: string };

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Standard', 'Free Size'];
const COLORS = ['Black', 'White', 'Navy Blue', 'Grey', 'Brown', 'Beige', 'Cream', 'Rose Pink', 'Dusty Pink', 'Maroon', 'Olive Green', 'Teal', 'Purple', 'Coral', 'Mustard'];

const emptyForm = {
  name: '', slug: '', short_description: '', description: '',
  fabric_type: '', care_instructions: '', is_active: true, is_featured: false, is_trending: false,
  category_id: '',
};

const emptyVariant = {
  color: '', customColor: '', size: '', price: '', compare_at_price: '',
  stock_quantity: '0', sku: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingVariant, setEditingVariant] = useState<VariantWithImages | null>(null);
  const [imageProduct, setImageProduct] = useState<{ id: string; name: string } | null>(null);
  const [generatorProduct, setGeneratorProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [variantForm, setVariantForm] = useState(emptyVariant);
  const [saving, setSaving] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name), product_variants(id, price, compare_at_price, stock_quantity, color, size, sku, low_stock_threshold, is_active, product_images(id, image_url, is_primary, display_order, variant_id, alt_text))')
      .order('created_at', { ascending: false });

    if (error) toast({ title: 'Error loading products', variant: 'destructive' });
    else setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, slug').eq('is_active', true).order('display_order');
    setCategories(data ?? []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug,
      short_description: p.short_description || '',
      description: p.description || '',
      fabric_type: p.fabric_type || '',
      care_instructions: p.care_instructions || '',
      is_active: p.is_active ?? true,
      is_trending: p.is_trending ?? false,
      is_featured: p.is_featured ?? false,
      category_id: p.category_id || '',
    });
    setDialogOpen(true);
  };

  const openAddVariant = (product: Product) => {
    setSelectedProduct(product);
    setEditingVariant(null);
    setVariantForm(emptyVariant);
    setPreviewImage(null);
    setImageFile(null);
    setVariantDialogOpen(true);
  };

  const openEditVariant = (product: Product, variant: VariantWithImages) => {
    setSelectedProduct(product);
    setEditingVariant(variant);
    const primaryImg = variant.product_images.find(i => i.is_primary) || variant.product_images[0];
    setPreviewImage(primaryImg?.image_url || null);
    setImageFile(null);
    setVariantForm({
      color: COLORS.includes(variant.color) ? variant.color : 'custom',
      customColor: COLORS.includes(variant.color) ? '' : variant.color,
      size: variant.size || '',
      price: String(variant.price),
      compare_at_price: variant.compare_at_price ? String(variant.compare_at_price) : '',
      stock_quantity: String(variant.stock_quantity || 0),
      sku: variant.sku,
    });
    setVariantDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) {
      toast({ title: 'Name and slug are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug.toLowerCase().replace(/\s+/g, '-'),
      short_description: form.short_description || null,
      description: form.description || null,
      fabric_type: form.fabric_type || null,
      care_instructions: form.care_instructions || null,
      is_active: form.is_active,
      is_trending: form.is_trending,
      is_featured: form.is_featured,
      category_id: form.category_id || null,
    };

    if (editing) {
      const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
      if (error) toast({ title: 'Failed to update product', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Product updated!' }); setDialogOpen(false); fetchProducts(); }
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) toast({ title: 'Failed to create product', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Product created! Now add variants.' }); setDialogOpen(false); fetchProducts(); }
    }
    setSaving(false);
  };

  const handleSaveVariant = async () => {
    if (!selectedProduct) return;
    const colorValue = variantForm.color === 'custom' ? variantForm.customColor : variantForm.color;
    if (!colorValue || !variantForm.price || !variantForm.sku) {
      toast({ title: 'Color, price and SKU are required', variant: 'destructive' });
      return;
    }
    setSavingVariant(true);

    const variantPayload = {
      product_id: selectedProduct.id,
      color: colorValue,
      size: variantForm.size || null,
      price: parseFloat(variantForm.price),
      compare_at_price: variantForm.compare_at_price ? parseFloat(variantForm.compare_at_price) : null,
      stock_quantity: parseInt(variantForm.stock_quantity) || 0,
      sku: variantForm.sku,
      is_active: true,
    };

    let variantId = editingVariant?.id;

    if (editingVariant) {
      const { error } = await supabase.from('product_variants').update(variantPayload).eq('id', editingVariant.id);
      if (error) {
        toast({ title: 'Failed to update variant', description: error.message, variant: 'destructive' });
        setSavingVariant(false);
        return;
      }
    } else {
      const { data, error } = await supabase.from('product_variants').insert(variantPayload).select().single();
      if (error) {
        toast({ title: 'Failed to create variant', description: error.message, variant: 'destructive' });
        setSavingVariant(false);
        return;
      }
      variantId = data.id;
    }

    // Upload image if selected
    if (imageFile && variantId) {
      setUploadingImage(true);
      const cleanName = imageFile.name.replace(/\s+/g, '-').toLowerCase();
      const filePath = `${variantId}/${Date.now()}-${cleanName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);
      if (uploadError) {
        toast({ title: 'Image upload failed', description: uploadError.message, variant: 'destructive' });
      } else {
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        // Remove old primary if editing
        if (editingVariant) {
          await supabase.from('product_images').update({ is_primary: false }).eq('variant_id', variantId);
        }
        await supabase.from('product_images').insert({
          variant_id: variantId,
          image_url: urlData.publicUrl,
          alt_text: `${selectedProduct.name} ${colorValue}`,
          is_primary: true,
          display_order: 1,
        });
      }
      setUploadingImage(false);
    }

    toast({ title: editingVariant ? 'Variant updated!' : 'Variant added!' });
    setVariantDialogOpen(false);
    setPreviewImage(null);
    setImageFile(null);
    fetchProducts();
    setSavingVariant(false);
  };

  // Anything that appears in a past order can't be deleted: the database keeps it so order history
  // stays complete (23502/23503 = the order_items link refuses to be removed). Hide it instead.
  const isInPastOrders = (error: { code?: string }) => error.code === '23502' || error.code === '23503';

  const deleteOrHide = async (table: 'products' | 'product_variants', id: string, label: string) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      toast({ title: `${label} deleted` });
    } else if (isInPastOrders(error)) {
      const { error: hideError } = await supabase.from(table).update({ is_active: false }).eq('id', id);
      if (hideError) {
        toast({ title: `Failed to delete ${label.toLowerCase()}`, description: hideError.message, variant: 'destructive' });
      } else {
        toast({
          title: 'Hidden from the shop instead',
          description: `This ${label.toLowerCase()} is in past orders, so it was kept for order history and marked Inactive. Customers can no longer see or buy it.`,
        });
      }
    } else {
      toast({ title: `Failed to delete ${label.toLowerCase()}`, description: error.message, variant: 'destructive' });
    }
    fetchProducts();
  };

  const handleDeleteVariant = (variantId: string) => deleteOrHide('product_variants', variantId, 'Variant');
  const handleDelete = (id: string) => deleteOrHide('products', id, 'Product');

  const filtered = useMemo(() => {
    let list = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
    );
    if (showLowStock) {
      list = list.filter(p => p.product_variants.some(v => (v.stock_quantity || 0) <= (v.low_stock_threshold || 5)));
    }
    return list;
  }, [products, search, showLowStock]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} products · products marked "Live" appear on the website. Change stock under Inventory → Stock.</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button variant={showLowStock ? 'default' : 'outline'} onClick={() => setShowLowStock(!showLowStock)} className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Low Stock
        </Button>
      </div>

      {/* Products List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((product) => {
                const lowestPrice = product.product_variants.length > 0
                  ? Math.min(...product.product_variants.map(v => Number(v.price))) : null;
                const totalStock = product.product_variants.reduce((s, v) => s + (v.stock_quantity || 0), 0);
                const hasLowStock = product.product_variants.some(v => (v.stock_quantity || 0) <= (v.low_stock_threshold || 5));
                const primaryImage = product.product_variants
                  .flatMap(v => v.product_images)
                  .find(img => img.is_primary) || product.product_variants.flatMap(v => v.product_images)[0];

                return (
                  <div key={product.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                    {/* Product Row */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {primaryImage ? (
                          <img src={primaryImage.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{product.name}</p>
                          {product.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                          {product.is_trending && <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-800">Trending</Badge>}
                          {hasLowStock && <Badge variant="destructive" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />Low Stock</Badge>}
                          <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">{product.is_active ? 'Live on website' : 'Hidden'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{product.categories?.name || 'No category'} • {product.product_variants.length} variants • Stock: {totalStock}</p>
                        {lowestPrice != null && <p className="text-sm font-semibold text-primary">{formatPrice(lowestPrice)}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" onClick={() => setGeneratorProduct(product)} className="hidden sm:flex items-center gap-1" title="Create every colour x size with SKUs automatically">
                          <Grid3x3 className="w-3 h-3" /> Colours & sizes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openAddVariant(product)} className="hidden sm:flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Variant
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setImageProduct({ id: product.id, name: product.name })}>
                          <Images className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>Delete "{product.name}"? This cannot be undone. If it has been ordered before, it will be hidden from the shop instead, so order history stays complete.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(product.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Variants */}
                    {product.product_variants.length > 0 && (
                      <div className="mt-3 ml-16 space-y-2">
                        {product.product_variants.map(variant => (
                          <div key={variant.id} className="flex items-center gap-3 bg-muted/40 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <span className="font-medium">{variant.color}{variant.size ? ` / ${variant.size}` : ''}</span>
                              <span className="text-muted-foreground">SKU: {variant.sku}</span>
                              <span className="font-semibold text-primary">{formatPrice(Number(variant.price))}</span>
                              {variant.compare_at_price && (
                                <span className="line-through text-muted-foreground">{formatPrice(Number(variant.compare_at_price))}</span>
                              )}
                              <span className={`${(variant.stock_quantity || 0) <= 5 ? 'text-red-500' : 'text-green-600'}`}>
                                Stock: {variant.stock_quantity}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditVariant(product, variant)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Variant</AlertDialogTitle>
                                    <AlertDialogDescription>Delete {variant.color} {variant.size} variant? If it has been ordered before, it will be hidden from the shop instead.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteVariant(variant.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setGeneratorProduct(product)} className="text-xs text-muted-foreground hover:text-foreground">
                            <Grid3x3 className="w-3 h-3 mr-1" /> Add colours & sizes
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openAddVariant(product)} className="text-xs text-muted-foreground hover:text-foreground">
                            <Plus className="w-3 h-3 mr-1" /> Add one variant
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>Fill in the product details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))}
                  placeholder="Premium Silk Hijab"
                />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="premium-silk-hijab" />
              </div>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Short Description</Label>
              <Input value={form.short_description} onChange={(e) => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="Brief description" />
            </div>

            <div>
              <Label>Full Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed product description..." rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fabric Type</Label>
                <Input value={form.fabric_type} onChange={(e) => setForm(f => ({ ...f, fabric_type: e.target.value }))} placeholder="Pure Silk, Chiffon..." />
              </div>
              <div>
                <Label>Care Instructions</Label>
                <Input value={form.care_instructions} onChange={(e) => setForm(f => ({ ...f, care_instructions: e.target.value }))} placeholder="Hand wash cold" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm">Live on website</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" title="Shown in the Trending Now row on the home page">
                <input type="checkbox" checked={form.is_trending} onChange={(e) => setForm(f => ({ ...f, is_trending: e.target.checked }))} className="rounded" />
                <span className="text-sm">Trending</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Variant Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVariant ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
            <DialogDescription>{selectedProduct?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">

            {/* Image Upload */}
            <div>
              <Label>Product Image</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <div className="relative inline-block">
                    <img src={previewImage} alt="Preview" className="h-40 w-40 object-cover rounded-lg mx-auto" />
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setImageFile(null); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP supported</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <Label>Color *</Label>
              <Select value={variantForm.color} onValueChange={(v) => setVariantForm(f => ({ ...f, color: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="custom">+ Custom Color</SelectItem>
                </SelectContent>
              </Select>
              {variantForm.color === 'custom' && (
                <Input
                  className="mt-2"
                  value={variantForm.customColor}
                  onChange={(e) => setVariantForm(f => ({ ...f, customColor: e.target.value }))}
                  placeholder="Enter custom color name"
                />
              )}
            </div>

            {/* Size */}
            <div>
              <Label>Size</Label>
              <Select value={variantForm.size} onValueChange={(v) => setVariantForm(f => ({ ...f, size: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Size</SelectItem>
                  {SIZES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price (₹) *</Label>
                <Input
                  type="number"
                  value={variantForm.price}
                  onChange={(e) => setVariantForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="899"
                  min="0"
                />
              </div>
              <div>
                <Label>Compare At Price (₹)</Label>
                <Input
                  type="number"
                  value={variantForm.compare_at_price}
                  onChange={(e) => setVariantForm(f => ({ ...f, compare_at_price: e.target.value }))}
                  placeholder="1199 (optional)"
                  min="0"
                />
              </div>
            </div>

            {/* SKU & Stock */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>SKU *</Label>
                <Input
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
                  placeholder="PSH-BLK-001"
                />
              </div>
              <div>
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  value={variantForm.stock_quantity}
                  onChange={(e) => setVariantForm(f => ({ ...f, stock_quantity: e.target.value }))}
                  placeholder="50"
                  min="0"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariantDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVariant} disabled={savingVariant || uploadingImage}>
              {savingVariant || uploadingImage ? 'Saving...' : editingVariant ? 'Update Variant' : 'Add Variant'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colours x sizes generator */}
      <VariantGenerator product={generatorProduct} onClose={() => setGeneratorProduct(null)} onSaved={fetchProducts} />

      {/* Image Manager */}
      {imageProduct && (
        <ProductImageManager
          open={!!imageProduct}
          onOpenChange={(next) => !next && setImageProduct(null)}
          productId={imageProduct.id}
          productName={imageProduct.name}
          onUpdated={fetchProducts}
        />
      )}
    </div>
  );
}