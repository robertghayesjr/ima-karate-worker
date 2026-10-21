# IMA Website Studio (Admin Area)

The Madanis can manage the site themselves at **https://ima.rob-hayes.com/admin**.

## Signing in

- Password: the `ADMIN_PASSWORD` secret on the Cloudflare Worker (`ima-karate-worker`).
  Robert Hayes has the value; share it with the Madanis through a secure channel
  (not email/SMS), and change it anytime via the Cloudflare dashboard:
  Workers & Pages → ima-karate-worker → Settings → Variables and Secrets.
- Sessions last 7 days per browser. 10 failed attempts from one IP locks
  login for 15 minutes.

## What's inside

### Claude chat (left side)

Ask Claude in plain English to update the site, e.g.:

- "Add a news item about the December belt test on the 12th"
- "Change Tuesday's Youth Class to start at 5:30 instead of 6:00"
- Attach a photo of an event and ask for it to be added to the news

Claude can only save **drafts**. Nothing goes live until a person presses
**Publish** in the panel on the right. Attachments can be published as site
images with the "Use on site" flow (they get a `/img-uploads/...` URL that can
be referenced in news items).

Claude requires the `ANTHROPIC_API_KEY` secret on the Worker. Without it the
chat shows a clear "not connected" message; the panels still work.

### Content panels (right side)

Three tabs:

- **News** — the News & Events page and the home-page news cards.
- **Schedule** — the weekly class schedule.
- **Belt Test** — test dates, late-fee cutoff, fees, location, and the DocuSign
  template ID. These drive the belt-testing pages and checkout.

Workflow for News and Schedule:

1. Claude (or you) saves a **draft**.
2. **Preview** shows the draft on the real page — the live site is untouched.
3. **Publish Draft** makes it live and saves a permanent revision.
4. **Restore** on any revision brings it back as a new draft — history is never
   deleted, so you can always undo.

## Where the data lives

Everything is in the `IMA_KARATE` KV namespace:

| Key | Purpose |
| --- | --- |
| `content:published:news` / `:schedule` | live content docs |
| `content:draft:news` / `:schedule` | pending drafts |
| `content:rev:{key}:{revId}` + `content:revindex:{key}` | revision history |
| `content:asset:{id}` | published images (served at `/img-uploads/{id}`) |
| `admin:attachment:{id}` | private chat attachments (30-day TTL) |
| `admin:sess:{token}` | login sessions |
| `current` | belt-test config (dates, fees, location) |

## Technical notes

- Auth is a KV-backed session (7-day sliding expiry) gated by the
  `ADMIN_PASSWORD` secret. The legacy `ADMIN_TOKEN` in wrangler.toml is
  **not** used for the admin UI and should be rotated/retired.
- The chat calls the Anthropic Messages API server-side with tools
  (`get_doc`, `save_draft`); the API key never reaches the browser.
- Chat text and attachments are treated as untrusted input — Claude only
  acts through the validated doc tools, and publishing is always a human
  action.
- Code changes (new pages, design) still deploy through GitHub
  (`robertghayesjr/ima-karate-worker` → Cloudflare Workers Builds). The
  admin area edits **content**, not code — that boundary is intentional.
