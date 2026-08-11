# Syllis V2 — Demo Build

This is a demo-first Syllis build designed to be easy to turn into the real product later.

## Run

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## Important routes

- `/` — main Syllis demo
- `/discover` — catalogue + URL style filters
- `/pricing` — user pricing first, brand pricing second, ad pricing
- `/waitlist` — demo brand waitlist form
- `/brands` — mock brands
- `/collections` — mock collections
- `/dev` — developer/demo control panel
- `/search` — working client-side search
- `/product/[slug]` — product detail
- `/saved` — saved demo page
- `/profile` — user demo profile

## Where to edit things

Most demo content lives in:

`lib/data.ts`

Add/remove products in `products`.
Add/remove brands in `brands`.
Add/remove ads in `ads`.
Change user plans in `userPlans`.
Change seller plans in `brandPlans`.
Change ad prices in `adPricing`.

## Turning this into the real app

Recommended next steps:

1. Replace `lib/data.ts` with Supabase queries.
2. Add Supabase Auth for users and brands.
3. Create separate user and brand dashboard layouts.
4. Add Stripe subscriptions for Free/Early and Starter/Growth/Premium.
5. Add a real waitlist table.
6. Add product/brand moderation before publishing.
7. Add an ad inventory table with placement, dates, price and renewal multiplier.
8. Add reservation inventory so Early members can reserve only a capped percentage of each drop.
9. Move image URLs to Supabase Storage or another image CDN.

## Demo assumptions

The forms currently simulate success locally. Nothing is permanently stored.
The ad cards are intentionally visible so you can judge how sponsored placements feel.
The `/dev` page is a visual development panel, not a secure production admin panel.
