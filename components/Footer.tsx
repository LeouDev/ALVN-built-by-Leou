import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { navLinks, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-6">
          <Link href="/" className="block w-fit">
            <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={137} height={40} className="h-10 w-auto" />
          </Link>
          <p className="eyebrow mt-6">{site.descriptor}</p>
          <p className="mt-2 text-lg font-semibold">Built by Leou.</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-3">
          <ul className="space-y-3">
            {[{ href: "/", label: "Home" }, ...navLinks].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm font-semibold text-navy/65 transition-colors hover:text-navy">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-navy/65 transition-colors hover:text-navy"
              >
                Résumé ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          </ul>
        </nav>
        <div className="md:col-span-3 md:text-right">
          <p className="text-sm text-muted">Have an idea?</p>
          <ButtonLink href="/contact" variant="accent" size="sm" className="mt-4">
            Start a Project
          </ButtonLink>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="shell flex flex-col gap-2 py-6 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} ALVN — Built by Leou</p>
          <p>Ideas, designed and built into digital experiences.</p>
        </div>
      </div>
    </footer>
  );
}
