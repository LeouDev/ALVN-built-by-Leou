import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroVideo } from "@/components/HeroVideo";
import { Logo } from "@/components/Logo";
import { MenuButton } from "@/components/Nav";
import { navLinks, site } from "@/lib/site";
import space from "@/public/hero/space.webp";

// The corner-down-right arrow on the hero's buttons.
function CornerArrow() {
  return (
    <svg aria-hidden viewBox="0 0 9 9" className="size-[0.62em] shrink-0">
      <path d="M1.6 .4V6H6.2" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <path d="M5.6 3.6 8.6 6 5.6 8.4Z" fill="currentColor" />
    </svg>
  );
}

/** The home page's full-screen hero. Its layout lives in globals.css under “Home hero”. */
export function HomeHero({ clients }: { clients: string[] }) {
  return (
    <section className="hero on-dark">
      <Image src={space} alt="" priority sizes="250vh" className="hero-bg" />
      {/* The same scene, moving. It fades in over the still; with reduced motion the still stays. */}
      <HeroVideo />

      <div className="hero-bar animate-fade-in">
        <MenuButton className="hero-menu" />
        <nav aria-label="Site" className="hero-links">
          {[navLinks.slice(0, 2), navLinks.slice(2)].map((col, i) => (
            <ul key={i}>
              {col.map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            </ul>
          ))}
        </nav>
        <p className="hero-tag">{site.descriptor}</p>
        <Link href="/contact" className="hero-cta">
          <CornerArrow />
          Start a Project
        </Link>
      </div>

      <div className="hero-body">
        <Logo weight="regular" className="hero-logo animate-fade-up" />
        <h1 className="hero-title animate-fade-up [animation-delay:120ms]">
          I build digital products <br className="max-md:hidden" />
          that turn <span className="text-accent">ideas into businesses</span>.
        </h1>
        <p className="hero-sub animate-fade-up [animation-delay:220ms]">
          Websites, apps, and custom digital experiences&nbsp;— designed and built from the ground up.
        </p>
        <div className="hero-actions animate-fade-up [animation-delay:320ms]">
          <Link href="/contact" className="hero-cta">
            <CornerArrow />
            Start a Project
          </Link>
          <a href="#work" className="hero-more">
            View Work <ArrowRight aria-hidden />
          </a>
        </div>
      </div>

      <a href="#testimonials" className="hero-proof animate-fade-up [animation-delay:420ms]">
        <span className="hero-proof-label">Trusted by</span>
        <span className="hero-proof-names">
          {clients.map((name) => (
            <span key={name}>{name.replace("'", "’")}</span>
          ))}
        </span>
      </a>
    </section>
  );
}
