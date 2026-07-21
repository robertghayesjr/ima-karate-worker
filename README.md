# ima-karate-worker

Cloudflare Worker that proxies the IMA Karate Webflow site and serves it at `ima.rob-hayes.com`, injecting updated content on the fly. Content changes deploy automatically on `git push` to `main` via Cloudflare Workers Builds — no Webflow custom code required.

Mirrors the `file-upload-worker` / Clientele Media pattern:

- Worker fetches the Webflow origin, runs `HTMLRewriter` to inject CSS in `<head>` and JS before `</body>`
- Injected JS rewrites `innerHTML` of existing Webflow sections to match imakarate.com
- Optional KV-hosted JS bundles at `/script/<name>` for hot-patching without redeploy

## First-time setup

### 1. Wrangler auth (one-time on your machine)

```bash
npm install
npx wrangler login
```

### 2. Configure the origin

Edit `wrangler.toml`:

```toml
[vars]
ORIGIN = "https://ima-670b18.webflow.io"
IMG_BASE = "https://cdn.jsdelivr.net/gh/robh-autods/ima-karate-assets@main/"
```

`ORIGIN` must be the Webflow-hosted URL (`.webflow.io`), **not** the public custom domain — otherwise you'll create a loop when the Worker is bound to the custom domain.

### 3. Deploy the first version

```bash
npm run deploy
```

That gives you `https://ima-karate-worker.<your-subdomain>.workers.dev`. Verify by visiting it — you should see the Webflow site with the injected content.

### 4. Bind the custom domain

In the Cloudflare dashboard:

1. Make sure `rob-hayes.com` is already on Cloudflare (it is — same zone as the Rob Hayes app)
2. Workers & Pages → `ima-karate-worker` → Settings → **Domains & Routes** → **Add Custom Domain** → `ima.rob-hayes.com`
3. Cloudflare adds the DNS record and issues an SSL cert automatically

### 5. Connect GitHub → Workers Builds (auto-deploy on push)

1. Workers & Pages → `ima-karate-worker` → Settings → **Builds** → **Connect to Git**
2. Select the `ima-karate-worker` GitHub repo, branch `main`
3. Build command: `npm install`
4. Deploy command: `npx wrangler deploy`

Every push to `main` now redeploys automatically.

## Updating content

Everything the visitor sees comes from `src/worker.js`:

- `buildStyleTag()` — CSS overrides (backgrounds, hidden template widgets, grid styles, etc.)
- `buildScriptTag()` — the client-side rewrite of hero, intro, comp team, programs, schedule, dojo kun, instructors, CTA, offer, footer, top bar

Edit → commit → push to `main`. Content is live in ~30–60 seconds.

## Optional: hot-patch bundles via KV

If you want to change the injected JS without waiting on Workers Builds:

1. Create a KV namespace: `npx wrangler kv:namespace create SCRIPTS`
2. Paste the id into `wrangler.toml` (uncomment the `[[kv_namespaces]]` block)
3. Set the upload secret: `npx wrangler secret put SCRIPT_UPLOAD_SECRET`
4. Redeploy: `npm run deploy`

Push a new bundle:

```bash
curl -X POST https://ima-karate-worker.<sub>.workers.dev/script-upload \
  -H "Content-Type: application/json" \
  -d '{"name":"ima-content.js","body":"...","secret":"..."}'
```

Fetch: `GET /script/ima-content.js`

## Health check

`GET /__worker/health` → `{ ok: true, worker: "ima-karate-worker", v: 1, origin: "..." }`
