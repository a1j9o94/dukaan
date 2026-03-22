import { PageHeader } from "@/components/PageHeader";

export function SalePage() {
  return (
    <div>
      <PageHeader title="बिक्री" />
      <div className="p-4 text-center text-muted-foreground mt-20">
        <p className="text-4xl mb-2">🛒</p>
        <p>ग्राहक को बिक्री दर्ज करें</p>
      </div>
    </div>
  );
}
