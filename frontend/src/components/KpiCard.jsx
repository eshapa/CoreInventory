import React from "react";
import { cn } from "../lib/utils";

function KpiCard({ title, value, icon: Icon, trend, trendUp, iconColor }) {
  return (
    <div className="kpi-card animate-fade-in">
      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm text-muted-foreground font-medium">
            {title}
          </p>

          <p className="text-2xl font-bold mt-1 text-foreground">
            {value}
          </p>

          {trend && (
            <p
              className={cn(
                "text-xs font-medium mt-1",
                trendUp ? "text-success" : "text-destructive"
              )}
            >
              {trend}
            </p>
          )}
        </div>

        <div className={cn("p-2.5 rounded-lg", iconColor || "bg-primary/10")}>
          {Icon && (
            <Icon
              className={cn(
                "w-5 h-5",
                iconColor ? "text-card-foreground" : "text-primary"
              )}
            />
          )}
        </div>

      </div>
    </div>
  );
}

export default KpiCard;