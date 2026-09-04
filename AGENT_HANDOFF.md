# Syllis agent handoff

Give this file to the next coding agent. It is the source of truth for where the work is.

**Repo:** `/Users/oliverday/Desktop/syllis-v2 live`  
**Product:** Syllis — independent fashion discovery  
**Owner:** Oliver Day (`oliverday015@gmail.com`)  
**Visual lock:** Colour look + dark theme is the **final product style**. Studio look is a header toggle, not a second website.

Ignore as sources of truth: `PersonalProjects/syllis`, older `Desktop/syllis-v2`, HTML prototypes in Downloads. Mivo is a different product.

---

## Run

```bash
cd "/Users/oliverday/Desktop/syllis-v2 live"
npm install
npm run dev    # http://localhost:3000 — this Mac often needs unsandboxed / all permissions
npm run build
```

`.env.local` is gitignored. Do not commit secrets.

---

## Shared Supabase project (important)

This is **not** a dedicated Syllis database. Other apps already live in the same project (`wgqclbcubudptljjknik`).

- All Syllis tables are prefixed: `syllis_profiles`, `syllis_saved_items`, `syllis_analytics_events`, `syllis_reservations`, `syllis_analytics_layouts`, `syllis_applications`, `syllis_reports`, `syllis_ledger`, `syllis_stylist_payouts`, `syllis_brands`, `syllis_products`, `syllis_ads`, `syllis_ad_bookings`, `syllis_stripe_prices`, `syllis_analytics_resets`.
- Table names in code: `lib/tables.ts` (`T.profiles`, etc.). Never query bare `profiles` / `saved_items`.
- `supabase/schema.sql` creates only `syllis_*` tables. Safe to re-run. Do **not** alter the other app’s `public.profiles`.
- Signup used to fail with `Database error saving new user` because an old `auth.users` trigger wrote into the other `profiles` table. Fix: `supabase/fix-auth-signup.sql` (drops custom auth-user triggers, wraps inserts so they cannot block Auth).

Admin is **not** hardcoded. `ADMIN_EMAIL` in `.env.local` must match the signup email. Bootstrap sets `role = admin`.

---

## Env

```
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_… is fine
SUPABASE_SERVICE_ROLE_KEY=              # required for admin list-all and Stripe webhook ad writes
ADMIN_EMAIL=oliverday015@gmail.com
STRIPE_SECRET_KEY=                      # or STRIPE_RESTRICTED_KEY
STRIPE_WEBHOOK_SECRET=
```

Price IDs are optional. Admin → **Payments** → Create Syllis products in Stripe writes `syllis_stripe_prices`.

Paste `supabase/payments.sql` (or the payments block at the end of `schema.sql`) if bookings/prices tables are missing.

Webhook URL: `/api/stripe/webhook`. Events: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`. Local: `stripe listen --forward-to localhost:3000/api/stripe/webhook`. Enable Customer Portal in the Stripe Dashboard. Do not enable `automatic_tax` until there is a tax registration.

---

## Product behaviour

| Piece | Where | Notes |
|---|---|---|
| Looks | `lib/look.ts` | `DEFAULT_LOOK = "colour"`. localStorage + cookie `syllis-look`. |
| Theme | `components/theme-provider.tsx` | `defaultTheme="dark"`. |
| Landing | `/` | Pick look, enter `/home`. |
| Catalogue | `lib/catalogue.ts`, `syllis_brands` / `syllis_products` / `syllis_ads` | Public pages read **live** rows only. Hardcoded demo lives in `lib/data.ts` as `demo*` and is loaded only if admin seeds it. |
| Auth | Supabase SSR | `lib/supabase/{client,server,middleware,service}.ts` |
| Profile create | `POST /api/account/bootstrap` | Server only. Never client-upsert `role`. Idempotent. Requires terms acceptance for new rows. |
| Signup | `components/signup-form.tsx` | Shopper / brand / stylist. Required Terms + Privacy checkbox. Legal pages `/terms` `/privacy` (`lib/legal.ts`). |
| Roles | shopper, brand, stylist, admin | Admin only via `ADMIN_EMAIL`. |
| Plans | `lib/plans.ts` | Free, Early £4, Starter £12, Growth £29, Premium £59 (placeholders). |
| Founding year | `lib/founding.ts` | Month 1 free, then 90 / 75 / 50 / 25% off, then full price. Stripe applies **current band only**. |
| Stylist cut | `STYLIST_PLATFORM_CUT = 0.05` | `POST /api/admin/payouts`. |
| Middleware | `lib/supabase/middleware.ts` | Skips Auth network if no `sb-*-auth` cookie. |
| Table map | `lib/tables.ts` | Prefix `syllis_`. |

**Security:** do not restore client `profiles.upsert` of role. Service role is required for admin list-all and test-brand creation.

---

## Admin (`/admin`)

Gated by `requireAdmin()`. UI: `components/admin-console.tsx`. Data: `GET /api/admin/overview`.

Tabs: Overview, **Payments**, Catalogue, People, Applications, Reports, Stylists, **Test lab**.

**Payments:** `components/admin-payments.tsx`. Data: `GET/POST /api/admin/payments`. Creates the four monthly Stripe products, comps a test ad without charging, lists bookings and ledger. Checkout for plans and ads lives on Syllis (`/api/stripe/checkout`), not a Stripe Dashboard app.

**Catalogue:** `components/admin-catalogue.tsx`. Data: `GET/POST /api/admin/catalogue`. Tables: `syllis_brands`, `syllis_products`, `syllis_ads`. Public site only shows `live = true` rows. Demo Unsplash pack is **off by default** — load it from Catalogue if you need it, then Hide / Delete at will. Seed fakes by niche (count slider + optional test ads). Add real brands/products/ads with image URLs. Removing a brand cascades its products. Ad placements: All, Brand, Drop, each niche.

If Catalogue says tables are missing: paste the Catalogue section from `supabase/schema.sql` into the Supabase SQL editor (safe to re-run).

**Overview chart reset:** pick a date range and hide those events. Restore undoes that batch. Does not touch income or accounts. If the panel asks for SQL: paste `supabase/analytics-reset.sql`.

**Overview charts:**
- Month + all-time income stay large and always visible.
- **Modules** only show/hide panels (saved in `localStorage` key `syllis-admin-layout`).
- **Activity chart** owns bar / line / area and metric income / signups / views. Those controls must not change other panels. Prior-window overlay is dashed, not a second global chart type.
- **Accounts by role** is always its own donut (shopper / brand / stylist only — **admin is excluded** so it is not mistaken for income).
- **Income sources** is always its own donut of ledger sources. Empty until Stripe or a stylist payout.
- Extra operator modules (independent display modes on each): overlay (composed / stacked / table), funnel, heatmap / weekday / hourly, rates, event mix radar, plan mix, verification pipeline, brand activity. Range 7 / 30 / 90 applies to event analytics only.
- People: search + role filter, verify / suspend / founding, plan buttons, and **Remove** (deletes the Auth user; not for admin).

Do not re-introduce a global chart-type that switches mix/sources between pie and list.

**Brand analytics fidelity** (`lib/plans.ts` `entitlements.fidelity`):
- **Starter (`plain`)**: written counts + crude CSS bar log. No date range, no chart switcher.
- **Growth (`basic`)**: stat cards, bar or line, 7/30/90, pick up to 6 widgets, ranked top products.
- **Premium (`advanced`)**: builder, stacked/area/donut/composed, funnel, heatmap, rates, radar, vs-prior comparison, CSV export.

Admin accounts always receive Premium entitlements (`profileEntitlements`).

**Test lab:** `POST /api/admin/test-brand` uses Auth admin + service role, creates a verified founding brand (Gmail plus-alias from the admin email), returns email + password. Test in a **private window**; keep admin logged in in the original window.

---

## How Oliver tests brands

1. Stay logged in as admin on `/admin`.
2. Catalogue → load demo, seed fakes, or add a real brand. Hide/Remove anything you do not want public.
3. Test lab → Create test brand → copy credentials.
4. Private window → `/login` → `/studio`.
5. On admin People, set the brand to Starter / Growth / Premium and refresh studio to see each analytics tier.
6. Or: private window `/signup?role=brand` → admin Applications → Approve → `/studio`.

Studio is locked until `verification_status === "verified"`.

---

## Still demo / next

- Brand self-serve product CMS is not built (admin lists for them via Catalogue).
- No stylist booking marketplace.
- Founding Stripe coupons do not auto-roll through the full year.
- Events/reservations fall back to memory if `syllis_*` RLS fails.
- Drops still use the old hardcoded drop windows, and only appear if those product ids are live.
- Speed: `next dev` compiles each route once; production `next start` is faster.

Suggested next: brand listing UI in Studio; stylist directory with reviews.

Help: `/help` is role-aware. Shoppers/brands/stylists get “you” copy. Operator (admin, Stripe keys, Test lab, Payments) is admin-only.

Ads on the public site go to the **product** (or brand) they promote, not to Pricing. Pricing `#advertising` is for brands buying slots. Book from Studio. Caps: All 3, niche 1, brand 2, drop 2. Renewals are +45% for 4 steps, then the price locks. Surfaces: Home All, Discover niche vs All, Brands + Home brand strip, Drops.

**Signing real brands:** you can start a **tiny founding cohort** now (concierge: they apply, you approve, you add their pieces in Catalogue with real photos). Do not open a wide outreach until Studio can take their own products and the public index has real images rather than Unsplash fakes.

Keep Colour + dark, accounts in the database, admin as a real operator console.
