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

`GET /__worker/health` → `{ ok: true, worker: "ima-karate-worker", v: 2, origin: "..." }`

---

## Belt-testing signup flow (`/belt-testing`)

Self-contained signup page + wizard that mirrors the paper Kyu-testing application. Pipeline:

1. User picks a tier + fills the form on `/belt-testing`
2. `POST /belt-testing/lookup` — Memberstack Admin API searches by email, then by first+last name
3. If no match, `POST /belt-testing/signup` creates a Memberstack member
4. `POST /belt-testing/checkout` — stashes the application in KV keyed by memberId and returns a Memberstack Stripe-Checkout URL for the belt-tier plan
5. Memberstack redirects back to `GET /belt-testing/post-payment?memberId=…` — which flips `belt-test-paid=true` and fires the Zapier webhook to generate a pre-filled DocuSign envelope
6. User signs the DocuSign envelope (emailed to them). A DocuSign "Envelope Completed" trigger in Zapier hits `POST /belt-testing/webhook/signed` with `{ memberId, envelopeId }` — we flip `belt-test-signed=true`
7. User lands on `/belt-testing/thank-you`, which reads the test date from KV so it stays accurate across tests

### One-time setup

**A. Create the KV namespace** (holds the reconfigurable test-date config):

```bash
npx wrangler kv:namespace create BELT_TEST
```

Paste the returned id into `wrangler.toml` (replace `REPLACE_WITH_BELT_TEST_KV_ID`).

**B. Set secrets:**

```bash
npx wrangler secret put MEMBERSTACK_SECRET_KEY     # Memberstack Admin API secret (sk_…)
npx wrangler secret put ZAPIER_DOCUSIGN_HOOK_URL   # Zapier catch-hook that fires your DocuSign envelope Zap
npx wrangler secret put ADMIN_TOKEN                # random string — protects /__admin/belt-testing
```

**C. Create 5 one-time Memberstack plans** (one per belt tier) and paste each plan ID into `wrangler.toml`:

| Tier | Price | `wrangler.toml` var |
|---|---|---|
| Tiny Tiger | $60 | `MS_PLAN_TINY_TIGER` |
| White/yellow | $135 | `MS_PLAN_WHITE_YELLOW` |
| Orange/green | $175 | `MS_PLAN_ORANGE_GREEN` |
| Purple/blue | $255 | `MS_PLAN_PURPLE_BLUE` |
| Brown | $365 | `MS_PLAN_BROWN` |

**D. Configure Zapier:**

- **Zap 1: Create envelope** — trigger: Catch Hook. Action: DocuSign → Create Envelope From Template. Map `tabs.*` from the webhook payload to the matching template tab labels (see `buildDocusignPayload()` in `src/beltRoutes.js` for the full field list). Set the DocuSign "date of test" tab to `{{testDateDisplay}}`.
- **Zap 2: Mark signed** — trigger: DocuSign → Envelope Completed. Action: Webhooks by Zapier → POST to `https://ima.rob-hayes.com/belt-testing/webhook/signed` with body `{ "memberId": "{{metadata.memberId}}", "envelopeId": "{{envelopeId}}" }`.

**E. Update the belt-test date without a deploy:**

```bash
curl -X POST https://ima.rob-hayes.com/__admin/belt-testing \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testDate": "2026-10-24",
    "testDateDisplay": "October 24, 2026",
    "testDay": "Saturday",
    "lateFeeCutoff": "2026-10-22",
    "applicationCutoff": "2026-10-22"
  }'
```

`GET /__admin/belt-testing` (with the same bearer token) returns the current config.

### DocuSign template setup

Add these tab labels to your DocuSign template so Zapier can pre-fill them:

`salutation`, `first_name`, `middle_name`, `last_name`, `age`, `membership_number`, `present_belt`, `email`, `phone`, `dojo`, `tier_label`, `tier_id`, `base_amount`, `manual_amount`, `late_amount`, `total_amount`, `wants_manual`, `is_late`, `test_date`, `testing_time`, `dojo_location`.

### Memberstack custom fields written by the worker

| Field | Value |
|---|---|
| `belt-test-paid` | `true` after Stripe checkout success |
| `belt-test-signed` | `true` after DocuSign envelope completed |
| `belt-test-tier` | tier id (e.g. `orange_green`) |
| `belt-test-date` | ISO date (e.g. `2026-08-29`) |
| `metaData.docusignEnvelopeId` | envelope UUID |
| `metaData.beltTestApplication` | full JSON snapshot of the form |
