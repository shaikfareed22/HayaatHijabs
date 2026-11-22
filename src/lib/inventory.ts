import { supabase } from '@/integrations/supabase/client';

// One stock number per colour/size (product_variants.stock_quantity) is shared by the website,
// online orders, in-store sales and restocks. These helpers read it for the inventory pages.

export const formatINR = (value: number | null | undefined) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export type StockStatus = 'in' | 'low' | 'out';

export const stockStatus = (stock: number, lowThreshold: number): StockStatus =>
  stock <= 0 ? 'out' : stock <= lowThreshold ? 'low' : 'in';

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in: 'In stock',
  low: 'Low stock',
  out: 'Out of stock',
};

export const STOCK_STATUS_CLASS: Record<StockStatus, string> = {
  in: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
  out: 'bg-red-100 text-red-800 border-red-200',
};

// Why a stock number changed (written by the database, see the inventory migration).
export const MOVEMENT_REASON_LABEL: Record<string, string> = {
  online_order: 'Online order',
  store_sale: 'In-store sale',
  restock: 'Restock',
  adjustment: 'Correction',
  damaged: 'Damaged / lost',
  return: 'Customer return',
  order_cancelled: 'Order cancelled',
  order_restored: 'Order un-cancelled',
  order_deleted: 'Order deleted',
  opening_stock: 'Opening stock',
};

// Reasons an admin can pick when changing stock by hand.
export const ADJUST_REASONS = [
  { value: 'restock', label: 'Restock (received new stock)', direction: 1 },
  { value: 'return', label: 'Customer return', direction: 1 },
  { value: 'damaged', label: 'Damaged / lost', direction: -1 },
  { value: 'adjustment', label: 'Correction (count was wrong)', direction: 0 },
] as const;

export type PaymentMethod = 'cash' | 'upi' | 'card';
export const PAYMENT_LABEL: Record<PaymentMethod, string> = { cash: 'Cash', upi: 'UPI', card: 'Card' };

export interface InventoryItem {
  id: string;
  itemCode: string;
  sku: string;
  color: string;
  size: string | null;
  price: number;
  costPrice: number | null;
  stock: number;
  lowThreshold: number;
  variantActive: boolean;
  productId: string;
  productName: string;
  productActive: boolean;
  category: string | null;
}

/** "Pink / M" style label for a colour/size. */
export const optionLabel = (item: Pick<InventoryItem, 'color' | 'size'>) =>
  [item.color, item.size].filter(Boolean).join(' / ');

/** On the website only when both the product and this colour/size are active. */
export const isLive = (item: InventoryItem) => item.productActive && item.variantActive;

export async function fetchInventoryItems(): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select(
      'id, item_code, sku, color, size, price, cost_price, stock_quantity, low_stock_threshold, is_active, product_id, products(name, is_active, categories(name))',
    )
    .order('created_at', { ascending: true });
  if (error) throw error;

  type Row = {
    id: string;
    item_code: string | null;
    sku: string;
    color: string;
    size: string | null;
    price: number;
    cost_price: number | null;
    stock_quantity: number | null;
    low_stock_threshold: number | null;
    is_active: boolean | null;
    product_id: string;
    products: { name: string; is_active: boolean | null; categories: { name: string } | null } | null;
  };

  return ((data ?? []) as unknown as Row[]).map((r) => ({
    id: r.id,
    itemCode: r.item_code ?? '',
    sku: r.sku,
    color: r.color,
    size: r.size,
    price: Number(r.price),
    costPrice: r.cost_price === null ? null : Number(r.cost_price),
    stock: r.stock_quantity ?? 0,
    lowThreshold: r.low_stock_threshold ?? 5,
    variantActive: r.is_active !== false,
    productId: r.product_id,
    productName: r.products?.name ?? 'Unknown product',
    productActive: r.products?.is_active !== false,
    category: r.products?.categories?.name ?? null,
  }));
}

/** Readable message from a Supabase/Postgres error (our database functions raise plain sentences). */
export const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message);
  return String(error);
};

/** Downloads rows as a CSV file that opens correctly in Excel (UTF-8 with BOM). */
export function downloadCsv(filename: string, header: string[], rows: (string | number | null)[][]) {
  const cell = (v: string | number | null) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
