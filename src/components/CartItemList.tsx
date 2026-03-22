import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

export interface CartItem {
  id: string; // temp client-side ID
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number; // paisa
}

interface CartItemListProps {
  items: CartItem[];
  onRemove: (id: string) => void;
  priceLabel?: string; // "लागत" or "मूल्य"
}

export function CartItemList({ items, onRemove, priceLabel = "मूल्य" }: CartItemListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground px-1">
        {items.length} आइटम
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
        >
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{item.productName}</div>
            <div className="text-xs text-muted-foreground">
              {item.quantity} × {formatINR(item.pricePerUnit)} = {formatINR(item.quantity * item.pricePerUnit)}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
