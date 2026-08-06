# Belt-testing manual setup

Everything the automated `scripts/setup-belt-testing.sh` cannot do — these all need a human logged into their respective dashboards.

---

## 1. Memberstack — 5 one-time plans + Admin API key

**A. Get the Admin API secret**

1. Log in to https://app.memberstack.com
2. Pick the IMA Karate app
3. Sidebar → **Developers** → **API Keys**
4. Copy the **Secret Key** (starts with `sk_`) — this is `MEMBERSTACK_SECRET_KEY`

**B. Create five one-time payment plans**

Sidebar → **Plans** → **+ Add Plan**. Configure each as **one-time**, add a Stripe price, and copy the resulting plan id (`pln_…`) into `wrangler.toml`.

| Plan name (visible to Members) | Price | Stripe product name | `wrangler.toml` var |
| --- | --- | --- | --- |
| Belt Test — Tiny Tiger | $60.00 | `ima-belt-test-tiny-tiger` | `MS_PLAN_TINY_TIGER` |
| Belt Test — White/Yellow | $135.00 | `ima-belt-test-white-yellow` | `MS_PLAN_WHITE_YELLOW` |
| Belt Test — Orange/Green | $175.00 | `ima-belt-test-orange-green` | `MS_PLAN_ORANGE_GREEN` |
| Belt Test — Purple/Blue | $255.00 | `ima-belt-test-purple-blue` | `MS_PLAN_PURPLE_BLUE` |
| Belt Test — Brown | $365.00 | `ima-belt-test-brown` | `MS_PLAN_BROWN` |

**For each plan**, on the plan detail page:
- **Redirect after success** → `https://ima.rob-hayes.com/belt-testing/post-payment`
- **Redirect after cancel** → `https://ima.rob-hayes.com/belt-testing?cancel=1`
- **Metadata** → add `belt_tier` = `tiny_tiger` (etc., matching the id in `beltConfig.js`)

**C. Custom fields to create on the Member schema**

Sidebar → **Members** → **Custom Fields** → **+ Add Field**. All are optional booleans / strings; the Worker writes to them by kebab-case slug.

| Slug | Type |
| --- | --- |
| `first-name` | Short text |
| `last-name` | Short text |
| `phone` | Short text |
| `belt-test-paid` | Boolean |
| `belt-test-signed` | Boolean |
| `belt-test-tier` | Short text |
| `belt-test-date` | Short text |

**D. Paste plan IDs into wrangler.toml + redeploy**

```bash
# Edit wrangler.toml, then:
npx wrangler deploy
```

---

## 2. Zapier — two Zaps

Both Zaps live in your existing Zapier account. Create a new Zap for each.

### Zap 1: "IMA Belt Test → Create DocuSign envelope"

- **Trigger**: **Webhooks by Zapier → Catch Hook**
  - Copy the resulting hook URL — this is `ZAPIER_DOCUSIGN_HOOK_URL` (paste into the setup script when prompted, or `npx wrangler secret put ZAPIER_DOCUSIGN_HOOK_URL`).
  - To test, run the setup script through checkout once, or POST any of the sample payloads in `docs/sample-docusign-payload.json`.
- **Action**: **DocuSign → Create Envelope From Template**
  - **Template**: pick your IMA belt-test waiver template (create/upload it if you haven't — the fields are listed in [`docusign-template-fields.md`](./docusign-template-fields.md))
  - **Recipient (Signer 1)**:
    - Name → `signerName` from webhook
    - Email → `signerEmail` from webhook
  - **Custom fields / Text tabs**: map each entry under the webhook's `tabs.*` object to the DocuSign tab with the same label. Zapier's UI lets you pick each tab and drop the matching `tabs.first_name`, `tabs.last_name`, etc. from the trigger sample.

### Zap 2: "DocuSign completed → Mark IMA member signed"

- **Trigger**: **DocuSign → Envelope Completed**
  - Filter on the template id from Zap 1 (so it fires only for belt-testing envelopes).
- **Action**: **Webhooks by Zapier → POST**
  - **URL**: `https://ima.rob-hayes.com/belt-testing/webhook/signed`
  - **Payload Type**: `json`
  - **Data**:
    - `memberId` → the value of the envelope's custom field `memberId` (Zap 1 embeds it in the envelope's metadata)
    - `envelopeId` → the envelope's ID
    - `signedAt` → the envelope's completed date

---

## 3. DocuSign template

See [`docusign-template-fields.md`](./docusign-template-fields.md) for the exact tab labels to add. Every tab label in that file has to exist on the template or Zapier's field-mapping picker won't show it.

---

## 4. Re-configuring the belt-test date without a deploy

When the next test is scheduled, run:

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

Both the landing page and the DocuSign envelope payload will pick up the new date immediately.
