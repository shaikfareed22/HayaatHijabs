import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import CollectionsGrid from "@/components/home/CollectionsGrid";
import TrendingSection from "@/components/home/TrendingSection";
import SaleSection from "@/components/home/SaleSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import BrandStory from "@/components/home/BrandStory";

const Index = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturedProducts />
      <CollectionsGrid />
      <TrendingSection />
      <SaleSection />
      <TestimonialsSection />
      <BrandStory />
    </div>
  );
};

export default Index;
