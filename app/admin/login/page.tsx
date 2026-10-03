import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { sendLoginLink, signIn } from "@/app/admin/actions";
import { Logo } from "@/components/Logo";
import { field } from "@/lib/styles";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: "Admin sign-in",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the sign-in token is in this page's URL
};

const button =
  "group inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 font-semibold text-cream transition-colors hover:bg-navy-soft";

export default async function AdminLogin({ searchParams }: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { token, sent, expired } = await searchParams;

  return (
    <main id="main" className="grid min-h-dvh place-items-center px-4 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-line bg-white/60 p-8 sm:p-10">
        <Logo className="text-[32px]" />
        <h1 className="mt-8 text-3xl font-semibold tracking-tight">Admin</h1>

        {typeof token === "string" ? (
          <form action={signIn} className="mt-6">
            <input type="hidden" name="token" value={token} />
            <p className="text-muted">Your sign-in link is ready.</p>
            <button type="submit" className={`${button} mt-6`}>
              Sign in <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        ) : sent ? (
          <p role="status" className="mt-4 text-muted">
            If that’s the admin email, a sign-in link is on its way. It works once and expires in 15 minutes.
          </p>
        ) : (
          <form action={sendLoginLink} className="mt-4">
            {expired && (
              <p role="alert" className="mb-4 text-sm font-semibold text-[#b42318]">
                That link has expired or was already used. Request a new one.
              </p>
            )}
            <p className="text-muted">Enter your email to get a one-time sign-in link.</p>
            <label className="mt-6 block">
              <span className="text-sm font-semibold">Email</span>
              <input name="email" type="email" required autoComplete="email" className={field} />
            </label>
            <button type="submit" className={`${button} mt-6`}>
              Email me a sign-in link <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
