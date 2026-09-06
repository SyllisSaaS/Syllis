/** Real Stripe charges stay off until PAYMENTS_ENABLED=true. Plans still apply in the product. */
export function paymentsLive() {
  return process.env.PAYMENTS_ENABLED === "true" || process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";
}
