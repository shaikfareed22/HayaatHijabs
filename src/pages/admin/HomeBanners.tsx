import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Images, Pencil, Plus, Trash2, Smartphone, Monitor } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { errorMessage } from '@/lib/inventory';
import { HomeBanner, bannerLink } from '@/lib/storefront';

// Hero slideshow on the website home page. Each banner can open a collection, the Sale page or a link.

const DESKTOP_SIZE = '1920 × 900 px';
const MOBILE_SIZE = '1080 × 1350 px';
const MAX_MB = 2;
const BUCKET = 'product-images';

type LinkType = HomeBanner['link_type'];

interface FormState {
  title: string;
  subtitle: string;
  button_text: string;
  image_url: string;
  mobile_image_url: string;
  link_type: LinkType;
  collection_id: string;
  link_url: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  title: '', subtitle: '', button_text: 'Shop Now', image_url: '', mobile_image_url: '',
  link_type: 'collection', collection_id: '', link_url: '', is_active: true,
};

async function uploadBanner(file: File, kind: 'desktop' | 'mobile'): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file (JPG, PNG or WebP).');
  if (file.size > MAX_MB * 1024 * 1024) throw new Error(`Image is too large. Keep it under ${MAX_MB} MB (compress it first).`);
  const clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `banners/${kind}-${Date.now()}-${clean}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function HomeBanners() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HomeBanner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'desktop' | 'mobile' | null>(null);
  const desktopInput = useRef<HTMLInputElement>(null);
  const mobileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const [b, c] = await Promise.all([
      supabase.from('home_banners').select('*, collections(slug, name)').order('display_order'),
      supabase.from('collections').select('id, name, slug').eq('is_active', true).order('display_order'),
    ]);
    if (b.error) toast({ title: 'Could not load banners', description: errorMessage(b.error), variant: 'destructive' });
    setBanners((b.data ?? []) as unknown as HomeBanner[]);
    setCollections(c.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (b: HomeBanner) => {
    setEditing(b);
    setForm({
      title: b.title ?? '', subtitle: b.subtitle ?? '', button_text: b.button_text ?? 'Shop Now',
      image_url: b.image_url, mobile_image_url: b.mobile_image_url ?? '',
      link_type: b.link_type, collection_id: b.collection_id ?? '', link_url: b.link_url ?? '', is_active: b.is_active,
    });
    setDialogOpen(true);
  };

  const onPick = async (kind: 'desktop' | 'mobile', file: File | undefined) => {
    if (!file) return;
    setUploading(kind);
    try {
      const url = await uploadBanner(file, kind);
      setForm((f) => (kind === 'desktop' ? { ...f, image_url: url } : { ...f, mobile_image_url: url }));
    } catch (e) {
      toast({ title: 'Upload failed', description: errorMessage(e), variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form.image_url) return toast({ title: 'Upload the banner image first', variant: 'destructive' });
    if (form.link_type === 'collection' && !form.collection_id) return toast({ title: 'Choose which collection the banner opens', variant: 'destructive' });
    if (form.link_type === 'url' && !form.link_url.trim()) return toast({ title: 'Enter the link', variant: 'destructive' });

    const payload = {
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      button_text: form.button_text.trim() || null,
      image_url: form.image_url,
      mobile_image_url: form.mobile_image_url || null,
      link_type: form.link_type,
      collection_id: form.link_type === 'collection' || form.link_type === 'sale' ? form.collection_id || null : null,
      link_url: form.link_type === 'url' ? form.link_url.trim() : null,
      is_active: form.is_active,
    };
    setSaving(true);
    const { error } = editing
      ? await supabase.from('home_banners').update(payload).eq('id', editing.id)
      : await supabase.from('home_banners').insert({ ...payload, display_order: (banners.at(-1)?.display_order ?? -1) + 1 });
    setSaving(false);
    if (error) return toast({ title: 'Banner not saved', description: errorMessage(error), variant: 'destructive' });
    toast({ title: editing ? 'Banner updated' : 'Banner added', description: 'The website home page shows it right away.' });
    setDialogOpen(false);
    load();
  };

  const remove = async (b: HomeBanner) => {
    const { error } = await supabase.from('home_banners').delete().eq('id', b.id);
    if (error) return toast({ title: 'Failed to delete', description: errorMessage(error), variant: 'destructive' });
    // Best effort: remove the uploaded files too.
    const paths = [b.image_url, b.mobile_image_url].filter(Boolean).map((u) => u!.split(`/${BUCKET}/`)[1]).filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    toast({ title: 'Banner deleted' });
    load();
  };

  const toggle = async (b: HomeBanner) => {
    await supabase.from('home_banners').update({ is_active: !b.is_active }).eq('id', b.id);
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const other = index + dir;
    if (other < 0 || other >= banners.length) return;
    const a = banners[index], b = banners[other];
    await Promise.all([
      supabase.from('home_banners').update({ display_order: b.display_order }).eq('id', a.id),
      supabase.from('home_banners').update({ display_order: a.display_order }).eq('id', b.id),
    ]);
    load();
  };

  const linkLabel = (b: HomeBanner) => {
    const href = bannerLink(b);
    if (b.link_type === 'collection') return `Collection: ${b.collections?.name ?? '—'}`;
    if (b.link_type === 'sale') return b.collections?.name ? `Sale: ${b.collections.name}` : 'All sale items';
    if (b.link_type === 'url') return href ?? '';
    return 'Not clickable';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-luxury font-semibold">Home Banner</h1>
          <p className="text-muted-foreground text-sm mt-1">
            The slideshow at the top of the website. Banners rotate every 5 seconds in the order below.
          </p>
        </div>
        <Button onClick={openAdd}><Plus className="w-4 h-4 mr-2" /> Add banner</Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-4 text-sm flex flex-col sm:flex-row gap-4 sm:gap-10">
          <div className="flex items-start gap-2"><Monitor className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><strong>Main image: {DESKTOP_SIZE}</strong><br /><span className="text-muted-foreground">JPG or WebP, under 400 KB. Keep the subject in the centre; on phones the sides are cropped.</span></div></div>
          <div className="flex items-start gap-2"><Smartphone className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><strong>Phone image (optional): {MOBILE_SIZE}</strong><br /><span className="text-muted-foreground">Portrait version shown on phones instead of cropping the main image.</span></div></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : banners.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No banners yet. The website shows two built-in banners until you add your own.</p>
            </div>
          ) : (
            <div className="divide-y">
              {banners.map((b, i) => (
                <div key={b.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4">
                  <img src={b.mobile_image_url || b.image_url} alt="" className="w-full sm:w-40 aspect-[2/1] sm:aspect-[16/7] object-cover rounded-lg bg-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{b.title?.replace('\n', ' ') || 'Untitled banner'}</p>
                      <Badge variant={b.is_active ? 'default' : 'secondary'} className="text-xs">{b.is_active ? 'Showing' : 'Hidden'}</Badge>
                      {b.mobile_image_url && <Badge variant="outline" className="text-xs"><Smartphone className="w-3 h-3 mr-1" />Phone image</Badge>}
                    </div>
                    {b.subtitle && <p className="text-sm text-muted-foreground truncate">{b.subtitle}</p>}
                    <p className="text-xs text-muted-foreground mt-1">Opens: {linkLabel(b)}{b.button_text ? ` · Button: "${b.button_text}"` : ''}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => move(i, 1)} disabled={i === banners.length - 1} aria-label="Move down"><ArrowDown className="w-4 h-4" /></Button>
                    <Switch checked={b.is_active} onCheckedChange={() => toggle(b)} aria-label="Show on website" />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete banner</AlertDialogTitle><AlertDialogDescription>Remove this banner from the website? This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(b)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-luxury">{editing ? 'Edit banner' : 'Add banner'}</DialogTitle>
            <DialogDescription>Main image {DESKTOP_SIZE}; optional phone image {MOBILE_SIZE}. Under {MAX_MB} MB each.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <ImagePicker label={`Main image * (${DESKTOP_SIZE})`} url={form.image_url} busy={uploading === 'desktop'} inputRef={desktopInput} aspect="aspect-[32/15]" onPick={(f) => onPick('desktop', f)} onClear={() => setForm((f) => ({ ...f, image_url: '' }))} />
              <ImagePicker label={`Phone image (${MOBILE_SIZE})`} url={form.mobile_image_url} busy={uploading === 'mobile'} inputRef={mobileInput} aspect="aspect-[4/5] max-h-56" onPick={(f) => onPick('mobile', f)} onClear={() => setForm((f) => ({ ...f, mobile_image_url: '' }))} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Elegance in Every Thread" />
                <p className="text-xs text-muted-foreground">Tip: put a line break where the italic second line should start.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Button text</Label>
                <Input value={form.button_text} onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))} placeholder="Shop Now" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Short text under the headline</Label>
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Festive collection now live" />
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <Label>When clicked, open…</Label>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select value={form.link_type} onValueChange={(v: LinkType) => setForm((f) => ({ ...f, link_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="collection">A collection</SelectItem>
                    <SelectItem value="sale">Sale page</SelectItem>
                    <SelectItem value="url">A custom link</SelectItem>
                    <SelectItem value="none">Nothing (not clickable)</SelectItem>
                  </SelectContent>
                </Select>
                {(form.link_type === 'collection' || form.link_type === 'sale') && (
                  <Select value={form.collection_id || 'all'} onValueChange={(v) => setForm((f) => ({ ...f, collection_id: v === 'all' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose collection" /></SelectTrigger>
                    <SelectContent>
                      {form.link_type === 'sale' && <SelectItem value="all">All sale items</SelectItem>}
                      {collections.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
                {form.link_type === 'url' && (
                  <Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} placeholder="/products or https://…" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Show on website</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || uploading !== null}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add banner'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImagePicker({ label, url, busy, inputRef, aspect, onPick, onClear }: {
  label: string;
  url: string;
  busy: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  aspect: string;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ''; }} />
      {url ? (
        <div className="space-y-2">
          <img src={url} alt="" className={`w-full ${aspect} object-cover rounded-lg bg-muted`} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>{busy ? 'Uploading…' : 'Replace'}</Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>Remove</Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={`w-full ${aspect} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors`}>
          <ImagePlus className="w-6 h-6" />
          {busy ? 'Uploading…' : 'Click to upload'}
        </button>
      )}
    </div>
  );
}
