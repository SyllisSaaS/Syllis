"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.push("/profile");
    router.refresh();
  }

  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow mb-4">Account</p>

        <h1 className="text-5xl font-semibold tracking-[-.06em]">
          Welcome back.
        </h1>

        <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
          Log in to access your Syllis account, saved pieces and membership.
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-9 grid gap-5 border hairline p-7"
        >
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border hairline bg-transparent px-3 py-3 outline-none"
              placeholder="Your password"
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
            data-cursor="LOGIN"
          >
            {loading ? "Logging in..." : "Log in"}

            {!loading && <ArrowRight size={15} />}
          </button>

          <p className="text-center text-xs text-[color:var(--muted)]">
            No account?{" "}
            <Link
              href="/signup"
              className="underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}