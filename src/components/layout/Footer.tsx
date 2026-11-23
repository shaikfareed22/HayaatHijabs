import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, MessageCircle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL, STORE_EMAIL, STORE_MAPS_URL, STORE_PHONE, STORE_WHATSAPP_URL } from "@/lib/storefront";

const columns = [
  {
    title: "Quick Links",
    links: [
      { label: "Shop All", to: "/products" },
      { label: "New Arrivals", to: "/new-arrivals" },
      { label: "Collections", to: "/collections" },
      { label: "Style Guides", to: "/style-guides" },
    ],
  },
  {
    title: "Customer Care",
    links: [
      { label: "Contact Us", to: "/contact" },
      { label: "Size Guide", to: "/size-guide" },
      { label: "Shipping Info", to: "/shipping" },
      { label: "Returns & Exchanges", to: "/returns" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", to: "/about" },
      { label: "Sustainability", to: "/sustainability" },
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms & Conditions", to: "/terms" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border">
      {/* Newsletter section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h3 className="font-luxury text-3xl mb-2">Stay Connected</h3>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          Subscribe for new arrivals, festive collections and special offers.
        </p>
        <form className="flex gap-2 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
          <Input placeholder="Enter your email" type="email" className="flex-1" />
          <Button className="tracking-wider uppercase text-xs px-6">Subscribe</Button>
        </form>
      </div>

      {/* Links */}
      <div className="border-t border-border">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-luxury text-xl mb-1">Hayaat Emporium</h4>
            <p className="text-sm italic text-muted-foreground mb-4">Elegance in Every Fold.</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Women’s ethnic wear and modest fashion boutique in Hyderabad. Pakistani suits, co-ord sets, premium hijabs, hijab accessories and anti-tarnish jewelry, with shipping across India.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-luxury text-lg mb-4">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.to}><Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h4 className="font-luxury text-lg mb-4">Follow Us</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Instagram className="h-4 w-4 shrink-0" /> {INSTAGRAM_HANDLE}
                </a>
              </li>
              <li>
                <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4 shrink-0" /> WhatsApp {STORE_PHONE}
                </a>
              </li>
              <li>
                <a href={`tel:+91${STORE_PHONE}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 shrink-0" /> +91 {STORE_PHONE.slice(0, 5)} {STORE_PHONE.slice(5)}
                </a>
              </li>
              <li>
                <a href={`mailto:${STORE_EMAIL}`} className="flex items-center gap-2 hover:text-foreground transition-colors break-all">
                  <Mail className="h-4 w-4 shrink-0" /> {STORE_EMAIL}
                </a>
              </li>
              <li>
                <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-foreground transition-colors">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" /> <span>Visit our store, Hyderabad</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Hayaat Emporium. All rights reserved. Elegance in Every Fold.</p>
      </div>
    </footer>
  );
};

export default Footer;
