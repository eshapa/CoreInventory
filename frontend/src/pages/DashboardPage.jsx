import React from "react";
import {
  Package,
  Building2,
  AlertTriangle,
  Truck,
  ArrowDownToLine,
  ArrowRightLeft,
} from "lucide-react";

import KpiCard from "../components/KpiCard";
import StatusBadge from "../components/StatusBadge";

import {
  stockMovementData,
  categoryDistribution,
  warehouseDistribution,
  transactions,
} from "../lib/mock-data";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

export default function DashboardPage() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your inventory operations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Total Products" value="1,248" icon={Package} trend="+12% this month" trendUp />
        <KpiCard title="Warehouses" value="4" icon={Building2} />
        <KpiCard title="Low Stock" value="14" icon={AlertTriangle} iconColor="bg-warning/10" trend="3 critical" />
        <KpiCard title="Pending Deliveries" value="8" icon={Truck} trend="+2 today" trendUp />
        <KpiCard title="Pending Receipts" value="12" icon={ArrowDownToLine} />
        <KpiCard title="Transfers" value="5" icon={ArrowRightLeft} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Stock Movement Chart */}
        <div className="glass-card rounded-xl p-5 lg:col-span-2">
          <h3 className="font-semibold text-foreground mb-4">
            Stock Movement Trend
          </h3>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockMovementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="receipts"
                  stroke="#6366f1"
                  strokeWidth={2}
                />

                <Line
                  type="monotone"
                  dataKey="deliveries"
                  stroke="#10b981"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Chart */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-foreground mb-4">
            By Category
          </h3>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill || ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444"][index % 5]} 
                    />
                  ))}
                </Pie>

                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Warehouse Chart */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">
          Warehouse Inventory
        </h3>

        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={warehouseDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />

              <Bar dataKey="products" fill="#6366f1" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-4">
          Recent Transactions
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {transactions.slice(0, 5).map((t) => (
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
              </TableRow>
            ))}
          </TableBody>
        </Table>

      </div>
    </div>
  );
}