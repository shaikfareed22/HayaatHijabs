import { Fragment, ReactNode } from "react";
import { STORE_PHONE } from "@/lib/storefront";

// Renders the simple text format used for the information pages (src/content/infoPages.ts):
//   ### Heading        -> section heading
//   **Sub heading**    -> sub heading (a line that is only bold)
//   - item             -> bullet list
//   | a | b |          -> table (first row is the header; a |---| row is ignored)
//   *note*             -> italic note (a line wrapped in single asterisks)
//   other lines        -> paragraphs; **bold**, links, emails and the store phone become clickable

const INLINE = new RegExp(`(\\*\\*[^*]+\\*\\*|https?://[^\\s)]+|[\\w.+-]+@[\\w-]+\\.[\\w.]+|\\b${STORE_PHONE}\\b)`, "g");

function renderInline(text: string): ReactNode {
  const parts = text.split(INLINE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (/^https?:\/\//.test(part)) {
      const label = part.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 break-all">{label}</a>;
    }
    if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(part)) return <a key={i} href={`mailto:${part}`} className="text-primary underline underline-offset-4">{part}</a>;
    if (part === STORE_PHONE) return <a key={i} href={`tel:+91${STORE_PHONE}`} className="text-primary underline underline-offset-4">+91 {STORE_PHONE.slice(0, 5)} {STORE_PHONE.slice(5)}</a>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "note"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; rows: string[][] }
  | { type: "hr" };

function parse(text: string): Block[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) { i++; continue; }
    if (/^-{3,}$/.test(line)) { blocks.push({ type: "hr" }); i++; continue; }
    if (/^#{1,3}\s/.test(line)) { blocks.push({ type: "h2", text: line.replace(/^#{1,3}\s+/, "") }); i++; continue; }
    if (/^\*\*[^*]+\*\*$/.test(line)) { blocks.push({ type: "h3", text: line.slice(2, -2) }); i++; continue; }
    if (/^\*[^*].*\*$/.test(line)) { blocks.push({ type: "note", text: line.slice(1, -1) }); i++; continue; }
    if (/^- /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^- /.test(lines[i].trim())) { items.push(lines[i].trim().slice(2)); i++; }
      blocks.push({ type: "ul", items });
      continue;
    }
    if (line.startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i].trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
        i++;
      }
      blocks.push({ type: "table", rows });
      continue;
    }
    blocks.push({ type: "p", text: line });
    i++;
  }
  return blocks;
}

export function SimpleMarkdown({ text, className = "" }: { text: string; className?: string }) {
  const blocks = parse(text);
  return (
    <div className={`space-y-4 text-muted-foreground leading-relaxed ${className}`}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2": return <h2 key={i} className="font-luxury text-2xl md:text-3xl text-foreground pt-6 first:pt-0">{renderInline(b.text)}</h2>;
          case "h3": return <h3 key={i} className="text-base font-semibold text-foreground pt-2">{renderInline(b.text)}</h3>;
          case "note": return <p key={i} className="text-sm italic border-l-2 border-primary/40 pl-3">{renderInline(b.text)}</p>;
          case "hr": return <hr key={i} className="border-border my-8" />;
          case "ul": return (
            <ul key={i} className="list-disc pl-6 space-y-1.5 marker:text-primary">
              {b.items.map((item, j) => <li key={j}>{renderInline(item)}</li>)}
            </ul>
          );
          case "table": {
            const [head, ...body] = b.rows;
            return (
              <div key={i} className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-secondary text-foreground">
                    <tr>{head.map((c, j) => <th key={j} className="text-left font-semibold px-4 py-2.5">{c}</th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {body.map((row, r) => <tr key={r}>{row.map((c, j) => <td key={j} className="px-4 py-2.5 tabular-nums">{c}</td>)}</tr>)}
                  </tbody>
                </table>
              </div>
            );
          }
          default: return <p key={i}>{renderInline(b.text)}</p>;
        }
      })}
    </div>
  );
}
