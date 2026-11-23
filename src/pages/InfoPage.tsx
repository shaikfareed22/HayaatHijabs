import { useEffect } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleMarkdown } from "@/components/content/SimpleMarkdown";
import { INFO_SECTIONS, infoPage, routedInfoPages } from "@/content/infoPages";
import { STORE_EMAIL, STORE_PHONE, STORE_WHATSAPP_URL } from "@/lib/storefront";

/** One of the information pages linked from the footer (Contact, Size Guide, Privacy Policy…). */
export default function InfoPage({ slug }: { slug: string }) {
  const page = infoPage(slug);

  useEffect(() => {
    if (page) document.title = `${page.title} | Hayaat Emporium`;
    window.scrollTo({ top: 0 });
    return () => { document.title = "Hayaat Emporium | Ethnic Wear, Modest Fashion & Hijabs in Hyderabad"; };
  }, [page]);

  if (!page) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-luxury">Page not found</h1>
        <Button asChild variant="outline" className="mt-4"><Link to="/">Back to home</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_280px]">
        <article className="max-w-3xl">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-3">{page.section}</p>
          <h1 className="font-luxury text-4xl md:text-5xl mb-3">{page.title}</h1>
          {page.tagline && <p className="text-lg text-muted-foreground mb-8">{page.tagline}</p>}
          <SimpleMarkdown text={page.body} />
        </article>

        <aside className="space-y-6 lg:sticky lg:top-28 h-fit">
          <div className="rounded-2xl border border-border bg-secondary p-5">
            <h2 className="font-luxury text-xl mb-3">Need help?</h2>
            <ul className="space-y-2.5 text-sm">
              <li><a href={STORE_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary"><MessageCircle className="h-4 w-4" /> WhatsApp us</a></li>
              <li><a href={`tel:+91${STORE_PHONE}`} className="flex items-center gap-2 hover:text-primary"><Phone className="h-4 w-4" /> +91 {STORE_PHONE.slice(0, 5)} {STORE_PHONE.slice(5)}</a></li>
              <li><a href={`mailto:${STORE_EMAIL}`} className="flex items-center gap-2 hover:text-primary"><Mail className="h-4 w-4" /> {STORE_EMAIL}</a></li>
            </ul>
          </div>
          <nav className="rounded-2xl border border-border p-5">
            {INFO_SECTIONS.map((section) => {
              const pages = routedInfoPages.filter((p) => p.section === section);
              if (pages.length === 0) return null;
              return (
                <div key={section} className="mb-4 last:mb-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{section}</p>
                  <ul className="space-y-1.5 text-sm">
                    {pages.map((p) => (
                      <li key={p.slug}>
                        <Link to={p.path} className={p.slug === page.slug ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground"}>{p.title}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>
      </div>
    </div>
  );
}
