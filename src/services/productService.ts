import { supabase } from "@/integrations/supabase/client";

export interface ProductFilters {
  search?: string;
  category?: string;
  category_id?: string;
  collection?: string;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  sort_by?: "created_at" | "updated_at" | "name";
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ProductMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

export interface ProductListResponse {
  data: any[];
  meta: ProductMeta;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const productService = {
  async list(filters: ProductFilters = {}): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
    });

    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/products?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    return res.json();
  },

  async get(slug: string): Promise<any> {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/products?slug=${slug}`,
      {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.data?.[0] || null;
  },

  async getCollections(): Promise<any[]> {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getCollectionBySlug(slug: string): Promise<any> {
    const { data, error } = await supabase
      .from('collections')
      .select('*, product_collections(*, products(*, product_variants(*, product_images(*))))')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (error) throw error;
    return data;
  },

  async getCategories(): Promise<any[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (error) throw error;
    return data || [];
  },
};
