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
import { formatINR, toPaisa } from "@/lib/format";
import { formatDateTime } from "@/lib/format";
import { Plus } from "lucide-react";

export function PurchasePage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Id<"products"> | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [tax, setTax] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { document.title = "दुकान — स्टॉक जोड़ें"; }, []);
  const createOrder = useMutation(api.purchases.createOrder);
  const recentOrders = useQuery(api.purchases.listRecent, {});

  const addItem = () => {
    if (!selectedProduct || !quantity || !costPerUnit) return;
    const qty = parseInt(quantity);
    const cost = parseFloat(costPerUnit);
    if (qty <= 0 || cost <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: selectedProduct,
        productName: selectedName,
        quantity: qty,
        pricePerUnit: toPaisa(cost),
      },
    ]);
    setSelectedProduct(null);
    setSelectedName("");
    setQuantity("");
    setCostPerUnit("");
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);
  const taxPaisa = toPaisa(parseFloat(tax) || 0);
  const total = subtotal + taxPaisa;

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (items.length === 0) {
      setError("कम से कम एक आइटम जोड़ें");
      return;
    }
    try {
      await createOrder({
        items: items.map((i) => ({
          productId: i.productId as Id<"products">,
          quantity: i.quantity,
          costPerUnit: i.pricePerUnit,
        })),
        taxAmount: taxPaisa,
        supplierName: supplier.trim() || undefined,
        purchasedAt: Date.now(),
      });
      setItems([]);
      setTax("");
      setSupplier("");
      setSuccess("खरीद दर्ज हो गई ✓");
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "त्रुटि हुई");
    }
  };

  return (
    <div>
      <PageHeader title="स्टॉक जोड़ें" />

      <div className="p-4 space-y-4">
        {/* Add item row */}
        <Card className="p-3 space-y-3">
          <Label className="text-xs text-muted-foreground">आइटम जोड़ें</Label>
          <ProductPicker
            value={selectedProduct}
            onChange={(id, name) => { setSelectedProduct(id); setSelectedName(name); }}
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
                  placeholder="लागत/इकाई"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
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
          priceLabel="लागत"
        />

        {/* Tax + Supplier */}
        {items.length > 0 && (
          <Card className="p-3 space-y-3">
            <div>
              <Label className="text-xs">कुल कर (₹)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">सप्लायर का नाम</Label>
              <Input
                placeholder="वैकल्पिक"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-center pt-2 border-t text-sm">
              <span className="text-muted-foreground">
                {items.reduce((s, i) => s + i.quantity, 0)} आइटम | कुल
              </span>
              <span className="font-bold text-lg">{formatINR(total)}</span>
            </div>
          </Card>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-emerald-600 font-medium">{success}</p>}

        {items.length > 0 && (
          <Button onClick={handleSubmit} className="w-full" size="lg">
            खरीद दर्ज करें
          </Button>
        )}

        {/* Recent purchases */}
        {recentOrders && recentOrders.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">हाल की खरीदारी</h3>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Card key={order._id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs text-muted-foreground">{formatDateTime(order.purchasedAt)}</div>
                      {order.supplierName && (
                        <div className="text-sm font-medium">{order.supplierName}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {order.itemCount} आइटम
                        {order.taxAmount > 0 && ` · कर ${formatINR(order.taxAmount)}`}
                      </div>
                    </div>
                    <div className="text-sm font-bold tabular-nums">{formatINR(order.total)}</div>
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
