import { Routes, Route } from "react-router-dom";
import { TabBar } from "@/components/TabBar";
import { InventoryPage } from "@/pages/InventoryPage";
import { PurchasePage } from "@/pages/PurchasePage";
import { SalePage } from "@/pages/SalePage";
import { ReportsPage } from "@/pages/ReportsPage";
import "@/styles/globals.css";

export function App() {
  return (
    <div className="min-h-[100dvh] bg-background pb-16">
      <div className="mx-auto max-w-lg">
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/purchase" element={<PurchasePage />} />
          <Route path="/sell" element={<SalePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  );
}
