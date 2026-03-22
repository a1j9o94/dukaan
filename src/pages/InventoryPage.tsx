import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { AddProductSheet } from "@/components/AddProductSheet";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function InventoryPage() {
  const [filter, setFilter] = useState<Category | "all">("all");

  const products = useQuery(api.products.listWithStock, {
    category: filter === "all" ? undefined : filter,
  });

  return (
    <div>
      <PageHeader
        title="इन्वेंटरी"
        action={<AddProductSheet />}
      />

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
      </div>

      {/* Product list */}
      <div className="px-4 space-y-2 pb-4">
        {products === undefined ? (
          <div className="text-center text-muted-foreground py-12">
            लोड हो रहा है...
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-4xl mb-2">📦</p>
            <p>अभी कोई उत्पाद नहीं है</p>
            <p className="text-sm mt-1">ऊपर "नया उत्पाद" बटन दबाएँ</p>
          </div>
        ) : (
          products.map((product) => (
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
