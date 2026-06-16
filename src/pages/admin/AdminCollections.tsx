import { useEffect, useRef, useState } from 'react';
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
import { Plus, Pencil, Trash2, FolderOpen, Package, Check, Upload, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

type Collection = Tables<'collections'> & {
  product_collections?: { product_id: string; products?: { id: string; name: string; slug: string } }[];
};
type Product = { id: string; name: string; slug: string; primary_image?: string };
const emptyForm = { name: '', slug: '', description: '', image_url: '', is_active: true, is_featured: false };

export default function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [managingCollection, setManagingCollection] = useState<Collection | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [savingProducts, setSavingProducts] = useState(false);

  const fetchCollections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('collections')
      .select('*, product_collections(product_id, products(id, name, slug))')
      .order('display_order', { ascending: true });
    if (error) toast({ title: 'Error loading collections', variant: 'destructive' });
    else setCollections((data ?? []) as Collection[]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, slug, product_variants(product_images(image_url, is_primary))')
      .eq('is_active', true)
      .order('name');
    if (data) {
      setAllProducts(data.map((p: any) => ({
        id: p.id, name: p.name, slug: p.slug,
        primary_image: p.product_variants?.flatMap((v: any) => v.product_images || [])?.find((img: any) => img.is_primary)?.image_url ||
          p.product_variants?.flatMap((v: any) => v.product_images || [])?.[0]?.image_url,
      })));
    }
  };

  useEffect(() => { fetchCollections(); fetchProducts(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setPreviewImage(null); setImageFile(null); setDialogOpen(true); };
  const openEdit = (c: Collection) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', image_url: c.image_url || '', is_active: c.is_active ?? true, is_featured: c.is_featured ?? false });
    setPreviewImage(c.image_url || null);
    setImageFile(null);
    setDialogOpen(true);
  };

  const openManageProducts = (collection: Collection) => {
    setManagingCollection(collection);
    setSelectedProductIds(new Set((collection.product_collections || []).map(pc => pc.product_id)));
    setProductDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast({ title: 'Name and slug are required', variant: 'destructive' }); return; }
    setSaving(true);
    let imageUrl = form.image_url || null;
    if (imageFile) {
      setUploadingImage(true);
      const cleanName = imageFile.name.replace(/\s+/g, '-').toLowerCase();
      const filePath = `collections/${Date.now()}-${cleanName}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, imageFile);
      if (uploadError) {
        toast({ title: 'Image upload failed', description: uploadError.message, variant: 'destructive' });
        setSaving(false);
        setUploadingImage(false);
        return;
      }
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
      setUploadingImage(false);
    }
    const payload = { name: form.name, slug: form.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), description: form.description || null, image_url: imageUrl, is_active: form.is_active, is_featured: form.is_featured };
    if (editing) {
      const { error } = await supabase.from('collections').update(payload).eq('id', editing.id);
      if (error) toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Collection updated!' }); setDialogOpen(false); fetchCollections(); }
    } else {
      const { error } = await supabase.from('collections').insert(payload);
      if (error) toast({ title: 'Failed to create', description: error.message, variant: 'destructive' });
      else { toast({ title: 'Collection created!' }); setDialogOpen(false); fetchCollections(); }
    }
    setSaving(false);
  };

  const handleSaveProducts = async () => {
    if (!managingCollection) return;
    setSavingProducts(true);
    await supabase.from('product_collections').delete().eq('collection_id', managingCollection.id);
    if (selectedProductIds.size > 0) {
      const inserts = Array.from(selectedProductIds).map((productId, index) => ({ collection_id: managingCollection.id, product_id: productId, display_order: index + 1 }));
      const { error } = await supabase.from('product_collections').insert(inserts);
      if (error) { toast({ title: 'Failed to save products', description: error.message, variant: 'destructive' }); setSavingProducts(false); return; }
    }
    toast({ title: `Saved ${selectedProductIds.size} products` });
    setProductDialogOpen(false);
    fetchCollections();
    setSavingProducts(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('collections').delete().eq('id', id);
    if (error) toast({ title: 'Failed to delete', variant: 'destructive' });
    else { toast({ title: 'Collection deleted' }); fetchCollections(); }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Collections</h1>
          <p className="text-muted-foreground text-sm mt-1">{collections.length} total collections</p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Collection</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : collections.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground"><FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No collections found</p></div>
          ) : (
            <div className="divide-y divide-border">
              {collections.map((collection) => {
                const productCount = collection.product_collections?.length || 0;
                return (
                  <div key={collection.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{collection.name}</p>
                        {collection.is_featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                        <Badge variant={collection.is_active ? 'default' : 'secondary'} className="text-xs">{collection.is_active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{collection.slug}</p>
                      {productCount > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {(collection.product_collections || []).slice(0, 4).map((pc) => (
                            <span key={pc.product_id} className="text-xs bg-muted px-2 py-0.5 rounded-full">{pc.products?.name || 'Product'}</span>
                          ))}
                          {productCount > 4 && <span className="text-xs text-muted-foreground">+{productCount - 4} more</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground"><Package className="w-4 h-4" /><span>{productCount}</span></div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => openManageProducts(collection)} className="text-xs">
                        <Package className="w-3 h-3 mr-1" /> Products
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(collection)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                            <AlertDialogDescription>Delete "{collection.name}"? Products won't be deleted.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(collection.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Collection' : 'Add Collection'}</DialogTitle>
            <DialogDescription>Fill in the collection details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} placeholder="Summer Collection" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="summer-collection" />
              </div>
            </div>
            {/* Image Upload */}
            <div>
              <Label>Cover Photo</Label>
              <div
                className="mt-2 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewImage ? (
                  <div className="relative inline-block">
                    <img src={previewImage} alt="Preview" className="h-32 w-full object-cover rounded-lg" />
                    <button type="button" className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      onClick={(e) => { e.stopPropagation(); setPreviewImage(null); setImageFile(null); setForm(f => ({ ...f, image_url: '' })); }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="py-3">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-sm text-muted-foreground">Click to upload cover photo</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setImageFile(file); setPreviewImage(URL.createObjectURL(file)); }
                  }} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Collection description..." rows={3} />
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="rounded" />
                <span className="text-sm">Featured</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving || uploadingImage ? 'Saving...' : editing ? 'Save Changes' : 'Create Collection'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Products</DialogTitle>
            <DialogDescription>{managingCollection?.name} — {selectedProductIds.size} selected</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Click products to add/remove from collection</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedProductIds(new Set(allProducts.map(p => p.id)))}>Select All</Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedProductIds(new Set())}>Clear</Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
              {allProducts.map((product) => {
                const isSelected = selectedProductIds.has(product.id);
                return (
                  <div key={product.id} onClick={() => toggleProduct(product.id)}
                    className={`relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                  >
                    <div className="aspect-[3/4] bg-muted">
                      {product.primary_image ? (
                        <img src={product.primary_image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground opacity-30" /></div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-0.5"><Check className="w-3 h-3" /></div>
                    )}
                    <div className="p-2"><p className="text-xs font-medium truncate">{product.name}</p></div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProducts} disabled={savingProducts}>{savingProducts ? 'Saving...' : `Save ${selectedProductIds.size} Products`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
