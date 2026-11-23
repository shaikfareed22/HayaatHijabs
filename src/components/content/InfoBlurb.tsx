import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SimpleMarkdown } from "@/components/content/SimpleMarkdown";
import { infoPage } from "@/content/infoPages";

/** The descriptive text for a shop page (Shop All, Collections), collapsed under the products. */
export function InfoBlurb({ slug }: { slug: string }) {
  const page = infoPage(slug);
  const [open, setOpen] = useState(false);
  if (!page) return null;
  return (
    <section className="max-w-3xl mx-auto mt-16 pt-10 border-t border-border">
      <h2 className="font-luxury text-3xl mb-2">{page.tagline || page.title}</h2>
      <div className={open ? "" : "relative max-h-40 overflow-hidden"}>
        <SimpleMarkdown text={page.body} />
        {!open && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background to-transparent" />}
      </div>
      <Button type="button" variant="link" className="px-0 mt-2 tracking-wider uppercase text-xs" onClick={() => setOpen((o) => !o)}>
        {open ? <>Show less <ChevronUp className="h-3.5 w-3.5 ml-1" /></> : <>Read more <ChevronDown className="h-3.5 w-3.5 ml-1" /></>}
      </Button>
    </section>
  );
}
