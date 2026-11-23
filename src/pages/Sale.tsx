import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { WishlistButton } from "@/components/product/WishlistButton";
import { useActiveCollections, useSaleProducts } from "@/hooks/useStorefront";
import { cardImage, cardPricing, cardVariant, formatPrice } from "@/lib/storefront";

/** /sale shows every discounted product; /sale/:slug only those in one collection. */
export default function Sale() {
  const { slug } = useParams<{ slug?: string }>();
  const { data: collections } = useActiveCollections();
  const { data: products, isLoading } = useSaleProducts(slug);
  const current = collections?.find((c) => c.slug === slug);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2 flex items-center justify-center gap-2">
          <Tag className="h-4 w-4" /> Sale
        </p>
        <h1 className="font-luxury text-4xl md:text-5xl">{current ? `${current.name} Sale` : "All Sale Items"}</h1>
        <p className="text-muted-foreground mt-3">Discounted prices on selected styles. Prices shown are after discount.</p>
      </div>

      {/* Collection chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <Button asChild size="sm" variant={!slug ? "default" : "outline"} className="rounded-full tracking-wider uppercase text-xs">
          <Link to="/sale">All</Link>
        </Button>
        {collections?.map((c) => (
          <Button key={c.id} asChild size="sm" variant={slug === c.slug ? "default" : "outline"} className="rounded-full tracking-wider uppercase text-xs">
            <Link to={`/sale/${c.slug}`}>{c.name}</Link>
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[3/4] rounded-xl mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : !products || products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{current ? `No sale items in ${current.name} right now.` : "No sale items right now. Check back soon!"}</p>
          <Button asChild variant="outline" className="mt-6 rounded-full tracking-wider uppercase text-xs">
            <Link to={current ? `/collections/${current.slug}` : "/products"}>{current ? `Browse ${current.name}` : "Shop all products"}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product, i) => {
            const image = cardImage(product);
            const variant = cardVariant(product);
            const { price, mrp, percentOff, from } = cardPricing(product);
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.06 }} viewport={{ once: true }} className="group">
                <div className="relative overflow-hidden rounded-xl bg-muted aspect-[3/4] mb-4">
                  <Link to={`/products/${product.slug}`}>
                    <img src={image} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  </Link>
                  {percentOff > 0 && (
                    <span className="absolute top-3 left-3 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold px-2.5 py-1">{percentOff}% OFF</span>
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
                {product.fabric_type && <p className="text-xs text-muted-foreground tracking-wider uppercase mb-1">{product.fabric_type}</p>}
                <Link to={`/products/${product.slug}`} className="font-medium hover:text-muted-foreground transition-colors line-clamp-2">{product.name}</Link>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-medium">{from ? "From " : ""}{formatPrice(price)}</span>
                  {mrp && <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
