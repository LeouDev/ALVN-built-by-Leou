"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { navLinks } from "@/lib/site";

// The floating capsule; the mobile menu reuses it so its close button lands where the menu button was.
const pill = "pointer-events-auto flex h-14 items-center rounded-full border border-line pr-2 pl-5 backdrop-blur-xl transition-[background-color,box-shadow] duration-300";

export function Nav() {
  const pathname = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const current = (href: string) => (pathname === href || pathname.startsWith(`${href}/`) ? "page" : undefined);

  return (
    <>
      {/* Only the pill takes clicks; the rest of the sticky strip lets them through to the page. */}
      <header className="pointer-events-none sticky top-0 z-40 px-4 pt-3 md:pt-4">
        <nav
          aria-label="Main"
          className={`${pill} mx-auto w-full justify-between gap-2 md:w-fit md:gap-8 ${
            scrolled ? "bg-paper/85 shadow-[0_12px_40px_-16px_rgba(7,26,45,0.35)]" : "bg-paper/60"
          }`}
        >
          <NavLink href="/" className="shrink-0">
            <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={110} height={32} preload className="h-6 w-auto md:h-7" />
          </NavLink>

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  aria-current={current(link.href)}
                  className="group relative block rounded-full px-4 py-2 text-sm font-semibold text-navy/65 transition-colors hover:text-navy aria-[current=page]:text-navy"
                >
                  {link.label}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 mx-auto hidden size-1 rounded-full bg-accent group-aria-[current=page]:block" />
                </NavLink>
              </li>
            ))}
          </ul>

          <NavLink
            href="/contact"
            className="group hidden items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-[#ff8a3d] md:inline-flex"
          >
            Start a Project
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </NavLink>

          <button
            type="button"
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => {
              menu.current?.showModal();
              setOpen(true);
            }}
            className="grid size-10 place-items-center rounded-full md:hidden"
          >
            <span aria-hidden className="flex w-5 flex-col gap-[5px]">
              <span className="h-0.5 rounded-full bg-navy" />
              <span className="h-0.5 w-3/5 self-end rounded-full bg-navy" />
            </span>
          </button>
        </nav>
      </header>

      <dialog
        id="mobile-menu"
        ref={menu}
        aria-label="Menu"
        onClose={() => setOpen(false)}
        onClick={(e) => (e.target as HTMLElement).closest("a") && menu.current?.close()}
        className="m-0 h-dvh max-h-none w-full max-w-none bg-cream p-0 text-navy open:flex open:animate-[fade-in_250ms_ease-out] open:flex-col"
      >
        <div className="px-4 pt-3">
          <div className={`${pill} justify-between bg-paper/60`}>
            <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={96} height={28} className="h-6 w-auto" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => menu.current?.close()}
              className="grid size-10 place-items-center rounded-full ring-1 ring-line"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
        </div>
        <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-between pt-10 pb-10">
          <ul>
            {navLinks.map((link, i) => (
              <li key={link.href} className="border-b border-line">
                <NavLink
                  href={link.href}
                  aria-current={current(link.href)}
                  className="flex items-baseline gap-5 py-4 text-5xl font-semibold tracking-[-0.04em] aria-[current=page]:text-navy-soft"
                >
                  <span className="text-xs font-semibold tracking-normal text-muted tabular-nums">0{i + 1}</span>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="space-y-6">
            <NavLink
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 font-semibold text-navy"
            >
              Start a Project <ArrowRight aria-hidden className="size-4" />
            </NavLink>
            <p className="eyebrow">ALVN — Built by Leou</p>
          </div>
        </nav>
      </dialog>
    </>
  );
}
