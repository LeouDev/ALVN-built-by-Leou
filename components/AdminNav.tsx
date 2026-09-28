"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { unreadNow } from "@/app/admin/actions";

export function AdminNav({ unread: initial }: { unread: number }) {
  const pathname = usePathname();
  // The layout (and this nav) stays mounted between admin pages, so re-check after each navigation.
  const [unread, setUnread] = useState(initial);
  useEffect(() => {
    unreadNow().then(setUnread, () => {});
  }, [pathname]);
  const links = [
    { href: "/admin", label: "Inbox", active: pathname === "/admin" || pathname.startsWith("/admin/messages") },
    { href: "/admin/projects", label: "Projects", active: pathname.startsWith("/admin/projects") },
    { href: "/admin/calendar", label: "Calendar", active: pathname.startsWith("/admin/calendar") },
  ];
  return (
    <nav aria-label="Admin" className="flex items-center gap-1">
      {links.map(({ href, label, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-navy/65 transition-colors hover:text-navy aria-[current=page]:bg-navy aria-[current=page]:text-cream"
        >
          {label}
          {label === "Inbox" && unread > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs leading-5 text-navy tabular-nums">
              {unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
