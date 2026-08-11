import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="page-shell section-space">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow mb-4">Account</p>
        <h1 className="text-5xl font-semibold tracking-[-.06em]">Welcome back.</h1>
        <form className="mt-9 grid gap-5 border hairline p-7">
          <label className="grid gap-2 text-xs">
            Email
            <input required type="email" className="border hairline bg-transparent px-3 py-3 outline-none" />
          </label>
          <label className="grid gap-2 text-xs">
            Password
            <input required type="password" className="border hairline bg-transparent px-3 py-3 outline-none" />
          </label>
          <button className="button button-dark w-full" data-cursor="LOGIN">Log in</button>
          <p className="text-center text-xs text-[color:var(--muted)]">
            No account? <Link href="/signup" className="underline underline-offset-4">Create one</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
