import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CATEGORY_LABEL, type Category } from "@/lib/constants";

interface ProductPickerProps {
  value: Id<"products"> | null;
  onChange: (id: Id<"products">, name: string) => void;
  showStock?: boolean;
}

export function ProductPicker({ value, onChange, showStock = false }: ProductPickerProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const products = useQuery(api.products.listWithStock, {});

  const filtered = products?.filter((p) =>
    p.isActive && (
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
    )
  );

  const selected = products?.find((p) => p._id === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span>{selected.name}</span>
            <span className="text-muted-foreground font-mono text-xs">{selected.sku}</span>
            {showStock && (
              <span className="text-xs text-emerald-600">({selected.stock} उपलब्ध)</span>
            )}
          </span>
        ) : (
          <span className="text-muted-foreground">उत्पाद चुनें</span>
        )}
        <span className="text-muted-foreground">▼</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-hidden">
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
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {CATEGORY_LABEL[p.category as Category]} · {p.sku}
                    </div>
                  </div>
                  {showStock && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {p.stock} उपलब्ध
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
