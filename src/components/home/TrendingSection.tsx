import { ProductCarousel } from "@/components/home/ProductCarousel";
import { useTrendingProducts } from "@/hooks/useStorefront";

/** Products marked "Trending" in Inventory → Products. Hidden until at least one is marked. */
const TrendingSection = () => {
  const { data, isLoading } = useTrendingProducts();
  return (
    <ProductCarousel
      eyebrow="What everyone's loving"
      title="Trending Now"
      products={data}
      loading={isLoading}
      viewAllTo="/products"
      viewAllLabel="Shop all"
    />
  );
};

export default TrendingSection;
