# Production Deployment Guide - Guest Wallet Top-Up Platform

This is a production-ready wallet top-up platform. Follow these instructions carefully.

## 🔐 Security Checklist

Before deploying to production:

- [ ] All environment variables configured securely
- [ ] Database backups enabled
- [ ] SSL/TLS certificates configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled
- [ ] Webhook signature verification enabled
- [ ] No secrets in client-side code
- [ ] Audit logs enabled
- [ ] Row-level database locking enabled

## 📋 Prerequisites

1. **Authorize.net Account**
   - Sign up at https://www.authorize.net/
   - Get API Login ID
   - Get Transaction Key
   - Get Client Key (for Accept.js)
   - Get Signature Key (for webhooks)
   - Configure webhook URL in Authorize.net dashboard

2. **PostgreSQL Database**
   - Version 14+
   - Connection pooling recommended (PgBouncer)
   - Backup strategy configured

3. **Redis Instance**
   - For rate limiting and caching
   - Persistent storage enabled

4. **Node.js Environment**
   - Node.js 18+ LTS
   - npm or pnpm

## 🔧 Environment Variables

Create a `.env.production` file:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authorize.net (Production)
AUTHORIZE_NET_API_LOGIN_ID=your_production_api_login_id
AUTHORIZE_NET_TRANSACTION_KEY=your_production_transaction_key
AUTHORIZE_NET_SIGNATURE_KEY=your_production_signature_key
AUTHORIZE_NET_ENV=production

# Public keys (safe to expose)
NEXT_PUBLIC_AUTHORIZE_NET_API_LOGIN_ID=your_production_api_login_id
NEXT_PUBLIC_AUTHORIZE_NET_CLIENT_KEY=your_production_client_key

# Application
APP_URL=https://yourdomain.com
NODE_ENV=production

# Security
JWT_SECRET=generate-strong-random-32-char-minimum
CSRF_SECRET=generate-strong-random-32-char-minimum

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Generate Strong Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate CSRF_SECRET
openssl rand -base64 32
```

## 📦 Installation Steps

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client

```bash
npm run prisma:generate
```

### 3. Run Database Migrations

```bash
npm run prisma:migrate
```

### 4. Build the Application

```bash
npm run build
```

### 5. Start Production Server

```bash
npm run start
```

## 🔄 Authorize.net Configuration

### 1. Enable Webhooks

1. Log in to Authorize.net Merchant Interface
2. Go to **Settings** → **Webhooks**
3. Add webhook URL: `https://yourdomain.com/api/payments/webhook/authorize-net`
4. Enable these events:
   - `net.authorize.payment.authcapture.created`
   - `net.authorize.payment.authorization.created`
   - `net.authorize.payment.capture.created`
   - `net.authorize.payment.fraud.held`
   - `net.authorize.payment.fraud.declined`
   - `net.authorize.customer.paymentProfile.created`

5. Copy the **Signature Key** to your environment variables

### 2. Accept.js Integration

For production, update the script URL in `app/layout.tsx`:

```typescript
// Change from sandbox to production
<script type="text/javascript" src="https://js.authorize.net/v1/Accept.js" charSet="utf-8"></script>
```

### 3. Apple Pay Setup

1. Create Apple Merchant ID at https://developer.apple.com/
2. Generate Certificate Signing Request (CSR)
3. Upload CSR to Apple Developer Portal
4. Download merchant certificate
5. Configure in Authorize.net:
   - Go to **Settings** → **Mobile & In-App Payments**
   - Upload Apple Pay certificate
   - Add your domain

### 4. Google Pay Setup

1. Register at https://pay.google.com/business/console/
2. Get Google Merchant ID
3. Configure in Authorize.net:
   - Go to **Settings** → **Mobile & In-App Payments**
   - Add Google Merchant ID

## 🗄️ Database Architecture

### Double-Entry Ledger System

The wallet uses a production-grade double-entry ledger:

```sql
-- Each transaction creates a ledger entry
-- Row-level locking prevents race conditions
-- Idempotency keys prevent duplicate credits
```

### Key Tables

1. **wallet** - User/guest wallet balances
2. **wallet_ledger_entry** - All transactions (immutable audit trail)
3. **payment_intent** - Payment processing state
4. **payment_webhook_event** - Webhook deduplication
5. **idempotency_key** - Request deduplication

### Backup Strategy

```bash
# Daily automated backups
pg_dump -Fc dbname > backup_$(date +%Y%m%d).dump

# Point-in-time recovery enabled
wal_level = replica
archive_mode = on
```

## 🚀 Payment Flow

### Guest Wallet Top-Up Flow

1. **User initiates top-up**
   - Enters email → Creates guest wallet
   - Enters amount and payment method
   - Accept.js tokenizes card (client-side)

2. **Backend processes payment**
   - Creates `PaymentIntent` (status: INITIATED)
   - Calls Authorize.net API
   - Updates status to PENDING_GATEWAY
   - Returns transaction ID to frontend

3. **Webhook confirms payment**
   - Authorize.net sends webhook
   - Signature verified using HMAC-SHA512
   - Deduplicated using `dedupeKey`
   - Updates `PaymentIntent` to SETTLED
   - Credits wallet using DB transaction with row lock
   - Creates immutable ledger entry

4. **Frontend polls status**
   - Polls `/api/payment/status/:id`
   - Displays success/failure

### Failure Handling

| Scenario | Handling |
|----------|----------|
| Duplicate webhook | Deduped by `dedupeKey` |
| Network timeout | Payment intent stays PENDING, admin reviews |
| Card declined | Status updated to DECLINED, user notified |
| Fraud hold | Status FRAUD_HOLD, admin review required |
| User refresh | Idempotency key prevents duplicate charge |
| DB lock timeout | Transaction rolled back, retry logic |

## 📊 Monitoring & Alerts

### Metrics to Monitor

1. **Payment Success Rate**
   ```sql
   SELECT
     COUNT(CASE WHEN status = 'SETTLED' THEN 1 END) * 100.0 / COUNT(*) as success_rate
   FROM payment_intent
   WHERE created_at > NOW() - INTERVAL '24 hours';
   ```

2. **Average Processing Time**
   ```sql
   SELECT AVG(updated_at - created_at) as avg_time
   FROM payment_intent
   WHERE status = 'SETTLED';
   ```

3. **Failed Payments**
   ```sql
   SELECT failure_code, COUNT(*)
   FROM payment_intent
   WHERE status IN ('DECLINED', 'FAILED')
   GROUP BY failure_code;
   ```

### Logging

All operations logged with Pino:

```javascript
logger.info({ walletId, amount }, "Wallet credited");
logger.error({ error }, "Payment failed");
```

### Alerts Setup

Configure alerts for:
- Payment failure rate > 5%
- Webhook processing time > 5 seconds
- Database connection errors
- Redis connection errors
- Fraud holds

## 🔒 Security Best Practices

### 1. Rate Limiting

Already implemented in `/lib/security/rate-limit.ts`:
- 5 requests per minute per IP for payments
- 10 requests per minute for balance checks

### 2. CSRF Protection

Enabled via `/lib/security/csrf.ts`

### 3. Input Validation

All endpoints use Zod schemas:
```typescript
const schema = z.object({
  amountCents: z.number().int().positive().max(500000), // $5,000 max
});
```

### 4. Database Security

- Row-level locking for wallet operations
- Prepared statements (Prisma ORM)
- Connection pooling
- SSL/TLS encryption

### 5. Secrets Management

Never expose:
- `AUTHORIZE_NET_TRANSACTION_KEY`
- `AUTHORIZE_NET_SIGNATURE_KEY`
- `JWT_SECRET`
- `CSRF_SECRET`

Only client-safe values have `NEXT_PUBLIC_` prefix.

## 🧪 Testing

### Test Credit Cards (Sandbox)

| Card Number | Result |
|-------------|--------|
| 4111111111111111 | Approved |
| 4012888818888 | Declined |
| 4007000000027 | Fraud Hold |

### Testing Checklist

- [ ] Successful payment credits wallet
- [ ] Declined card shows error
- [ ] Duplicate payment rejected
- [ ] Webhook signature verification
- [ ] Idempotency key prevents double credit
- [ ] Race condition test (concurrent requests)
- [ ] Guest wallet conversion to user wallet

## 🔄 Maintenance

### Regular Tasks

1. **Monitor webhook processing**
   ```sql
   SELECT * FROM payment_webhook_event
   WHERE processed = false
   AND created_at < NOW() - INTERVAL '1 hour';
   ```

2. **Clean up expired guest wallets**
   ```sql
   DELETE FROM wallet
   WHERE is_guest = true
   AND expires_at < NOW();
   ```

3. **Review fraud holds**
   ```sql
   SELECT * FROM payment_intent
   WHERE status = 'FRAUD_HOLD'
   AND created_at > NOW() - INTERVAL '7 days';
   ```

## 📞 Support

### Common Issues

1. **Webhook not received**
   - Check Authorize.net webhook configuration
   - Verify signature key matches
   - Check server firewall allows Authorize.net IPs

2. **Payment stuck in PENDING**
   - Check Authorize.net transaction status
   - Manually trigger webhook processing
   - Review gateway logs

3. **Double credit issue**
   - Check ledger entries for duplicate `idempotencyKey`
   - Review transaction logs
   - Wallet balance should match sum of ledger entries

## 🎯 Performance Optimization

### Database Indexes

Already configured in Prisma schema:
- `walletId` + `idempotencyKey` (unique)
- `merchantTransactionId` (unique)
- `status` + `createdAt`

### Caching Strategy

Use Redis for:
- Rate limiting (already implemented)
- Session tokens
- Wallet balance caching (optional)

### Connection Pooling

```javascript
// prisma/client.ts
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});
```

## 📈 Scaling Considerations

### Horizontal Scaling

- Stateless API design (ready for load balancer)
- Webhook deduplication handles multiple instances
- Database locking prevents race conditions

### Database Optimization

- Use read replicas for reporting queries
- Partition large tables by date
- Archive old transactions

## ✅ Pre-Launch Checklist

- [ ] All environment variables set correctly
- [ ] Database migrations run successfully
- [ ] Webhook URL configured in Authorize.net
- [ ] SSL certificate valid
- [ ] Rate limiting tested
- [ ] Payment flow tested end-to-end
- [ ] Monitoring and alerts configured
- [ ] Backup strategy implemented
- [ ] Security audit completed
- [ ] Load testing completed
- [ ] Documentation reviewed

## 🚨 Emergency Procedures

### Payment Gateway Down

1. Display maintenance message to users
2. Queue pending transactions in Redis
3. Process when gateway recovers

### Database Failure

1. Activate read replica (if available)
2. Queue write operations
3. Restore from latest backup

### Fraud Alert

1. Temporarily disable affected payment methods
2. Review suspicious transactions
3. Contact Authorize.net support

---

**This is a production system handling real money. Test thoroughly before going live.**
