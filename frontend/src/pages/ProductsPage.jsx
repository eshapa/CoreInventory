import React, { useState } from "react";
import { Plus, Eye, Pencil, Trash2, QrCode, Search } from "lucide-react";

import { products } from "../lib/mock-data";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";

export default function ProductsPage() {

  const [searchQuery, setSearchQuery] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your product catalog
          </p>
        </div>

        <Dialog>
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

              <div className="grid grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="Steel Bolts M10" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="SB-M10-001" />
                </div>

              </div>

              <Button className="w-full mt-2">
                Create Product
              </Button>

            </div>

          </DialogContent>
        </Dialog>

      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">

        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          placeholder="Search products..."
          className="pl-10 h-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-border">

        <Table>

          <TableHeader>

            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>

          </TableHeader>

          <TableBody>

            {filtered.map((p) => (

              <TableRow key={p.id}>

                <TableCell>{p.name}</TableCell>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.category}</TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell>{p.stockLevel}</TableCell>
                <TableCell>{p.location}</TableCell>

                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>

                <TableCell className="text-right">

                  <div className="flex justify-end gap-2">

                    <Eye className="w-4 h-4" />
                    <Pencil className="w-4 h-4" />
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <QrCode className="w-4 h-4" />

                  </div>

                </TableCell>

              </TableRow>

            ))}

          </TableBody>

        </Table>

      </div>

    </div>
  );
}