# BRUChat — Setup Guide
Built in Kigali by INEZA AIME BRUNO

---

## STEP 1 — Install Node.js & tools on your computer

1. Go to https://nodejs.org → download and install the **LTS** version
2. Go to https://git-scm.com → download and install Git
3. Open a terminal (on Windows: press Win+R → type `cmd` → Enter)
4. Run this to install Supabase CLI:
   ```
   npm install -g supabase
   ```

---

## STEP 2 — Download and open the project

1. Unzip the `bruchat-final` folder you downloaded
2. In your terminal, navigate to it:
   ```
   cd path/to/bruchat-final
   ```
3. Install all packages:
   ```
   npm install
   ```

---

## STEP 3 — Set your secret keys in Supabase Edge Functions

These keys NEVER go in the frontend. You set them in Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/pnkvioxgooovvenitbzc/settings/edge-functions
2. Click **"Add secret"** for each of these (one at a time):

| Secret Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini key (starts with AQ...) |
| `ADMIN_PASSWORD` | Your admin password you invented |
| `LIVEKIT_API_KEY` | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret |
| `LIVEKIT_URL` | Your LiveKit wss:// URL |

3. Also add your Supabase service role key:

| Secret Name | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Your sb_secret_... key |

---

## STEP 4 — Add your LiveKit URL to the frontend

Open `.env.local` in the bruchat-final folder with any text editor (Notepad is fine).

Change this line:
```
VITE_LIVEKIT_URL=PASTE_YOUR_WSS_URL_HERE
```
To your actual LiveKit URL:
```
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
```

---

## STEP 5 — Run the database migrations

This creates all the tables in your Supabase database.

In your terminal (inside the bruchat-final folder):

```bash
# Login to Supabase CLI
supabase login

# Link to your project
supabase link --project-ref pnkvioxgooovvenitbzc

# Push all migrations (creates all tables, RLS, triggers)
supabase db push
```

---

## STEP 6 — Deploy the Edge Functions (backend)

```bash
supabase functions deploy admin-login
supabase functions deploy admin-operations
supabase functions deploy ai-chat
supabase functions deploy mcp
```

---

## STEP 7 — Run the app locally

```bash
npm run dev
```

Then open your browser and go to: **http://localhost:5173**

You should see BRUChat! 🎉

---

## STEP 8 — Deploy to the internet (so anyone can use it)

Best free option: **Vercel**

1. Go to https://vercel.com → sign up with GitHub
2. Push your code to GitHub first:
   ```bash
   git init
   git add .
   git commit -m "BRUChat initial"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bruchat.git
   git push -u origin main
   ```
3. In Vercel: click **New Project** → import your GitHub repo
4. Add these Environment Variables in Vercel settings:
   - `VITE_SUPABASE_URL` = `https://pnkvioxgooovvenitbzc.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_8Hsq-YWEqB9vFaggXMnCFw_ZoGP5lpM`
   - `VITE_LIVEKIT_URL` = your wss:// URL
5. Click **Deploy** — you get a free `.vercel.app` URL!

---

## STEP 9 — Add your Vercel URL to Google OAuth

Once deployed, go back to Google Cloud Console → your BRUChat OAuth client → add your Vercel URL as an authorized redirect URI:
```
https://your-app.vercel.app
```

---

## Admin Panel

Go to `/admin` on your app → enter your `ADMIN_PASSWORD` → you're in.

---

## Test a Voice/Video Call

1. Open your app in **two different browser windows**
2. Sign up as two different users
3. Start a conversation between them
4. Click the call button in the conversation header
5. Accept in the other window

---

## Your Project Details

- **Supabase Project**: pnkvioxgooovvenitbzc
- **Supabase URL**: https://pnkvioxgooovvenitbzc.supabase.co
- **Supabase Dashboard**: https://supabase.com/dashboard/project/pnkvioxgooovvenitbzc

---

*Made with 🖤 by INEZA AIME BRUNO — Having any problem? Message @bruchat*
