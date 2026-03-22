import { useLocation, useNavigate } from "react-router-dom";
import { Package, ArrowDownToLine, ShoppingCart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/", label: "इन्वेंटरी", icon: Package },
  { path: "/purchase", label: "स्टॉक जोड़ें", icon: ArrowDownToLine },
  { path: "/sell", label: "बिक्री", icon: ShoppingCart },
  { path: "/reports", label: "रिपोर्ट", icon: BarChart3 },
] as const;

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                "min-h-[56px] active:bg-accent",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
