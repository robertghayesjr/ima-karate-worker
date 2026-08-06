# DocuSign template — required tab labels

Create a DocuSign template that mirrors the paper "Kyu-testing on <date>" form. In DocuSign's template editor:

1. Add **one signer role** called `Student` (this is who Zapier will pin the recipient to)
2. Drop the following tabs onto the document (right sidebar → drag Text/Checkbox/Date onto the doc). For each, set the **Data Label** to the exact string listed below. Zapier maps by data label.

## Text tabs

| Data label | Fills with | Notes |
| --- | --- | --- |
| `salutation` | Mr./Mrs./Ms./Miss | Small text tab |
| `first_name` | Student first name | Required |
| `middle_name` | Middle name/initial | Optional |
| `last_name` | Student last name | Required |
| `age` | Age (number) | |
| `membership_number` | IMA membership # | May be empty |
| `present_belt` | e.g. "Full orange" | |
| `email` | Student/parent email | |
| `phone` | Best phone | |
| `dojo` | IMA Dojo / Rec. Center / IMA Arvada | |
| `tier_label` | Human-readable tier | e.g. "Orange/white stripe through full green belts" |
| `tier_id` | Machine tier id | e.g. `orange_green` |
| `base_amount` | Base fee (dollars) | e.g. `175.00` |
| `manual_amount` | Progress Manual add-on | `0.00` or `30.00` |
| `late_amount` | Late-fee amount | `0.00` or `50.00` |
| `total_amount` | Grand total | e.g. `205.00` |
| `wants_manual` | `Yes` / `No` | |
| `is_late` | `Yes` / `No` | |
| `test_date` | Long-form test date | e.g. `August 29, 2026` — pulled from `testDateDisplay` |
| `testing_time` | Arrival time | e.g. `9:15 AM (test starts 9:30 AM)` |
| `dojo_location` | Full address | `IMA Dojo — 1340 Main St., Louisville, CO 80027` |

## Hidden envelope metadata (used by Zap 2)

DocuSign lets you attach envelope-level custom fields via the template. Add one:

| Custom field name | Value source |
| --- | --- |
| `memberId` | Zap 1 pipes the webhook's `metadata.memberId` into it |

This is what Zap 2 reads to POST back to `/belt-testing/webhook/signed`.

## Signature + date-signed tabs

Add a **Signature** tab and a **Date Signed** tab for the Student role. These aren't in the pre-fill payload — they're captured live.

## Why every tab label matters

`beltRoutes.js → buildDocusignPayload()` sends this exact JSON to Zapier:

```json
{
  "signerEmail": "…",
  "signerName": "…",
  "testDate": "2026-08-29",
  "testDateDisplay": "August 29, 2026",
  "location": "IMA Dojo — 1340 Main St., Louisville, CO 80027",
  "tabs": {
    "salutation": "Mr.", "first_name": "Alex", "last_name": "Doe",
    "…every field above…": "…"
  },
  "metadata": { "memberId": "mem_abc123" }
}
```

If a tab label in DocuSign doesn't match a key in `tabs.*`, that field simply won't pre-fill — the envelope still sends, so it's a soft failure. If you want to rename a field, change it in **both** the DocuSign template **and** `buildDocusignPayload()` in `src/beltRoutes.js`.
