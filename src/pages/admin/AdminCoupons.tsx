import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Tag, Globe, Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { errorMessage } from '@/lib/inventory';

// Coupons are read and saved straight from the database (admin-only rules), the same way
// products are. Public coupons are listed on the checkout page with their terms; private
// coupons work only when a customer types the code, and can be limited to chosen customers.

type Coupon = Tables<'coupons'>;

const emptyForm = {
  code: '',
  title: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  max_discount_amount: '',
  minimum_order_amount: '',
  starts_at: '',
  expires_at: '',
  usage_limit: '',
  per_customer_limit: '',
  is_public: true,
  description: '',
  allowed_emails: '',
  is_active: true,
};

const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const parseEmails = (text: string) =>
  [...new Set(text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];

const discountText = (c: Coupon) =>
  c.discount_type === 'percentage'
    ? `${c.discount_value}% off${c.max_discount_amount ? ` (max ₹${c.max_discount_amount})` : ''}`
    : `₹${c.discount_value} off`;

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) toast({ title: 'Error loading coupons', description: errorMessage(error), variant: 'destructive' });
    else setCoupons(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      title: c.title ?? '',
      discount_type: c.discount_type === 'fixed' ? 'fixed' : 'percentage',
      discount_value: String(c.discount_value),
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : '',
      minimum_order_amount: c.minimum_order_amount ? String(c.minimum_order_amount) : '',
      starts_at: toLocalInput(c.starts_at),
      expires_at: toLocalInput(c.expires_at),
      usage_limit: c.usage_limit ? String(c.usage_limit) : '',
      per_customer_limit: c.per_customer_limit ? String(c.per_customer_limit) : '',
      is_public: c.is_public,
      description: c.description ?? '',
      allowed_emails: (c.allowed_emails ?? []).join('\n'),
      is_active: c.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const code = form.code.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(form.discount_value);
    if (!code || !value || value <= 0) {
      toast({ title: 'Code and discount value are required', variant: 'destructive' });
      return;
    }
    if (form.discount_type === 'percentage' && value > 100) {
      toast({ title: 'Percentage cannot be more than 100', variant: 'destructive' });
      return;
    }
    if (form.is_public && !form.description.trim()) {
      toast({ title: 'Add terms & conditions', description: 'Public coupons are shown on the website with their terms.', variant: 'destructive' });
      return;
    }
    if (form.starts_at && form.expires_at && form.starts_at >= form.expires_at) {
      toast({ title: 'Expiry must be after the start date', variant: 'destructive' });
      return;
    }
    const emails = form.is_public ? [] : parseEmails(form.allowed_emails);
    const bad = emails.find((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    if (bad) {
      toast({ title: `"${bad}" is not a valid email`, variant: 'destructive' });
      return;
    }

    const payload = {
      code,
      title: form.title.trim() || null,
      discount_type: form.discount_type,
      discount_value: value,
      max_discount_amount: form.discount_type === 'percentage' && form.max_discount_amount ? Number(form.max_discount_amount) : null,
      minimum_order_amount: Number(form.minimum_order_amount) || 0,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      per_customer_limit: form.per_customer_limit ? Number(form.per_customer_limit) : null,
      is_public: form.is_public,
      description: form.description.trim() || null,
      allowed_emails: emails.length ? emails : null,
      is_active: form.is_active,
    };

    setSaving(true);
    const { error } = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing.id)
      : await supabase.from('coupons').insert(payload);
    setSaving(false);
    if (error) {
      toast({
        title: editing ? 'Coupon not updated' : 'Coupon not created',
        description: error.code === '23505' ? `The code ${code} already exists.` : errorMessage(error),
        variant: 'destructive',
      });
      return;
    }
    toast({ title: editing ? 'Coupon updated' : 'Coupon created', description: form.is_public ? `${code} is shown on the website.` : `${code} is private: it works only when typed.` });
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) {
      // A coupon used by past orders can't be removed; switch it off instead.
      const { error: offError } = await supabase.from('coupons').update({ is_active: false }).eq('id', id);
      if (offError) toast({ title: 'Failed to delete', description: errorMessage(error), variant: 'destructive' });
      else toast({ title: 'Coupon switched off instead', description: 'It was used in past orders, so it is kept for order history and can no longer be applied.' });
    } else {
      toast({ title: 'Coupon deleted' });
    }
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase.from('coupons').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) toast({ title: 'Failed to update', description: errorMessage(error), variant: 'destructive' });
    fetchCoupons();
  };

  const publicCount = coupons.filter((c) => c.is_public).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-luxury font-semibold">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {coupons.length} coupons · {publicCount} shown on the website · {coupons.length - publicCount} private
          </p>
        </div>
        <Button onClick={openAdd} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Coupon</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No coupons yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {coupons.map(coupon => {
                const expired = !!coupon.expires_at && new Date(coupon.expires_at) <= new Date();
                const members = coupon.allowed_emails?.length ?? 0;
                return (
                  <div key={coupon.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-mono font-semibold text-sm">{coupon.code}</p>
                        {coupon.title && <span className="text-sm">{coupon.title}</span>}
                        {coupon.is_public ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-800 border-emerald-200"><Globe className="w-3 h-3 mr-1" />On website</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700"><Lock className="w-3 h-3 mr-1" />Private{members ? ` · ${members} customer${members === 1 ? '' : 's'}` : ''}</Badge>
                        )}
                        <Badge variant={coupon.is_active && !expired ? 'default' : 'secondary'} className="text-xs">
                          {expired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {discountText(coupon)}
                        {Number(coupon.minimum_order_amount) > 0 && ` • Min ₹${coupon.minimum_order_amount}`}
                        {coupon.per_customer_limit && ` • ${coupon.per_customer_limit}× per customer`}
                        {coupon.starts_at && new Date(coupon.starts_at) > new Date() && ` • Starts ${new Date(coupon.starts_at).toLocaleDateString('en-IN')}`}
                        {coupon.expires_at && ` • Expires ${new Date(coupon.expires_at).toLocaleDateString('en-IN')}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Used: {coupon.used_count ?? 0}{coupon.usage_limit ? `/${coupon.usage_limit}` : ''}
                      </span>
                      <Switch checked={!!coupon.is_active} onCheckedChange={() => toggleActive(coupon)} aria-label="Active" />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(coupon)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
                            <AlertDialogDescription>Delete coupon "{coupon.code}"? This cannot be undone. If it was used in past orders it will be switched off instead.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(coupon.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-luxury">{editing ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
            <DialogDescription>Public coupons are listed at checkout with their terms. Private coupons work only when the customer types the code.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Code *</Label>
                <Input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="SAVE20" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label>Name shown to customers</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Festive 20% off" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Discount type</Label>
                <Select value={form.discount_type} onValueChange={(v: 'percentage' | 'fixed') => setForm(f => ({ ...f, discount_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{form.discount_type === 'percentage' ? 'Percent off *' : 'Amount off (₹) *'}</Label>
                <Input type="number" min={0} value={form.discount_value} onChange={(e) => setForm(f => ({ ...f, discount_value: e.target.value }))} placeholder={form.discount_type === 'percentage' ? '20' : '100'} />
              </div>
              {form.discount_type === 'percentage' ? (
                <div className="space-y-1.5">
                  <Label>Max discount (₹)</Label>
                  <Input type="number" min={0} value={form.max_discount_amount} onChange={(e) => setForm(f => ({ ...f, max_discount_amount: e.target.value }))} placeholder="No cap" />
                </div>
              ) : <div />}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Minimum order (₹)</Label>
                <Input type="number" min={0} value={form.minimum_order_amount} onChange={(e) => setForm(f => ({ ...f, minimum_order_amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Total uses allowed</Label>
                <Input type="number" min={1} value={form.usage_limit} onChange={(e) => setForm(f => ({ ...f, usage_limit: e.target.value }))} placeholder="Unlimited" />
              </div>
              <div className="space-y-1.5">
                <Label>Uses per customer</Label>
                <Input type="number" min={1} value={form.per_customer_limit} onChange={(e) => setForm(f => ({ ...f, per_customer_limit: e.target.value }))} placeholder="Unlimited" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Starts at</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Expires at</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label className="flex items-center gap-2">{form.is_public ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />} Show on website</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.is_public
                      ? 'Listed under "Available offers" at checkout, with the terms below. Anyone can apply it.'
                      : 'Private: not shown anywhere. It works only when the customer types the code.'}
                  </p>
                </div>
                <Switch checked={form.is_public} onCheckedChange={(v) => setForm(f => ({ ...f, is_public: v }))} />
              </div>

              {form.is_public ? (
                <div className="space-y-1.5">
                  <Label>Terms & conditions *</Label>
                  <Textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder={'e.g.\n• Valid on orders above ₹1,499\n• Not valid with other offers\n• One use per customer'}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Only for these customers (optional)</Label>
                  <Textarea
                    rows={3}
                    value={form.allowed_emails}
                    onChange={(e) => setForm(f => ({ ...f, allowed_emails: e.target.value }))}
                    placeholder={'Customer emails, one per line. Leave empty to let anyone who knows the code use it.'}
                  />
                  <p className="text-xs text-muted-foreground">Customers must be signed in with one of these emails for the code to work.</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
