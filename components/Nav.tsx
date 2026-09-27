"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { navLinks } from "@/lib/site";

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
      <header
        className={`sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled ? "border-line bg-cream/80 backdrop-blur-xl" : "border-transparent"
        }`}
      >
        <nav aria-label="Main" className="shell flex h-16 items-center justify-between gap-6 md:h-20">
          <Link href="/" className="shrink-0">
            <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={110} height={32} preload className="h-7 w-auto md:h-8" />
          </Link>

          <ul className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current(link.href)}
                  className="group relative block rounded-full px-4 py-2 text-sm font-semibold text-navy/65 transition-colors hover:text-navy aria-[current=page]:text-navy"
                >
                  {link.label}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 mx-auto hidden size-1 rounded-full bg-accent group-aria-[current=page]:block" />
                </Link>
              </li>
            ))}
          </ul>

          <Link
            href="/contact"
            className="group hidden items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-[#ff8a3d] md:inline-flex"
          >
            Start a Project
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>

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
            className="-mr-2 grid size-11 place-items-center rounded-full md:hidden"
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
        <div className="shell flex h-16 items-center justify-between">
          <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={96} height={28} className="h-7 w-auto" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => menu.current?.close()}
            className="-mr-2 grid size-11 place-items-center rounded-full ring-1 ring-line"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <nav aria-label="Mobile" className="shell flex flex-1 flex-col justify-between pt-10 pb-10">
          <ul>
            {navLinks.map((link, i) => (
              <li key={link.href} className="border-b border-line">
                <Link
                  href={link.href}
                  aria-current={current(link.href)}
                  className="flex items-baseline gap-5 py-4 text-5xl font-semibold tracking-[-0.04em] aria-[current=page]:text-navy-soft"
                >
                  <span className="text-xs font-semibold tracking-normal text-muted tabular-nums">0{i + 1}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="space-y-6">
            <Link
              href="/contact"
              className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 font-semibold text-navy"
            >
              Start a Project <ArrowRight aria-hidden className="size-4" />
            </Link>
            <p className="eyebrow">ALVN — Built by Leou</p>
          </div>
        </nav>
      </dialog>
    </>
  );
}
