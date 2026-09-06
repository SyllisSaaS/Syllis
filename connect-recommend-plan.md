## Recommended Connect integration

### A. Account configuration
Accounts API: `/v2/core/accounts`
Legacy account `type`: not used
Dashboard: Express (lightweight view for sellers)
Fee collection: your platform manages pricing
Negative balance liability: your platform

Syllis is a marketplace: shoppers check out on Syllis, Syllis takes a cut, and the rest goes to the brand after they ship. Express keeps brands out of full Stripe (no pasted keys). Platform-managed pricing and platform negative-balance liability are required for this Express + hold-and-release setup.

Each connected account needs recipient configuration (`configuration.recipient`) with `stripe_transfers` on `stripe_balance` requested, so the account can receive transfers from the platform. Marketplace connected accounts should NOT request merchant configuration or `card_payments` capability — this is unnecessary and causes longer onboarding.

### B. Charge pattern: separate charges and transfers
The customer pays Syllis. Funds sit on the Syllis Stripe balance until the brand marks the order shipped (tracking required). Then Syllis creates a transfer for the brand’s share. Destination charges cannot hold funds, so they are the wrong fit here.

### C. Brand onboarding flow
Onboarding method: embedded

Embedded onboarding stays inside Studio, which matches “easy for brands” and avoids sending them to a raw Stripe signup. Flow: brand signs up on Syllis → Studio creates a connected account → brand completes KYC in the embedded onboarding component → Stripe verifies identity → Syllis checks recipient `stripe_transfers` (and payouts) are `active` → listing “for sale” and checkout stay locked until those capabilities are active. Re-check capabilities whenever the notification banner says something changed.

### D. Payments dashboard access for brands
Brands open a lightweight Express dashboard through a login link Syllis generates (`accounts.createLoginLink`). Studio should also embed onboarding, account management, payouts, and a payments view so they do not need to leave Syllis for day-to-day sales.

### E. Embedded components
Recommended [Connect embedded components](https://docs.stripe.com/connect/supported-embedded-components):
- `account_onboarding`
- `notification_banner` (required; keeps connected accounts aware of new requirements so they stay enabled)
- `account_management`
- `payments`
- `payouts`

Caveat: with separate charges and transfers, Express payment and dispute views show reduced detail. Syllis must own refund and dispute UI and webhook recovery.

### F. Webhook integration
Use webhooks for reliable payment confirmation, especially for async payment methods. Always verify incoming webhook signatures before processing event data ([webhook signature verification](https://stripe.com/docs/webhooks/signatures)). Specific events and implementation details are covered in the build skill.

### G. Onboarding status gating
Verify capability statuses with `stripe.v2.core.accounts.retrieve(id)` before enabling transfers or treating a brand as able to sell:
- `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'`
- Also check payouts capability status in the recipient subtree
Do not rely on older `charges_enabled` / `payouts_enabled` flags.

### H. Fee structure
- Platform fee model: mixed — monthly Studio plan plus a per-sale take by plan: Starter 10%, Growth 8%, Premium 6%
- `application_fee_amount` strategy: not used (incompatible with separate charges and transfers)
- `applicationFeeIncludes`: `platform_fee_only` — brands see the plan %, Syllis absorbs Stripe processing by transferring `price × (1 − plan%)` and keeping the rest. Pricing varies by region and card — check [stripe.com/pricing](https://stripe.com/pricing). Use the [Platform Pricing Tool](https://dashboard.stripe.com/settings/connect/platform_pricing) for Connect pricing policy and watch the [margin report](https://docs.stripe.com/connect/margin-reports.md).

```
Shopper pays £40
      │
      ▼
┌───────────────┐
│    Syllis     │  charge lands here and is held until shipped
└──────┬────────┘
       │ after tracking: transfer £36 / £36.80 / £37.60
       │ (10% / 8% / 6% stay on Syllis; Stripe fees already taken from Syllis)
       ▼
┌───────────────┐
│     Brand     │  receives the transfer, then Stripe pays out to their bank
└───────────────┘
```

**Warning:** Premium at 6% can sit close to Stripe processing on cheap items or international cards. Syllis pays those processing fees. Illustrative only (not a quote): a £15 tee at 6% keeps £0.90 before Stripe; UK consumer cards are often on the order of a percent-plus-pence — see [stripe.com/pricing](https://stripe.com/pricing). Net can be thin or negative. Do not treat 6% as guaranteed profit. Consider a small minimum keep (for example 50p) later if cheap SKUs dominate.

### I. SaaS monetization
Both: recurring Studio plans (Starter / Growth / Premium) billed on the Syllis Stripe account as normal platform customers, plus the per-sale take above. Do not use Connect `customer_account` for those brand subscriptions unless you later move plan billing onto the connected account.

### J. Implementation plan
1. Create connected accounts with Accounts v2: Express dashboard, platform fee collection, platform negative-balance liability, recipient + `stripe_transfers` only.
2. Embed onboarding, notification banner, and account management in Studio. Gate “sell on Syllis” until transfers/payouts are active.
3. Checkout charges Syllis (no `transfer_data`). Create `syllis_orders`. Release a transfer only after the brand adds tracking / marks shipped. Transfer amount = charge minus plan %.
4. Webhooks confirm payment, shipment-gated transfer, refunds, and disputes. Reverse transfers when you refund or lose a dispute after payout.
5. Go live only after `PAYMENTS_ENABLED=true`, Connect webhooks, Radar, and a test brand that completes KYC → lists → checkout → ship → transfer.

### K. Risk and liability
- Negative balance liability owner: your platform
- Risk controls owner: your platform (Stripe Radar on, Syllis writes terms and refund rules)

When a customer disputes after you already transferred, Stripe debits Syllis first. You reverse the transfer to pull money back from the brand. That can put the brand’s connected balance negative — that is why negative balance liability must be the platform. Radar matters because fraud that gets through hits the Syllis balance first.

Compatibility: Express + this charge pattern is allowed, with a caveat — brands see limited refund/dispute detail in Express. Syllis must run those flows.

Do not let brands paste their own secret keys. That is how mis-keys and fake payout accounts happen.

### L. Why this fits your business
- Checkout stays on Syllis; the statement shows Syllis (marketplace merchant of record for the payment).
- Money is held until tracking exists, which is the main anti-scam / “item never arrived” control you asked for.
- Brands still get paid into their own connected Stripe balance, not a manual Syllis bank run.
- Sales log themselves from webhooks — no “log a sale” chore.
- Plan-tiered take (10 / 8 / 6) keeps listing easy and rewards higher plans without a 12% flat cut.

### M. Open questions
- Add a minimum per-sale keep (for example 50p) so Premium 6% on cheap tees does not go negative after Stripe.
- Who pays shipping — brand-quoted vs flat, and whether shipping is in the held amount.
- Refund window and who clicks refund (Syllis admin vs brand request vs auto on “not shipped in X days”).
- This is integration guidance, not legal advice. A UK solicitor should still review marketplace terms (seller of goods vs checkout platform, distance-selling, disputes).
