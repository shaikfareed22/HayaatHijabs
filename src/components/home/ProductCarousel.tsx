import { useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { CardProduct, cardImage, cardPricing, cardVariant, formatPrice } from "@/lib/storefront";

interface Props {
  eyebrow: string;
  title: string;
  products: CardProduct[] | undefined;
  loading: boolean;
  viewAllTo?: string;
  viewAllLabel?: string;
  emptyText?: string;
  className?: string;
}

/** Horizontal row of product cards with left/right arrows. Hidden when there's nothing to show. */
export function ProductCarousel({ eyebrow, title, products, loading, viewAllTo, viewAllLabel = "View all", emptyText, className = "" }: Props) {
  const track = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(240, el.clientWidth * 0.8), behavior: "smooth" });
  };

  if (!loading && (!products || products.length === 0) && !emptyText) return null;

  return (
    <section className={`py-16 md:py-20 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">{eyebrow}</p>
            <h2 className="font-luxury text-4xl md:text-5xl">{title}</h2>
          </motion.div>
          <div className="hidden sm:flex items-center gap-2">
            {viewAllTo && (
              <Button asChild variant="link" className="tracking-wider uppercase text-xs">
                <Link to={viewAllTo}>{viewAllLabel}</Link>
              </Button>
            )}
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Scroll left" onClick={() => scroll(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="icon" className="rounded-full" aria-label="Scroll right" onClick={() => scroll(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex gap-4 md:gap-6 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-[70%] sm:w-[45%] md:w-[31%] lg:w-[23%] shrink-0">
                <Skeleton className="aspect-[3/4] rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="relative">
            {/* Arrows on phones sit over the track */}
            <button type="button" aria-label="Scroll left" onClick={() => scroll(-1)} className="sm:hidden absolute left-0 top-1/3 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow p-2">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Scroll right" onClick={() => scroll(1)} className="sm:hidden absolute right-0 top-1/3 z-10 -translate-y-1/2 rounded-full bg-background/90 shadow p-2">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div ref={track} className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {products.map((product, i) => {
                const image = cardImage(product);
                const variant = cardVariant(product);
                const { price, mrp, percentOff, from } = cardPricing(product);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 4) * 0.08 }}
                    viewport={{ once: true }}
                    className="group w-[70%] sm:w-[45%] md:w-[31%] lg:w-[23%] shrink-0 snap-start"
                  >
                    <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-4">
                      <Link to={`/products/${product.slug}`}>
                        <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </Link>
                      {percentOff > 0 && (
                        <span className="absolute top-3 left-3 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 py-1">
                          {percentOff}% OFF
                        </span>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                        {variant && (
                          <AddToCartButton
                            productId={product.id}
                            variantId={variant.id}
                            productName={product.name}
                            productPrice={Number(variant.price)}
                            productImage={image}
                            productColor={variant.color}
                            productSize={variant.size ?? undefined}
                            size="sm"
                            className="flex-1 rounded-full text-xs tracking-wider"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                          </AddToCartButton>
                        )}
                        <WishlistButton productId={product.id} className="h-8 w-8" />
                      </div>
                    </div>
                    <div>
                      {product.fabric_type && <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">{product.fabric_type}</p>}
                      <Link to={`/products/${product.slug}`} className="font-medium text-foreground hover:text-muted-foreground transition-colors line-clamp-2">
                        {product.name}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-medium">{from ? "From " : ""}{formatPrice(price)}</span>
                        {mrp && <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {viewAllTo && (
          <div className="text-center mt-8 sm:hidden">
            <Button asChild variant="outline" className="tracking-wider uppercase text-xs px-8 rounded-full">
              <Link to={viewAllTo}>{viewAllLabel}</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
