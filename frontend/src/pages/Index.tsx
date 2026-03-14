import * as React from "react";
import { 
  Package, 
  AlertTriangle, 
  BarChart3, 
  ArrowRight,
  Plus
} from "lucide-react";
import { KpiCard } from "@/components/KpiCard";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const Index = () => {
  // Logic to calculate quick stats
  const lowStockCount = products.filter(
    (p) => p.status === "low-stock" || p.status === "out-of-stock"
  ).length;

  return (
    <div className="space-y-8 p-6 lg:p-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Inventory Overview</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Here is what's happening with your stock today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:flex gap-2">
            <BarChart3 className="w-4 h-4" />
            Reports
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Inventory" 
          value={products.length} 
          icon={Package} 
          trend="+5 new items" 
        />
        <KpiCard 
          title="Stock Alerts" 
          value={lowStockCount} 
          icon={AlertTriangle} 
          iconColor={lowStockCount > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}
          trend={lowStockCount > 0 ? "Action required" : "All healthy"} 
        />
        {/* You can add more KpiCards here for Valuations, Warehouses, etc. */}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Welcome Call-to-Action */}
        <div className="xl:col-span-2 glass-card rounded-2xl p-8 flex flex-col justify-center border border-border/50 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Ready to manage your stock?</h2>
            <p className="text-muted-foreground max-w-md mb-6">
              Navigate to the Dashboard to see detailed trends, or check your Alerts for items running low.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" className="gap-2">
                View Analytics <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {/* Subtle Background Decoration */}
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Quick Tips or Status Panel */}
        <div className="glass-card rounded-2xl p-6 border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Database Sync</span>
              <span className="text-success font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                Live
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last Inventory Count</span>
              <span className="text-foreground">2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;