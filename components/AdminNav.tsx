"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { unreadNow } from "@/app/admin/actions";

// Each tab, and where its inner pages live.
const TABS = [
  { href: "/admin", label: "Inbox", section: "/admin/messages" },
  { href: "/admin/projects", label: "Projects", section: "/admin/projects" },
  { href: "/admin/contracts", label: "Contracts", section: "/admin/contracts" },
  { href: "/admin/invoices", label: "Invoices", section: "/admin/invoices" },
  { href: "/admin/calendar", label: "Calendar", section: "/admin/calendar" },
];

const EDGE = 24; // px: swipes from the screen's edge are Android's Back gesture

/** Touches that need sideways movement of their own: fields, the signature pad, pop-ups, anything that scrolls sideways. */
function needsSideways(target: EventTarget | null) {
  if (document.querySelector("dialog[open]")) return true;
  for (let el = target instanceof Element ? target : null; el && el !== document.body; el = el.parentElement) {
    if (el.matches("input, textarea, select, canvas, [contenteditable]")) return true;
    if (el.scrollWidth > el.clientWidth && /auto|scroll/.test(getComputedStyle(el).overflowX)) return true;
  }
  return false;
}

export function AdminNav({ unread: initial }: { unread: number }) {
  const pathname = usePathname();
  const router = useRouter();
  // The layout (and this nav) stays mounted between admin pages, so re-check after each navigation.
  const [unread, setUnread] = useState(initial);
  const nav = useRef<HTMLElement>(null);
  const slideFrom = useRef(0); // set by a swipe: 1 = the new page comes in from the right, -1 from the left
  useEffect(() => {
    unreadNow().then(setUnread, () => {});
    // On phones the tab row scrolls sideways: keep the current tab in view.
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
    const from = slideFrom.current;
    slideFrom.current = 0;
    if (from && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      document.getElementById("main")?.animate([{ transform: `translateX(${from * 18}%)`, opacity: 0 }, { transform: "none", opacity: 1 }], {
        duration: 280,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      });
  }, [pathname]);

  // On a tab's main page, a sideways swipe moves to the next tab (left) or the previous one (right).
  useEffect(() => {
    const index = TABS.findIndex((t) => t.href === pathname);
    if (index < 0) return;
    let start: { x: number; y: number; at: number } | null = null;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = e.touches.length === 1 && t.clientX > EDGE && t.clientX < innerWidth - EDGE && !needsSideways(e.target) ? { x: t.clientX, y: t.clientY, at: e.timeStamp } : null;
    };
    const onEnd = (e: TouchEvent) => {
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const quick = e.timeStamp - start.at < 700;
      start = null;
      // Clearly sideways and quick, so scrolling or selecting text never switches tabs.
      if (Math.abs(dx) < 60 || Math.abs(dx) < 2 * Math.abs(dy) || !quick || getSelection()?.toString()) return;
      const next = TABS[index + (dx < 0 ? 1 : -1)];
      if (!next) return;
      slideFrom.current = dx < 0 ? 1 : -1;
      router.push(next.href);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [pathname, router]);

  const links = TABS.map((t) => ({ ...t, active: pathname === t.href || pathname.startsWith(t.section) }));
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
