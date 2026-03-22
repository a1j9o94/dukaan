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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatINR, toPaisa, formatDateTime } from "@/lib/format";
import { extractError } from "@/lib/errors";
import { Plus, Trash2, RotateCcw } from "lucide-react";

export function SalePage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Id<"products"> | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [totalSalePrice, setTotalSalePrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Id<"saleTransactions"> | null>(null);
  const [undoId, setUndoId] = useState<Id<"saleTransactions"> | null>(null);

  useEffect(() => { document.title = "दुकान — बिक्री"; }, []);
  const createTransaction = useMutation(api.sales.createTransaction);
  const deleteTransaction = useMutation(api.sales.deleteTransaction);
  const recentSales = useQuery(api.sales.listRecent, {});
  const lastTransaction = useQuery(api.sales.getLastTransaction, {});

  // Fix #6: Auto-fill last sale price when product is selected
  // lastSalePrice is per-unit in paisa from the DB
  const lastSalePrice = useQuery(
    api.sales.getLastSalePrice,
    selectedProduct ? { productId: selectedProduct } : "skip"
  );
  // Auto-fill totalSalePrice = lastSalePrice * qty when both are available
  useEffect(() => {
    if (lastSalePrice != null && !totalSalePrice) {
      const qty = parseInt(quantity);
      if (qty > 0) {
        setTotalSalePrice(String((lastSalePrice * qty) / 100));
      }
      // If quantity not set yet, don't auto-fill — wait until qty is entered
    }
  }, [lastSalePrice, quantity]);

  const addItem = () => {
    if (!selectedProduct || !quantity || !totalSalePrice) return;
    const qty = parseInt(quantity);
    const price = parseFloat(totalSalePrice);
    if (qty <= 0 || price <= 0) return;

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: selectedProduct,
        productName: selectedName,
        quantity: qty,
        pricePerUnit: Math.round(toPaisa(price) / qty),
      },
    ]);
    setSelectedProduct(null);
    setSelectedName("");
    setQuantity("");
    setTotalSalePrice("");
  };

  const total = items.reduce((s, i) => s + i.quantity * i.pricePerUnit, 0);

  const handleSubmit = async () => {
    setConfirmSubmit(false);
    setError("");
    setSuccess("");
    if (items.length === 0) {
      setError("कम से कम एक आइटम जोड़ें");
      return;
    }
    try {
      const txnId = await createTransaction({
        items: items.map((i) => ({
          productId: i.productId as Id<"products">,
          quantity: i.quantity,
          salePricePerUnit: i.pricePerUnit,
        })),
        soldAt: Date.now(),
      });
      setItems([]);
      setUndoId(txnId);
      setSuccess("बिक्री दर्ज हो गई ✓");
      setTimeout(() => { setUndoId(null); setSuccess(""); }, 5000);
    } catch (e: unknown) {
      setError(extractError(e));
    }
  };

  const handleUndo = async () => {
    if (!undoId) return;
    try {
      await deleteTransaction({ transactionId: undoId });
      setUndoId(null);
      setSuccess("बिक्री वापस ली गई");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("वापस लेने में त्रुटि");
    }
  };

  const handleDelete = async (txnId: Id<"saleTransactions">) => {
    setDeleteConfirm(null);
    try {
      await deleteTransaction({ transactionId: txnId });
    } catch {
      setError("हटाने में त्रुटि");
    }
  };

  // Fix #4: Repeat last sale
  const handleRepeatLast = () => {
    if (!lastTransaction) return;
    const newItems: CartItem[] = lastTransaction.items.map((i) => ({
      id: crypto.randomUUID(),
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      pricePerUnit: i.salePricePerUnit,
    }));
    setItems(newItems);
  };

  return (
    <div>
      <PageHeader
        title="बिक्री"
        action={
          lastTransaction && items.length === 0 ? (
            <Button variant="outline" size="sm" className="gap-1" onClick={handleRepeatLast}>
              <RotateCcw className="h-3.5 w-3.5" />
              पिछली बिक्री
            </Button>
          ) : undefined
        }
      />

      <div className="p-4 space-y-4 pb-24">
        {/* Add item row */}
        <Card className="p-3 space-y-3">
          <Label className="text-xs text-muted-foreground">आइटम जोड़ें</Label>
          <ProductPicker
            value={selectedProduct}
            onChange={(id, name) => { setSelectedProduct(id); setSelectedName(name); setTotalSalePrice(""); }}
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
                  placeholder="कुल राशि"
                  value={totalSalePrice}
                  onChange={(e) => setTotalSalePrice(e.target.value)}
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

            {/* Fix #5: Confirmation */}
            <Button onClick={() => setConfirmSubmit(true)} className="w-full" size="lg">
              बिक्री दर्ज करें
            </Button>
          </>
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

        {/* Recent sales with delete */}
        {recentSales && recentSales.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">हाल की बिक्री</h3>
            <div className="space-y-2">
              {recentSales.map((txn) => (
                <Card key={txn._id} className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-muted-foreground">{formatDateTime(txn.soldAt)}</div>
                      <div className="text-xs text-muted-foreground">
                        {txn.itemCount} आइटम · {txn.items.map((i) => i.productName).join(", ")}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums text-emerald-600">
                        {formatINR(txn.total)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirm(txn._id)}
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

      {/* Fix #5: Confirm dialog */}
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>बिक्री दर्ज करें?</DialogTitle>
          </DialogHeader>
          <div className="space-y-1 text-sm text-muted-foreground">
            {items.map((i) => (
              <div key={i.id}>{i.productName} × {i.quantity} = {formatINR(i.quantity * i.pricePerUnit)}</div>
            ))}
            <div className="pt-1 border-t font-bold text-foreground">कुल: {formatINR(total)}</div>
          </div>
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
            <DialogTitle>बिक्री हटाएँ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">यह बिक्री और उसके सभी आइटम हटा दिए जाएँगे। स्टॉक वापस आ जाएगा।</p>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">रद्द करें</Button>
            <Button onClick={() => deleteConfirm && handleDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white hover:bg-red-700">हटाएँ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
