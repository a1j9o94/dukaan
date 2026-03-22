import { PageHeader } from "@/components/PageHeader";

export function ReportsPage() {
  return (
    <div>
      <PageHeader title="रिपोर्ट" />
      <div className="p-4 text-center text-muted-foreground mt-20">
        <p className="text-4xl mb-2">📊</p>
        <p>मासिक लाभ-हानि रिपोर्ट</p>
      </div>
    </div>
  );
}
