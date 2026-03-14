import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRightLeft, SlidersHorizontal, Plus, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import api from "../api/axios";
import { toast } from "sonner";

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState("transfers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Operations</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage stock transfers between warehouses and inventory adjustments
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4" />
            Transfers
          </TabsTrigger>
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Adjustments
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="transfers" className="m-0">
            <TransfersTab />
          </TabsContent>
          
          <TabsContent value="adjustments" className="m-0">
            <AdjustmentsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSFERS TAB
// ─────────────────────────────────────────────────────────────────────────────
function TransfersTab() {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false); // Controls modal visibility
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [sourceId, setSourceId] = useState("");
  const [destId, setDestId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ product_id: "", quantity: "" }]);

  // Data for Dropdowns
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [transfersRes, whRes, prodRes] = await Promise.all([
        api.get("/transfers"),
        api.get("/warehouses"),
        api.get("/products")
      ]);
      setTransfers(transfersRes.data.data || []);
      setWarehouses(whRes.data.data?.warehouses || whRes.data.data || []);
      setProducts(prodRes.data.data?.products || prodRes.data.data || []); // depends on product route pagination structure
    } catch (err) {
      toast.error("Failed to load transfer data.");
    } finally {
      setIsLoading(false);
    }
  };

  const addItemRow = () => setItems([...items, { product_id: "", quantity: "" }]);
  
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!sourceId || !destId) return toast.error("Please select both warehouses.");
    if (sourceId === destId) return toast.error("Source and destination cannot be the same.");
    
    const validItems = items.filter(i => i.product_id && i.quantity > 0);
    if (validItems.length === 0) return toast.error("Please add at least one valid product.");

    try {
      setIsSubmitting(true);
      await api.post("/transfers", {
        source_warehouse_id: parseInt(sourceId),
        destination_warehouse_id: parseInt(destId),
        notes,
        items: validItems.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: Number(i.quantity)
        }))
      });
      toast.success("Transfer draft created successfully.");
      setIsCreating(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create transfer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async (id) => {
    try {
      await api.put(`/transfers/${id}/status`, { status: "done" });
      toast.success("Transfer validated. Stock updated!");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to validate transfer.");
    }
  };

  const resetForm = () => {
    setSourceId("");
    setDestId("");
    setNotes("");
    setItems([{ product_id: "", quantity: "" }]);
  };

  if (isLoading && !isCreating) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header / Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Transfer History</h2>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          {isCreating ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Transfer</>}
        </Button>
      </div>

      {/* Creation Form inline (using simple box for now) */}
      {isCreating && (
        <div className="glass-card p-6 border border-border/50 rounded-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold border-b pb-2">Create New Transfer Draft</h3>
          <form onSubmit={handleCreateDraft} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source Warehouse</Label>
                <Select value={sourceId} onValueChange={setSourceId}>
                  <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Warehouse</Label>
                <Select value={destId} onValueChange={setDestId} disabled={!sourceId}>
                  <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()} disabled={w.id.toString() === sourceId}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Products to Transfer</Label>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-end gap-4 p-4 border rounded-lg bg-secondary/20">
                  <div className="flex-1 space-y-2">
                    <Label>Product</Label>
                    <Select value={item.product_id} onValueChange={(v) => updateItem(idx, "product_id", v)}>
                      <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-32 space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number" min="1" step="0.01" 
                      value={item.quantity} 
                      onChange={(e) => updateItem(idx, "quantity", e.target.value)} 
                    />
                  </div>
                </div>
              ))}
              <Button type="button" onClick={addItemRow} variant="outline" className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Another Product
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Reason for transfer..." />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Draft
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold border-b">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Source</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transfers.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-muted-foreground">No transfers found</td></tr>
            ) : transfers.map(t => (
              <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4 font-medium">TRN-{t.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4">{format(new Date(t.created_at), 'MMM dd, yyyy')}</td>
                <td className="px-6 py-4">{t.source_warehouse_name}</td>
                <td className="px-6 py-4">{t.destination_warehouse_name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    t.status === 'done' ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {t.status === 'draft' ? (
                    <Button size="sm" onClick={() => handleValidate(t.id)} className="gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Validate
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADJUSTMENTS TAB
// ─────────────────────────────────────────────────────────────────────────────
function AdjustmentsTab() {
  const [adjustments, setAdjustments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [systemQty, setSystemQty] = useState(null);
  const [actualQty, setActualQty] = useState("");
  const [reason, setReason] = useState("");

  // Data
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchData(); }, []);

  // Fetch System Qty when Product & Warehouse are selected
  useEffect(() => {
    if (productId && warehouseId) {
      api.get(`/stock-adjustments/system-quantity?productId=${productId}&warehouseId=${warehouseId}`)
        .then(res => setSystemQty(res.data.data.systemQuantity))
        .catch(() => setSystemQty(0));
    } else {
      setSystemQty(null);
    }
  }, [productId, warehouseId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [adjRes, whRes, prodRes] = await Promise.all([
        api.get("/stock-adjustments"),
        api.get("/warehouses"),
        api.get("/products")
      ]);
      setAdjustments(adjRes.data.data?.adjustments || adjRes.data.data || []);
      setWarehouses(whRes.data.data?.warehouses || whRes.data.data || []);
      setProducts(prodRes.data.data?.products || prodRes.data.data || []);
    } catch (err) {
      toast.error("Failed to load adjustment data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!productId || !warehouseId || actualQty === "" || !reason) {
      return toast.error("Please fill in all fields.");
    }
    
    try {
      setIsSubmitting(true);
      await api.post("/stock-adjustments", {
        product_id: parseInt(productId),
        warehouse_id: parseInt(warehouseId),
        actual_quantity: Number(actualQty),
        reason
      });
      toast.success("Stock adjustment successful.");
      setIsCreating(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit adjustment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setProductId("");
    setWarehouseId("");
    setActualQty("");
    setReason("");
  };

  const delta = (actualQty !== "" && systemQty !== null) ? Number(actualQty) - systemQty : 0;

  if (isLoading && !isCreating) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Stock Adjustments</h2>
        <Button onClick={() => setIsCreating(!isCreating)} variant={isCreating ? "outline" : "default"}>
          {isCreating ? "Cancel" : <><RotateCcw className="w-4 h-4 mr-2" /> New Adjustment</>}
        </Button>
      </div>

      {isCreating && (
        <div className="glass-card p-6 border border-border/50 rounded-xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-lg font-semibold border-b pb-2">Record Physical Count</h3>
          <form onSubmit={handleAdjust} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger><SelectValue placeholder="Select Warehouse" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id.toString()}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-secondary/10">
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">System Quantity</Label>
                <div className="font-mono text-2xl font-bold">
                  {systemQty !== null ? systemQty : "—"}
                </div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Actual Count</Label>
                <Input 
                  type="number" min="0" step="0.01" 
                  value={actualQty} 
                  onChange={(e) => setActualQty(e.target.value)} 
                  className="font-mono text-xl h-10"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs uppercase">Delta (Adjustment)</Label>
                <div className={`font-mono text-2xl font-bold ${
                  delta > 0 ? "text-green-500" : delta < 0 ? "text-red-500" : "text-muted-foreground"
                }`}>
                  {delta > 0 ? "+" : ""}{delta}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason for Count Discrepancy</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="e.g. Damage, Miscount, Expiration..." 
                required 
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || delta === 0}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Adjustment
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* List Table */}
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-semibold border-b">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Warehouse</th>
              <th className="px-6 py-4 text-center">Sys. Qty</th>
              <th className="px-6 py-4 text-center">Actual Qty</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4">User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {adjustments.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-8 text-center text-muted-foreground">No adjustments found</td></tr>
            ) : adjustments.map(a => (
              <tr key={a.id} className="hover:bg-secondary/20 transition-colors">
                <td className="px-6 py-4">{format(new Date(a.created_at), 'MMM dd, yyyy HH:mm')}</td>
                <td className="px-6 py-4">
                  <div className="font-medium">{a.product_name}</div>
                  <div className="text-xs text-muted-foreground">{a.sku}</div>
                </td>
                <td className="px-6 py-4">{a.warehouse_name}</td>
                <td className="px-6 py-4 text-center font-mono">{a.system_quantity}</td>
                <td className="px-6 py-4 text-center font-mono font-medium">{a.actual_quantity}</td>
                <td className="px-6 py-4 text-muted-foreground text-xs max-w-[200px] truncate" title={a.reason}>
                  {a.reason}
                </td>
                <td className="px-6 py-4">{a.adjusted_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}