# NGX Offerings Monitor

Track IPOs, Rights Issues, Public Offers, Bonds & ETFs on the Nigerian Exchange Group — live on your phone.

## Features
- 🔍 AI-powered web search for live NGX offerings
- 📱 PWA — installs on Android & iOS like a native app
- 🔔 Push notifications when new offerings are detected
- 💾 Caches last scan so data loads instantly
- 🔒 API key stays server-side, never exposed to browser

---

## Deploy in 5 Steps

### Step 1 — Get a Google Generative AI API key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account → click **Create API Key**
3. Copy the key

### Step 2 — Push to GitHub
1. Create a new repo on [github.com](https://github.com) (name it `ngx-monitor`)
2. In this folder, run:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/ngx-monitor.git
git push -u origin main
```

### Step 3 — Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **Add New Project** → select `ngx-monitor`
3. Click **Deploy** (leave all settings default)

### Step 4 — Add your API key to Vercel
1. In Vercel dashboard → your project → **Settings** → **Environment Variables**
2. Add:
   - Name: `GOOGLE_GENERATIVE_AI_API_KEY`
   - Value: your key from Step 1
3. Click **Save** → go to **Deployments** → **Redeploy**

### Step 5 — Install on your phone
1. Open your Vercel URL (e.g. `ngx-monitor.vercel.app`) in Chrome
2. Tap the 3-dot menu → **Add to Home Screen**
3. Done — it works like an app!

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.local.example .env.local
# Edit .env.local and add your API key

# 3. Run locally
npm run dev
# Open http://localhost:3000
```

---

## How it works

1. You tap **SCAN** on the app
2. Your phone calls `/api/scan` on your Vercel server
3. The server (with your hidden API key) calls Claude with web search enabled
4. Claude searches for current NGX offerings and returns structured JSON
5. The app displays results and highlights any NEW offerings since last scan
6. If you enabled notifications, you get a push alert for new offerings

---

## Notes
- Each scan uses ~1,000–2,000 tokens (costs ~$0.003–0.006 per scan)
- Always verify offerings at [invest.ngxgroup.com](https://invest.ngxgroup.com) before investing
- Scan daily for best results
