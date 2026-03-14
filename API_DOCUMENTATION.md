# CoreInventory API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Version:** 1.0.0  
> **Last Updated:** 2026-03-14

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Auth Routes](#auth-routes-apauth)
  - [User Routes](#user-routes-apiusers)

---

## Overview

CoreInventory is an inventory management system with two distinct user roles:

| Role | Value |
|------|-------|
| Inventory Manager | `inventory_manager` |
| Warehouse Staff | `warehouse_staff` |

Authentication uses **stateless JWT** (Bearer tokens). Tokens are **not stored server-side**; logout is handled client-side by discarding the token.

---

## Authentication

Protected routes require a valid JWT access token passed in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Tokens are issued on:
- Successful email verification (`POST /api/auth/verify-email`)
- Successful login (`POST /api/auth/login`)

---

## Response Format

All endpoints return a consistent JSON envelope:

### Success
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

### Error
```json
{
  "success": false,
  "message": "Error description"
}
```

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "fieldName": "Specific error for this field"
  }
}
```

---

## Error Codes

| Status Code | Meaning |
|-------------|---------|
| `200` | OK — request succeeded |
| `201` | Created — resource created |
| `400` | Bad Request — invalid OTP, expired token, etc. |
| `401` | Unauthorized — missing/invalid JWT |
| `403` | Forbidden — account not verified, deactivated, or wrong role |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — duplicate resource (e.g., email already registered) |
| `422` | Unprocessable Entity — validation failed |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |

---

## Rate Limiting

Rate limits are enforced per **IP address**. Standard `RateLimit-*` headers (RFC 6585) are included in responses.

| Limiter | Applied To | Max Requests | Window |
|---------|-----------|-------------|--------|
| `authLimiter` | `/register`, `/login` | 10 | 15 minutes |
| `otpLimiter` | `/verify-email`, `/resend-otp` | 3 | 10 minutes |
| `resetLimiter` | `/forgot-password`, `/verify-reset-otp`, `/reset-password` | 5 | 30 minutes |

> **429 response body:**
> ```json
> { "success": false, "message": "Too many attempts. Please try again in 15 minutes." }
> ```

---

## Endpoints

---

### Health Check

#### `GET /api/health`

Check server status. No authentication required.

**Response `200`:**
```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2026-03-14T10:59:00.000Z",
  "environment": "development"
}
```

---

### Auth Routes `/api/auth`

---

#### `POST /api/auth/register`

Register a new user account. A 6-digit email verification OTP is sent to the provided email address.

**Rate limit:** `authLimiter` (10 req / 15 min)  
**Access:** Public

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password@123",
  "role": "inventory_manager"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | 2–100 characters |
| `email` | string | ✅ | Valid email, lowercased |
| `password` | string | ✅ | 8–72 chars; must include uppercase, lowercase, digit, and special char (`@$!%*?&`) |
| `role` | string | ✅ | `"inventory_manager"` or `"warehouse_staff"` |

**Response `201`:**
```json
{
  "success": true,
  "message": "Account created. Please check your email for the verification code.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": false,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `409` | Email already registered |
| `422` | Validation failure |

---

#### `POST /api/auth/verify-email`

Verify a user's email address using the OTP sent during registration.  
Returns an `accessToken` — the user is **logged in** upon successful verification.

**Rate limit:** `otpLimiter` (3 req / 10 min)  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "482910"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `email` | string | ✅ | Valid email |
| `otp` | string | ✅ | Exactly 6 digits |

**Response `200`:**
```json
{
  "success": true,
  "message": "Email verified successfully. You are now logged in.",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    },
    "accessToken": "<jwt_token>"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid or expired OTP |
| `404` | No account found with this email |

---

#### `POST /api/auth/resend-otp`

Resend a verification or password-reset OTP email.

**Rate limit:** `otpLimiter` (3 req / 10 min)  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "type": "EMAIL_VERIFY"
}
```

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `email` | string | ✅ | Valid email |
| `type` | string | ✅ | `"EMAIL_VERIFY"` or `"PASSWORD_RESET"` |

**Response `200`:**
```json
{
  "success": true,
  "message": "A new OTP has been sent to your email.",
  "data": null
}
```

> **Note:** If the email does not exist or the account is inactive, the API **still returns 200** to prevent user enumeration.

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Email is already verified (when `type` is `EMAIL_VERIFY`) |

---

#### `POST /api/auth/login`

Authenticate with email and password. Returns a JWT `accessToken`.

**Rate limit:** `authLimiter` (10 req / 15 min)  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "Password@123"
}
```

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    },
    "accessToken": "<jwt_token>"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `401` | Invalid email or password (generic — prevents enumeration) |
| `403` | Email not yet verified |

---

#### `POST /api/auth/forgot-password`

Initiate the password reset flow. Sends a 6-digit OTP to the provided email.

**Rate limit:** `resetLimiter` (5 req / 30 min)  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "If an account with that email exists, a reset code has been sent.",
  "data": null
}
```

> **Note:** Always returns 200 regardless of whether the email exists (prevents enumeration).

---

#### `POST /api/auth/verify-reset-otp`

Verify the password-reset OTP. Returns a short-lived `resetToken` (valid 15 minutes) that must be used in the next step.

**Rate limit:** `resetLimiter` (5 req / 30 min)  
**Access:** Public

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "193847"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "OTP verified. Use the resetToken to set your new password.",
  "data": {
    "resetToken": "<short_lived_jwt>"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid or expired OTP |

---

#### `POST /api/auth/reset-password`

Set a new password using the `resetToken` obtained from `POST /api/auth/verify-reset-otp`.

**Rate limit:** `resetLimiter` (5 req / 30 min)  
**Access:** Public

**Request Body:**
```json
{
  "resetToken": "<short_lived_jwt>",
  "newPassword": "NewPassword@456"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `resetToken` | string | ✅ | JWT issued by `verify-reset-otp` |
| `newPassword` | string | ✅ | 8–72 chars; uppercase, lowercase, digit, special char |

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset successful. Please log in with your new password.",
  "data": null
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `400` | Invalid or expired `resetToken` |
| `404` | User not found or inactive |

---

#### `GET /api/auth/me`

Get the currently authenticated user's profile.

**Access:** 🔒 Private (JWT required)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response `200`:**
```json
{
  "success": true,
  "message": "",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    }
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `401` | Missing or invalid JWT |
| `404` | User no longer exists |

---

#### `PUT /api/auth/me`

Update the authenticated user's own profile (name only).

**Access:** 🔒 Private (JWT required)

**Request Body:**
```json
{
  "name": "John Updated"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | 2–100 characters |

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Updated",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    }
  }
}
```

---

#### `POST /api/auth/logout`

Logout the current user. Stateless — the client must discard the JWT.

**Access:** 🔒 Private (JWT required)

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

---

### User Routes `/api/users`

> All routes in this group require a valid JWT (`Authorization: Bearer <token>`).

---

#### `GET /api/users/profile`

Get the authenticated user's profile.

**Access:** 🔒 Private — both roles

**Response `200`:**
```json
{
  "success": true,
  "message": "",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    }
  }
}
```

---

#### `PUT /api/users/profile`

Update the authenticated user's name.

**Access:** 🔒 Private — both roles

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `name` | string | ✅ | Minimum 2 characters |

**Response `200`:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "john@example.com",
      "role": "inventory_manager",
      "isEmailVerified": true,
      "isActive": true,
      "createdAt": "2026-03-14T10:00:00.000Z"
    }
  }
}
```

---

#### `GET /api/users/dashboard`

Access the Inventory Manager dashboard.

**Access:** 🔒 Private — `inventory_manager` role only

**Response `200`:**
```json
{
  "success": true,
  "message": "Dashboard — Inventory Manager only",
  "user": {
    "id": 1,
    "role": "inventory_manager"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `403` | Role is not `inventory_manager` |

---

#### `GET /api/users/operations`

Access Warehouse Staff operational data.

**Access:** 🔒 Private — `warehouse_staff` role only

**Response `200`:**
```json
{
  "success": true,
  "message": "Operations — Warehouse Staff only",
  "user": {
    "id": 2,
    "role": "warehouse_staff"
  }
}
```

**Error Responses:**
| Status | Condition |
|--------|-----------|
| `403` | Role is not `warehouse_staff` |

---

#### `GET /api/users/shared`

Access a shared route available to both roles.

**Access:** 🔒 Private — `inventory_manager` or `warehouse_staff`

**Response `200`:**
```json
{
  "success": true,
  "message": "Shared route — both roles allowed",
  "user": {
    "id": 1,
    "role": "inventory_manager"
  }
}
```

---

## Password Rules

Passwords must satisfy **all** of the following:
- Minimum **8** characters, maximum **72** characters
- At least one **uppercase** letter (`A-Z`)
- At least one **lowercase** letter (`a-z`)
- At least one **digit** (`0-9`)
- At least one **special character** from: `@ $ ! % * ? &`

---

## User Object (Safe)

All API responses expose a sanitized user object — internal fields like `password_hash` are never returned.

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "inventory_manager",
  "isEmailVerified": true,
  "isActive": true,
  "createdAt": "2026-03-14T10:00:00.000Z"
}
```

---

## Registration & Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     REGISTRATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│  1. POST /api/auth/register      → Account created          │
│  2. Check email for 6-digit OTP                             │
│  3. POST /api/auth/verify-email  → Verified + accessToken   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PASSWORD RESET FLOW                     │
├─────────────────────────────────────────────────────────────┤
│  1. POST /api/auth/forgot-password   → OTP sent to email    │
│  2. POST /api/auth/verify-reset-otp  → resetToken returned  │
│  3. POST /api/auth/reset-password    → Password updated     │
└─────────────────────────────────────────────────────────────┘
```

---

## CORS Configuration

| Setting | Value |
|---------|-------|
| Allowed Origin | `CLIENT_URL` env var (default: `http://localhost:5173`) |
| Allowed Methods | `GET, POST, PUT, PATCH, DELETE, OPTIONS` |
| Allowed Headers | `Content-Type, Authorization` |
| Credentials | `true` |

---

*Generated for CoreInventory Backend — Express.js + TiDB*
