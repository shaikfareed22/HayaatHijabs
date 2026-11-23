import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CardProduct } from "@/lib/storefront";

const CARD_FIELDS = `
  id, name, slug, fabric_type,
  product_variants (
    id, color, size, price, compare_at_price, stock_quantity, is_active,
    product_images ( id, image_url, alt_text, is_primary, display_order )
  )
`;

const onlyActiveVariants = (rows: CardProduct[]) =>
  rows
    .map((p) => ({ ...p, product_variants: (p.product_variants ?? []).filter((v) => (v as { is_active?: boolean | null }).is_active !== false) }))
    .filter((p) => p.product_variants.length > 0);

/** Products switched to "Trending" in the admin. */
export function useTrendingProducts(limit = 12) {
  return useQuery({
    queryKey: ["trending-products", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(CARD_FIELDS)
        .eq("is_active", true)
        .eq("is_trending", true)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return onlyActiveVariants((data ?? []) as unknown as CardProduct[]);
    },
  });
}

/**
 * Products with at least one colour/size on sale (MRP above selling price).
 * Only the discounted colours/sizes are returned, so cards show the sale price.
 * Pass a collection slug to limit to that collection.
 */
export function useSaleProducts(collectionSlug?: string, limit = 48) {
  return useQuery({
    queryKey: ["sale-products", collectionSlug ?? "all", limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          collectionSlug
            ? `${CARD_FIELDS}, product_collections!inner ( collection_id, collections!inner ( slug ) )`
            : CARD_FIELDS.replace("product_variants (", "product_variants!inner ("),
        )
        .eq("is_active", true)
        .eq("product_variants.on_sale", true)
        .eq("product_variants.is_active", true)
        .order("updated_at", { ascending: false })
        .limit(limit);
      if (collectionSlug) query = query.eq("product_collections.collections.slug", collectionSlug);
      const { data, error } = await query;
      if (error) throw error;
      // With a collection filter the variants join isn't "inner", so drop non-sale variants here too.
      return ((data ?? []) as unknown as CardProduct[])
        .map((p) => ({ ...p, product_variants: (p.product_variants ?? []).filter((v) => v.compare_at_price && Number(v.compare_at_price) > Number(v.price)) }))
        .filter((p) => p.product_variants.length > 0);
    },
  });
}

/** Active collections, for the Sale menu and the Sale page chips. */
export function useActiveCollections() {
  return useQuery({
    queryKey: ["active-collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
