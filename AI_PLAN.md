# 🤖 BeritaKarya AI Assistant - Product Development Plan

**Created:** May 14, 2026  
**Status:** Draft for Implementation  
**Owner:** Product + Engineering Team  
**Target Audience:** Journalists & Editors (BeritaKarya users)

---

## **📌 Executive Summary**

BeritaKarya AI Assistant adalah **Digital Writing Companion** untuk jurnalis Indonesia. Tidak seperti ChatGPT biasa, AI ini:
- ✅ **Specialized** untuk gaya penulisan berita Indonesia
- ✅ **Integrated** langsung ke editor konten
- ✅ **Context-aware** dengan artikel yang sedang dikerjakan
- ✅ **Production-ready output** (bukan draft acak)

**Goal:** Tingkatkan produktivitas redaksi 2-3x dengan tetap menjaga kualitas journalism.

---

## **🎯 Current State Analysis**

### **Existing Features (Backend)**
| Feature | Status | API Endpoint | Description |
|---------|--------|--------------|-------------|
| Rewrite | ✅ Live | `/ai/rewrite` | Tulis ulang dengan tone/length kontrol |
| Expand | ✅ Live | `/ai/expand` | Kembangkan paragraf dengan detail |
| Headline Generator | ✅ Live | `/ai/headline` | Generate 5 judul pilihan |
| SEO Generator | ✅ Live | `/ai/seo` | Generate meta title, description, keywords |
| Grammar Check | ✅ Live | `/ai/grammar` | Cek tata bahasa & ejaan |
| Readability | ✅ Live | `/ai/readability` | Analisis skor keterbacaan |
| Layout Analysis | ✅ Live | `/ai/layout` | Suggest perbaikan struktur artikel |
| Image Caption | ✅ Live | `/ai/caption` | Generate caption dari gambar URL |

**Infrastructure:**
- OpenAI GPT-4o (default, configurable)
- Retry logic (3 attempts, exponential backoff)
- Usage tracking (AIUsage table)
- Rate limiting per user
- Authentication required

### **Existing Features (Frontend)**
- ✅ AISidebar with 5 tabs (Write, Optimize, Validate, Layout, Image)
- ✅ Custom hooks for each AI feature
- ✅ Integration with editor store
- ✅ Result cards with apply functionality
- ✅ Loading states & error handling

### **Critical Gaps** ❌
1. **Poor UX:** Write tab - no side-by-side comparison
2. **Poor UX:** Write tab - limited preview (150 chars only)
3. **Missing:** Undo/redo for AI changes
4. **Missing:** AI history/session persistence
5. **No streaming** - long content blocks wait for full response
6. **Token limit hardcoded** - should be configurable per feature
7. **No fallback model** - if GPT-4o fails, no automatic fallback to 3.5
8. **Single prompt strategy** - no A/B testing of prompts
9. **No fine-tuning** - custom model for BeritaKarya style

---

## **🚀 Improvement Roadmap**

### **PHASE 1: Critical Fixes (Week 1) - ✅ COMPLETED**

- [x] Add Image Caption tab
- [x] Implement side-by-side comparison component
- [x] Show full context (prev/next paragraphs)
- [x] Add cost estimation display
- [x] Batch apply for grammar corrections

---

### **PHASE 2: Quality of Life (Week 2-3) - ✅ COMPLETED**

#### **2.1 SEO: SERP Preview**
Show how meta title/description looks in Google results with visual mockup.

#### **2.2 Model Selector**
Allow user to choose:
- GPT-4o (best quality, expensive)
- GPT-4-turbo (good balance)
- GPT-3.5-turbo (fast, cheap)

#### **2.3 Keyboard Shortcuts**
Full keyboard navigation support:
- `Ctrl+Shift+R` - Rewrite paragraph
- `Ctrl+Shift+E` - Expand paragraph
- `Ctrl+Shift+H` - Generate headlines
- `Ctrl+Shift+S` - Generate SEO meta
- `Ctrl+Shift+G` - Grammar check
- `Ctrl+Shift+R` - Readability analysis
- `Ctrl+Shift+L` - Layout analysis
- `Ctrl+Shift+C` - Image caption

#### **2.4 Circuit Breaker Activation**
Wire up the existing `circuitBreaker.ts` using opossum library with:
- Timeout: 10 seconds
- Error threshold: 50%
- Reset timeout: 30 seconds

#### **2.5 Redis Caching**
Add Redis cache layer with:
- Hash-based cache keys (prompt + model + temperature)
- TTL: 1 hour default
- Estimated 20-30% cost reduction from cache hits

---

### **PHASE 3: Advanced Features (Month 2)**

#### **3.1 AI Session History**
Persist AI requests in IndexedDB/localStorage:
- Previous prompts & results
- Favorites/starred results
- Compare across multiple runs
- Export history to JSON

**UI:** History panel in sidebar (scrollable list with timestamps).

---

#### **3.2 Smart Context Window**
Currently passing only prev/next paragraph (200 chars). Enhance:
- Include article title & section
- Include key entities (people, places) from full article
- Include style guide preferences per publication
- Conversation memory (last 5 exchanges in same session)

---

#### **3.3 Template Prompts**
Pre-defined prompts for common journalism tasks:
- "Rewrite for breaking news"
- "Rewrite for feature story"
- "Rewrite for op-ed"
- "Simplify for general audience"
- "Add local context"

Save as quick buttons in Write tab.

---

#### **3.4 Collaborative AI**
Allow multiple editors to:
- See each other's AI suggestions
- Vote on best headline
- Comment on AI-generated content
- Merge suggestions

---

## **📊 Success Metrics**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Adoption Rate** | >60% active users use AI weekly | Product analytics |
| **AI Action per Session** | >3 per editor | Usage logs |
| **Time Saved** | 50% reduction in writing time | User survey |
| **Error Rate** | <5% AI rejection rate | Application logs |
| **Cost per User** | <$10/month for power users | Billing data |
| **User Satisfaction** | NPS >40 for AI features | Quarterly survey |
| **Cache Hit Rate** | >20% requests served from cache | Redis metrics |
| **Circuit Breaker Effectiveness** | <1% downtime per month | Monitoring logs |

---

## **💰 Usage Quotas & Cost Control (Internal Use)**

**Important:** BeritaKarya AI adalah internal tool untuk mendukung operasional redaksi, **bukan produk komersial**. Oleh karena itu kita menerapkan **quota-based access** untuk kontrol biaya dan fair usage.

### **Role Definitions & Hierarchy**

| Role | Description | AI Access Level |
|------|-------------|-----------------|
| **superadmin** | Pemilik/owner BeritaKarya pusat | Unlimited + full oversight |
| **wapimred** | Pimpinan di cabang (wakil pusat) | High quota + all features |
| **Jurnalis** | Reporter & Editor (content creators) | Moderate quota, core features |
| **reader** | Pembaca biasa (subscribers) | No AI access |

---

### **Quota Matrix by Role**

| Role | Daily Requests | Daily Tokens | Monthly Budget | Allowed Features | Model Restriction |
|------|----------------|--------------|----------------|------------------|-------------------|
| **superadmin** | Unlimited | Unlimited | No limit | ALL features | None |
| **wapimred** | 500 | 100,000 | $500/site | ALL features | None |
| **editor** | 200 | 50,000 | $50/user | ALL features | None |
| **reporter** | 100 | 25,000 | $25/user | Rewrite, Expand, Grammar, Readability, Caption | GPT-3.5-turbo only |
| **reader** | 0-5 (trial) | 0-1,000 | $0 | None (or trial only) | None |

**Feature Access Details:**
- **Reporter**: Core writing tools only. NOT allowed: Headline Generator, SEO Generator, Layout Analysis (these are editorial-level decisions)
- **Editor**: Full access to all AI features
- **wapimred**: Same as editor + oversight capabilities
- **Cost-saving**: Reporters forced to use GPT-3.5-turbo (70% cheaper) for routine tasks

---

### **Technical Implementation**

#### **1. Database Schema Updates**

```sql
-- Add quota fields to User table:
ALTER TABLE "User" ADD COLUMN "aiDailyLimit" INTEGER DEFAULT 50;
ALTER TABLE "User" ADD COLUMN "aiMonthlyBudget" DECIMAL(10,2) DEFAULT 10.00;
ALTER TABLE "User" ADD COLUMN "aiFeaturesAllowed" JSONB DEFAULT '["rewrite","expand","grammar","readability","caption"]';
ALTER TABLE "User" ADD COLUMN "aiQuotaResetDate" DATE DEFAULT NULL;

-- Create RoleQuota table for centralized management:
CREATE TABLE "RoleQuota" (
  "role" VARCHAR(20) PRIMARY KEY,
  "dailyRequests" INTEGER NOT NULL,
  "dailyTokens" INTEGER NOT NULL,
  "monthlyBudget" DECIMAL(10,2) NOT NULL,
  "allowedFeatures" JSONB NOT NULL,
  "modelRestriction" VARCHAR(50) DEFAULT NULL
);

-- Seed default quotas:
INSERT INTO "RoleQuota" VALUES
('superadmin', 999999, 999999, 99999.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('wapimred', 500, 100000, 500.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('editor', 200, 50000, 50.00, '["rewrite","expand","headline","seo","grammar","readability","layout","caption"]', NULL),
('reporter', 100, 25000, 25.00, '["rewrite","expand","grammar","readability","caption"]', 'gpt-3.5-turbo'),
('reader', 0, 0, 0.00, '[]', NULL);
```

---

#### **2. Quota Middleware**

```typescript
// middleware/aiQuota.ts
export async function checkAIPermissions(req: Request, res: Response, next: NextFunction) {
  const userId = req.user.userId
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user.aiEnabled) {
    return res.status(403).json({ error: 'AI access disabled. Contact admin.' })
  }

  const endpoint = req.path.split('/').pop() ?? ''
  const quota = await prisma.roleQuota.findUnique({ where: { role: user.role } })
  
  // Feature permission check
  if (!quota.allowedFeatures.includes(endpoint)) {
    return res.status(403).json({ 
      error: `Feature '${endpoint}' tidak tersedia untuk role '${user.role}'. Hubungi admin untuk upgrade.` 
    })
  }
  
  // Daily quota check (using Redis for performance)
  const today = new Date().toISOString().split('T')[0]
  const key = `ai:quota:${userId}:${today}`
  const currentRequests = await redis.incr(key)
  
  if (currentRequests === 1) {
    // Set expiry to midnight UTC
    const midnight = new Date()
    midnight.setUTCHours(24, 0, 0, 0)
    await redis.expireat(key, Math.floor(midnight.getTime() / 1000))
  }
  
  if (currentRequests > quota.dailyRequests) {
    return res.status(429).json({
      error: `Quota harian habis (${quota.dailyRequests}/hari). Reset besok pukul 00:00.`,
      resetTime: 'tomorrow 00:00 WIB'
    })
  }
  
  // Model restriction check
  if (quota.modelRestriction && process.env.AI_MODEL !== quota.modelRestriction) {
    return res.status(403).json({
      error: `Role '${user.role}' hanya bisa menggunakan model ${quota.modelRestriction}.`
    })
  }
  
  // Store user context for post-call accounting
  ;(req as any).aiUser = user
  ;(req as any).aiQuota = quota
  
  next()
}
```

---

#### **3. Post-Call Accounting with Cost Tracking**

```typescript
// In base.service.ts, after successful OpenAI call:
const usage = res.usage
const tokensInput = usage?.prompt_tokens ?? Math.ceil(inputLength / 4)
const tokensOutput = usage?.completion_tokens ?? Math.ceil(outputLength / 4)
const cost = calculateCost(tokensInput, tokensOutput, modelUsed)

// Log to AIUsage table (for billing/audit)
await prisma.aIUsage.create({
  data: {
    userId: req.userId,
    siteId: req.user.siteId ?? 'pusat',
    action: endpoint,
    inputLength: tokensInput,
    outputLength: tokensOutput,
    latencyMs: Date.now() - start,
    success: true,
    estimatedCost: cost,
    modelUsed: modelUsed
  }
})

// Update real-time counters in Redis
const today = new Date().toISOString().split('T')[0]
await redis.hincrby(`ai:daily:${userId}:${today}`, 'requests', 1)
await redis.hincrby(`ai:daily:${userId}:${today}`, 'tokens', tokensInput + tokensOutput)
await redis.hincrby(`ai:daily:${userId}:${today}`, 'cost', Math.round(cost * 10000)) // store as cents

// Check if user approaching quota limit (soft warning)
const stats = await redis.hgetall(`ai:daily:${userId}:${today}`)
const usagePercent = (parseInt(stats.requests) / user.aiDailyLimit) * 100
if (usagePercent >= 80) {
  await notifyUser(userId, {
    type: 'QUOTA_WARNING',
    message: `Anda sudah menggunakan ${Math.round(usagePercent)}% quota AI harian.`
  })
}
```

---

#### **4. Cost Calculation Function**

```typescript
const COST_PER_1M_TOKENS = {
  'gpt-4o': { input: 5.00, output: 15.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
}

function calculateCost(inputTokens: number, outputTokens: number, model: string): number {
  const rates = COST_PER_1M_TOKENS[model as keyof typeof COST_PER_1M_TOKENS]
  if (!rates) return 0
  
  return (
    (inputTokens / 1_000_000) * rates.input +
    (outputTokens / 1_000_000) * rates.output
  )
}
```

---

### **Admin Dashboard: Usage Monitoring**

Admin panel at `/admin/ai-usage` showing:

```
📊 AI Usage Dashboard - Mei 2026

┌─────────────────────────────────────────────┐
│ Total Cost: $695.90 | Budget: $1,000 (69%)  │
│ Total Requests: 12,450                     │
│ Total Tokens: 56.05M                       │
│ Avg Cost/Request: $0.056                   │
└─────────────────────────────────────────────┘

By Role:
┌─────────────┬──────────┬────────────┬──────────┐
│ Role        │ Requests │ Tokens (M) │ Cost ($) │
├─────────────┼──────────┼────────────┼──────────┤
│ superadmin  │ 156      │ 0.45       │ 12.30    │
│ wapimred    │ 2,340    │ 5.20       │ 125.80   │
│ editor      │ 8,950    │ 18.30      │ 312.50   │
│ reporter    │ 15,670   │ 32.10      │ 245.30   │
└─────────────┴──────────┴────────────┴──────────┘

By Feature:
┌──────────────────────┬──────────┬──────────┐
│ Feature              │ Requests │ Cost ($) │
├──────────────────────┼──────────┼──────────┤
│ Rewrite              │ 5,200    │ 120.50   │
│ Grammar Check        │ 3,100    │ 45.80    │
│ Headline Generator   │ 2,150    │ 52.30    │
│ SEO Generator        │ 1,200    │ 18.70    │
│ Expand               │ 800      │ 8.00     │
│ Readability          │ 750      │ 12.70    │
│ Layout Analysis      │ 150      │ 28.40    │
│ Image Caption        │ 100      │ 9.50     │
└──────────────────────┴──────────┴──────────┘

Top Users (by cost):
┌─────────────────────────┬──────┬──────────┐
│ User                    │ Req  │ Cost($)  │
├─────────────────────────┼──────┼──────────┤
│ jsmith@beritakarya.co   │2150  │ 45.20    │
│ adewi@beritakarya.co    │1890  │ 38.70    │
│ budi@beritakarya.co     │1650  │ 32.10    │
└─────────────────────────┴──────┴──────────┘

[Export CSV] [Manage Quotas] [Set Budgets]
```

---

### **Alerting & Notifications**

**Automated alerts (via email/notification):**

| Condition | Threshold | Action |
|-----------|-----------|--------|
| User quota 80% used | ≥ 80% daily quota | Send warning to user + manager |
| User quota 100% used | ≥ 100% daily quota | Disable AI + notify admin |
| Site budget 80% spent | ≥ 80% monthly budget | Alert wapimred + finance |
| Site budget 100% spent | ≥ 100% monthly budget | Auto-disable AI for site |
| Unusual spike | 5x normal usage | Security alert + investigate |
| Model restriction violation | Any | Log event + notify admin |

**Implementation:** cron job running hourly:
```bash
# infra/scripts/check-ai-quotas.sh
0 * * * * /opt/beritakarya/infra/scripts/check-ai-quotas.sh
```

---

### **Cost-Saving Strategies**

1. **Model Optimization by Feature:**
   - GPT-3.5-turbo for: Grammar, Readability, Expand (cheap, accurate enough)
   - GPT-4o for: Headline, SEO, Rewrite (critical quality)
   
   **Estimated savings:** 60-70% reduction vs all-GPT-4o

2. **Redis Caching:**
   - Cache common prompts (e.g., "expand this paragraph" with similar length)
   - TTL: 1 hour for dynamic content, 24 hours for static
   - Hit rate target: 20-30% cost reduction

3. **Prompt Optimization:**
   - Keep prompts concise (fewer tokens)
   - Use system messages efficiently
   - Set max_tokens appropriately per feature

4. **Batch Processing:**
   - Allow batch grammar check (multiple paragraphs at once)
   - Reduces API calls by 3-5x

---

### **Admin Controls (UI)**

Admin can manage quotas via `/admin/users`:

```tsx
<UserEditForm>
  <h4>AI Access Configuration</h4>
  
  <Switch
    label="Enable AI Access"
    checked={user.aiEnabled}
    onChange={setAiEnabled}
  />
  
  <Slider
    label="Daily Request Limit"
    min={10} max={1000} step={10}
    value={user.aiDailyLimit}
    onChange={setDailyLimit}
  />
  
  <Slider
    label="Monthly Budget ($)"
    min={10} max={1000} step={10}
    value={user.aiMonthlyBudget}
    onChange={setMonthlyBudget}
  />
  
  <MultiSelect
    label="Allowed Features"
    options={ALL_FEATURES}
    value={user.aiFeaturesAllowed}
    onChange={setAllowedFeatures}
  />
  
  <Select
    label="Model Restriction (Optional)"
    options={[
      { value: '', label: 'No restriction' },
      { value: 'gpt-3.5-turbo', label: 'Force GPT-3.5 (cheaper)' },
      { value: 'gpt-4o', label: 'Force GPT-4o (better quality)' }
    ]}
    value={user.modelRestriction}
    onChange={setModelRestriction}
  />
</UserEditForm>
```

---

### **Success Metrics (Updated)**

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Quota Compliance** | >95% stay under limits | Redis counters |
| **Feature Adoption by Role** | Reporter: 70% use allowed features | Usage logs |
| **Cost per Role** | Reporter <$25/mo, Editor <$50/mo | Billing data |
| **Budget Adherence** | >90% sites under monthly cap | Admin dashboard |
| **AI Usage Rate** | >60% editors use AI weekly | Product analytics |
| **Quota Warning Accuracy** | <10% false warnings | Alert logs |
| **Cache Hit Rate** | >20% requests from cache | Redis metrics |
| **Circuit Breaker Effectiveness** | <1% downtime per month | Monitoring logs |

---

### **Monthly Reporting**

Auto-generated report sent to stakeholders:

```
📧 Monthly AI Report - May 2026

Executive Summary:
• Total Cost: $695.90 (69.6% of $1,000 budget)
• Active AI Users: 47 out of 60 editors (78%)
• Quota Compliance: 94% (2 users exceeded, warned)
• Top Feature: Rewrite (42% of requests)

By Branch:
┌─────────────────┬──────────┬──────────┬──────────┐
│ Branch          │ Users    │ Cost($)  │ Quota    │
├─────────────────┼──────────┼──────────┼──────────┤
│ Jakarta Pusat  │ 25       │ 350.20   │ ✅ 70%    │
│ Surabaya       │ 12       │ 180.40   │ ✅ 90%    │
│ Bandung        │ 6        │ 95.30    │ ⚠️ 85%   │
│ Yogyakarta     │ 4        │ 70.00    │ ✅ 65%   │
└─────────────────┴──────────┴────────────┴──────────┘

Recommendations:
• Bandung approaching budget limit - consider quota adjustment
• 2 reporters using headline feature (not allowed) - retrain
• Consider increasing wapimred quota (usage at 85%)
• GPT-3.5 rollout for reporters saved $180 this month
```

---

## **🔒 Security & Compliance**

### **Data Privacy**
- ✅ No training on user data (OpenAI enterprise/API)
- ✅ Encrypt all API calls
- ✅ Anonymize usage logs
- ✅ GDPR compliance (data deletion)
- ⚠️ Need user consent for data processing (opt-in)

### **Audit Trail**
- All AI actions logged in AuditLog table
- Track which user used which prompt
- Cost attribution per site/organization
- Exportable reports for billing

---

## **🎨 UI/UX Mockup Ideas**

### **Write Tab Enhanced**
```
┌─────────────────────────────────────────────────────┐
│  🖊 Write                                             │
├─────────────────────────────────────────────────────┤
│  Select Paragraph: [▼ Paragraf 3: "Kementerian..."]│
│                                                     │
│  ┌──────────────────┬──────────────────┐          │
│  │ Original         │ AI Result        │          │
│  │──────────────────│──────────────────│          │
│  │ [Full paragraph] │ [Full result]    │          │
│  │                  │                  │          │
│  │                  │                  │          │
│  └──────────────────┴──────────────────┘          │
│                                                     │
│  Tone: [○ Gaya Berita ○ Formal ○ Santai]           │
│  Length: [○ Sama ○ Lebih Pendek ○ Lebih Panjang]  │
│                                                     │
│  [🔄 Regenerate] [✅ Apply All] [❌ Cancel]        │
│                                                     │
│  💰 Cost: ~$0.015                                  │
└─────────────────────────────────────────────────────┘
```

---

## **📝 Content Guidelines for AI**

To maintain journalistic integrity:

### **Do:**
- ✅ Fact-check all AI output
- ✅ Verify names, dates, numbers
- ✅ Maintain BeritaKarya style guide
- ✅ Attribute AI-assisted content (internal note)
- ✅ Use AI for drafts, not final copy

### **Don't:**
- ❌ Publish AI content without review
- ❌ Let AI make editorial decisions
- ❌ Use AI for sensitive topics (crime, tragedy)
- ❌ Generate quotes from non-existent sources

---

## **🛠️ Technical Debt to Address**

1. **No streaming** - long content blocks wait for full response
2. **Token limit hardcoded** - should be configurable per feature
3. **No fallback model** - if GPT-4o fails, no automatic fallback to 3.5
4. **Single prompt strategy** - no A/B testing of prompts
5. **No fine-tuning** - custom model for BeritaKarya style

---

## **📈 Competitive Analysis**

| Feature | BeritaKarya | Grammarly | Jasper | Copy.ai |
|---------|-------------|-----------|--------|---------|
| Indonesian support | ✅ Native | ❌ | ❌ | ❌ |
| Integrated in editor | ✅ Yes | ❌ Extension | ❌ | ❌ |
| Journalism style | ✅ Specialized | ❌ General | ❌ | ❌ |
| Context-aware | ✅ Yes | ❌ | ❌ | ❌ |
| Usage tracking | ✅ Yes | ✅ | ✅ | ✅ |
| Price (per user/mo) | $15-29 | $12-30 | $39-99 | $36-96 |

**Differentiator:** Only AI assistant **built specifically for Indonesian journalists** with editorial workflow integration.

---

## **🚦 Implementation Priority Matrix**

```
Impact
  ^
  | High  │ P1: Image Tab, Comparison, Cost
  |        │ P2: Batch Apply, SERP Preview
  |        │
  | Medium │ P2: Model Selector, Shortcuts
  |        │ P3: History, Smart Context
  |        │
  | Low   │ P3: Templates, Collaborative
  +─────────────────────────────────> Effort
    Low    Medium    High
```

---

## **📋 Action Items (Next 30 Days)**

### **Week 1 (Critical) - ✅ COMPLETED**
- [x] Add Image Caption tab
- [x] Implement side-by-side comparison component
- [x] Show full context (prev/next paragraphs)
- [x] Add cost estimation display
- [x] Batch apply for grammar corrections

### **Week 2-3 (Enhancement) - ✅ COMPLETED**
- [x] SERP preview for SEO
- [x] Model selector dropdown
- [x] Keyboard shortcuts (Ctrl+Shift+R/E/H/S/L/C)
- [x] Wire circuit breaker (opossum)
- [x] Add Redis caching for frequent prompts (hash-based, 1hr TTL)

### **Week 4 (Polish)**
- [ ] User testing with real journalists
- [ ] Performance optimization (monitor cache hit rates, circuit breaker stats)
- [ ] Documentation update (API usage guide, troubleshooting)
- [ ] Training videos for editorial team

---

## **🎯 Go-to-Market Messaging**

**For Journalists:**
> "BeritaKarya AI adalah asisten penulisan yang memahami gaya berita Indonesia. Tidak mengganti Anda, tetapi membantu Anda:
> - Tulis ulang dengan tone yang tepat dalam 1 klik
> - Optimize judul dan SEO tanpa trial-error
> - Cek grammar & readability sebelum publikasi
> - Analisis struktur artikel untuk alur yang lebih baik"

**For Management:**
> "Tingkatkan produktivitas redaksi 2-3x tanpa kenaikan biaya 10x. AI assistant terintegrasi, aman, dan bisa di-track usagenya. Hanya $15-29 per user/bulan."

---

## **🔮 Long-term Vision (6-12 Months)**

1. **Fine-tuned model** - Train on BeritaKarya corpus for style match
2. **Voice-to-text** - Dictation for interviews
3. **Real-time collaboration** - Multiple editors + AI in same doc
4. **Fact-checking integration** - Cross-reference claims with trusted sources
5. **Multilingual support** - Translate to/from Indonesian
6. **Personal style learning** - AI adapts to each journalist's voice
7. **Automated KYC assistance** - Help fill KYC forms with AI

---

## **📞 Questions?**

Contact: Product Team  
Documentation: See `docs/AI_FEATURES.md` for technical details  
Feedback: https://github.com/sabdakarya77-spec/beritakarya/issues

---

**"Great journalism with AI assistance, not AI replacement."**