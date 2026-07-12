# Deploy PriceThis API to Vercel (via GitHub)

## 1. Push to GitHub

```bash
git init   # if not already done
git add .
git commit -m "Initial commit: PriceThis mobile app + Claude API"
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
| `ANTHROPIC_API_KEY` | `sk-ant-...` | **Required** |
| `CLAUDE_MODEL` | `claude-haiku-4-5` | Default when no preset is requested |
| `CLAUDE_MODEL_SONNET` | `claude-sonnet-4-6` | Preset: `sonnet` |
| `CLAUDE_MODEL_OPUS` | `claude-opus-4-6` | Preset: `opus` |
| `CLAUDE_MODEL_HAIKU` | `claude-haiku-4-5` | Preset: `haiku` |
| `CLAUDE_MODEL_FAST` | `claude-haiku-4-5` | Preset: `fast` (alias for quick/cheap tests) |
| `CLAUDE_MODEL_QUALITY` | `claude-opus-4-6` | Preset: `quality` (alias for best quality) |
| `CLAUDE_WEB_SEARCH` | `true` | Enable Claude web search for price grounding (set `false` to disable) |
| `WEB_SEARCH_MAX_USES` | `1` | Max searches per scan (cost + latency cap) |
| `SCAN_PIPELINE` | `true` | Progressive pipeline: Stage 1 without search, then gated search |
| `SCAN_ID_FAIL_FLOOR` | `50` | Below this identification score → too weak to price (no search) |
| `SCAN_SEARCH_THRESHOLD` | `70` | Search when **valuation** confidence is below this |
| `SCAN_CATEGORY_SEARCH_THRESHOLD` | `75` | Stricter search bar for watches, art, cars, etc. |
| `SCAN_AMBIGUITY_MARGIN` | `15` | Top alt within this of identification → disambiguation, no search |
| `MARKET_DATA_ENABLED` | `true` | Optional |

After changing env vars, **redeploy** on Vercel.

### Switch models on the fly

List configured presets:

```bash
curl https://your-project.vercel.app/api/models
```

Use a preset in a scan request:

```bash
curl -X POST https://your-project.vercel.app/api/scan/text \
  -H "Content-Type: application/json" \
  -d '{"query":"Rolex Submariner","locale":"en-US","currencyCode":"USD","model":"opus"}'
```

Or via header:

```bash
curl -X POST https://your-project.vercel.app/api/scan/text \
  -H "Content-Type: application/json" \
  -H "X-Claude-Model: haiku" \
  -d '{"query":"Rolex Submariner","locale":"en-US","currencyCode":"USD"}'
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
