// Shared bits for the shop: contact details, banner links, and product card helpers.

export const STORE_PHONE = '8074411944';
export const STORE_WHATSAPP_URL = `https://wa.me/91${STORE_PHONE}?text=${encodeURIComponent('Hello Hayaat Emporium')}`;
export const STORE_MAPS_URL = 'https://maps.app.goo.gl/JXzs2Ap8PY4PmA9z7';
export const STORE_CITY = 'Hyderabad';
export const STORE_EMAIL = 'hayaatemporium@gmail.com';
export const INSTAGRAM_HANDLE = '@hayaat_emporium';
export const INSTAGRAM_URL = 'https://www.instagram.com/hayaat_emporium/';

export const ANNOUNCEMENT = 'Welcome to Hayaat Emporium: Dress with Grace, Shine with Confidence.';

export const ABOUT_SHORT =
  'Hayaat Emporium is a leading women’s ethnic wear and modest fashion store in Hyderabad, offering a curated collection of ready-to-wear traditional and contemporary styles.';

export const ABOUT_PARAGRAPHS = [
  'Hayaat Emporium is a leading women’s ethnic wear and modest fashion store in Hyderabad, offering a curated collection of ready-to-wear traditional and contemporary styles. Whether you are shopping for richly embroidered Pakistani suits, festive outfits, or trendy daily-wear co-ord sets, our boutique brings together quality craftsmanship and timeless elegance for every occasion.',
  'To complete your look, we also specialize in breathable premium hijabs, hijab accessories, and long-lasting anti-tarnish jewelry. Visit our store in Hyderabad for an effortless boutique experience or shop our ready-made modest clothing and ethnic wear online with fast, nationwide shipping across India.',
];

// ---- Home banners -------------------------------------------------------------------------

export interface HomeBanner {
  id: string;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  image_url: string;
  mobile_image_url: string | null;
  link_type: 'collection' | 'sale' | 'url' | 'none';
  collection_id: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  collections?: { slug: string; name: string } | null;
}

/** Where a banner click goes. `null` means the banner is not clickable. */
export function bannerLink(b: Pick<HomeBanner, 'link_type' | 'link_url' | 'collections'>): string | null {
  switch (b.link_type) {
    case 'collection':
      return b.collections?.slug ? `/collections/${b.collections.slug}` : '/collections';
    case 'sale':
      return b.collections?.slug ? `/sale/${b.collections.slug}` : '/sale';
    case 'url':
      return b.link_url?.trim() || null;
    default:
      return null;
  }
}

export const isExternal = (href: string) => /^https?:\/\//i.test(href);

// ---- Product cards --------------------------------------------------------------------------

export interface CardVariant {
  id: string;
  color: string;
  size: string | null;
  price: number;
  compare_at_price?: number | null;
  stock_quantity: number | null;
  product_images?: { image_url: string; is_primary: boolean | null; display_order?: number | null }[] | null;
}

export interface CardProduct {
  id: string;
  name: string;
  slug: string;
  fabric_type?: string | null;
  product_variants: CardVariant[];
}

/** First variant that is in stock, else the first one. */
export const cardVariant = (p: CardProduct): CardVariant | undefined =>
  p.product_variants?.find((v) => (v.stock_quantity ?? 0) > 0) ?? p.product_variants?.[0];

export const cardImage = (p: CardProduct): string => {
  for (const v of p.product_variants ?? []) {
    const img = v.product_images?.find((i) => i.is_primary) ?? v.product_images?.[0];
    if (img?.image_url) return img.image_url;
  }
  return '/placeholder.svg';
};

/** Lowest price, plus MRP and % off when the product is discounted. */
export function cardPricing(p: CardProduct) {
  const variants = p.product_variants ?? [];
  const price = variants.length ? Math.min(...variants.map((v) => Number(v.price))) : 0;
  const cheapest = variants.find((v) => Number(v.price) === price);
  const mrp = cheapest?.compare_at_price ? Number(cheapest.compare_at_price) : null;
  const onSale = !!mrp && mrp > price;
  return {
    price,
    mrp: onSale ? mrp : null,
    percentOff: onSale && mrp ? Math.round(((mrp - price) / mrp) * 100) : 0,
    from: variants.length > 1 && variants.some((v) => Number(v.price) !== price),
  };
}

export const formatPrice = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
