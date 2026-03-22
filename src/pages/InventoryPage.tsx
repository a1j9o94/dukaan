import { PageHeader } from "@/components/PageHeader";

export function InventoryPage() {
  return (
    <div>
      <PageHeader title="इन्वेंटरी" />
      <div className="p-4 text-center text-muted-foreground mt-20">
        <p className="text-4xl mb-2">📦</p>
        <p>अभी कोई उत्पाद नहीं है</p>
        <p className="text-sm">पहला उत्पाद जोड़ने के लिए "नया उत्पाद जोड़ें" बटन दबाएँ</p>
      </div>
    </div>
  );
}
