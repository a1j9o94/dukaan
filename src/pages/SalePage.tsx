import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageHeader } from "@/components/PageHeader";
import { ProductPicker } from "@/components/ProductPicker";
import { CartItemList, type CartItem } from "@/components/CartItemList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatINR, toPaisa, formatDateTime } from "@/lib/format";
import { Plus } from "lucide-react";

export function SalePage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Id<"products"> | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { document.title = "दुकान — बिक्री"; }, []);
  const createTransaction = useMutation(api.sales.createTransaction);
  const recentSales = useQuery(api.sales.listRecent, {});

  const addItem = () => {
    if (!selectedProduct || !quantity || !salePrice) return;
    const qty = parseInt(quantity);
    const price = parseFloat(salePrice);
    if (qty <= 0 || price <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: selectedProduct,
        productName: selectedName,
        quantity: qty,
        pricePerUnit: toPaisa(price),
      },
    ]);
    setSelectedProduct(null);
    setSelectedName("");
    setQuantity("");
    setSalePrice("");
  };

  const total = items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (items.length === 0) {
      setError("कम से कम एक आइटम जोड़ें");
      return;
    }
    try {
      await createTransaction({
        items: items.map((i) => ({
          productId: i.productId as Id<"products">,
          quantity: i.quantity,
          salePricePerUnit: i.pricePerUnit,
        })),
        soldAt: Date.now(),
      });
      setItems([]);
      setSuccess("बिक्री दर्ज हो गई ✓");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "त्रुटि हुई");
    }
  };

  return (
    <div>
      <PageHeader title="बिक्री" />

      <div className="p-4 space-y-4">
        {/* Add item row */}
        <Card className="p-3 space-y-3">
          <Label className="text-xs text-muted-foreground">आइटम जोड़ें</Label>
          <ProductPicker
            value={selectedProduct}
            onChange={(id, name) => { setSelectedProduct(id); setSelectedName(name); }}
            showStock
          />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="मात्रा"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  placeholder="बिक्री मूल्य"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="pl-7 h-11"
                />
              </div>
            </div>
            <Button onClick={addItem} size="icon" className="h-11 w-11 shrink-0">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </Card>

        {/* Cart items */}
        <CartItemList
          items={items}
          onRemove={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />

        {/* Total + submit */}
        {items.length > 0 && (
          <>
            <Card className="p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {items.reduce((s, i) => s + i.quantity, 0)} आइटम | कुल
                </span>
                <span className="font-bold text-lg">{formatINR(total)}</span>
              </div>
            </Card>

            <Button onClick={handleSubmit} className="w-full" size="lg">
              बिक्री दर्ज करें
            </Button>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

        {/* Recent sales */}
        {recentSales && recentSales.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">हाल की बिक्री</h3>
            <div className="space-y-2">
              {recentSales.map((txn) => (
                <Card key={txn._id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(txn.soldAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {txn.itemCount} आइटम · {txn.items.map((i) => i.productName).join(", ")}
                      </div>
                    </div>
                    <div className="text-sm font-bold tabular-nums text-emerald-600">
                      {formatINR(txn.total)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
