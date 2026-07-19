# Deploy PriceThis API to Vercel (via GitHub)

## 1. Push to GitHub

```bash
git init   # if not already done
git add .
git commit -m "Initial commit: PriceThis mobile app + Gemini API"
git branch -M main
git remote add origin https://github.com/YOUR_USER/PriceThis.git
git push -u origin main
```

## 2. Create Vercel project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your **PriceThis** GitHub repo
3. **Root Directory:** `server` ← **required**
4. Framework Preset: **Other**
5. Build Command: leave empty (serverless functions only)
6. Output Directory: leave empty

> If scans fail with `FUNCTION_INVOCATION_FAILED` or `NOT_FOUND`, the Root Directory is almost always wrong. It must be `server`, not the repo root.

## 3. Environment variables (Vercel dashboard → Settings → Environment Variables)

| Variable | Value | Notes |
|----------|-------|-------|
| `GEMINI_API_KEY` | `AQ....` | **Required** — Gemini Flash-Lite |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Optional Gemini model ID override |
| `SCAN_PIPELINE` | `true` | Progressive pipeline: Stage 1 followed by gated valuation refinement |
| `SCAN_ID_FAIL_FLOOR` | `50` | Below this identification score → too weak to price (no search) |
| `SCAN_SEARCH_THRESHOLD` | `70` | Search when **valuation** confidence is below this |
| `SCAN_CATEGORY_SEARCH_THRESHOLD` | `75` | Stricter search bar for watches, art, cars, etc. |
| `SCAN_AMBIGUITY_MARGIN` | `15` | Top alt within this of identification → disambiguation, no search |
| `MARKET_DATA_ENABLED` | `true` | Optional |

After changing env vars, **redeploy** on Vercel.

### Confirm the configured model

The API exposes Gemini as the only configured model:

```bash
curl https://your-project.vercel.app/api/models
```

Scan requests use Gemini by default. The optional model field only accepts `gemini`:

```bash
curl -X POST https://your-project.vercel.app/api/scan/text \
  -H "Content-Type: application/json" \
  -d '{"query":"Rolex Submariner","locale":"en-US","currencyCode":"USD","model":"gemini"}'
```

Responses include `meta.modelId` and `meta.preset` so you can confirm which model ran.

## 4. Deploy

Vercel deploys automatically on every push to `main`.

Your API will be at:
```
https://your-project.vercel.app/api/health
https://your-project.vercel.app/api/scan/text
https://your-project.vercel.app/api/scan/image
```

Test:
```bash
curl https://your-project.vercel.app/api/health
```

## 5. Standalone mobile build (on-the-go)

```bash
cp .env.standalone.example .env.standalone
# Edit API_BASE_URL to your Vercel URL:
#   API_BASE_URL=https://your-project.vercel.app

npm run android:standalone
```

Unplug USB — app + scans work anywhere with internet.

## Repo layout

```text
/
├── src/          React Native app
├── android/ ios/
├── server/       Vercel API (set as Root Directory in Vercel)
│   ├── api/
│   └── lib/
└── docs/
```
