import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { AddProductSheet } from "@/components/AddProductSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CATEGORIES, type Category } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export function InventoryPage() {
  const [filter, setFilter] = useState<Category | "all">("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { document.title = "दुकान — इन्वेंटरी"; }, []);

  const products = useQuery(api.products.listWithStock, {
    category: filter === "all" ? undefined : filter,
  });

  const todaySummary = useQuery(api.reports.todaySummary, {});

  const filteredProducts = useMemo(() => {
    if (products === undefined) return undefined;

    let result = products;

    // Low stock filter: stock > 0 AND stock < 5
    if (lowStockFilter) {
      result = result.filter((p) => p.stock > 0 && p.stock < 5);
    }

    // Search filter: case-insensitive match on name or SKU
    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query),
      );
    }

    return result;
  }, [products, lowStockFilter, search]);

  return (
    <div>
      <PageHeader
        title="इन्वेंटरी"
        action={<AddProductSheet />}
      />

      {/* Today's dashboard card */}
      {todaySummary && todaySummary.salesCount > 0 && (
        <div className="px-4 pt-3">
          <Card className="border-l-4 border-l-emerald-500 py-3 px-4 gap-0">
            <p className="text-sm font-medium text-foreground">
              आज: {todaySummary.salesCount} बिक्री · {todaySummary.itemsSold} आइटम · {formatINR(todaySummary.revenue)}
            </p>
          </Card>
        </div>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="shrink-0"
        >
          सभी
        </Button>
        {CATEGORIES.map((c) => (
          <Button
            key={c.value}
            variant={filter === c.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(c.value)}
            className="shrink-0"
          >
            {c.label}
          </Button>
        ))}
        <Button
          variant={lowStockFilter ? "default" : "outline"}
          size="sm"
          onClick={() => setLowStockFilter((prev) => !prev)}
          className={cn(
            "shrink-0",
            lowStockFilter && "bg-amber-600 hover:bg-amber-700 text-white",
          )}
        >
          कम स्टॉक
        </Button>
      </div>

      {/* Search bar */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="नाम या SKU खोजें..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Product list */}
      <div className="px-4 space-y-2 pb-24">
        {filteredProducts === undefined ? (
          <div className="text-center text-muted-foreground py-12">
            लोड हो रहा है...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-4xl mb-2">📦</p>
            <p>अभी कोई उत्पाद नहीं है</p>
            <p className="text-sm mt-1">ऊपर "नया उत्पाद" बटन दबाएँ</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              name={product.name}
              sku={product.sku}
              category={product.category}
              type={product.type}
              stock={product.stock}
              avgCost={product.avgCost}
            />
          ))
        )}
      </div>
    </div>
  );
}
