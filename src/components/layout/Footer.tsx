import { Link } from "react-router-dom";
import { Instagram, Facebook, MapPin, Phone, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ABOUT_SHORT, STORE_MAPS_URL, STORE_PHONE, STORE_WHATSAPP_URL } from "@/lib/storefront";

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
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-luxury text-lg mb-4">Hayaat Emporium</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{ABOUT_SHORT}</p>
          </div>
          <div>
            <h4 className="font-luxury text-lg mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/products" className="hover:text-foreground transition-colors">Shop All</Link></li>
              <li><Link to="/collections" className="hover:text-foreground transition-colors">Collections</Link></li>
              <li><Link to="/sale" className="hover:text-foreground transition-colors">Sale</Link></li>
              <li><Link to="/wishlist" className="hover:text-foreground transition-colors">Wishlist</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-luxury text-lg mb-4">Customer Care</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/orders" className="hover:text-foreground transition-colors">Track Your Order</Link></li>
              <li><Link to="/account" className="hover:text-foreground transition-colors">My Account</Link></li>
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-luxury text-lg mb-4">Visit &amp; Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a href={STORE_MAPS_URL} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 hover:text-foreground transition-colors">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Our store in Hyderabad<br /><span className="text-xs">Open in Google Maps</span></span>
                </a>
              </li>
              <li>
                <a href={`tel:+91${STORE_PHONE}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4 shrink-0" /> +91 {STORE_PHONE.slice(0, 5)} {STORE_PHONE.slice(5)}
                </a>
              </li>
              <li>
                <a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <MessageCircle className="h-4 w-4 shrink-0" /> Chat on WhatsApp
                </a>
              </li>
            </ul>
            <div className="flex gap-4 mt-5">
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Hayaat Emporium, Hyderabad. All rights reserved. Dress with Grace, Shine with Confidence.</p>
      </div>
    </footer>
  );
};

export default Footer;
