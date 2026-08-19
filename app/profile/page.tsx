"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Settings, LogOut, Heart, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  plan: string | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoggedIn(false);
          setLoading(false);
          return;
        }

        setLoggedIn(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, username, email, plan, created_at")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Profile loading error:", error);

          // Still show the account using Supabase auth information
          setProfile({
            id: user.id,
            name:
              user.user_metadata?.name ??
              user.user_metadata?.full_name ??
              null,
            username: user.user_metadata?.username ?? null,
            email: user.email ?? null,
            plan: "free",
            created_at: user.created_at ?? null,
          });

          setLoading(false);
          return;
        }

        setProfile({
          ...data,
          plan: data.plan ?? "free",
          name:
            data.name ??
            user.user_metadata?.name ??
            user.user_metadata?.full_name ??
            null,
          username:
            data.username ??
            user.user_metadata?.username ??
            null,
          email: data.email ?? user.email ?? null,
          created_at: data.created_at ?? user.created_at ?? null,
        });
      } catch (error) {
        console.error("Unexpected profile error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <div className="page-shell section-space">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow mb-4">Account</p>

          <div className="animate-pulse">
            <div className="h-16 w-64 bg-[color:var(--line)]" />
            <div className="mt-5 h-4 w-48 bg-[color:var(--line)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!loggedIn || !profile) {
    return (
      <div className="page-shell section-space">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center border hairline">
            <User size={24} />
          </div>

          <p className="eyebrow mt-8 mb-4">Account</p>

          <h1 className="text-5xl font-semibold tracking-[-.06em]">
            You&apos;re not logged in.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-6 text-[color:var(--muted)]">
            Log in to access your Syllis profile, saved pieces and account
            settings.
          </p>

          <Link
            href="/login"
            className="button button-dark mt-8"
            data-cursor="LOGIN"
          >
            Log in <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  const planName =
    (profile.plan ?? "free").charAt(0).toUpperCase() +
    (profile.plan ?? "free").slice(1);

  const displayName =
    profile.name ||
    profile.username ||
    profile.email?.split("@")[0] ||
    "Syllis member";

  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-GB", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="border-b hairline pb-8">
          <p className="eyebrow mb-4">Account</p>

          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <h1 className="text-[clamp(52px,8vw,100px)] font-semibold leading-[.86] tracking-[-.075em]">
                Your profile.
              </h1>

              <p className="mt-6 max-w-lg text-sm leading-6 text-[color:var(--muted)]">
                Your personal Syllis space for saved pieces, preferences and
                early access.
              </p>
            </div>

            <Link
              href="/settings"
              className="button button-quiet"
              data-cursor="SETTINGS"
            >
              <Settings size={14} />
              Settings
            </Link>
          </div>
        </div>

        {/* Profile hero */}
        <section className="grid gap-5 py-8 md:grid-cols-[1.5fr_1fr]">
          <div className="border hairline p-7 md:p-9">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center bg-[color:var(--text)] text-3xl font-semibold text-[color:var(--bg)]">
                {initials}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-semibold tracking-[-.05em]">
                    {displayName}
                  </h2>

                  <span className="border hairline px-2 py-1 text-[10px] uppercase tracking-[.12em]">
                    {planName}
                  </span>
                </div>

                {profile.username && (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">
                    @{profile.username}
                  </p>
                )}

                {profile.email && (
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {profile.email}
                  </p>
                )}

                <p className="mt-5 text-xs text-[color:var(--muted)]">
                  Member since {memberSince}
                </p>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="border hairline p-7 md:p-9">
            <p className="eyebrow">Current plan</p>

            <div className="mt-7 flex items-end justify-between">
              <div>
                <p className="text-4xl font-semibold tracking-[-.05em]">
                  {planName}
                </p>

                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  Syllis membership
                </p>
              </div>

              {profile.plan === "free" && (
                <Link
                  href="/pricing"
                  className="button button-dark"
                  data-cursor="UPGRADE"
                >
                  Upgrade <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Account stats */}
        <section className="grid grid-cols-2 border-y hairline md:grid-cols-4">
          <div className="border-r hairline p-6">
            <p className="text-xs text-[color:var(--muted)]">Saved</p>
            <p className="mt-3 text-3xl font-semibold">0</p>
          </div>

          <div className="border-r hairline p-6">
            <p className="text-xs text-[color:var(--muted)]">Following</p>
            <p className="mt-3 text-3xl font-semibold">0</p>
          </div>

          <div className="border-r hairline p-6">
            <p className="text-xs text-[color:var(--muted)]">Collections</p>
            <p className="mt-3 text-3xl font-semibold">0</p>
          </div>

          <div className="p-6">
            <p className="text-xs text-[color:var(--muted)]">Plan</p>
            <p className="mt-3 text-3xl font-semibold">{planName}</p>
          </div>
        </section>

        {/* Account navigation */}
        <section className="py-10">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/saved"
              className="group border hairline p-7 transition hover:bg-[color:var(--text)] hover:text-[color:var(--bg)]"
              data-cursor="SAVED"
            >
              <Heart size={18} />

              <p className="mt-12 text-xl font-semibold tracking-[-.03em]">
                Saved pieces
              </p>

              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)] group-hover:text-current">
                Everything you&apos;ve saved in one place.
              </p>

              <ArrowRight
                size={16}
                className="mt-7 transition-transform group-hover:translate-x-1"
              />
            </Link>

            <Link
              href="/settings"
              className="group border hairline p-7 transition hover:bg-[color:var(--text)] hover:text-[color:var(--bg)]"
              data-cursor="SETTINGS"
            >
              <Settings size={18} />

              <p className="mt-12 text-xl font-semibold tracking-[-.03em]">
                Account settings
              </p>

              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)] group-hover:text-current">
                Manage your details and preferences.
              </p>

              <ArrowRight
                size={16}
                className="mt-7 transition-transform group-hover:translate-x-1"
              />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="group border hairline p-7 text-left transition hover:bg-[color:var(--text)] hover:text-[color:var(--bg)]"
              data-cursor="LOGOUT"
            >
              <LogOut size={18} />

              <p className="mt-12 text-xl font-semibold tracking-[-.03em]">
                Log out
              </p>

              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)] group-hover:text-current">
                Sign out of your Syllis account.
              </p>

              <ArrowRight
                size={16}
                className="mt-7 transition-transform group-hover:translate-x-1"
              />
            </button>
          </div>
        </section>

        {/* Account information */}
        <section className="border-t hairline pt-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row">
            <div>
              <p className="eyebrow">Account information</p>

              <h2 className="mt-3 text-2xl font-semibold tracking-[-.04em]">
                Your Syllis identity
              </h2>
            </div>

            <Link
              href="/settings"
              className="button button-quiet"
              data-cursor="EDIT"
            >
              Edit details <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-8 grid border-y hairline md:grid-cols-2">
            <div className="border-b hairline p-5 md:border-r">
              <p className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                Name
              </p>

              <p className="mt-2 text-sm">
                {profile.name || "Not set"}
              </p>
            </div>

            <div className="border-b hairline p-5">
              <p className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                Email
              </p>

              <p className="mt-2 text-sm">
                {profile.email || "Not available"}
              </p>
            </div>

            <div className="p-5 md:border-r">
              <p className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                Username
              </p>

              <p className="mt-2 text-sm">
                {profile.username
                  ? `@${profile.username}`
                  : "Not set"}
              </p>
            </div>

            <div className="p-5">
              <p className="text-[10px] uppercase tracking-[.12em] text-[color:var(--muted)]">
                Membership
              </p>

              <p className="mt-2 text-sm">
                {planName} · Since {memberSince}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}