"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { unreadNow } from "@/app/admin/actions";

export function AdminNav({ unread: initial }: { unread: number }) {
  const pathname = usePathname();
  // The layout (and this nav) stays mounted between admin pages, so re-check after each navigation.
  const [unread, setUnread] = useState(initial);
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    unreadNow().then(setUnread, () => {});
    // On phones the tab row scrolls sideways: keep the current tab in view.
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);
  const links = [
    { href: "/admin", label: "Inbox", active: pathname === "/admin" || pathname.startsWith("/admin/messages") },
    { href: "/admin/projects", label: "Projects", active: pathname.startsWith("/admin/projects") },
    { href: "/admin/contracts", label: "Contracts", active: pathname.startsWith("/admin/contracts") },
    { href: "/admin/invoices", label: "Invoices", active: pathname.startsWith("/admin/invoices") },
    { href: "/admin/calendar", label: "Calendar", active: pathname.startsWith("/admin/calendar") },
  ];
  return (
    <nav ref={nav} aria-label="Admin" className="-mx-4 flex scroll-px-4 items-center gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
      {links.map(({ href, label, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-navy/65 transition-colors hover:text-navy aria-[current=page]:bg-navy aria-[current=page]:text-cream"
        >
          {label}
          {label === "Inbox" && unread > 0 && (
            <span className="rounded-full bg-accent px-1.5 text-xs leading-5 text-on-accent tabular-nums">
              {unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
