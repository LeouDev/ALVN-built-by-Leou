import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/AdminNav";
import { requireAdmin } from "@/lib/admin";
import { unreadCount } from "@/lib/inbox";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

// Each admin page also calls requireAdmin(): layouts aren't re-run on every navigation.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const unread = await unreadCount();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-xl">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/admin" className="flex shrink-0 items-center gap-3">
              <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={96} height={28} className="h-6 w-auto" />
              <span className="eyebrow max-sm:hidden">Admin</span>
            </Link>
            <AdminNav unread={unread} />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/" className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-navy/65 hover:text-navy max-sm:hidden">
              View site <ArrowUpRight aria-hidden className="size-4" />
            </Link>
            <form action={signOut}>
              <button type="submit" className="rounded-full px-3 py-2 text-navy/65 ring-1 ring-line hover:text-navy">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main id="main" className="shell py-10 lg:py-14">
        {children}
      </main>
    </>
  );
}
