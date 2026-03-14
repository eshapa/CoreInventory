# CoreInventory - Workflow and Project Structure

This document outlines the entire flow of the CoreInventory project based on the specifications.

## 1. User Roles
The system has two primary roles:

### Inventory Manager
*   Permissions: Manage products, configure warehouses, monitor KPIs, view move history, approve transfers, adjust stock, manage categories.

### Warehouse Staff
*   Permissions: Receive goods, process deliveries, execute internal transfers, scan products via QR, perform stock counts.

## 2. Authentication Flow
*   Login Page: Email, Password, Login, Forgot Password (OTP reset).
*   Flow: User Login -> Role Detection -> Dashboard (Manager or Staff).

## 3. Dashboard (Landing Page)
*   KPIs: Total Products, Low Stock/Out of Stock, Pending Receipts, Pending Deliveries, Scheduled Transfers.
*   Charts: Stock movements, Category distribution, Warehouse distribution.
*   Filters: Document types (Receipts, Deliveries, Transfers, Adjustments), Statuses (Draft, Waiting, Ready, Done, Canceled), Warehouses, Categories.

## 4. Product Management
*   Displays: Product Name, SKU, Category, UOM, Stock by Location, Reorder Level.
*   Actions (Manager): Create, Edit, Delete, View availability, Generate QR Code.
*   Creation Fields: Name, SKU/Code, Category, UOM, Initial Stock, Reorder Level, Location.

## 5. Warehouse Management
*   Displays: Name, Location, Capacity, Available Space.
*   Actions: Add, Edit, Delete, View Inventory.

## 6. Inventory Operations (Core Module)
Divided into 5 main tabs: Receipts, Delivery Orders, Internal Transfers, Stock Adjustments, Move History.

### 7. Receipts (Incoming Stock)
*   Flow: Supplier -> Warehouse
*   Actions: Create, Select supplier/products/qty, Validate. Updates ledger and warehouse stock.

### 8. Delivery Orders (Outgoing Stock)
*   Flow: Warehouse -> Customer
*   Actions: Pick, Pack, Validate. Decreases stock.

### 9. Internal Transfers
*   Flow: Location A -> Location B
*   Actions: Select product/qty/source/destination, Confirm. Stock quantity is unchanged, only location updates. Movement is logged.

### 10. Stock Adjustments
*   Purpose: Correct mismatches between system and physical stock.
*   Actions: Select product/location, enter actual count. System auto-calculates difference, logs adjustment, updates ledger.

### 11. Move History (Inventory Ledger)
*   Tracks all movements.
*   Data: TXN ID, Product, Operation Type, Qty, Warehouse, Date, User, Status. Filters available.

## 12. Low Stock Alerts
System detects when items fall below the assigned reorder level, notifying the manager and allowing restock requests.

## 13. Reports & Analytics (Manager)
Reports on valuation, trends, top products, utilization. Visualized via graphs for monthly flow, categories, and warehouse usage.

## 14. Staff Dashboard
Simplified view focusing on daily operations: Today's Receipts/Deliveries, Pending Transfers, Alerts. Quick actions included.

## 15. QR / Barcode Scanner Feature (Unique Innovation)
*   Each product gets a QR code upon creation.
*   Staff uses a mobile camera to scan.
*   Scanner Screen displays Name, SKU, Location, Stock.
*   Actions available directly from scan: Receive, Deliver, Transfer, Adjust.
*   Suggested Library (MERN): `html5-qrcode` or `react-qr-scanner`

## 16. Notifications
Alerts for low stock, pending transfers/receipts, and transfer approvals.

## 17. Profile Screen
User updates profile, changes password, or logs out.

## Complete Example System Workflow
1. Manager creates product -> 2. System generates QR -> 3. Stored in warehouse -> 4. Supplier sends goods -> 5. Staff scans QR -> 6. Staff records receipt -> 7. Stock increases -> 8. Customer orders -> 9. Staff scans QR -> 10. Process delivery -> 11. Stock decreases -> 12. Transfer needed -> 13. Staff moves stock -> 14. Mismatch found -> 15. Staff adjusts stock.
