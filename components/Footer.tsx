import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { ButtonLink } from "@/components/ui";
import { navLinks, site } from "@/lib/site";

const link = "text-sm font-semibold text-navy/65 transition-colors hover:text-navy";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-6">
          <NavLink href="/" className="block w-fit">
            <Logo className="text-[44px]" />
          </NavLink>
          <p className="eyebrow mt-6">{site.descriptor}</p>
          <p className="mt-2 text-lg font-semibold">Built by Leou.</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3">
            <p className="text-sm text-muted">Have an idea?</p>
            <ButtonLink href="/contact" variant="accent" size="sm">
              Start a Project
            </ButtonLink>
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-5 md:col-start-8">
          <div>
            <p className="eyebrow">Explore</p>
            <ul className="mt-4 space-y-3">
              {navLinks
                .filter((l) => l.href !== "/contact")
                .map((l) => (
                  <li key={l.href}>
                    <NavLink href={l.href} className={link}>
                      {l.label}
                    </NavLink>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Connect</p>
            <ul className="mt-4 space-y-3">
              <li>
                <NavLink href="/contact" className={link}>
                  Contact
                </NavLink>
              </li>
              <li>
                <a href={site.resumeUrl} target="_blank" rel="noopener noreferrer" className={link}>
                  About the developer ↗<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>
        </nav>
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
