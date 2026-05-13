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
- ✅ AISidebar with 4 tabs (Write, Optimize, Validate, Layout)
- ✅ Custom hooks for each AI feature
- ✅ Integration with editor store
- ✅ Result cards with apply functionality
- ✅ Loading states & error handling

### **Critical Gaps** ❌
1. **Missing UI:** Image Caption tab (service exists but no UI)
2. **Poor UX:** Write tab - no side-by-side comparison
3. **Poor UX:** Write tab - limited preview (150 chars only)
4. **Missing:** Context preview (prev/next paragraphs)
5. **Missing:** Undo/redo for AI changes
6. **Missing:** Cost transparency (users unaware of API costs)
7. **Missing:** AI model selector (GPT-4o vs 3.5-turbo)
8. **Missing:** Batch operations (grammar corrections apply all)
9. **Missing:** SERP preview for SEO meta
10. **Missing:** Keyboard shortcuts
11. **Missing:** AI history/session persistence

---

## **🚀 Improvement Roadmap**

### **PHASE 1: Critical Fixes (Week 1) - MUST BEFORE LAUNCH**

These are **blockers** for user adoption. Journalists need to see value immediately.

#### **1.1 Add Missing Image Caption Tab**
**Impact:** High - Feature exists but inaccessible  
**Effort:** 2 hours  
**Owner:** Frontend  

**Implementation:**
```tsx
// In AISidebar.tsx, add 'image' to tabs
{ id: 'image', label: 'Gambar' }

// Create components/editor/ai/ImageTab.tsx
// - Upload/input image URL
// - Show preview
// - "Generate Caption" button
// - Copy caption button
// - Apply to alt text field
```

**Acceptance Criteria:**
- User can input image URL or upload
- AI generates caption + alt text
- One-click copy & apply to image metadata

---

#### **1.2 Write Tab: Side-by-Side Comparison**
**Impact:** Critical - Core user experience  
**Effort:** 1 day  
**Owner:** Frontend  

**Current:** Result appears below, user must scroll to compare.  
**After:** Split view - original (left) vs AI result (right) with:
- Scroll sync (scroll original, result follows)
- Highlight changes (diff highlighting)
- Accept line-by-line or entire block
- Regenerate button with same settings

**UI Pattern:**
```
┌─────────────────┬─────────────────┐
│   Original      │  AI Result      │
│  [paragraph]    │  [paragraph]    │
│                 │                 │
│                 │                 │
│                 │                 │
└─────────────────┴─────────────────┘
[Approve All] [Reject All] [Regenerate]
```

---

#### **1.3 Write Tab: Full Context Display**
**Impact:** High - Users need to understand context  
**Effort:** 4 hours  
**Owner:** Frontend  

**Requirements:**
- Show full selected paragraph (not just 150 chars)
- Display prev/next paragraphs in muted/bordered boxes
- Option to toggle context visibility
- Word count indicator

**Code Changes:**
```tsx
// Replace current preview box
<div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto">
  <p className="text-xs text-gray-600 mb-2">Paragraf Terpilih:</p>
  <p className="text-sm">{content}</p>
  <p className="text-xs text-gray-400 mt-1">{content.length} karakter</p>
</div>

{prev && (
  <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
    <p className="font-medium">Sebelumnya:</p>
    <p>{prev.slice(0, 200)}...</p>
  </div>
)}
{next && (/* similar */)}
```

---

#### **1.4 Cost Transparency**
**Impact:** High - Prevent surprise bills, build trust  
**Effort:** 3 hours  
**Owner:** Backend + Frontend  

**Backend:**
```typescript
// In base.service.ts, after successful API call:
const usage = {
  promptTokens: res.usage?.prompt_tokens || 0,
  completionTokens: res.usage?.completion_tokens || 0,
  totalTokens: res.usage?.total_tokens || 0
}
// Return usage metadata to frontend
return { result: content, usage }
```

**Frontend:**
```tsx
// Display estimated cost
const COST_PER_1M = {
  'gpt-4o': { input: 5, output: 15 }, // USD
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 }
}

const estimateCost = (input: number, output: number) => {
  const model = env.AI_MODEL
  const rates = COST_PER_1M[model]
  const cost = (input/1e6*rates.input) + (output/1e6*rates.output)
  return cost.toFixed(4) // Show as "$0.0042"
}

// Button label:
<button>
  {loading ? '...' : `✨ Tulis Ulang (≈${estimateCost(inputLen, outputLen)})`}
</button>
```

**User Dashboard:**
- Monthly usage stats
- Cost breakdown by feature
- Quota limits warning (if enabled)

---

#### **1.5 Grammar Check: Batch Apply**
**Impact:** Medium - Quality of life  
**Effort:** 1 day  
**Owner:** Frontend  

**Current:** Each correction shown, user must manually copy-paste.  
**After:** 
- Checkbox per correction
- "Apply Selected" & "Apply All" buttons
- Preview of combined changes
- Undo capability

---

### **PHASE 2: Quality of Life (Week 2-3)**

#### **2.1 SEO: SERP Preview**
Show how meta title/description looks in Google results:
```
┌─────────────────────────────────────┐
│  https://beritakarya.co/artikel-xyz  │
│  ────────────────────────────────   │
│  Meta Title (50-60 chars)           │
│  ────────────────────────────────   │
│  Meta Description (150-160 chars)   │
│  ────────────────────────────────   │
└─────────────────────────────────────┘
```

#### **2.2 Model Selector**
Allow user to choose:
- GPT-4o (best quality, expensive)
- GPT-4-turbo (good balance)
- GPT-3.5-turbo (fast, cheap)

**Implementation:**
```tsx
<select value={selectedModel} onChange={setModel}>
  <option value="gpt-4o">GPT-4o (Best - ~$0.01-0.03/request)</option>
  <option value="gpt-4-turbo">GPT-4 Turbo (Good - ~$0.005-0.015)</option>
  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast - ~$0.0005-0.002)</option>
</select>
```

#### **2.3 Keyboard Shortcuts**
```typescript
// hooks/useKeyboardShortcuts.ts
useHotkeys('ctrl+shift+r', () => doRewrite(...))
useHotkeys('ctrl+shift+e', () => doExpand(...))
useHotkeys('ctrl+shift+h', () => doHeadlines(...))
// etc
```

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

#### **3.2 Circuit Breaker Activation**
Wire up the existing `circuitBreaker.ts`:

```typescript
// In base.service.ts
import { openaiBreaker } from '../lib/circuitBreaker'

export async function chatComplete(...) {
  return openaiBreaker.fire(
    async () => {
      const res = await client.chat.completions.create(...)
      return res.choices[0]?.message?.content?.trim() ?? ''
    }
  ).catch(() => {
    // Fallback to cached or error message
    throw new Error('AI service temporarily unavailable')
  })
}
```

---

#### **3.3 Smart Context Window**
Currently passing only prev/next paragraph (200 chars). Enhance:
- Include article title & section
- Include key entities (people, places) from full article
- Include style guide preferences per publication
- Conversation memory (last 5 exchanges in same session)

---

#### **3.4 Template Prompts**
Pre-defined prompts for common journalism tasks:
- "Rewrite for breaking news"
- "Rewrite for feature story"
- "Rewrite for op-ed"
- "Simplify for general audience"
- "Add local context"

Save as quick buttons in Write tab.

---

#### **3.5 Collaborative AI**
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

---

## **💰 Pricing & Monetization Strategy**

### **Free Tier**
- 50 AI requests/month
- GPT-3.5-turbo only
- Basic features only

### **Pro Tier** ($15-29/user/month)
- Unlimited AI requests
- GPT-4o access
- All features
- Priority support

### **Enterprise** (Custom pricing)
- SSO integration
- Custom style guides
- Dedicated model fine-tuning
- SLA guarantees
- Volume discounts

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

1. **Circuit breaker** not wired (created but unused)
2. **No caching** - repeated requests cost duplicate money
3. **No streaming** - long content blocks wait for full response
4. **Token limit hardcoded** - should be configurable per feature
5. **No fallback model** - if GPT-4o fails, no automatic fallback to 3.5
6. **Single prompt strategy** - no A/B testing of prompts
7. **No fine-tuning** - custom model for BeritaKarya style

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

### **Week 1 (Critical)**
- [ ] Add Image Caption tab
- [ ] Implement side-by-side comparison in Write tab
- [ ] Show full context (prev/next paragraphs)
- [ ] Add cost estimation display
- [ ] Batch apply for grammar corrections

### **Week 2-3 (Enhancement)**
- [ ] SERP preview for SEO
- [ ] Model selector dropdown
- [ ] Keyboard shortcuts
- [ ] Wire circuit breaker
- [ ] Add Redis caching for frequent prompts

### **Week 4 (Polish)**
- [ ] User testing with real journalists
- [ ] Performance optimization
- [ ] Documentation update
- [ ] Training videos

---

## **🎯 Go-to-Market Messaging**

**For Journalists:**
> "BeritaKarya AI adalah asisten penulisan yang memahami gaya berita Indonesia. Tidak meng替换 Anda, tetapi membantu Anda:
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