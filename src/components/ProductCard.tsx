import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import { CATEGORY_LABEL, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  name: string;
  sku: string;
  category: string;
  type: string;
  stock: number;
  avgCost: number; // paisa
}

export function ProductCard({ name, sku, category, type, stock, avgCost }: ProductCardProps) {
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-sm truncate">{name}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
              {type}
            </Badge>
            {stock > 0 && stock < 5 && (
              <Badge
                className="text-[10px] px-1.5 py-0 shrink-0 bg-amber-100 text-amber-800 border-amber-300"
                variant="outline"
              >
                कम स्टॉक
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{CATEGORY_LABEL[category as Category] ?? category}</span>
            <span>·</span>
            <span className="font-mono">{sku}</span>
          </div>
          {avgCost > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5">
              औसत लागत: {formatINR(avgCost)}
            </div>
          )}
        </div>
        <div
          className={cn(
            "text-2xl font-bold tabular-nums min-w-[48px] text-right",
            stock > 0 ? "text-emerald-600" : "text-destructive"
          )}
        >
          {stock}
        </div>
      </div>
    </Card>
  );
}
