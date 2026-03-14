import React, { useState } from "react";
import { Search } from "lucide-react";

import { transactions } from "../lib/mock-data";
import StatusBadge from "../components/StatusBadge";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "../components/ui/table";

import { Input } from "../components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../components/ui/select";

export default function TransactionsPage() {

  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = transactions.filter((t) => {
    const matchesType = typeFilter === "all" || t.type === typeFilter;

    const matchesSearch =
      t.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and audit all inventory movements
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search product or ID..."
            className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="receipt">Receipts</SelectItem>
            <SelectItem value="delivery">Deliveries</SelectItem>
            <SelectItem value="transfer">Transfers</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" className="w-full sm:w-44" />

      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden border border-border">

        <Table>

          <TableHeader>

            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
            </TableRow>

          </TableHeader>

          <TableBody>

            {filtered.map((t) => (

              <TableRow key={t.id}>

                <TableCell>{t.id}</TableCell>
                <TableCell>{t.product}</TableCell>

                <TableCell>
                  <StatusBadge status={t.type} variant="operation" />
                </TableCell>

                <TableCell>
                  {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                </TableCell>

                <TableCell>{t.warehouse}</TableCell>
                <TableCell>{t.date}</TableCell>

                <TableCell>
                  {t.user}
                </TableCell>

              </TableRow>

            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}

          </TableBody>

        </Table>

      </div>

    </div>
  );
}