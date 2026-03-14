import * as React from "react";
import { products } from "@/lib/mock-data";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  // Filters the mock data for low or out of stock items
  const lowStock = products.filter(
    (p) => p.status === "low-stock" || p.status === "out-of-stock"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Low Stock Alerts</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Products below reorder level
        </p>
      </div>

      <div className="grid gap-3">
        {lowStock.map((p) => {
          const isCritical = p.status === "out-of-stock";
          
          return (
            <div
              key={p.id}
              className={cn(
                "glass-card rounded-xl p-5 flex items-center justify-between transition-all",
                isCritical && "border-destructive/30 bg-destructive/5"
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-lg",
                    isCritical ? "bg-destructive/10" : "bg-warning/10"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "w-5 h-5",
                      isCritical ? "text-destructive" : "text-warning"
                    )}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {p.sku} · {p.warehouse}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      isCritical ? "text-destructive" : "text-warning"
                    )}
                  >
                    {p.stockLevel}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    of {p.reorderLevel} min
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Restock
                </Button>
              </div>
            </div>
          );
        })}
        
        {/* Empty state if no alerts found */}
        {lowStock.length === 0 && (
          <div className="text-center py-12 glass-card rounded-xl">
            <p className="text-muted-foreground">All stock levels are healthy.</p>
          </div>
        )}
      </div>
    </div>
  );
}