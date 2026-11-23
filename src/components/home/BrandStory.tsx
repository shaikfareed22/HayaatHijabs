import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ABOUT_PARAGRAPHS, STORE_MAPS_URL } from "@/lib/storefront";
import logo from "@/assets/logo.png";

const BrandStory = () => {
  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="rounded-2xl bg-background shadow-luxury aspect-square flex items-center justify-center p-10 md:p-14">
              <img src={logo} alt="Hayaat Emporium" className="w-full h-full object-contain" loading="lazy" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">About Hayaat Emporium</p>
            <h2 className="font-luxury text-4xl mb-6">Dress with Grace,<br /><span className="italic">Shine with Confidence</span></h2>
            {ABOUT_PARAGRAPHS.map((text) => (
              <p key={text.slice(0, 24)} className="text-muted-foreground leading-relaxed mb-4">{text}</p>
            ))}
            <div className="flex flex-wrap gap-3 mt-6">
              <Button asChild variant="outline" className="tracking-wider uppercase text-xs px-8 rounded-full">
                <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer">Visit our Hyderabad store</a>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
