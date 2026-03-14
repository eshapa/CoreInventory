import * as React from "react";
import { Plus, Pencil, Eye } from "lucide-react";
import { warehouses } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function WarehousesPage() {
  // Helper to determine color based on usage percentage
  const getUsageColor = (usage) => {
    if (usage >= 90) return "bg-destructive";
    if (usage >= 75) return "bg-warning";
    return "bg-primary";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Warehouses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage warehouse locations and capacity
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Warehouse
        </Button>
      </div>

      {/* Warehouse Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {warehouses.map((w) => {
          const usage = Math.round((w.used / w.capacity) * 100);
          return (
            <div key={w.id} className="glass-card rounded-xl p-5 border border-border/50">
              <h3 className="font-semibold text-foreground">{w.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{w.location}</p>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground font-medium">Capacity Usage</span>
                  <span className={cn(
                    "font-bold",
                    usage >= 90 ? "text-destructive" : "text-foreground"
                  )}>
                    {usage}%
                  </span>
                </div>
                <Progress 
                  value={usage} 
                  className="h-2" 
                  indicatorClassName={getUsageColor(usage)}
                />
              </div>
              
              <div className="flex justify-between mt-3 text-[11px] uppercase tracking-wider font-bold text-muted-foreground/70">
                <span>{w.used.toLocaleString()} used</span>
                <span>{(w.capacity - w.used).toLocaleString()} available</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="table-header">Warehouse</TableHead>
                <TableHead className="table-header">Location</TableHead>
                <TableHead className="table-header">Capacity</TableHead>
                <TableHead className="table-header">Used</TableHead>
                <TableHead className="table-header">Available</TableHead>
                <TableHead className="table-header">Usage</TableHead>
                <TableHead className="table-header text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((w) => {
                const usage = Math.round((w.used / w.capacity) * 100);
                return (
                  <TableRow key={w.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold">{w.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {w.location}
                    </TableCell>
                    <TableCell className="text-sm">{w.capacity.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{w.used.toLocaleString()}</TableCell>
                    <TableCell className="text-sm font-medium">
                      {(w.capacity - w.used).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Progress value={usage} className="h-1.5 w-16" />
                        <span className={cn(
                          "text-xs font-bold w-8",
                          usage >= 90 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {usage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <button 
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title="View Inventory"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          className="p-1.5 rounded-md hover:bg-secondary transition-colors"
                          title="Edit Warehouse"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}