# Cedars Art Production — Master Project Structure

```
cedars-art-production/
├── app/
│   ├── globals.css                        # Design tokens (light + dark), grain/vintage utilities
│   ├── [lang]/                            # ROOT LAYOUT lives here (locale-scoped <html dir>)
│   │   ├── layout.tsx                     # ✅ D3 — fonts, ThemeProvider, dynamic SEO, JSON-LD
│   │   ├── not-found.tsx
│   │   ├── 403/page.tsx                   # RBAC rejection page
│   │   │
│   │   ├── (site)/                        # ── PUBLIC MARKETING + VOD ───────────────
│   │   │   ├── layout.tsx                 # Header / NewsTicker / Footer (Server)
│   │   │   ├── (home)/
│   │   │   │   ├── page.tsx               # Server: fetch featured slider + rails
│   │   │   │   └── loading.tsx
│   │   │   ├── catalog/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [type]/page.tsx        # /catalog/series | /catalog/movies
│   │   │   ├── series/[slug]/page.tsx     # generateMetadata + generateStaticParams
│   │   │   ├── movies/[slug]/page.tsx
│   │   │   ├── watch/[episodeId]/page.tsx # DRM player shell
│   │   │   ├── legacy/page.tsx            # "Our Story" + 70th anniversary player
│   │   │   ├── news/page.tsx
│   │   │   ├── contact/page.tsx
│   │   │   └── b2b/
│   │   │       ├── page.tsx               # Public licensing landing
│   │   │       └── (protected)/
│   │   │           └── licensing/page.tsx # Gated: b2b_client + PDF download CTA
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   └── admin/                         # ── ADMIN PANEL ──────────────────────────
│   │       ├── layout.tsx                 # ✅ D4 — session + RBAC gate (Server)
│   │       └── (dashboard)/
│   │           ├── actions.ts             # ✅ D4 — 'use server' mutations
│   │           ├── page.tsx               # KPI overview
│   │           ├── series/
│   │           │   ├── page.tsx           # Data table + FeaturedSliderSwitch
│   │           │   └── [id]/page.tsx      # Editor (i18n tabs: AR / EN / FR)
│   │           ├── movies/page.tsx
│   │           ├── programs/page.tsx
│   │           ├── episodes/page.tsx
│   │           ├── drm/page.tsx           # super_admin only
│   │           ├── legacy/page.tsx
│   │           ├── ticker/page.tsx
│   │           ├── users/page.tsx         # super_admin only
│   │           └── settings/page.tsx
│   │
│   ├── api/                               # ── ROUTE HANDLERS (locale-agnostic) ─────
│   │   ├── generate-b2b-pdf/route.ts      # ✅ D5 — pdf-lib catalogue
│   │   ├── auth/callback/route.ts         # Supabase PKCE exchange
│   │   ├── drm/license/route.ts           # Widevine/FairPlay proxy
│   │   ├── revalidate/route.ts            # Supabase webhook → ISR purge
│   │   └── og/route.tsx                   # Edge runtime OG image
│   │
│   ├── sitemap.ts                         # Multilingual sitemap + hreflang
│   └── robots.ts
│
├── components/
│   ├── ui/                                # shadcn/ui primitives
│   │   ├── switch.tsx  label.tsx  sonner.tsx  button.tsx  dialog.tsx  table.tsx …
│   ├── site/
│   │   ├── hero/
│   │   │   ├── split-hero.tsx             # Server shell
│   │   │   ├── hero-copy.tsx              # Client — Framer Motion staggered serif
│   │   │   └── poster-marquee.tsx         # Client — infinite masonry columns
│   │   ├── header.tsx  footer.tsx  news-ticker.tsx
│   │   ├── media-card.tsx  media-rail.tsx
│   │   ├── legacy-player.tsx              # 70th anniversary cinematic player
│   │   ├── theme-toggle.tsx
│   │   └── locale-switcher.tsx
│   ├── motion/
│   │   ├── reveal.tsx                     # whileInView "bottom coming up"
│   │   ├── parallax.tsx                   # useScroll + useTransform
│   │   └── stagger.tsx
│   ├── admin/
│   │   ├── admin-sidebar.tsx  admin-topbar.tsx
│   │   ├── featured-slider-switch.tsx     # ✅ D4 — optimistic Switch
│   │   └── data-table/…
│   └── providers/
│       └── theme-provider.tsx             # next-themes wrapper
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                      # RLS-scoped SSR client + admin client
│   │   ├── client.ts                      # Browser client
│   │   └── middleware.ts                  # Cookie refresh for middleware
│   ├── auth/rbac.ts                       # getCurrentProfile / isStaff / isSuperAdmin
│   ├── pdf/b2b-catalog.ts                 # ✅ D5 — pdf-lib renderer
│   ├── seo/metadata.ts                    # Canonicals + hreflang + OG
│   └── utils.ts                           # cn() + t() jsonb localizer
│
├── i18n/
│   ├── config.ts                          # locales, direction, OG locale
│   ├── get-dictionary.ts                  # server-only lazy loader
│   └── dictionaries/{ar,en,fr}.json
│
├── types/database.types.ts                # supabase gen types output
├── hooks/                                 # use-media-query, use-scroll-direction …
├── supabase/
│   ├── config.toml
│   ├── migrations/0001_init.sql           # ✅ D2 — schema + RLS
│   └── seed.sql
├── public/{fonts,logo.png,favicon.ico}
├── middleware.ts                          # ✅ D3 — /ar /en /fr + session refresh
├── next.config.mjs   tailwind.config.ts   postcss.config.mjs
├── tsconfig.json     components.json      .env.example
└── package.json
```

## Architectural rules

| Rule | Enforcement |
|---|---|
| Root layout is `app/[lang]/layout.tsx` | No `app/layout.tsx` exists — every path is locale-prefixed by `middleware.ts` |
| Data fetching is Server-only | `lib/supabase/server.ts` imports `server-only`; Client Components never query Supabase directly |
| Mutations go through Server Actions | `app/[lang]/admin/(dashboard)/actions.ts` — Zod-validated, role-checked, RLS-backed |
| `'use client'` sits at leaves | Motion, switches, toggles. Layouts/pages stay Server Components |
| Locale never enters `/api` | Route handlers take `?lang=` — keeps them cacheable and locale-agnostic |
| Secrets never cross the boundary | `SUPABASE_SERVICE_ROLE_KEY` is only read inside `lib/supabase/server.ts` |
