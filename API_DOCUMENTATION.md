# CoreInventory API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Version:** 2.0.0  
> **Last Updated:** 2026-03-14

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)

---

## Overview

CoreInventory is a full-stack inventory management system backed by **TiDB**. It supports two roles:

| Role | `role_name` |
|------|-------------|
| Inventory Manager | `inventory_manager` |
| Warehouse Staff | `warehouse_staff` |

Role icons used below:
- 🔑 = Inventory Manager only
- 👥 = Both roles

---

## Authentication

Stateless **JWT Bearer tokens** are issued on login / email verification.

```
Authorization: Bearer <access_token>
```

The JWT payload contains `{ id, role_id, role }` where `role` is the resolved role name.

---

## Response Format

```json
// Success
{ "success": true, "message": "...", "data": { } }

// Error
{ "success": false, "message": "..." }

// Validation Error 422
{ "success": false, "message": "Validation failed", "errors": { "field": "reason" } }
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| `200` | OK |
| `201` | Created |
| `400` | Bad Request |
| `401` | Unauthorized — missing/invalid JWT |
| `403` | Forbidden — account inactive or wrong role |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `422` | Validation Failed |
| `429` | Rate Limited |
| `500` | Internal Server Error |

---

## Rate Limiting

| Limiter | Applied To | Max | Window |
|---------|-----------|-----|--------|
| `authLimiter` | `/register`, `/login` | 10 | 15 min |
| `otpLimiter` | `/verify-email`, `/resend-otp` | 3 | 10 min |
| `resetLimiter` | `/forgot-password`, `/verify-reset-otp`, `/reset-password` | 5 | 30 min |

---

## Endpoints

---

### `GET /api/health`
Public. Returns server status.

```json
{ "success": true, "status": "OK", "timestamp": "...", "environment": "development" }
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`
**Public** · Rate: authLimiter

```json
// Request
{ "name": "John Doe", "email": "john@example.com", "phone": "+911234567890",
  "password": "Password@123", "role": "inventory_manager" }

// 201 Response
{ "data": { "user": { "id": 1, "name": "...", "email": "...", "phone": "...",
  "role_id": 1, "role": "inventory_manager", "status": "inactive", "createdAt": "..." } } }
```

| Field | Rules |
|-------|-------|
| `name` | 2–100 chars |
| `email` | valid email |
| `phone` | optional, max 20 chars |
| `password` | 8–72 chars, requires upper/lower/digit/special |
| `role` | `"inventory_manager"` or `"warehouse_staff"` |

Errors: `409` duplicate email · `422` validation

---

### `POST /api/auth/verify-email`
**Public** · Rate: otpLimiter  
Activates account (`status → active`) and returns access token.

```json
// Request
{ "email": "john@example.com", "otp": "482910" }

// 200 Response
{ "data": { "user": { ... , "status": "active" }, "accessToken": "<jwt>" } }
```

Errors: `400` invalid/expired OTP · `404` email not found

---

### `POST /api/auth/resend-otp`
**Public** · Rate: otpLimiter

```json
{ "email": "john@example.com", "type": "EMAIL_VERIFY" }
// type: "EMAIL_VERIFY" | "PASSWORD_RESET"
```

Always responds with `200` (prevents enumeration).

---

### `POST /api/auth/login`
**Public** · Rate: authLimiter

```json
// Request
{ "email": "john@example.com", "password": "Password@123" }

// 200 Response
{ "data": { "user": { ... }, "accessToken": "<jwt>" } }
```

Errors: `401` invalid credentials · `403` account not active

---

### `POST /api/auth/forgot-password`
**Public** · Rate: resetLimiter  
Sends 6-digit reset OTP. Always responds `200`.

```json
{ "email": "john@example.com" }
```

---

### `POST /api/auth/verify-reset-otp`
**Public** · Rate: resetLimiter

```json
// Request
{ "email": "john@example.com", "otp": "193847" }
// 200 Response
{ "data": { "resetToken": "<short_lived_jwt>" } }
```

---

### `POST /api/auth/reset-password`
**Public** · Rate: resetLimiter

```json
{ "resetToken": "<short_lived_jwt>", "newPassword": "NewPass@456" }
```

Errors: `400` invalid/expired token

---

### `GET /api/auth/me`  🔒 Private
Returns the authenticated user.

```json
{ "data": { "user": { "id":1, "name":"...", "email":"...", "phone":"...",
  "role_id":1, "role":"inventory_manager", "status":"active", "createdAt":"..." } } }
```

---

### `PUT /api/auth/me`  🔒 Private
Update own name and/or phone.

```json
{ "name": "Updated Name", "phone": "+919876543210" }
```

---

### `POST /api/auth/logout`  🔒 Private
Stateless logout — client must discard token.

---

## Users — `/api/users`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/profile` | 👥 Both | Get own profile |
| PUT | `/profile` | 👥 Both | Update own name/phone |

---

## Warehouses — `/api/warehouses`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | 👥 Both | List all warehouses |
| GET | `/:id` | 👥 Both | Get warehouse by ID |
| POST | `/` | 🔑 Manager | Create warehouse |
| PUT | `/:id` | 🔑 Manager | Update warehouse |
| DELETE | `/:id` | 🔑 Manager | Delete warehouse |

**Warehouse Object:**
```json
{ "id": 1, "name": "Main Warehouse", "location": "Bangalore", "capacity": 5000, "created_at": "..." }
```

**POST/PUT body:**
```json
{ "name": "Main Warehouse", "location": "Bangalore", "capacity": 5000 }
```

---

## Categories — `/api/categories`

| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | 👥 Both |
| GET | `/:id` | 👥 Both |
| POST | `/` | 🔑 Manager |
| PUT | `/:id` | 🔑 Manager |
| DELETE | `/:id` | 🔑 Manager |

**Body:** `{ "name": "Electronics", "description": "..." }`

---

## Products — `/api/products`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | 👥 Both | List products (optional `?categoryId=`) |
| GET | `/:id` | 👥 Both | Get by ID |
| GET | `/sku/:sku` | 👥 Both | Get by SKU |
| POST | `/` | 🔑 Manager | Create product |
| PUT | `/:id` | 🔑 Manager | Update product |
| DELETE | `/:id` | 🔑 Manager | Delete product |

**Product Object:**
```json
{ "id": 1, "name": "Widget A", "sku": "WGT-001", "category_id": 2,
  "category_name": "Electronics", "description": "...", "unit": "pcs",
  "reorder_level": 10, "qr_code": null, "created_at": "..." }
```

Errors: `409` duplicate SKU

---

## Suppliers — `/api/suppliers`

🔑 Manager only for all operations.

```json
{ "name": "ABC Supplies", "contact_person": "Raj", "phone": "9876543210",
  "email": "raj@abc.com", "address": "Mumbai" }
```

---

## Customers — `/api/customers`

🔑 Manager only for all operations.

```json
{ "name": "XYZ Corp", "phone": "9876543210", "email": "xyz@corp.com", "address": "Delhi" }
```

---

## Inventory — `/api/inventory`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/?warehouseId=` | 👥 Both | Stock levels for a warehouse |
| GET | `/product/:productId` | 👥 Both | Stock across all warehouses |
| GET | `/ledger` | 👥 Both | Audit trail (query: `productId`, `warehouseId`, `limit`) |

**Stock Object:**
```json
{ "id": 1, "product_id": 5, "warehouse_id": 1, "quantity": 120,
  "product_name": "Widget A", "sku": "WGT-001", "unit": "pcs",
  "reorder_level": 10, "category_name": "Electronics", "updated_at": "..." }
```

**Ledger Entry Object:**
```json
{ "id": 1, "product_id": 5, "warehouse_id": 1, "product_name": "Widget A",
  "warehouse_name": "Main", "operation_type": "receipt", "quantity_change": 50,
  "reference_id": 3, "reference_type": "receipt", "created_by_name": "John", "created_at": "..." }
```

`operation_type` values: `receipt · delivery · transfer_in · transfer_out · adjustment`

---

## Receipts — `/api/receipts`

Goods arriving from suppliers into a warehouse.

| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | 👥 Both |
| GET | `/:id` | 👥 Both |
| POST | `/` | 🔑 Manager |
| PATCH | `/:id/status` | 🔑 Manager |

**Query params (GET /):** `?warehouseId=&status=`

**Create Body:**
```json
{
  "supplier_id": 1,
  "warehouse_id": 1,
  "notes": "First batch",
  "items": [
    { "product_id": 5, "quantity": 100, "unit_price": 29.99 }
  ]
}
```

**Status Update:**
```json
{ "status": "done" }
// status: "draft" | "ready" | "done" | "cancelled"
```

> ⚡ When status → `done`: inventory_stocks is incremented and a `stock_ledger` entry is written atomically.

---

## Deliveries — `/api/deliveries`

Goods going out to customers from a warehouse.

| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | 👥 Both |
| GET | `/:id` | 👥 Both |
| POST | `/` | 🔑 Manager |
| PATCH | `/:id/status` | 🔑 Manager |

**Create Body:**
```json
{
  "customer_id": 2,
  "warehouse_id": 1,
  "notes": "Urgent delivery",
  "items": [
    { "product_id": 5, "quantity": 20, "unit_price": 49.99 }
  ]
}
```

> ⚡ When status → `done`: validates sufficient stock, then decrements inventory and writes ledger.  
> Returns `422` if stock is insufficient for any item.

---

## Transfers — `/api/transfers`

Move stock between warehouses.

| Method | Route | Access |
|--------|-------|--------|
| GET | `/` | 👥 Both |
| GET | `/:id` | 👥 Both |
| POST | `/` | 🔑 Manager |
| PATCH | `/:id/status` | 🔑 Manager |

**Create Body:**
```json
{
  "source_warehouse_id": 1,
  "destination_warehouse_id": 2,
  "notes": "Rebalancing stock",
  "items": [
    { "product_id": 5, "quantity": 30 }
  ]
}
```

> ⚡ When status → `done`: decrements source, increments destination, writes `transfer_out` + `transfer_in` ledger entries.

---

## Stock Adjustments — `/api/stock-adjustments`

🔑 Manager only. Correct discrepancies between system and actual counts.

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List (query: `?productId=&warehouseId=`) |
| GET | `/:id` | Get by ID |
| POST | `/` | Create adjustment |

**Create Body:**
```json
{
  "product_id": 5,
  "warehouse_id": 1,
  "system_quantity": 120,
  "actual_quantity": 115,
  "reason": "Physical count discrepancy"
}
```

> ⚡ Sets `inventory_stocks.quantity` to `actual_quantity` and writes an `adjustment` ledger entry.

---

## Alerts — `/api/alerts`

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | 👥 Both | List alerts (query: `?isResolved=true\|false&alertType=`) |
| GET | `/:id` | 👥 Both | Get alert |
| PATCH | `/:id/resolve` | 🔑 Manager | Mark resolved |

**Alert Object:**
```json
{ "id": 1, "product_id": 5, "warehouse_id": 1, "product_name": "Widget A",
  "warehouse_name": "Main", "alert_type": "low_stock", "message": "...",
  "is_resolved": 0, "created_at": "..." }
```

`alert_type`: `low_stock · out_of_stock`

---

## Notifications — `/api/notifications`

Each user sees only their own notifications.

| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/` | 👥 Both | List my notifications |
| PATCH | `/:id/read` | 👥 Both | Mark one as read |
| PATCH | `/read-all` | 👥 Both | Mark all as read |

**Notification Object:**
```json
{ "id": 1, "user_id": 1, "alert_id": 3, "alert_type": "low_stock",
  "title": "Low Stock Alert", "message": "Widget A is running low",
  "is_read": 0, "created_at": "..." }
```

---

## Key Flows

### Registration & Login
```
POST /api/auth/register → OTP sent to email
POST /api/auth/verify-email (OTP) → account active + accessToken
POST /api/auth/login → accessToken
```

### Password Reset
```
POST /api/auth/forgot-password → OTP sent
POST /api/auth/verify-reset-otp → resetToken (15 min)
POST /api/auth/reset-password (resetToken + newPassword)
```

### Goods In Flow
```
POST /api/receipts (draft)
PATCH /api/receipts/:id/status { "status": "ready" }
PATCH /api/receipts/:id/status { "status": "done" } → stock updated + ledger written
```

### Goods Out Flow
```
POST /api/deliveries (draft)
PATCH /api/deliveries/:id/status { "status": "done" } → stock decremented (validates availability)
```

### Transfer Flow
```
POST /api/transfers { source, destination, items }
PATCH /api/transfers/:id/status { "status": "done" } → atomic bi-directional stock move
```

---

## Password Rules
Must be 8–72 characters with at least one: uppercase, lowercase, digit, and special char (`@$!%*?&`).

---

## CORS
| Setting | Value |
|---------|-------|
| Origin | `CLIENT_URL` env (default: `http://localhost:5173`) |
| Methods | GET, POST, PUT, PATCH, DELETE, OPTIONS |
| Headers | Content-Type, Authorization |
| Credentials | true |

---

*CoreInventory Backend — Express.js + TiDB*
