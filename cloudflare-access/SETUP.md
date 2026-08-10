# Inkception — Cloudflare Access (Locked Down URL)

Goal: restrict the live Inkception URL to the 4 allowlisted Gmail accounts.
Auth is enforced at the edge (Cloudflare Zero Trust) **before** the app loads —
no client-side password.

**Allowlist** (`cloudflare-access/allowlist.json`):
1. `successpartner10@gmail.com`
2. `sandipyashpal@gmail.com`
3. `sulaniyashpal@gmail.com`
4. `sulaniy79@gmail.com`

> **Easy mode (recommended):** use Cloudflare's built-in **One-time PIN** login
> method — users type their email, Cloudflare emails a code. This **avoids the
> Google OAuth (Client ID/Secret) step entirely**. Step-by-step: see
> `GUIDE.html` (open in a browser).

---

## Path A — Cloudflare Pages with One-time PIN (recommended, no domain, no Google setup)

### 1. Deploy the repo to Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. Pick `successpartner10/Inkception`
3. Build settings (match `package.json` + `vite.config.js`):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy → you get a `*.pages.dev` URL (e.g. `https://inkception.pages.dev`)

### 2. Enable Zero Trust (free)
- Cloudflare account home → **Zero Trust** product → pick a team name → Free plan

### 3. Create the Access application
1. **Zero Trust → Access → Applications → Add an application → Self-hosted**
2. Application domain: your `*.pages.dev` URL
3. Login methods: **One-time PIN ONLY** (turn everything else off)

### 4. Lock the policy to the 4 emails (critical)
1. In the application → **Policies → Add a policy**
2. Name: `Allowlist` · Action: **Allow**
3. Rule: **Include → Emails** → add exactly:
   - `successpartner10@gmail.com`
   - `sandipyashpal@gmail.com`
   - `sulaniyashpal@gmail.com`
   - `sulaniy79@gmail.com`
4. Save

> Critical: the email allowlist rule is what restricts access. Enabling a login
> method alone would let anyone use it. Do not skip the policy.

### 5. Test
- Open the `*.pages.dev` URL in a private window → asked for email → code emailed
- Allowlisted account → app loads · any other account → denied

---

## Path A-alt — Cloudflare Pages with Google login (original method)

Only if you specifically want Google sign-in instead of emailed codes:
1. **Zero Trust → Settings → Authentication → Login methods → Add → Google**
2. Create Google OAuth credentials at
   [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials):
   - **Create credentials → OAuth Client ID → Web application**
   - Authorized redirect URI: copy the exact URL Cloudflare shows you
   - Copy **Client ID** and **Client Secret** back into Cloudflare
3. Continue with Steps 3–5 above (login method = Google, same allowlist policy)

---

## Path B — Custom domain (stay on GitHub Pages)
1. Buy/point a domain (e.g. `inkception.app`) with a CNAME to
   `successpartner10.github.io`
2. Add the domain to Cloudflare, DNS record **Proxied** (orange cloud)
3. Repeat the Access steps using the custom domain

---

## Notes
- The app's cache-busting version tag (`<meta name="inkception-version">`,
  `window.__INKCEPTION_VERSION__`, footer) still works behind the auth wall.
- If we add PWA (service worker / manifest) later, Cloudflare Access may need a
  bypass rule for `/manifest.json` and `/sw.js` so the SW can register before
  auth completes.
- The old GitHub Pages URL stays public until you unpublish Pages in the repo
  settings (Settings → Pages → Unpublish) or delete the repo.

