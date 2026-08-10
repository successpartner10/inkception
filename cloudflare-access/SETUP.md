# Inkception — Cloudflare Access (Locked Down URL)

Goal: restrict the live Inkception URL to the 4 allowlisted Gmail accounts.
Auth is enforced at the edge (Cloudflare Zero Trust) **before** the app loads —
no client-side password.

**Allowlist** (`cloudflare-access/allowlist.json`):
1. `successpartner10@gmail.com`
2. `sandipyashpal@gmail.com`
3. `sulaniyashpal@gmail.com`
4. `sulaniy79@gmail.com`

---

## Path A — Cloudflare Pages (recommended, no domain needed)

> GitHub Pages can't be locked down with Cloudflare (we don't own
> `successpartner10.github.io`). Cloudflare Pages gives us our own `*.pages.dev`
> domain that Cloudflare can protect.

### 1. Deploy the repo to Cloudflare Pages
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
2. Pick `successpartner10/Inkception`
3. Build settings (match `package.json` + `vite.config.js`):
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy → you get `https://inkception.pages.dev` (or similar)

### 2. Add Google as a login method
1. **Zero Trust → Settings → Authentication → Login methods → Add → Google**
2. Create the Google OAuth credentials at
   [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials):
   - **Create credentials → OAuth Client ID → Web application**
   - Authorized redirect URI: copy the exact URL Cloudflare shows you
   - Copy the **Client ID** and **Client Secret** back into Cloudflare
3. Save

### 3. Create the Access application
1. **Zero Trust → Access → Applications → Add an application → Self-hosted**
2. Application domain: your `*.pages.dev` URL
3. Login methods: **Google only** (deselect everything else)

### 4. Lock the policy to the 4 emails
1. In the application → **Policies → Add a policy**
2. Name: `Allowlist` · Action: **Allow**
3. Rule: **Include → Emails** → add exactly:
   - `successpartner10@gmail.com`
   - `sandipyashpal@gmail.com`
   - `sulaniyashpal@gmail.com`
   - `sulaniy79@gmail.com`
4. Save

> Critical: the email allowlist rule is what restricts access. Selecting
> Google alone would let ANY Gmail account in.

### 5. Test
- Open the `*.pages.dev` URL in a private window → expect "Sign in with Google"
- Allowlisted account → app loads
- Any other account → Cloudflare access-denied page

---

## Path B — Custom domain (stay on GitHub Pages)
1. Buy/point a domain (e.g. `inkception.app`) with a CNAME to
   `successpartner10.github.io`
2. Add the domain to Cloudflare, DNS record **Proxied** (orange cloud)
3. Repeat Steps 2–5 above using the custom domain

---

## Notes
- The app's cache-busting version tag (`<meta name="inkception-version">`,
  `window.__INKCEPTION_VERSION__`, footer) still works behind the auth wall.
- If we add PWA (service worker / manifest) later, Cloudflare Access may need a
  bypass rule for `/manifest.json` and `/sw.js` so the SW can register before
  auth completes.
