# Belt Testing — Setup Guide

The belt-testing signup flow runs entirely on the Cloudflare Worker at
`ima.rob-hayes.com`. No Zapier account is needed anymore — the Worker signs
DocuSign JWTs itself and hits DocuSign's REST API directly.

## Architecture

```
Student → /belt-testing (wizard) → /belt-testing/lookup, /signup (Memberstack REST)
        → /belt-testing/checkout   (Memberstack Stripe Checkout URL)
        → Memberstack Stripe        → Success URL
        → /belt-testing/post-payment
              ├── recordBeltTestProgress(paid=true)       via Memberstack Admin API
              ├── sendBeltTestEnvelope()                  via DocuSign JWT + REST
              └── Interstitial      → user checks email, signs
DocuSign → /belt-testing/docusign-connect  (Connect webhook)
              └── recordBeltTestProgress(signed=true)
Student  → /belt-testing/thank-you (final)
```

## What's already done (as of 2026-08-11)

- ✅ KV namespace `IMA_KARATE` (id `b88e14c597dc445c8aa8061dba031e90`) wired
- ✅ KV `current` config seeded for **Aug 29, 2026**
- ✅ Worker secret `MEMBERSTACK_SECRET_KEY` set
- ✅ Worker secret `ADMIN_TOKEN` set (`wnFp8jv3U3wd-mgjb5g5f5YUg1TVYhOQAmZ4kq6r-Tk`)
- ✅ `/belt-testing`, `/belt-testing/thank-you`, `/__admin/belt-testing` live
- ✅ Direct DocuSign integration (no Zapier)

## Remaining setup (all in the DocuSign / Memberstack UIs)

### 1. Memberstack — five one-time plans

Log in to **memberstack.com → Plans → Add plan** and create these five
one-time plans with Stripe pricing:

| Tier | Amount | wrangler var |
| --- | --- | --- |
| Tiny Tiger | $60 | `MS_PLAN_TINY_TIGER` |
| White / yellow / full yellow | $135 | `MS_PLAN_WHITE_YELLOW` |
| Orange / white stripe → full green | $175 | `MS_PLAN_ORANGE_GREEN` |
| Purple / white stripe → blue | $255 | `MS_PLAN_PURPLE_BLUE` |
| Brown belt (all levels) | $365 | `MS_PLAN_BROWN` |

**How to configure CC surcharge (3%):** Memberstack doesn't do dynamic
surcharges automatically. Two options:

- Bake it into the plan price (e.g. Tiny Tiger $60 base + a second $61.80
  plan for CC users). Cleaner UX; the wizard picks the right plan.
- Or use one plan and let Stripe handle it via a coupon/discount that the
  Worker attaches (`stripeMetadata` on the plan).

**After creating plans**, paste the plan IDs (they look like `pln_ck…`) into
`wrangler.toml` under `[vars]` and push — Workers Builds will redeploy.

### 2. DocuSign — one template + one Connect config + one integration key

**a) Template**

Log in to **DocuSign → Templates → New Template**. Upload
`docs/kyu-belt-testing-template.pdf` (a cleaned-up version of the paper form).
Then:

- Add one signer role called `Student`.
- Drop **Text** tabs on the doc with these **Data Labels** (they must be exact
  — the Worker maps by data label):

  ```
  salutation, first_name, middle_name, last_name, age,
  membership_number, present_belt, email, phone, dojo,
  tier_label, tier_id, base_amount, manual_amount, late_amount,
  total_amount, wants_manual, is_late, test_date, testing_time,
  dojo_location
  ```

- Add one **Signature** tab and one **Date Signed** tab for the Student.
- In the template's **Envelope Custom Fields** section, add a *hidden* text
  field called `memberId` (leave the value blank — the Worker sets it per
  envelope).

Save. Copy the **Template ID** (looks like a UUID) — you'll need it for the
Worker secret `DOCUSIGN_TEMPLATE_ID`.

**b) Integration key (JWT auth)**

DocuSign → Admin → **Apps and Keys** → **Add App and Integration Key**:

1. Name: "IMA Karate Worker"
2. Auth: enable **JWT Grant** and generate an RSA keypair; download the
   private key (`.pem`).
3. Add **Redirect URI**: `https://ima.rob-hayes.com/belt-testing/docusign-consent-callback`
   (this URL is only used once to grant consent — see below).
4. Copy the **Integration Key** (client ID, UUID) and the **API Username**
   (the User GUID for you as the sending user).

**c) One-time consent**

The very first JWT request will fail with `consent_required`. Grant consent
once by visiting (replace `INTEGRATION_KEY` with yours):

```
https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=INTEGRATION_KEY&redirect_uri=https://ima.rob-hayes.com/belt-testing/docusign-consent-callback
```

Approve. The Worker will use `account.docusign.com` (prod) by default; if
you're testing against the DocuSign demo env, set `DOCUSIGN_OAUTH_HOST` to
`account-d.docusign.com`.

**d) Set the 5 DocuSign Worker secrets**

Via Cloudflare dashboard → Workers → ima-karate-worker → **Settings →
Variables → Secrets → Add secret**, or `wrangler secret put`:

| Secret | Value |
| --- | --- |
| `DOCUSIGN_INTEGRATION_KEY` | UUID from step b |
| `DOCUSIGN_USER_GUID` | API Username (UUID) from step b |
| `DOCUSIGN_ACCOUNT_ID` | `6b65537a-a0f5-4bd6-802d-1daa34fe38d8` |
| `DOCUSIGN_TEMPLATE_ID` | UUID from step a |
| `DOCUSIGN_RSA_PRIVATE_KEY` | Full PEM (including `BEGIN RSA PRIVATE KEY`/`END` lines) |
| `DOCUSIGN_BASE_URI` | `https://na4.docusign.net` |

**e) DocuSign Connect webhook**

DocuSign → Admin → **Connect → Add Configuration → Custom**:

- URL: `https://ima.rob-hayes.com/belt-testing/docusign-connect`
- Format: JSON
- Event: enable **Envelope Signed/Completed** at minimum.
- In **Include Data** enable *Custom Fields* so the `memberId` we attach at
  send-time flows back to the Worker.
- (Optional) In **HMAC Signatures** generate a secret and paste it into a new
  Worker secret `DOCUSIGN_CONNECT_HMAC_KEY`. The Worker will verify signatures
  automatically. Skip this to disable verification.

Save.

### 3. Reconfiguring the test date later

```bash
curl -X POST https://ima.rob-hayes.com/__admin/belt-testing \
  -H "Authorization: Bearer wnFp8jv3U3wd-mgjb5g5f5YUg1TVYhOQAmZ4kq6r-Tk" \
  -H "Content-Type: application/json" \
  -d '{"testDate":"2026-10-24","cutoffDate":"2026-10-22"}'
```

Only the fields you pass are updated. Times, location, fees, and the
address use the last-saved values.

### 4. Testing end-to-end

- Visit `https://ima.rob-hayes.com/belt-testing` → complete the wizard with a
  test email you control (or `noreply+test@ima.karate`). Select a tier.
- You should be forwarded to Memberstack Stripe Checkout for the matching
  plan. Complete with a test card.
- After payment, the Worker POSTs to Memberstack (mark paid) and calls
  DocuSign to create + send the envelope. The email arrives at the address you
  put in the form.
- Sign in DocuSign. The Connect webhook fires and flips `belt-test-signed` on
  the Memberstack profile.
- Return to `/belt-testing/thank-you` (the interstitial's "I've signed"
  button).

## Troubleshooting

- `500 MEMBERSTACK_SECRET_KEY is not set` → secret missing; re-check the
  dashboard. Currently set.
- `500 DocuSign consent required. Grant consent once by visiting…` → the
  error message includes the consent URL. Follow it once, then retry.
- `500 DocuSign create-envelope failed (401): …` → access token was rejected;
  the Worker auto-invalidates its cached token on 401. Second try should
  succeed after re-signing JWT.
- `500 DOCUSIGN_TEMPLATE_ID missing` → template ID env var not set.
- Envelope arrives but tabs are empty → the Data Labels on the template
  don't match. Compare against the list in step 2a above.
