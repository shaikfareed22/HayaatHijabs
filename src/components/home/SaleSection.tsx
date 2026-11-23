import { ProductCarousel } from "@/components/home/ProductCarousel";
import { useSaleProducts } from "@/hooks/useStorefront";

/** Products with an MRP higher than the selling price. Hidden when nothing is on sale. */
const SaleSection = () => {
  const { data, isLoading } = useSaleProducts(undefined, 12);
  return (
    <ProductCarousel
      eyebrow="Limited time"
      title="On Sale"
      products={data}
      loading={isLoading}
      viewAllTo="/sale"
      viewAllLabel="View all sale items"
      className="bg-secondary"
    />
  );
};

export default SaleSection;
