import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const CollectionsGrid = () => {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['featured-collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order')
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">Explore</p>
            <h2 className="font-luxury text-4xl md:text-5xl">Our Collections</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {[1,2,3].map(i => <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />)}
          </div>
        </div>
      </section>
    );
  }

  if (!collections || collections.length === 0) return null;

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">Explore</p>
          <h2 className="font-luxury text-4xl md:text-5xl">Our Collections</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/collections/${collection.slug}`}
                className={`group relative overflow-hidden rounded-2xl block ${
                  index === 0 ? "md:row-span-2 aspect-[3/4]" : "aspect-[3/2]"
                }`}
              >
                <img
                  src={collection.image_url || 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&h=800&fit=crop'}
                  alt={collection.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-foreground/10 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-background">
                  <p className="text-xs tracking-wider uppercase opacity-80 mb-1">{collection.description || 'Collection'}</p>
                  <div className="flex items-center justify-between">
                    <h3 className="font-luxury text-2xl">{collection.name}</h3>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/collections" className="text-sm tracking-wider uppercase underline underline-offset-4 hover:opacity-70 transition-opacity">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CollectionsGrid;
