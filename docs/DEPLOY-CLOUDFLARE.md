# Deploying Hayaat Emporium on Cloudflare + Supabase

## How it fits together

| Piece | Where | Address (example) | Built with |
| --- | --- | --- | --- |
| Shop website | Cloudflare Pages project `hayaat-store` | `hayaatemporium.com` | `npm run build` → `dist` |
| Admin portal | Cloudflare Pages project `hayaat-admin` | `admin.hayaatemporium.com` | `npm run build:admin` → `dist-admin` |
| Keep-awake job | Cloudflare Worker `hayaat-supabase-keep-alive` | runs daily | `workers/keep-alive/` |
| Database, login, images, server functions | Supabase (free plan) | `xxxx.supabase.co` | `supabase/` |

Both sites come from this one repository. The admin portal is a separate site: none of its code is in the shop.

Replace `hayaatemporium.com` below with your real domain.

---

## Part 1 — Supabase (backend)

> **Why this is needed:** the Supabase projects this repo pointed to (`bcgcxflakiyhqbmcixgv` in `.env`, and `jzadftaaxangwmpabybb` in `supabase/config.toml`) no longer exist; their addresses don't resolve. Everything the backend needs is in this repo, so it can be rebuilt on a new free project. Old products, orders and customers are not recoverable from here; if you have a backup, restore it after step 1.3.

### 1.1 Create the project
1. Go to <https://supabase.com/dashboard> → **New project** (Free plan).
2. Region: **South Asia (Mumbai)**, closest to Indian customers.
3. Save the database password somewhere safe.

### 1.2 Install the Supabase command line (once)
Open a terminal in the repo folder and run:
```
npx supabase login
npx supabase link --project-ref YOUR-PROJECT-REF
```
`YOUR-PROJECT-REF` is the part before `.supabase.co` in your project URL (Project Settings → General). It asks for the database password.

### 1.3 Create the tables, image bucket and security rules
```
npx supabase db push
```
This runs every file in `supabase/migrations/` in order, including `20261123000000_lock_down_roles_orders_reviews.sql`, the security fix.

*Without the command line:* open **SQL Editor** in the dashboard and run each file from `supabase/migrations/` one at a time, oldest first.

### 1.4 Deploy the server functions (products, cart, orders, coupons)
```
npx supabase functions deploy
```
If it complains about Docker, run `npx supabase functions deploy --use-api` instead.

### 1.5 Put the new keys in `.env`
In the dashboard: **Project Settings → API Keys → Legacy API Keys**. Copy the **anon / public** key (it starts with `eyJ`).

> Use the legacy anon key, not the newer `sb_publishable_…` key: the site sends this key to the server functions, which only accept the `eyJ…` format.

Edit `.env` in the repo:
```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...your anon key...
VITE_SUPABASE_ANON_KEY=eyJ...same anon key...
VITE_SUPABASE_PROJECT_ID=YOUR-PROJECT-REF
```
Also set `project_id = "YOUR-PROJECT-REF"` in `supabase/config.toml`. Commit and push.

This anon key is meant to be public (it is inside the website anyway). Never put the **service_role / secret** key in `.env` or anywhere in the repo.

### 1.6 Login settings
**Authentication → URL Configuration**
- **Site URL:** `https://hayaatemporium.com`
- **Redirect URLs** (add each):
  - `https://hayaatemporium.com/**`
  - `https://www.hayaatemporium.com/**`
  - `https://admin.hayaatemporium.com/**`
  - `http://localhost:8080/**` and `http://localhost:8081/**` (for testing on your computer)

If a site isn't listed here, Supabase sends its email links (confirm account, reset password) to the Site URL instead, and they won't work properly.

**Authentication → Sign In / Providers → Email:** leave **Confirm email** on. The signup page tells customers to check their inbox.

**Emails (important):** Supabase's built-in email sender only allows a few emails per hour and is meant for testing. Before launch, set up your own sender under **Authentication → Emails → SMTP Settings** (for example Resend or Brevo, both have free plans; use an address on your domain).

### 1.7 Google sign-in
1. In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. **Authorized redirect URIs:** `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
3. Copy the Client ID and Client secret into Supabase → **Authentication → Sign In / Providers → Google**, and enable it.
4. To show "Hayaat Emporium" and your logo on Google's screen: **Google Auth Platform → Branding** — app name, logo, home page, privacy policy, and your domain under authorized domains. Then submit for verification.

### 1.8 Make yourself admin
1. Sign up on the shop with your email (after Part 2), and confirm it.
2. In **SQL Editor**, run (with your email):
   ```sql
   update public.user_profiles set role = 'admin' where email = 'you@example.com';
   ```
3. Sign in at the admin portal.

Roles can only be changed this way, or by another admin. The security fix stops customers from making themselves admin.

---

## Part 2 — Cloudflare Pages: shop website

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git** → choose `shaikfareed22/HayaatHijabs`.
2. Settings:
   - Project name: `hayaat-store`
   - Production branch: `main`
   - Framework preset: **None**
   - Build command: `npm run build`
   - Build output directory: `dist`
3. **Environment variables** (Production and Preview):
   | Name | Value |
   | --- | --- |
   | `NODE_VERSION` | `20` |
   | `VITE_STORE_URL` | `https://hayaatemporium.com` |
   | `VITE_ADMIN_URL` | `https://admin.hayaatemporium.com` |

   The Supabase settings come from `.env` in the repo, so they don't need adding here.
4. **Save and Deploy.** Open the `hayaat-store.pages.dev` address it gives you and check the site loads.
5. **Custom domains → Set up a custom domain:** add `hayaatemporium.com`, then add `www.hayaatemporium.com`. Your DNS is on Cloudflare, so it connects automatically.

No redirect file is needed: Cloudflare Pages already sends links like `/products/abc` to the app.

## Part 3 — Cloudflare Pages: admin portal

Repeat Part 2 with the same repository, but:
- Project name: `hayaat-admin`
- Build command: `npm run build:admin`
- Build output directory: `dist-admin`
- Same three environment variables
- Custom domain: `admin.hayaatemporium.com`

The admin site tells search engines not to index it. Every admin action is also checked by the database, so only accounts with the admin role can see or change admin data.

**Optional extra lock (free):** Cloudflare **Zero Trust → Access → Applications → Add → Self-hosted**, domain `admin.hayaatemporium.com`, policy "Allow" for your email(s) only. Cloudflare then asks for a one-time code by email before anyone even sees the admin login page.

## Part 4 — Keep Supabase awake (Worker)

Free Supabase projects pause after about a week with no requests. This Worker makes one small request every day.

**From the dashboard (easiest)**
1. **Workers & Pages → Create → Create Worker**, name it `hayaat-supabase-keep-alive` → **Deploy**.
2. **Edit code:** replace everything with the contents of `workers/keep-alive/src/index.js` → **Deploy**.
3. **Settings → Variables and Secrets:**
   - `SUPABASE_URL` (Text) = `https://YOUR-PROJECT-REF.supabase.co`
   - `SUPABASE_KEY` (Secret) = your anon key from 1.5
4. **Settings → Trigger events → Add → Cron trigger:** `0 6 * * *` (every day at 06:00 UTC).
5. Test: open the Worker's `….workers.dev` address. It should say **Supabase is awake (HTTP 200)**.

**Or from the command line**
```
cd workers/keep-alive
# put your project URL in wrangler.toml first
npx wrangler login
npx wrangler secret put SUPABASE_KEY
npx wrangler deploy
```

## Part 5 — Test before going live

On the shop:
- [ ] Home and Shop pages show products.
- [ ] Refreshing a product page directly doesn't give a 404.
- [ ] Sign up → "Confirm your email" screen → the email link opens your domain and you're signed in.
- [ ] Sign in with an unconfirmed account → message plus a **Resend confirmation email** button.
- [ ] Forgot password → email link opens the "Set New Password" form on your domain.
- [ ] Sign in with Google → you come back to the page you started from.
- [ ] Add to cart → checkout → order confirmation, and the product's stock goes down.

On the admin portal:
- [ ] A customer account sees "No admin access".
- [ ] Your admin account sees the dashboard, products, orders, coupons, customers, analytics.
- [ ] Uploading a product image works.
- [ ] The shop's navbar shows the admin shield link only for admins.

## Part 6 — Switch off Vercel

When everything above works on your domain, delete the project in Vercel, then delete `vercel.json` from the repo.

---

## Working on your computer

```
npm install
npm run dev          # shop on http://localhost:8080
npm run dev:admin    # admin on http://localhost:8081
```

## What changed in this update

- **Separate admin portal:** `src/admin/` is its own app with its own login. The admin pages moved from `/admin/...` to the root of the admin site, and old `/admin/...` links redirect. The shop no longer contains admin code.
- **Login and signup:**
  - Google sign-in, confirmation emails and password resets now return to whichever site you're on, not the old Vercel address.
  - Signup shows "Confirm your email" instead of pretending you're signed in.
  - Signing up with an email that already exists sends you to login.
  - Expired reset links show a clear message.
  - Fixed a race that could leave a signed-in user without a profile.
  - Logins are no longer wiped when the Supabase project changes.
- **Security:** the new migration stops customers from making themselves admin, from creating orders with their own prices, and from marking their own reviews as verified. The admin email is no longer hard-coded in the website.
- **Build:**
  - `package-lock.json` is back in sync (Cloudflare's install step would have failed).
  - Removed the bun lock files so Cloudflare uses npm.
  - Added the `dev:admin`, `build:admin` and `preview:admin` scripts.
