"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Account could not be created.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        full_name: name,
        email: email,
        plan: "free",
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow mb-4">Create account</p>

        <h1 className="text-5xl font-semibold tracking-[-.06em]">
          Start discovering.
        </h1>

        <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
          Create your free Syllis account to save products, follow brands and
          access your account dashboard.
        </p>

        <form
          onSubmit={handleSignup}
          className="mt-9 grid gap-5 border hairline p-7"
        >
          <label className="grid gap-2 text-xs">
            Name

            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="Your name"
            />
          </label>

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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="At least 6 characters"
            />
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
            {loading ? "Creating account..." : "Create free account"}

            {!loading && <ArrowRight size={15} />}
          </button>

          <p className="text-center text-xs text-[color:var(--muted)]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="underline underline-offset-4"
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}