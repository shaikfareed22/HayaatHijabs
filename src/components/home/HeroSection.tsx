import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { HomeBanner, bannerLink, isExternal } from "@/lib/storefront";
import bannerEthnic from "@/assets/banner-ethnic.jpg";
import bannerHijab from "@/assets/banner-hijab.jpg";

// Rotating hero banners, managed in Store Admin → Home Banner. Until banners are added there,
// two built-in ones are shown.
const DEFAULT_BANNERS: HomeBanner[] = [
  {
    id: "default-ethnic",
    title: "Elegance in\nEvery Thread",
    subtitle: "Ready-to-wear Pakistani suits, festive outfits and co-ord sets, curated in Hyderabad.",
    button_text: "Shop Now",
    image_url: bannerEthnic,
    mobile_image_url: null,
    link_type: "url",
    collection_id: null,
    link_url: "/products",
    display_order: 0,
    is_active: true,
  },
  {
    id: "default-hijab",
    title: "Grace in\nEvery Fold",
    subtitle: "Breathable premium hijabs, accessories and anti-tarnish jewellery to complete your look.",
    button_text: "Shop Now",
    image_url: bannerHijab,
    mobile_image_url: null,
    link_type: "url",
    collection_id: null,
    link_url: "/products",
    display_order: 1,
    is_active: true,
  },
];

const INTERVAL_MS = 5000;

const HeroSection = () => {
  const { data } = useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_banners")
        .select("*, collections(slug, name)")
        .eq("is_active", true)
        .order("display_order");
      if (error) return [] as HomeBanner[];
      return (data ?? []) as unknown as HomeBanner[];
    },
  });

  const banners = data && data.length > 0 ? data : DEFAULT_BANNERS;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [banners.length]);

  useEffect(() => {
    if (paused || banners.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, banners.length]);

  const banner = banners[index] ?? banners[0];
  const href = bannerLink(banner);
  const titleLines = (banner.title || "Elegance in\nEvery Thread").split("\n");

  const CtaLink = ({ children, className }: { children: React.ReactNode; className?: string }) =>
    href && isExternal(href) ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>
    ) : (
      <Link to={href || "/products"} className={className}>{children}</Link>
    );

  return (
    <section
      className="relative min-h-[85vh] flex items-center overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Background slideshow: all images stay mounted and crossfade with CSS, in step with the text */}
      <div className="absolute inset-0">
        {banners.map((b, i) => (
          <picture key={b.id}>
            {b.mobile_image_url && <source media="(max-width: 767px)" srcSet={b.mobile_image_url} />}
            <img
              src={b.image_url}
              alt={b.title?.replace("\n", " ") || "Hayaat Emporium"}
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-out ${i === index ? "opacity-100" : "opacity-0"}`}
              loading={i === 0 ? "eager" : "lazy"}
              aria-hidden={i !== index}
            />
          </picture>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/55 to-background/10" />
        {/* The whole banner is clickable when it has a link */}
        {href && <CtaLink className="absolute inset-0 z-[1]" aria-label={banner.button_text || "Open"}>{null}</CtaLink>}
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 pointer-events-none">
        {/* Keyed on the banner so the text fades in on each slide, without ever disappearing */}
        <div key={banner.id} className="w-full max-w-xl pointer-events-auto animate-fade-in">
            <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Ethnic Wear &amp; Modest Fashion · Hyderabad
            </p>
            <h1 className="font-luxury text-4xl sm:text-5xl md:text-7xl leading-tight mb-6 text-foreground break-words">
              {titleLines[0]}
              {titleLines[1] && (<><br /><span className="italic">{titleLines.slice(1).join(" ")}</span></>)}
            </h1>
            {banner.subtitle && (
              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-full sm:max-w-md leading-relaxed break-words">{banner.subtitle}</p>
            )}
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="tracking-wider uppercase text-xs px-8 py-6 rounded-full">
                <CtaLink>
                  {banner.button_text || "Shop Now"} <ArrowRight className="ml-2 h-4 w-4" />
                </CtaLink>
              </Button>
              <Button asChild variant="outline" size="lg" className="tracking-wider uppercase text-xs px-8 py-6 rounded-full">
                <Link to="/collections">View Collections</Link>
              </Button>
            </div>
        </div>
      </div>

      {/* Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${i === index ? "w-8 bg-foreground" : "w-2 bg-foreground/35 hover:bg-foreground/60"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroSection;
