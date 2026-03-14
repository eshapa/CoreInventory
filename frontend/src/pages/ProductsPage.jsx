import React, { useState, useEffect } from "react";
import { Plus, Eye, Pencil, Trash2, QrCode, Search, RefreshCw, AlertCircle } from "lucide-react";

import StatusBadge from "../components/StatusBadge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";

import { getProducts, createProduct } from "../api/products";
import { getCategories } from "../api/categories";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  /* ─────────────────────────────────────────
     FETCH DATA
  ───────────────────────────────────────── */
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      
      const productsData = productsRes.data?.data?.products || productsRes.data?.data || [];
      const categoriesData = categoriesRes.data?.data?.categories || categoriesRes.data?.data || [];
      
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ─────────────────────────────────────────
     CREATE PRODUCT
  ───────────────────────────────────────── */
  const handleCreate = async () => {
    if (!name || !sku) {
      setFormError("Product Name and SKU are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await createProduct({
        name,
        sku,
        category,
        unit
      });

      await fetchData(); // Refresh the list

      // Reset form
      setName("");
      setSku("");
      setCategory("");
      setUnit("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Create product failed", err);
      setFormError(err.response?.data?.message || err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────
     SEARCH FILTER
  ───────────────────────────────────────── */
  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product catalog
          </p>
        </div>

        {/* ADD PRODUCT MODAL */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {formError && (
                <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="Steel Bolts M10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    placeholder="SB-M10-001"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat._id} value={cat.name || cat.id || cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="pcs, kg, etc."
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full mt-2"
                onClick={handleCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* SEARCH AND REFRESH */}
      <div className="flex gap-4 items-center w-full max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-10 h-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-500/10 rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div className="glass-card rounded-xl overflow-hidden border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading products...
                  </div>
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => (
                <TableRow key={p.id || p._id || p.sku}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.sku}</TableCell>
                  <TableCell>{p.category || "-"}</TableCell>
                  <TableCell>{p.unit || "-"}</TableCell>
                  <TableCell>{p.totalStock || p.stock || 0}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status || "ok"} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}