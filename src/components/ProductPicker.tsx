import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CATEGORY_LABEL, type Category } from "@/lib/constants";
import { Plus } from "lucide-react";

interface ProductPickerProps {
  value: Id<"products"> | null;
  onChange: (id: Id<"products">, name: string) => void;
  showStock?: boolean;
  onRequestNewProduct?: () => void;
}

export function ProductPicker({ value, onChange, showStock = false, onRequestNewProduct }: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const products = useQuery(api.products.listWithStock, {});

  const filtered = products?.filter((p) =>
    p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  );

  const selected = products?.find((p) => p._id === value);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate">
            <span className="truncate">{selected.name}</span>
            <span className="text-muted-foreground font-mono text-xs shrink-0">{selected.sku}</span>
            {showStock && (
              <span className="text-xs text-emerald-600 shrink-0">({selected.stock} उपलब्ध)</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">उत्पाद चुनें</span>
        )}
        <span className="text-muted-foreground shrink-0 ml-2">▼</span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-[60] mt-1 rounded-md border bg-popover shadow-lg max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="खोजें..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-2 py-1.5 text-sm bg-transparent outline-none"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {!filtered || filtered.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                कोई उत्पाद नहीं मिला
              </div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onChange(p._id, p.name);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent text-left"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CATEGORY_LABEL[p.category as Category]} · {p.sku}
                    </div>
                  </div>
                  {showStock && (
                    <span className="text-xs tabular-nums text-muted-foreground shrink-0 ml-2">
                      {p.stock} उपलब्ध
                    </span>
                  )}
                </button>
              ))
            )}
            {onRequestNewProduct && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                  onRequestNewProduct();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-primary font-medium hover:bg-accent active:bg-accent border-t"
              >
                <Plus className="h-4 w-4" />
                नया उत्पाद जोड़ें
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
