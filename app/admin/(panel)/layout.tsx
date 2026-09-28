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
        {/* One row from sm up; on phones the tabs drop to a second row so nothing collides. */}
        <div className="shell flex flex-wrap items-center gap-x-8 gap-y-2 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
          <Link href="/admin" className="flex shrink-0 items-center gap-3">
            <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={96} height={28} className="h-6 w-auto" />
            <span className="eyebrow max-md:hidden">Admin</span>
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto">
            <AdminNav unread={unread} />
          </div>
          <div className="ml-auto flex items-center gap-2 text-sm font-semibold">
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
