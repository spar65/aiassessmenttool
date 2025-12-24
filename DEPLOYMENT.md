# Deployment Guide: aiassessmenttool.com

**Last Updated:** December 24, 2024  
**Version:** 0.7.2  
**Status:** Ready for Production

---

## 🎉 Pre-Deployment Checklist - All Complete!

| Item | Status | Notes |
|------|--------|-------|
| SDK published to npm | ✅ | `@aiassesstech/sdk@0.7.0` |
| Demo app uses npm package | ✅ | Updated from `file:` link |
| Build succeeds | ✅ | No errors or warnings |
| Metadata configured | ✅ | metadataBase set to aiassessmenttool.com |
| Lead registration API | ✅ | `/api/leads/register` with CORS |
| Rate limiting | ✅ | Per-IP limiting in place |

---

## 📋 Deployment Steps

### Step 1: Create Demo API Key (Main Platform)

1. **Log into the main platform** at https://www.aiassesstech.com
2. **Navigate to Health Check Settings**
3. **Create a new API Key** with:
   - Label: `Demo App - aiassessmenttool.com`
   - Environment: `production`
   - Tier: `DEMO` (if available, otherwise `STANDARD`)
   - Rate limits: 5/hour per IP (server-enforced)

4. **Copy the key** - it will look like: `hck_xxxxxxxxxxxxxxxxxx`

**Alternative (Database Direct):**
```sql
-- Create demo API key in HealthCheckApiKey table
INSERT INTO "HealthCheckApiKey" (
  id, "organizationId", label, "keyHash", "lastFourChars",
  environment, active, tier, "createdBy", "createdAt"
) VALUES (
  'demo_key_id',
  'your_org_id',
  'Demo App - aiassessmenttool.com',
  'sha256_hash_of_key',
  'last4',
  'production',
  true,
  'DEMO',
  'your_user_id',
  NOW()
);
```

---

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

```bash
cd apps/ai-assessment-tool

# Login to Vercel (if not already)
vercel login

# Deploy to preview first
vercel

# After testing, deploy to production
vercel --prod
```

#### Option B: Vercel Dashboard

1. Go to https://vercel.com/new
2. Import from GitHub: `your-repo/apps/ai-assessment-tool`
3. Configure:
   - Framework Preset: `Next.js`
   - Root Directory: `apps/ai-assessment-tool`
   - Build Command: `npm run build`
   - Output Directory: `.next`

---

### Step 3: Configure Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_API_URL=https://www.aiassesstech.com
NEXT_PUBLIC_HEALTH_CHECK_KEY=hck_your_demo_key_here
```

**Important:** 
- These are **public** variables (prefixed with `NEXT_PUBLIC_`)
- The demo key is intentionally public and rate-limited server-side
- Do NOT add any secret keys here

---

### Step 4: Configure Custom Domain

1. **In Vercel Dashboard:**
   - Go to Project → Settings → Domains
   - Add: `aiassessmenttool.com`
   - Add: `www.aiassessmenttool.com` (optional)

2. **At Your Domain Registrar:**
   - Add A record: `@` → `76.76.21.21`
   - Or add CNAME: `www` → `cname.vercel-dns.com`

3. **Wait for DNS propagation** (usually 1-24 hours)

4. **Verify SSL** is automatically provisioned by Vercel

---

### Step 5: Post-Deployment Verification

```bash
# 1. Check the site is accessible
curl -I https://aiassessmenttool.com

# 2. Verify API endpoint
curl https://www.aiassesstech.com/api/health

# 3. Test lead registration
curl -X POST https://www.aiassesstech.com/api/leads/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","companyName":"Test Corp"}'
```

---

## 🧪 Testing the Full Flow

### Manual Test Checklist

1. **Landing Page** (`/`)
   - [ ] Page loads correctly
   - [ ] Lead capture form visible
   - [ ] Submit with email + company name
   - [ ] Redirects to `/configure`

2. **Configure Page** (`/configure`)
   - [ ] OpenAI API key input works
   - [ ] Key validation button works
   - [ ] System prompt editor functional
   - [ ] Threshold sliders work
   - [ ] Model selector works
   - [ ] "Run Assessment" button enabled after key validated

3. **Assessment Page** (`/assess`)
   - [ ] Progress bar shows
   - [ ] Question count updates
   - [ ] Estimated time displays
   - [ ] Cancel button works

4. **Results Page** (`/results/[runId]`)
   - [ ] Scores display correctly
   - [ ] Pass/Fail status shown
   - [ ] Verification URL generated
   - [ ] "Run Again" button works

---

## 🔧 Troubleshooting

### "Failed to register" Error

**Cause:** CORS issue or API unreachable

**Fix:**
1. Verify `NEXT_PUBLIC_API_URL` is set correctly
2. Check main platform is online
3. Verify CORS headers in `/api/leads/register`

### "Invalid API Key" Error

**Cause:** Demo Health Check Key not valid

**Fix:**
1. Create a new key in main platform
2. Update `NEXT_PUBLIC_HEALTH_CHECK_KEY` in Vercel
3. Redeploy

### Assessment Hangs

**Cause:** OpenAI API key issues or rate limiting

**Fix:**
1. User should verify their OpenAI key
2. Try a different model (GPT-3.5 is faster)
3. Check user's OpenAI account for credits

---

## 📊 Monitoring

### Analytics (Recommended)

Add to Vercel Dashboard → Analytics:
- Enable Web Analytics (free)
- Enable Speed Insights (free)

### Error Tracking (Optional)

Add Sentry:
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Lead Tracking

Leads are stored in the main platform database:
- Table: `DemoLead`
- Fields: email, companyName, role, useCase, source, createdAt

---

## 🚀 Go-Live Checklist

Before announcing:

- [ ] DNS fully propagated (check with `dig aiassessmenttool.com`)
- [ ] SSL certificate active (green lock in browser)
- [ ] Full user flow tested end-to-end
- [ ] Error tracking enabled
- [ ] Analytics enabled
- [ ] Social sharing (OG tags) verified
- [ ] Mobile responsiveness verified

---

## 📁 Environment Variables Summary

| Variable | Value | Where |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://www.aiassesstech.com` | Vercel |
| `NEXT_PUBLIC_HEALTH_CHECK_KEY` | `hck_demo_xxxxx` | Vercel |

---

## 🔗 Links

- **Production Site:** https://aiassessmenttool.com
- **Main Platform:** https://www.aiassesstech.com
- **SDK on npm:** https://www.npmjs.com/package/@aiassesstech/sdk
- **SDK Docs:** https://www.aiassesstech.com/docs/sdk

---

**Questions?** Contact support@aiassesstech.com

