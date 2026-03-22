import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { PageHeader } from "@/components/PageHeader";
import { ProductPicker } from "@/components/ProductPicker";
import { AddProductSheet } from "@/components/AddProductSheet";
import { CartItemList, type CartItem } from "@/components/CartItemList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatINR, toPaisa, formatDateTime } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export function PurchasePage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Id<"products"> | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [tax, setTax] = useState("");
  const [supplier, setSupplier] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"purchaseOrders"> | null>(null);
  const [undoId, setUndoId] = useState<Id<"purchaseOrders"> | null>(null);

  useEffect(() => { document.title = "दुकान — स्टॉक जोड़ें"; }, []);
  const createOrder = useMutation(api.purchases.createOrder);
  const deleteOrder = useMutation(api.purchases.deleteOrder);
  const recentOrders = useQuery(api.purchases.listRecent, {});

  // Fix #6: Auto-fill last purchase price when product is selected
  // lastPrice is per-unit in paisa from the DB
  const lastPrice = useQuery(
    api.purchases.getLastPrice,
    selectedProduct ? { productId: selectedProduct } : "skip"
  );
  // Auto-fill totalCost = lastPrice * qty when both are available
  useEffect(() => {
    if (lastPrice != null && !totalCost) {
      const qty = parseInt(quantity);
      if (qty > 0) {
        setTotalCost(String((lastPrice * qty) / 100));
      }
      // If quantity not set yet, don't auto-fill — wait until qty is entered
    }
  }, [lastPrice, quantity]);

  const addItem = () => {
    if (!selectedProduct || !quantity || !totalCost) return;
    const qty = parseInt(quantity);
    const cost = parseFloat(totalCost);
    if (qty <= 0 || cost <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: selectedProduct,
        productName: selectedName,
        quantity: qty,
        pricePerUnit: Math.round(toPaisa(cost) / qty),
      },
    ]);
    setSelectedProduct(null);
    setSelectedName("");
    setQuantity("");
    setTotalCost("");
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);
  const taxPaisa = toPaisa(parseFloat(tax) || 0);
  const total = subtotal + taxPaisa;

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setError("");
    setSuccess("");
    if (items.length === 0) {
      setError("कम से कम एक आइटम जोड़ें");
      return;
    }
    try {
      const orderId = await createOrder({
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
      // Fix #2: Undo — show undo option for 5 seconds
      setUndoId(orderId);
      setSuccess("खरीद दर्ज हो गई ✓");
      setTimeout(() => { setUndoId(null); setSuccess(""); }, 5000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "त्रुटि हुई");
    }
  };

  const handleUndo = async () => {
    if (!undoId) return;
    try {
      await deleteOrder({ orderId: undoId });
      setUndoId(null);
      setSuccess("खरीद वापस ली गई");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("वापस लेने में त्रुटि");
    }
  };

  const handleDelete = async (orderId: Id<"purchaseOrders">) => {
    setDeleteConfirm(null);
    try {
      await deleteOrder({ orderId });
    } catch {
      setError("हटाने में त्रुटि");
    }
  };

  return (
    <div>
      <PageHeader title="स्टॉक जोड़ें" />

      <div className="p-4 space-y-4 pb-24">
        {/* Add item row */}
        <Card className="p-3 space-y-3">
          <Label className="text-xs text-muted-foreground">आइटम जोड़ें</Label>
          <ProductPicker
            value={selectedProduct}
            onChange={(id, name) => { setSelectedProduct(id); setSelectedName(name); setTotalCost(""); }}
            onRequestNewProduct={() => setShowAddProduct(true)}
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
                  placeholder="कुल राशि"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
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
          priceLabel="कुल"
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
        {/* Fix #2: Undo toast */}
        {success && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-emerald-600 font-medium">{success}</p>
            {undoId && (
              <Button variant="outline" size="sm" onClick={handleUndo}>
                वापस लें
              </Button>
            )}
          </div>
        )}

        {/* Fix #5: Confirmation before submit */}
        {items.length > 0 && (
          <Button onClick={() => setConfirmSubmit(true)} className="w-full" size="lg">
            खरीद दर्ज करें
          </Button>
        )}

        {/* Recent purchases with delete */}
        {recentOrders && recentOrders.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">हाल की खरीदारी</h3>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Card key={order._id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">{formatDateTime(order.purchasedAt)}</div>
                      {order.supplierName && (
                        <div className="text-sm font-medium">{order.supplierName}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {order.itemCount} आइटम
                        {order.taxAmount > 0 && ` · कर ${formatINR(order.taxAmount)}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums">{formatINR(order.total)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(order._id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline add product sheet */}
      <AddProductSheet externalOpen={showAddProduct} onExternalClose={() => setShowAddProduct(false)} />

      {/* Fix #5: Confirm dialog */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>खरीद दर्ज करें?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {items.reduce((s, i) => s + i.quantity, 0)} आइटम · कुल {formatINR(total)}
          </p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setConfirmSubmit(false)} className="flex-1">रद्द करें</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">हाँ, दर्ज करें</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fix #1: Delete confirm dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>खरीद हटाएँ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">यह खरीद और उसके सभी आइटम हटा दिए जाएँगे।</p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">रद्द करें</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white hover:bg-red-700">हटाएँ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
