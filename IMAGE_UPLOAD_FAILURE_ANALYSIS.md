# 🔍 ANALISIS KEGAGALAN UPLOAD GAMBAR

**Tanggal:** 11 Mei 2026  
**Lokasi:** Halaman Artikel Dashboard Admin  
**Status:** 🔴 CRITICAL - Upload Gagal Total

---

## 📊 RINGKASAN MASALAH

**Root Cause:** **Missing `siteId` cookie** karena `middleware.ts` tidak ada

**Impact:** Semua upload gambar di halaman artikel gagal dengan error 400 (SITE_REQUIRED)

---

## 🔍 DETAIL ANALISIS

### 1. Frontend Implementation

**File:** `apps/web/components/editor/blocks/ImageBlock.tsx`

```typescript
const handleUpload = async (file: File) => {
  const form = new FormData()
  form.append('file', file)
  setUploading(true)
  setProgress(10)
  try {
    const { data } = await api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total) setProgress(Math.round((e.loaded / e.total) * 90))
      }
    })
    // ... success handling
  } catch {
    alert('Upload gagal, coba lagi')  // ← Error handling terlalu sederhana
  }
}
```

**Status:** ✅ Kode frontend benar
- FormData dikirim dengan benar
- Header multipart/form-data di-set
- Progress tracking diimplementasikan
- Error handling ada tapi tidak informatif

---

### 2. Backend Implementation

**File:** `apps/api/src/modules/media/media.controller.ts`

```typescript
mediaRouter.post(
  '/upload',
  requireAuth,        // ← Memerlukan authentication
  siteMiddleware,     // ← MEMERLUKAN SITE ID!
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: 'File tidak ditemukan' }
      })
    }
    // ... process image
  })
)
```

**Status:** ✅ Kode backend benar
- Multer dikonfigurasi dengan benar
- File size limit: 10MB
- File filter: JPG, PNG, WebP, GIF
- Image processing dengan Sharp
- Watermarking diimplementasikan

---

### 3. Site Middleware (THE PROBLEM!)

**File:** `apps/api/src/middleware/site.middleware.ts`

```typescript
export async function siteMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const siteId =
    (req.query.site as string) ||
    (req.headers['x-site-id'] as string)  // ← Mencari di header

  if (!siteId) {
    return res.status(400).json({
      success: false,
      error: { code: 'SITE_REQUIRED', message: 'Parameter site diperlukan' }
    })
  }
  // ... validation
}
```

**Status:** ⚠️ Middleware memerlukan siteId tapi tidak tersedia

---

### 4. API Client Configuration

**File:** `apps/web/lib/api.ts`

```typescript
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`

    const siteId = document.cookie
      .split('; ')
      .find(r => r.startsWith('siteId='))  // ← Mencari cookie siteId
      ?.split('=')[1]
    if (siteId) {
      config.headers['X-Site-ID'] = siteId  // ← Set header jika ada
      if (!config.params) config.params = {}
      config.params.site = siteId
    }
  }
  return config
})
```

**Status:** ⚠️ Mencoba membaca cookie siteId tapi tidak ada

---

### 5. Missing Middleware.ts (ROOT CAUSE)

**File:** `apps/web/middleware.ts` - **TIDAK ADA!**

**File yang ada:** `apps/web/proxy.ts`

```typescript
// apps/web/proxy.ts - Ada tapi tidak di-import
export function proxy(req: NextRequest) {
  // ... logic untuk set cookie siteId
  const res = NextResponse.next()
  res.cookies.set('siteId', siteId, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24
  })
  // ...
}
```

**Status:** 🔴 **CRITICAL** - Middleware tidak ada, cookie tidak pernah di-set

---

## 🎯 ROOT CAUSE ANALYSIS

### Chain of Failure:

```
1. User membuka halaman artikel
   ↓
2. Tidak ada middleware.ts untuk set cookie siteId
   ↓
3. Cookie siteId tidak ada di browser
   ↓
4. Frontend mencoba membaca cookie siteId (lib/api.ts)
   ↓
5. siteId = undefined (karena cookie tidak ada)
   ↓
6. Request ke /api/v1/media/upload tanpa X-Site-ID header
   ↓
7. Backend siteMiddleware mengecek siteId
   ↓
8. siteId tidak ditemukan (tidak ada di query params dan tidak ada di header)
   ↓
9. siteMiddleware return 400 error: "Parameter site diperlukan"
   ↓
10. Frontend catch error dan tampilkan alert: "Upload gagal, coba lagi"
```

### Why This Happens:

1. **Missing `middleware.ts`** - File ini seharusnya meng-import dan mengeksekusi `proxy.ts`
2. **No cookie initialization** - Tanpa middleware, cookie `siteId` tidak pernah di-set
3. **Backend validation** - `siteMiddleware` memerlukan siteId untuk setiap request
4. **Silent failure** - Frontend error handling tidak menampilkan detail error

---

## 🔬 EVIDENCE

### Evidence #1: Missing middleware.ts

```bash
# Search result
$ find apps/web -name "middleware.ts"
# No results found
```

### Evidence #2: proxy.ts exists but not used

```bash
# File exists
$ ls -la apps/web/proxy.ts
-rw-r--r-- 1 user user 2.1K May 11 12:25 apps/web/proxy.ts

# But not imported anywhere
$ grep -r "from.*proxy" apps/web/
# No results found
```

### Evidence #3: Backend requires siteId

```typescript
// apps/api/src/modules/media/media.controller.ts line 94-98
mediaRouter.post(
  '/upload',
  requireAuth,
  siteMiddleware,  // ← This middleware REQUIRES siteId
  upload.single('file'),
  // ...
)
```

### Evidence #4: Frontend tries to read siteId from cookie

```typescript
// apps/web/lib/api.ts line 15-23
const siteId = document.cookie
  .split('; ')
  .find(r => r.startsWith('siteId='))  // ← Looking for cookie
  ?.split('=')[1]
if (siteId) {
  config.headers['X-Site-ID'] = siteId
  // ...
}
```

---

## 🐛 ERROR FLOW

### Expected Flow (If middleware.ts existed):

```
User Request → middleware.ts → Set cookie siteId → 
Frontend reads cookie → Add X-Site-ID header → 
Backend receives siteId → siteMiddleware passes → 
Upload succeeds ✅
```

### Actual Flow (Current):

```
User Request → NO middleware.ts → NO cookie siteId → 
Frontend reads undefined → NO X-Site-ID header → 
Backend receives NO siteId → siteMiddleware rejects → 
Upload fails ❌
```

---

## 📋 IMPACT ANALYSIS

### Affected Features:

1. **Image Upload in Article Editor** - ❌ COMPLETELY BROKEN
2. **Gallery Block** - ❌ COMPLETELY BROKEN
3. **Image Grid Block** - ❌ COMPLETELY BROKEN
4. **Any media upload** - ❌ COMPLETELY BROKEN

### Error Response:

```json
{
  "success": false,
  "error": {
    "code": "SITE_REQUIRED",
    "message": "Parameter site diperlukan"
  }
}
```

### User Experience:

- User selects image
- Upload progress starts (10%)
- Upload fails immediately
- Alert shows: "Upload gagal, coba lagi"
- No detailed error message
- User cannot upload any images

---

## 🔧 SOLUTION

### Immediate Fix (Create middleware.ts):

**File:** `apps/web/middleware.ts`

```typescript
import { proxy } from './proxy'

export { proxy as middleware }
```

This will:
1. Import the existing `proxy.ts` function
2. Export it as `middleware` (Next.js convention)
3. Enable multi-tenant routing
4. Set `siteId` cookie for all requests
5. Fix image upload functionality

### Why This Works:

1. Next.js automatically executes `middleware.ts` for all requests
2. `proxy.ts` already has logic to extract siteId from subdomain
3. `proxy.ts` sets the `siteId` cookie
4. Frontend `api.ts` reads the cookie and adds `X-Site-ID` header
5. Backend `siteMiddleware` receives the siteId and passes the request
6. Upload succeeds

---

## 📊 ADDITIONAL FINDINGS

### Finding #1: Error Handling Too Generic

**File:** `apps/web/components/editor/blocks/ImageBlock.tsx` line 35-36

```typescript
} catch {
  alert('Upload gagal, coba lagi')
}
```

**Problem:** Error tidak ditampilkan ke user
**Recommendation:** Tampilkan error detail dari response

```typescript
} catch (error: any) {
  const errorMessage = error.response?.data?.error?.message || 
                       'Upload gagal, coba lagi'
  alert(errorMessage)
}
```

### Finding #2: No Console Logging

**Problem:** Tidak ada logging untuk debugging
**Recommendation:** Tambah console.log untuk development

```typescript
console.log('[Image Upload] Starting upload:', file.name)
console.log('[Image Upload] Response:', data)
console.log('[Image Upload] Error:', error)
```

### Finding #3: Missing Upload Retry

**Problem:** Tidak ada retry mechanism
**Recommendation:** Implement retry logic untuk transient errors

---

## 🎯 VERIFICATION STEPS

### Step 1: Create middleware.ts

```bash
# Create the file
cat > apps/web/middleware.ts << 'EOF'
import { proxy } from './proxy'

export { proxy as middleware }
EOF
```

### Step 2: Verify Cookie is Set

```javascript
// Open browser console
console.log(document.cookie)
// Should show: "siteId=pusat" or similar
```

### Step 3: Verify Request Headers

```javascript
// In browser DevTools Network tab
// Check request to /api/v1/media/upload
// Should have header: X-Site-ID: pusat
```

### Step 4: Test Upload

1. Open article editor
2. Click on image block
3. Select image file
4. Upload should succeed ✅

---

## 📝 CONCLUSION

**Root Cause:** Missing `apps/web/middleware.ts` file

**Impact:** Complete failure of image upload functionality

**Solution:** Create `middleware.ts` that exports the existing `proxy` function

**Priority:** 🔴 CRITICAL - Blocks core functionality

**Estimated Fix Time:** 1 minute (just create the file)

**Testing Required:** Yes - verify image upload works after fix

---

## 🚨 ADDITIONAL NOTES

### Related Issues from Previous Audit:

1. **Missing middleware.ts** - Already identified in comprehensive audit
2. **Multi-tenant routing broken** - Same root cause
3. **Wildcard domains not working** - Same root cause

### This Fix Will Also Resolve:

- ✅ Image upload in article editor
- ✅ Multi-tenant subdomain routing
- ✅ Wildcard domain functionality
- ✅ Site-specific content display
- ✅ All site-dependent features

---

**Analysis Completed By:** Senior News Website Code System Development  
**Date:** May 11, 2026  
**Status:** Ready for Fix Implementation