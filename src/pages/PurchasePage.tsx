import { PageHeader } from "@/components/PageHeader";

export function PurchasePage() {
  return (
    <div>
      <PageHeader title="स्टॉक जोड़ें" />
      <div className="p-4 text-center text-muted-foreground mt-20">
        <p className="text-4xl mb-2">📥</p>
        <p>सप्लायर से खरीदारी दर्ज करें</p>
      </div>
    </div>
  );
}
