"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/env";
import { brandPlans, isBrandPlan, type AccountRole, type BrandPlan } from "@/lib/plans";
import { DEFAULT_LOOK, LOOK_STORAGE_KEY, isLook } from "@/lib/look";
import { requestedAccountRole } from "@/lib/profile";
import { STYLIST_PLATFORM_CUT } from "@/lib/founding";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function storedLook() {
  try {
    const stored = window.localStorage.getItem(LOOK_STORAGE_KEY);
    return isLook(stored) ? stored : DEFAULT_LOOK;
  } catch {
    return DEFAULT_LOOK;
  }
}

export function SignupForm() {
  const params = useSearchParams();
  const initialRole = requestedAccountRole(params.get("role"));
  const requestedPlan = params.get("plan");

  const [role, setRole] = useState<Exclude<AccountRole, "admin">>(initialRole);
  const [brandPlan, setBrandPlan] = useState<BrandPlan>(
    isBrandPlan(requestedPlan) ? requestedPlan : "starter"
  );
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [bio, setBio] = useState("");
  const [foundingBrand, setFoundingBrand] = useState(true);
  const [foundingMember, setFoundingMember] = useState(true);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"session" | "email" | null>(null);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured()) {
      setError(
        "This live site still cannot see the Supabase keys. In Vercel, add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, then Redeploy. No database password is needed."
      );
      setLoading(false);
      return;
    }

    if (!acceptedLegal) {
      setError("Please accept the Terms of use and Privacy policy to create an account.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const look = storedLook();
    const plan = role === "brand" ? brandPlan : "free";
    const brandSlug = role === "brand" ? slugify(brandName || name) : null;

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: name,
          role,
          plan,
          brand_slug: brandSlug,
          look,
          founding_brand: role === "brand" && foundingBrand,
          founding_member: role === "shopper" && foundingMember,
          instagram: role === "stylist" ? instagram : null,
          portfolio: role === "stylist" ? portfolio : null,
          bio: role === "stylist" ? bio : null,
          accepted_legal: true,
        },
      },
    });

    if (signupError) {
      const hint =
        signupError.message === "Database error saving new user"
          ? " The shared database still has an old signup trigger. Run supabase/fix-auth-signup.sql in the Supabase SQL editor, then try again."
          : "";
      setError(signupError.message + hint);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Account could not be created.");
      setLoading(false);
      return;
    }

    if (data.session) {
      const bootstrap = await fetch("/api/account/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          plan,
          look,
          full_name: name,
          brand_slug: brandSlug,
          founding_brand: role === "brand" && foundingBrand,
          founding_member: role === "shopper" && foundingMember,
          instagram,
          portfolio,
          bio,
          accepted_legal: true,
        }),
      });
      const payload = (await bootstrap.json()) as { error?: string };
      if (!bootstrap.ok) {
        setError(payload.error || "Account was created but the profile could not be saved.");
        setLoading(false);
        return;
      }
      setDone("session");
      if (role === "brand") window.location.href = `/studio?welcome=1&plan=${brandPlan}`;
      else if (role === "stylist") window.location.href = "/stylists?applied=1";
      else window.location.href = "/profile";
      return;
    }

    setDone("email");
    setLoading(false);
  }

  if (done === "email") {
    return (
      <div className="page-shell section-space">
        <div className="mx-auto max-w-lg">
          <p className="eyebrow mb-4">Check your inbox</p>
          <h1 className="text-5xl font-semibold tracking-[-.06em]">Verify your email.</h1>
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
            We sent a confirmation link to {email}. After you confirm, log in and your application
            will finish setting up. Brand and stylist accounts stay pending until Syllis verifies them.
          </p>
          <Link href="/login" className="button button-dark mt-8">
            Go to log in <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow mb-4">Create account</p>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">Join Syllis.</h1>
        <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
          Shoppers start free. Brands and stylists apply — nothing is hardcoded. Verification is
          reviewed in admin.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3">
          {(
            [
              ["shopper", "Shopper", "Browse free. Early is £4/month."],
              ["brand", "Brand", "Apply to list. Founding year discounts."],
              ["stylist", "Stylist", "Apply to style. 5% platform cut."],
            ] as const
          ).map(([id, title, copy]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRole(id)}
              className={`border p-4 text-left ${role === id ? "border-[color:var(--text)]" : "hairline"}`}
              style={{ borderRadius: "var(--radius-card)" }}
            >
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-xs text-[color:var(--muted)]">{copy}</p>
            </button>
          ))}
        </div>

        <form onSubmit={handleSignup} className="panel mt-6 grid gap-5 border hairline p-7">
          <label className="grid gap-2 text-xs">
            {role === "brand" ? "Your name" : "Name"}
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="Your name"
            />
          </label>

          {role === "brand" && (
            <>
              <label className="grid gap-2 text-xs">
                Brand name
                <input
                  required
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="North / 00"
                />
              </label>

              <fieldset className="grid gap-2">
                <legend className="text-xs">Starting plan</legend>
                <div className="grid gap-2">
                  {brandPlans.map((plan) => (
                    <label
                      key={plan.id}
                      className={`flex items-center justify-between border px-3 py-3 text-sm ${
                        brandPlan === plan.id ? "border-[color:var(--text)]" : "hairline"
                      }`}
                    >
                      <span>
                        <span className="font-semibold">{plan.name}</span>
                        <span className="ml-2 text-xs text-[color:var(--muted)]">
                          £{plan.price}/mo after founding year
                        </span>
                      </span>
                      <input
                        type="radio"
                        name="brandPlan"
                        checked={brandPlan === plan.id}
                        onChange={() => setBrandPlan(plan.id)}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={foundingBrand}
                  onChange={(e) => setFoundingBrand(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Apply as a founding brand
                  <span className="mt-1 block text-xs text-[color:var(--muted)]">
                    Month 1 free, then 90% / 75% / 50% / 25% off across the first year.
                  </span>
                </span>
              </label>
            </>
          )}

          {role === "stylist" && (
            <>
              <label className="grid gap-2 text-xs">
                Instagram
                <input
                  required
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  className="border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="@yourhandle"
                />
              </label>
              <label className="grid gap-2 text-xs">
                Portfolio URL
                <input
                  required
                  type="url"
                  value={portfolio}
                  onChange={(e) => setPortfolio(e.target.value)}
                  className="border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="https://"
                />
              </label>
              <label className="grid gap-2 text-xs">
                Why Syllis
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="min-h-24 border hairline bg-transparent px-3 py-3 outline-none"
                  placeholder="A short note on your work"
                />
              </label>
              <p className="text-xs text-[color:var(--muted)]">
                Verified stylists keep {Math.round((1 - STYLIST_PLATFORM_CUT) * 100)}% of what they
                are paid. Syllis takes {Math.round(STYLIST_PLATFORM_CUT * 100)}%.
              </p>
            </>
          )}

          {role === "shopper" && (
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={foundingMember}
                onChange={(e) => setFoundingMember(e.target.checked)}
                className="mt-1"
              />
              <span>
                Early-access founding member
                <span className="mt-1 block text-xs text-[color:var(--muted)]">
                  The same first-year discount ladder applies to Early (£4) if you upgrade.
                </span>
              </span>
            </label>
          )}

          <label className="grid gap-2 text-xs">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="you@example.com"
            />
          </label>

          <label className="grid gap-2 text-xs">
            Password
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="At least 8 characters"
            />
          </label>

          <label className="flex items-start gap-3 text-sm">
            <input
              required
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline underline-offset-4">
                Terms of use
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="underline underline-offset-4">
                Privacy policy
              </Link>
              . I confirm I am 16 or older.
            </span>
          </label>

          {error && (
            <div className="border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-500">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="button button-dark w-full disabled:cursor-not-allowed disabled:opacity-50"
            data-cursor="JOIN"
          >
            {loading
              ? "Creating account..."
              : role === "brand"
                ? "Submit brand application"
                : role === "stylist"
                  ? "Submit stylist application"
                  : "Create free account"}
            {!loading && <ArrowRight size={15} />}
          </button>

          <p className="text-center text-xs text-[color:var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
