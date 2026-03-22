import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { CATEGORIES, TYPES_BY_CATEGORY, SKU_PREFIX, type Category } from "@/lib/constants";

export function AddProductSheet() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");

  const createProduct = useMutation(api.products.create);

  const handleCategoryChange = (val: string) => {
    const cat = val as Category;
    setCategory(cat);
    setType("");
    // Auto-suggest SKU prefix
    if (!sku || Object.values(SKU_PREFIX).some((p) => sku.startsWith(p))) {
      setSku(`${SKU_PREFIX[cat]}-`);
    }
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim() || !sku.trim() || !category || !type) {
      setError("सभी फ़ील्ड भरना ज़रूरी है");
      return;
    }
    try {
      await createProduct({ name: name.trim(), sku: sku.trim(), category, type });
      setName("");
      setSku("");
      setCategory("");
      setType("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "त्रुटि हुई");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1">
          <Plus className="h-4 w-4" />
          नया उत्पाद
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>नया उत्पाद जोड़ें</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>नाम</Label>
            <Input
              placeholder="उत्पाद का नाम"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>श्रेणी</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="श्रेणी चुनें" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <div>
              <Label>प्रकार</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="प्रकार चुनें" />
                </SelectTrigger>
                <SelectContent>
                  {TYPES_BY_CATEGORY[category as Category]?.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>SKU</Label>
            <Input
              placeholder="SAR-001"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="mt-1 font-mono"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button onClick={handleSubmit} className="w-full" size="lg">
            उत्पाद जोड़ें
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
