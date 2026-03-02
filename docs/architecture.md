# ShopYourProduct Production Architecture

## 1) Folder Structure (Clean Architecture + Next App Router)

```txt
app/
  api/
    auth/
    wallet/
    payments/webhook/authorize-net/
    orders/
    admin/
  layout.tsx
  page.tsx
application/
  auth/
  wallet/
  payments/
  orders/
infrastructure/
  repositories/
lib/
  config/
  db/
  cache/
  logger/
  security/
  rbac/
  http/
  utils/
components/
stores/
prisma/
  schema.prisma
docs/
  architecture.md
middleware.ts
```

## 2) Database Schema Explanation

- `User` + `Session`: account + session lifecycle.
- `EmailVerificationToken` / `PasswordResetToken`: one-time secure flows.
- `Wallet`: current aggregate wallet balances (`availableCents`, `pendingCents`).
- `WalletLedgerEntry`: immutable ledger events (credit/debit, status, idempotency).
- `PaymentIntent`: each Authorize.net payment attempt with idempotency and gateway refs.
- `PaymentWebhookEvent`: stores every webhook payload + dedupe key + signature validity.
- `Order` + `OrderItem`: purchase lifecycle and item details.
- `Product` + `Category` + `InventoryItem`: SKU, digital pool, and physical inventory support.
- `Coupon`: discount logic and usage limits.
- `WalletAdjustment` + `AuditLog`: admin/manual operations with accountability.

## 3) Wallet Ledger Design (Double-Entry Ready)

Current implementation writes immutable credit/debit entries; for strict double-entry split, add balanced journal rows (`WALLET_ASSET`, `WALLET_LIABILITY`) per transaction.

Current safety controls:

- Immutable ledger rows (`WalletLedgerEntry`)
- Idempotency (`walletId + idempotencyKey` unique)
- Reference uniqueness (`referenceType + referenceId + type`)
- Per-user transaction lock (`pg_advisory_xact_lock(hashtext(userId))`)
- Atomic updates with `prisma.$transaction`

## 4) Payment Flow Diagrams (Text)

### 4.1 Wallet Recharge (Authorize.net)

1. Client loads Accept.js
2. Card tokenized in browser (`opaqueData`)
3. Client calls `/api/wallet/recharge/initiate` with token + idempotency key
4. Server creates/returns `PaymentIntent`
5. Server calls Authorize.net `createTransactionRequest`
6. Server returns pending status
7. Authorize.net sends webhook
8. Server verifies webhook signature + dedupe
9. Server posts wallet credit in one DB transaction
10. `PaymentIntent` -> `SETTLED`

### 4.2 Order Payment from Wallet

1. Client submits order
2. Server creates order `PENDING`
3. Server debits wallet with idempotency + advisory lock
4. On success, order -> `PAID` -> `PROCESSING`
5. Fulfillment engine marks `DELIVERED` or `REFUNDED`

## 5) API Route Structure

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/verify-email`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `POST /api/wallet/recharge/initiate`
- `POST /api/wallet/guest-recharge/initiate`
- `GET /api/wallet/transactions`
- `POST /api/payments/webhook/authorize-net`
- `POST /api/orders`
- `POST /api/admin/wallet/adjust`
- `GET /api/admin/orders`
- `POST /api/admin/payments/refund`
- `POST /api/admin/payments/void`

## 6) Webhook Handling Notes

- Verify `x-anet-signature` HMAC SHA512 against raw body
- Store payload before business processing for observability
- Enforce dedupe via unique `dedupeKey`
- Only settle wallet on valid success event
- Mark webhook row as processed with timestamp

## 7) Race Condition Prevention

- Use Postgres advisory lock by user (`pg_advisory_xact_lock`)
- Keep all balance + ledger writes in one DB transaction
- Idempotency keys at payment and ledger level
- Ignore duplicate webhook events through upsert on dedupe key

## 8) Deployment Guide

### Vercel (Web/API) + Managed Postgres/Redis

1. Provision Postgres (Neon/RDS/Supabase) and Redis (Upstash/Elasticache)
2. Set all env vars in Vercel project
3. Build command: `npm run build`
4. Run migrations in CI before deployment: `npx prisma migrate deploy`
5. Configure Authorize.net webhook URL to Vercel endpoint
6. Restrict webhook endpoint with signature validation only

### VPS (Docker Compose)

- Services: `web`, `postgres`, `redis`, optional `worker`
- Build Next.js standalone image
- Run migrations at container startup job
- Put behind Nginx with TLS
- Add fail2ban + backups + monitoring

## 9) Security Checklist

- [x] JWT auth (httpOnly cookie)
- [x] RBAC checks for admin/support routes
- [x] Zod validation for external inputs
- [x] SQL injection-safe Prisma usage
- [x] Rate limiting via Redis
- [x] Security headers in middleware
- [x] Webhook signature validation + dedupe
- [x] Idempotent wallet writes
- [ ] CSRF token validation on state-changing browser routes
- [ ] 2FA TOTP flow (schema is ready)
- [ ] KYC provider integration
- [ ] SIEM pipeline for audit logs

## 10) Edge Cases Handled

- Duplicate recharge requests (idempotency key)
- Guest top-up without login (email-linked payment request)
- Duplicate webhook delivery (dedupe key)
- Webhook replay with invalid signature (rejected)
- Concurrent wallet debits (advisory lock)
- Gateway decline/failure propagates error
- Expired/consumed email reset tokens
- Insufficient wallet balance on debit
- Unknown or inactive products in order creation

## 11) Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Rotate secrets and keys (JWT, CSRF, gateway)
- [ ] Enforce HTTPS and secure cookies
- [ ] Enable DB PITR backups and restore drill
- [ ] Configure Redis persistence/HA
- [ ] Add queue workers for async fulfillment and notifications
- [x] BullMQ queue scaffolding (`lib/queue`, `workers/`)
- [ ] Add observability (APM + logs + alerts)
- [ ] Add integration tests for payment + webhook workflows
- [ ] Add penetration test and threat model review
