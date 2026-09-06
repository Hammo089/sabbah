# Security posture — CAP platform

Verified against PostgreSQL 16 with all 9 migrations applied. Every result below is a real query, not an assertion.

## 1. Database (Supabase)

| Check | Result |
|---|---|
| Tables in `public` | 16 |
| Tables with RLS enabled | 16 / 16 |
| Tables with 0 policies | 0 |
| `SECURITY DEFINER` functions | 13, all pinned to `search_path=public` |
| `anon` write grant on content tables | none — `permission denied for table series` |
| `anon` read of unpublished rows | 0 rows |
| `anon` read of `drm_licenses` | `permission denied` (grant-level, before RLS) |
| `editor` read of `drm_licenses` | 0 rows |
| `editor` read of `expiring_licenses` | 0 rows |
| `editor` value of `expiring_license_count()` | 0 |

Defence is layered: table `GRANT`s first, RLS policies second, server-action role checks third.

## 2. Privilege escalation

| Attack | Result |
|---|---|
| editor sets own `role = 'super_admin'` | `ERROR: Insufficient privileges to modify role` (`guard_role_change`) |
| demote the only active super_admin | `ERROR: Refusing to remove the last active super_admin` |
| deactivate the only active super_admin | same refusal |
| delete the only active super_admin | `ERROR: Refusing to delete the last active super_admin` |

You can never lock yourself out of the panel.

## 3. Admin panel

- `app/[lang]/admin/layout.tsx` — `force-dynamic`, `revalidate = 0`, session + `STAFF_ROLES` gate on every request. No admin route is ever statically cached.
- `robots: { index: false, follow: false, nocache: true }` on the whole panel.
- 18 / 18 server actions in `settings-actions.ts`, `actions.ts` and `title-actions.ts` re-check the caller's role before touching the database — RLS is not trusted alone.
- `/drm` additionally requires `isSuperAdmin()` and redirects to `/403`.
- Every action input passes a Zod schema before it reaches Postgres.

## 4. Theme injection

Appearance colours are written into a `<style>` block. Two independent gates:

1. SQL `CHECK` constraint `site_settings_hex_colors` — `^#[0-9a-fA-F]{6}$`.
2. `components/providers/theme-vars.tsx` re-validates each value before rendering.

Verified: `#2c845c; } body { display:none } .x{` → rejected by the database. `#ff0000` → accepted.

## 5. HTTP headers (`next.config.mjs`)

- `Content-Security-Policy` — `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`, `base-uri 'self'`, `form-action 'self'`. Only YouTube, the Supabase project host and Vercel analytics are allowed as external origins.
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cross-Origin-Opener-Policy: same-origin`
- `/api/*` → `Cache-Control: no-store`, `X-Robots-Tag: noindex`

`script-src` keeps `'unsafe-inline'` because Next.js emits inline bootstrap scripts. Removing it requires per-request nonces threaded through middleware — worth doing later, not a live hole today.

## 6. Rate limiting

`lib/security/rate-limit.ts`, fixed window, keyed on `x-forwarded-for`:

- `/api/search` — 60 req / min / IP
- `/api/generate-b2b-pdf` — 10 req / min / IP
- `/api/submissions` (POST) — 5 per 10 min / IP
- `/api/submissions` (PUT, signed upload) — 8 per 10 min / IP
- `/api/assistant` — 20 req / min / IP

Counters are per lambda instance. For global counters, swap `hit()` for Upstash Redis.

## 7. Secrets

- `SUPABASE_SERVICE_ROLE_KEY` is referenced in exactly one file, `lib/supabase/server.ts`, inside `createSupabaseAdminClient()` — a server-only module. No client component imports it.
- `NEXT_PUBLIC_*` variables must be **Config**, not **Secret**, in Vercel. Secrets are write-only and cannot be inlined into the browser bundle; setting them as Secret is what caused the earlier site-wide 500.
- `CRON_SECRET` guards `/api/cron/licence-reminders`; the route returns 401 without a matching `Authorization: Bearer` header, and 503 if the service-role key is absent.

## 8. Storage

Six buckets with per-bucket policies (`0008_storage.sql`). Verified previously: `anon` upload rejected, `editor` upload to `posters` allowed, `editor` upload to `contracts` rejected. Uploads go browser → Supabase directly, so no file ever crosses a serverless body limit.

## 9. Script submissions

The page promises writers that nobody outside the company sees their material. That promise is enforced by grants and RLS, not by the UI.

| Check | Result |
|---|---|
| `anon` INSERT a submission | allowed — `INSERT 0 1` |
| `anon` SELECT any submission | `ERROR: permission denied for table script_submissions` |
| `anon` UPDATE a submission (e.g. flip status) | `ERROR: permission denied` |
| `anon` list the private bucket | `ERROR: permission denied for table objects` |
| staff SELECT | allowed — the row is returned |
| `submissions` bucket `public` flag | `f` (private) |

Notes:

- There is deliberately **no "read your own row"** policy. A submitter cannot read back what they sent, so submissions can never be enumerated from the browser — not even one at a time by guessing.
- `anon` holds INSERT only, which means `INSERT … RETURNING` is refused for the anon key. The form therefore posts to `/api/submissions`, which writes with the service-role client server-side and returns just the reference number.
- The uploaded file goes browser → Supabase Storage through a **short-lived signed upload URL** minted server-side. The bucket is private, MIME-restricted and capped at 25 MB.
- Staff downloads use a 120-second signed URL. The storage path is never sent to the browser.
- The submitter's IP is stored only as a salted SHA-256 prefix (`SUBMISSION_IP_SALT`) — enough to spot a flood, useless as personal data.
- A honeypot field returns a fake success to bots rather than telling them which check failed.

## 10. The public AI assistant

The assistant is grounded through `lib/ai/company-context.ts`, which builds its reference material with the **anon** Supabase client. That is the security control: RLS decides what the model can possibly see, so no prompt-injection phrasing can make it quote a draft title, a licence, a fee, or someone else's submission — those rows are not in its context to begin with.

On top of that, the system prompt forbids inventing dates or rights positions, forbids committing to commercial terms, forbids looking up individual submissions, and instructs it to ignore instructions embedded in a visitor's message. History is capped at 12 turns and 2000 characters per message.

## 11. Open items

1. CSP nonces to drop `'unsafe-inline'` from `script-src`.
2. Global rate limiting (Redis) if traffic grows past one lambda instance.
3. Supabase Auth: enable leaked-password protection and set OTP expiry to 1 hour in the dashboard (project-level settings, not migrations).
