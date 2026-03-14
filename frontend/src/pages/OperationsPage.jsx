import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowDownToLine, 
  Truck, 
  ArrowRightLeft, 
  SlidersHorizontal 
} from "lucide-react";
import { toast } from "sonner";

const operationTypes = [
  { id: 'receipt', label: 'Receipt (Stock In)', icon: ArrowDownToLine },
  { id: 'delivery', label: 'Delivery (Stock Out)', icon: Truck },
  { id: 'transfer', label: 'Internal Transfer', icon: ArrowRightLeft },
  { id: 'adjustment', label: 'Stock Adjustment', icon: SlidersHorizontal },
];

function OperationForm({ type }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Capitalize the first letter for the success message
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    toast.success(`${formattedType} recorded successfully!`);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 max-w-xl space-y-4">
      <div className="space-y-2">
        <Label>Product</Label>
        <Select>
          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Steel Bolts M10 (SB-M10-001)</SelectItem>
            <SelectItem value="2">Copper Wire 2.5mm (CW-25-002)</SelectItem>
            <SelectItem value="3">Safety Helmets (SH-STD-003)</SelectItem>
            <SelectItem value="4">PVC Pipes 4" (PP-4IN-005)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Quantity</Label>
        <Input type="number" placeholder="Enter quantity" required />
      </div>

      <div className="space-y-2">
        <Label>{type === 'transfer' ? 'Source Warehouse' : 'Warehouse'}</Label>
        <Select>
          <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Warehouse A</SelectItem>
            <SelectItem value="b">Warehouse B</SelectItem>
            <SelectItem value="c">Warehouse C</SelectItem>
            <SelectItem value="d">Warehouse D</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {type === 'transfer' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label>Destination Warehouse</Label>
          <Select>
            <SelectTrigger><SelectValue placeholder="Select destination" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="a">Warehouse A</SelectItem>
              <SelectItem value="b">Warehouse B</SelectItem>
              <SelectItem value="c">Warehouse C</SelectItem>
              <SelectItem value="d">Warehouse D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {type === 'adjustment' && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label>Reason</Label>
          <Input placeholder="Reason for adjustment" required />
        </div>
      )}

      <Button type="submit" className="w-full mt-2">
        Submit {type.charAt(0).toUpperCase() + type.slice(1)}
      </Button>
    </form>
  );
}

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Operations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Record stock movements and adjustments
        </p>
      </div>

      <Tabs defaultValue="receipt" className="space-y-6">
        <TabsList className="bg-card border border-border h-auto p-1 flex-wrap">
          {operationTypes.map((op) => (
            <TabsTrigger 
              key={op.id} 
              value={op.id} 
              className="gap-2 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <op.icon className="w-4 h-4" />
              {op.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {operationTypes.map((op) => (
          <TabsContent key={op.id} value={op.id}>
            <OperationForm type={op.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}