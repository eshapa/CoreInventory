export const products = [
  { id: "1", name: "Steel Bolts M10", sku: "SB-M10-001", category: "Hardware", unit: "Box", stockLevel: 450, reorderLevel: 100, warehouse: "Warehouse A", location: "A-12-3", status: "in-stock" },
  { id: "2", name: "Copper Wire 2.5mm", sku: "CW-25-002", category: "Electrical", unit: "Roll", stockLevel: 23, reorderLevel: 50, warehouse: "Warehouse B", location: "B-04-1", status: "low-stock" },
  { id: "3", name: "Safety Helmets", sku: "SH-STD-003", category: "Safety", unit: "Piece", stockLevel: 180, reorderLevel: 30, warehouse: "Warehouse A", location: "A-08-2", status: "in-stock" },
  { id: "4", name: "Hydraulic Oil 5L", sku: "HO-5L-004", category: "Fluids", unit: "Can", stockLevel: 0, reorderLevel: 20, warehouse: "Warehouse C", location: "C-02-5", status: "out-of-stock" },
  { id: "5", name: "PVC Pipes 4\"", sku: "PP-4IN-005", category: "Plumbing", unit: "Piece", stockLevel: 340, reorderLevel: 80, warehouse: "Warehouse B", location: "B-11-4", status: "in-stock" },
  { id: "6", name: "LED Panel Lights", sku: "LP-60W-006", category: "Electrical", unit: "Piece", stockLevel: 15, reorderLevel: 25, warehouse: "Warehouse A", location: "A-06-1", status: "low-stock" },
  { id: "7", name: "Welding Rods 3.2mm", sku: "WR-32-007", category: "Hardware", unit: "Pack", stockLevel: 95, reorderLevel: 40, warehouse: "Warehouse C", location: "C-09-3", status: "in-stock" },
  { id: "8", name: "Rubber Gaskets", sku: "RG-STD-008", category: "Plumbing", unit: "Set", stockLevel: 8, reorderLevel: 15, warehouse: "Warehouse B", location: "B-03-2", status: "low-stock" }
];

export const warehouses = [
  { id: "1", name: "Warehouse A", location: "New York, NY", capacity: 5000, used: 3200 },
  { id: "2", name: "Warehouse B", location: "Los Angeles, CA", capacity: 8000, used: 5600 },
  { id: "3", name: "Warehouse C", location: "Chicago, IL", capacity: 3000, used: 1800 },
  { id: "4", name: "Warehouse D", location: "Houston, TX", capacity: 6000, used: 2400 }
];

export const transactions = [
  { id: "TXN-001", product: "Steel Bolts M10", type: "receipt", quantity: 200, warehouse: "Warehouse A", date: "2026-03-14", user: "John Smith" },
  { id: "TXN-002", product: "Copper Wire 2.5mm", type: "delivery", quantity: 30, warehouse: "Warehouse B", date: "2026-03-13", user: "Jane Doe" },
  { id: "TXN-003", product: "Safety Helmets", type: "transfer", quantity: 50, warehouse: "Warehouse A", date: "2026-03-13", user: "John Smith" },
  { id: "TXN-004", product: "PVC Pipes 4\"", type: "receipt", quantity: 100, warehouse: "Warehouse B", date: "2026-03-12", user: "Mike Johnson" },
  { id: "TXN-005", product: "LED Panel Lights", type: "adjustment", quantity: -5, warehouse: "Warehouse A", date: "2026-03-12", user: "Jane Doe" },
  { id: "TXN-006", product: "Welding Rods 3.2mm", type: "delivery", quantity: 25, warehouse: "Warehouse C", date: "2026-03-11", user: "Mike Johnson" },
  { id: "TXN-007", product: "Hydraulic Oil 5L", type: "receipt", quantity: 40, warehouse: "Warehouse C", date: "2026-03-11", user: "John Smith" },
  { id: "TXN-008", product: "Rubber Gaskets", type: "transfer", quantity: 12, warehouse: "Warehouse B", date: "2026-03-10", user: "Jane Doe" }
];

export const stockMovementData = [
  { month: "Sep", receipts: 320, deliveries: 280 },
  { month: "Oct", receipts: 450, deliveries: 390 },
  { month: "Nov", receipts: 380, deliveries: 420 },
  { month: "Dec", receipts: 520, deliveries: 460 },
  { month: "Jan", receipts: 410, deliveries: 350 },
  { month: "Feb", receipts: 480, deliveries: 440 },
  { month: "Mar", receipts: 390, deliveries: 360 }
];

export const categoryDistribution = [
  { name: "Hardware", value: 35 },
  { name: "Electrical", value: 22 },
  { name: "Safety", value: 15 },
  { name: "Plumbing", value: 18 },
  { name: "Fluids", value: 10 }
];

export const warehouseDistribution = [
  { name: "WH-A", products: 320, capacity: 5000 },
  { name: "WH-B", products: 560, capacity: 8000 },
  { name: "WH-C", products: 180, capacity: 3000 },
  { name: "WH-D", products: 240, capacity: 6000 }
];