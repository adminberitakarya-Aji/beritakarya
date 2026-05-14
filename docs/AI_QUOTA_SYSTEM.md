# AI Quota Management System

## Overview

This document describes the comprehensive AI quota and cost management system implemented for the BeritaKarya platform. The system tracks AI usage, enforces quotas based on user roles, provides real-time monitoring, and includes an admin dashboard for management.

---

## Architecture

### 1. Database Schema

#### User Quota Fields (in `User` model)
- `aiEnabled` - Toggle for AI access
- `aiDailyLimit` - Daily request limit (per user override)
- `aiMonthlyBudget` - Monthly budget in USD (per user override)
- `aiFeaturesAllowed` - JSON array of allowed feature endpoints
- `aiQuotaResetDate` - Manual reset tracking
- `aiModelRestriction` - Force specific AI model

#### Role Quota Table (`RoleQuota` model)
Default quotas per role:
- `role` (primary key)
- `dailyRequests` - Daily request limit
- `dailyTokens` - Daily token limit
- `monthlyBudget` - Monthly budget in USD
- `allowedFeatures` - JSON array of allowed feature endpoints
- `modelRestriction` - Force specific model (nullable)

#### AI Usage Tracking (`AIUsage` model)
- `userId` - User who made the request
- `siteId` - Site/branch identifier
- `action` - AI feature used (rewrite, expand, grammar, etc.)
- `inputLength` / `outputLength` - Token counts
- `latencyMs` - Response time
- `success` - Whether the call succeeded
- `estimatedCost` - Calculated cost in USD
- `modelUsed` - AI model identifier
- `tokensInput` / `tokensOutput` - Actual token usage (when available)
- `createdAt` - Timestamp

---

## Components

### 1. Quota Middleware (`apps/api/src/middleware/aiQuota.ts`)

**Route Protection**: Applied to all AI endpoints before rate limiting.

**Features**:
- Validates user AI access is enabled
- Checks feature permissions based on role
- Enforces model restrictions
- Tracks daily request counts using Redis
- Tracks monthly budget spent using Redis
- Returns 403 with specific error messages when quotas exceeded
- Caches quota checks for 5 minutes

**Integration**: Add to AI routes:
```typescript
import { checkAIPermissions } from '../middleware/aiQuota'
aiRouter.use(requireAuth, checkAIPermissions, aiLimiter)
```

### 2. Post-Call Accounting (`apps/api/src/ai/base.service.ts`)

**Function**: `callAIWithTracking<T>()`

Wraps AI calls with:
- Retry logic (up to 3 attempts with exponential backoff)
- Circuit breaker protection
- Post-call cost calculation and logging
- Quota counter updates in Redis

**Cost Calculation**: Uses per-1M token pricing:
- `gpt-4o`: $5.00 (input) / $15.00 (output)
- `gpt-4-turbo`: $10.00 / $30.00
- `gpt-3.5-turbo`: $0.50 / $1.50

### 3. Admin API Endpoints (`apps/api/src/admin/admin.router.ts`)

**Routes** (require admin role: `superadmin` or `wapimred`):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/ai-usage` | GET | Comprehensive usage dashboard data |
| `/api/admin/quotas` | GET | Role quotas and user quota overrides |
| `/api/admin/users/:userId/quota` | PATCH | Update user-specific quotas |
| `/api/admin/roles/:role/quota` | PATCH | Update role default quotas |
| `/api/admin/alerts` | GET | Quota warning history |

### 4. Admin Dashboard UI (`apps/web/components/admin/AIDashboard.tsx`)

**Features**:
- Four tabs: Overview, Quotas, Users, Reports
- Real-time metrics: cost, requests, latency, tokens
- Budget status by role with visual indicators
- Top users by cost
- Quota management interface
- Export capabilities

**Access**: Admin users only (wapimred + superadmin roles)

### 5. Quota Notifications (`apps/api/src/middleware/quotaNotifications.ts`)

**Automated Checks**:
- Cron job runs hourly to check all users
- Sends warnings at 80% quota usage
- Auto-suspends AI access when quota exceeded (100%)
- Creates `Notification` records in database

**Integration**: Call after AI usage logging or run as hourly cron:
```typescript
import { checkAllQuotas } from '../middleware/quotaNotifications'
// Run via cron: node -e "require('./src/middleware/quotaNotifications').checkAllQuotas()"
```

---

## Setup

### 1. Database Migration

Apply the schema changes:

```bash
cd apps/api
pnpm prisma migrate dev --name add-quota-system
```

This will:
- Add new fields to `User` table
- Create `RoleQuota` table
- Update `AIUsage` with cost tracking fields
- Create necessary indexes

### 2. Seed Default Quotas

Populate role quota defaults:

```bash
cd apps/api
npx tsx prisma/seed_quotas.ts
```

This seeds:
- Quotas for superadmin, wapimred, editor, reporter, reader
- Default quota fields for existing users

### 3. Regenerate Prisma Client

```bash
cd apps/api
pnpm prisma generate
```

### 4. Configure Redis (Optional but Recommended)

For better performance, enable Redis caching:

```bash
# In .env
REDIS_HOST=localhost
REDIS_PORT=6379
```

Without Redis, the system falls back to database queries (slower but functional).

### 5. Set Up Hourly Cron Job

Configure the quota check to run hourly:

**Using PM2 cron**:
```json
{
  "name": "quota-check",
  "script": "apps/api/src/middleware/quotaNotifications.ts",
  "cron": "0 * * * *"
}
```

**Using system cron**:
```bash
0 * * * * cd /path/to/beritakarya && pnpm tsx apps/api/src/middleware/quotaNotifications.ts
```

---

## Role Quotas Reference

| Role | Daily Requests | Daily Tokens | Monthly Budget | Features |
|------|---------------|--------------|----------------|----------|
| superadmin | 999,999 | 999,999 | $99,999 | All features |
| wapimred | 500 | 100,000 | $500 | All features |
| editor | 200 | 50,000 | $50 | All features |
| reporter | 100 | 25,000 | $25 | Limited (rewrite, expand, grammar, readability, caption) + GPT-3.5 only |
| reader | 5 | 1,000 | $0 | No AI features |

---

## API Usage Examples

### User Making AI Request

```javascript
POST /api/ai/rewrite
Headers: { Authorization: Bearer <token> }
Body: { content: "text...", tone: "berita", length: "sama" }

Response:
{
  "success": true,
  "data": "Rewritten text...",
  "fallback": false,
  "cached": false
}

// Errors:
// 403: Quota exceeded (with specific message)
// 429: Rate limit exceeded
```

### Admin: Update User Quota

```javascript
PATCH /api/admin/users/:userId/quota
Headers: { Authorization: Bearer <admin_token> }
Body: {
  "aiDailyLimit": 300,
  "aiMonthlyBudget": 75.00,
  "aiEnabled": true
}
```

---

## Monitoring & Alerts

### Budget Thresholds

- **80% warning**: User receives notification (once per hour)
- **100% exceeded**: AI access automatically suspended

### Notification Types

- `quota_warning` - 80% threshold reached
- `quota_suspended` - 100% quota exceeded

### Logs

All quota checks and notifications are logged with:
- `quota.check` - Hourly quota scan results
- `quota.warning` - Warning notifications sent
- `quota.suspend` - User AI access suspended

---

## Cost Optimization Strategies

1. **Caching**: `useCache: true` (default) stores responses in Redis for 1 hour
2. **Model restriction**: Force reporter role to use cheaper GPT-3.5
3. **Circuit breaker**: Prevents runaway costs during OpenAI outages
4. **Token estimation**: Approximates tokens for logging when not provided by API
5. **Redis caching**: Minimizes database queries for quota checks

---

## Testing

### Manual Test

1. Log in as a user with AI access
2. Make AI requests to various endpoints
3. Check AI usage logs: 
   ```sql
   SELECT * FROM "AIUsage" ORDER BY "createdAt" DESC LIMIT 10;
   ```
4. View admin dashboard at `/admin/ai-dashboard` (if route configured)
5. Verify quota counters increment correctly

### Automated Test (Future)

```typescript
describe('Quota System', () => {
  it('should reject requests when daily limit exceeded', async () => {})
  it('should calculate costs correctly', async () => {})
  it('should send warnings at 80%', async () => {})
})
```

---

## Troubleshooting

### Prisma Type Errors

If you see `Property 'aiEnabled' does not exist on type 'User'`:
```bash
cd apps/api
pnpm prisma generate
```

### Redis Connection Fails

The system automatically falls back to database queries. Ensure Redis is running for optimal performance:
```bash
docker run -p 6379:6379 redis
```

### Quotas Not Enforced

1. Check `checkAIPermissions` middleware is applied to routes
2. Verify user has `aiEnabled: true` in database
3. Confirm `RoleQuota` exists for user's role
4. Check Redis keys: `redis-cli KEYS "ai:quota:*"`

### Cost Calculation Incorrect

Review `calculateCost()` function in `base.service.ts`. Update `COST_PER_1M_TOKENS` map for new models.

---

## Future Enhancements

1. **Real-time WebSocket updates** to admin dashboard
2. **Quota increase requests** from users via portal
3. **Export reports** in CSV/PDF formats
4. **Email notifications** for daily summary
5. **Multi-currency support** (currently USD only)
6. **Granular site-level quotas** (per-branch budgeting)
7. **AI model performance metrics** (accuracy, user satisfaction)

---

## Maintenance

### Daily Tasks
- Monitor high-cost users in dashboard
- Review budget status by role

### Weekly Tasks
- Export and archive usage reports
- Check for abnormal usage patterns

### Monthly Tasks
- Reset budgets (automatic via calendar month)
- Review and adjust role quotas based on actual usage
- Archive old `AIUsage` records (consider partitioning)

---

## Security Considerations

- All admin routes require authentication + role check
- User quota updates are audited via `Notification` system
- Sensitive fields in responses are filtered by `select` clauses
- SQL injection prevented by Prisma parameterized queries
- Cost calculations performed server-side only

---

## Performance

- **Redis cache**: 5-minute TTL for quota counts
- **Database indexes**: On `AIUsage(userId, createdAt)`, `AIUsage(siteId, createdAt)`
- **Pagination**: All list endpoints support limit/offset
- **Connection pooling**: Prisma manages Postgres connections

---

## Support

For issues or questions:
1. Check logs in `apps/api/logs/`
2. Review Prisma Studio: `pnpm prisma studio`
3. Consult `AI_PLAN.md` for original requirements