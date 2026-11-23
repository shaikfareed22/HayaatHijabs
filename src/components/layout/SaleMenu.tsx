import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Tag } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveCollections } from "@/hooks/useStorefront";

// "Sale" in the navbar: pick a collection to see only its discounted products, or all sale items.

export function SaleMenuDesktop() {
  const { data: collections } = useActiveCollections();
  const location = useLocation();
  const active = location.pathname.startsWith("/sale");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`inline-flex items-center gap-1 text-sm tracking-wider uppercase font-semibold text-red-600 transition-colors hover:text-red-700 outline-none ${active ? "underline underline-offset-8 decoration-2" : ""}`}
      >
        Sale <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">Sale by collection</DropdownMenuLabel>
        {collections?.map((c) => (
          <DropdownMenuItem key={c.id} asChild>
            <Link to={`/sale/${c.slug}`} className="cursor-pointer">{c.name}</Link>
          </DropdownMenuItem>
        ))}
        {collections && collections.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem asChild>
          <Link to="/sale" className="cursor-pointer font-medium"><Tag className="h-4 w-4 mr-2" /> All sale items</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SaleMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const { data: collections } = useActiveCollections();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const active = location.pathname.startsWith("/sale");
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between py-3 px-4 text-sm tracking-wider uppercase font-semibold text-red-600 rounded-lg transition-colors ${active ? "bg-secondary" : "hover:bg-muted"}`}
      >
        Sale <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {collections?.map((c) => (
            <Link key={c.id} to={`/sale/${c.slug}`} onClick={onNavigate} className="py-2 px-3 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
              {c.name}
            </Link>
          ))}
          <Link to="/sale" onClick={onNavigate} className="py-2 px-3 text-sm font-medium text-foreground rounded-lg hover:bg-muted">
            All sale items
          </Link>
        </div>
      )}
    </div>
  );
}
