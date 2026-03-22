import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronLeft, ChevronRight, Plus, ArrowDownToLine, ArrowUpFromLine, TrendingDown } from "lucide-react";
import { formatINR, formatHindiMonth, formatDateTime, getMonthRange, toPaisa } from "@/lib/format";
import { CATEGORY_LABEL, EXPENSE_CATEGORIES, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const { start, end } = getMonthRange(year, month);

  const pl = useQuery(api.reports.monthlyPL, { start, end });
  const timeline = useQuery(api.reports.activityTimeline, { start, end });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div>
      <PageHeader title="रिपोर्ट" action={<AddExpenseSheet />} />

      <div className="p-4 space-y-4">
        {/* Month picker */}
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-lg font-semibold min-w-[160px] text-center">
            {formatHindiMonth(month, year)}
          </span>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* P&L Summary */}
        {pl && (
          <Card className="p-4 space-y-2">
            <Row label="कुल आय" value={pl.revenue} color="text-foreground" />
            <Row label="माल की लागत" value={-pl.cogs} color="text-muted-foreground" prefix="−" />
            <div className="border-t my-1" />
            <Row label="सकल लाभ" value={pl.grossProfit} color={pl.grossProfit >= 0 ? "text-emerald-600" : "text-destructive"} />
            <Row label="अन्य खर्चे" value={-pl.overhead} color="text-muted-foreground" prefix="−" />
            <div className="border-t my-1" />
            <div className="flex justify-between items-center">
              <span className="font-bold">शुद्ध लाभ</span>
              <span className={cn("font-bold text-lg tabular-nums", pl.netProfit >= 0 ? "text-emerald-600" : "text-destructive")}>
                {formatINR(Math.abs(pl.netProfit))}
                {pl.netProfit < 0 && " (हानि)"}
              </span>
            </div>
            {pl.revenue > 0 && (
              <div className="text-xs text-muted-foreground text-right">
                मार्जिन: {pl.margin}%
              </div>
            )}
          </Card>
        )}

        {/* Category breakdown */}
        {pl && pl.categories.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">श्रेणी अनुसार</h3>
            {pl.categories.map((cat) => (
              <Card key={cat.category} className="p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {CATEGORY_LABEL[cat.category as Category] ?? cat.category}
                  </span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    cat.profit >= 0 ? "text-emerald-600" : "text-destructive"
                  )}>
                    {formatINR(cat.profit)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                  <span>आय: {formatINR(cat.revenue)}</span>
                  <span>लागत: {formatINR(cat.cogs)}</span>
                  <span>मार्जिन: {cat.margin}%</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Activity timeline */}
        {timeline && timeline.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <h3 className="text-sm font-semibold text-muted-foreground">गतिविधि</h3>
            {timeline.map((event, i) => (
              <div key={i} className="flex items-start gap-3 py-2">
                <div className={cn(
                  "mt-0.5 rounded-full p-1.5",
                  event.type === "purchase" && "bg-emerald-100 text-emerald-700",
                  event.type === "sale" && "bg-blue-100 text-blue-700",
                  event.type === "expense" && "bg-red-100 text-red-700",
                )}>
                  {event.type === "purchase" && <ArrowDownToLine className="h-3.5 w-3.5" />}
                  {event.type === "sale" && <ArrowUpFromLine className="h-3.5 w-3.5" />}
                  {event.type === "expense" && <TrendingDown className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{event.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(event.timestamp)}
                    {event.itemCount != null && ` · ${event.itemCount} items`}
                  </div>
                </div>
                <div className={cn(
                  "text-sm font-bold tabular-nums shrink-0",
                  event.type === "purchase" && "text-emerald-700",
                  event.type === "sale" && "text-blue-700",
                  event.type === "expense" && "text-red-700",
                )}>
                  {formatINR(event.amount)}
                </div>
              </div>
            ))}
          </div>
        )}

        {pl && pl.revenue === 0 && (!timeline || timeline.length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-4xl mb-2">📊</p>
            <p>इस महीने कोई गतिविधि नहीं</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, color, prefix }: { label: string; value: number; color: string; prefix?: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("tabular-nums font-medium", color)}>
        {prefix}{formatINR(Math.abs(value))}
      </span>
    </div>
  );
}

function AddExpenseSheet() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const createExpense = useMutation(api.expenses.create);

  const handleSubmit = async () => {
    setError("");
    if (!description.trim() || !category || !amount) {
      setError("सभी फ़ील्ड भरें");
      return;
    }
    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      setError("राशि 0 से अधिक होनी चाहिए");
      return;
    }
    try {
      await createExpense({
        description: description.trim(),
        category,
        amount: toPaisa(amountNum),
        date: Date.now(),
      });
      setDescription("");
      setCategory("");
      setAmount("");
      setOpen(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "त्रुटि");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          खर्चा
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>खर्चा जोड़ें</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <Label>विवरण</Label>
            <Input
              placeholder="शिपिंग, यात्रा, आदि"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>श्रेणी</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="श्रेणी चुनें" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>राशि (₹)</Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            खर्चा दर्ज करें
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
