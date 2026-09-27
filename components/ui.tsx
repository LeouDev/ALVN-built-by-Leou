import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { OrbitGallery } from "@/components/OrbitGallery";
import { type Project, type Status, projects, statusLabels } from "@/data/projects";

const buttonStyles = {
  primary: "bg-navy text-cream hover:bg-navy-soft",
  accent: "bg-accent text-navy hover:bg-[#ff8a3d]",
  outline: "border border-navy/15 bg-white/40 text-navy hover:border-navy/40 hover:bg-white/80",
  light: "border border-cream/25 text-cream hover:border-cream/60",
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: keyof typeof buttonStyles;
  size?: "sm" | "md";
  external?: boolean;
  className?: string;
}) {
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const cls = `group inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors duration-300 active:scale-[0.98] ${
    size === "sm" ? "px-4 py-2.5 text-sm" : "px-6 py-3.5 text-[15px]"
  } ${buttonStyles[variant]} ${className}`;
  const body = (
    <>
      {children}
      <Arrow
        aria-hidden
        className={`size-4 transition-transform duration-300 ${external ? "group-hover:-translate-y-0.5 group-hover:translate-x-0.5" : "group-hover:translate-x-1"}`}
      />
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

const statusDot: Record<Status, string> = {
  live: "bg-accent shadow-[0_0_0_3px_rgb(244_119_33/0.22)]",
  "in-development": "border-[1.5px] border-accent",
  "coming-soon": "bg-navy/45",
  concept: "border-[1.5px] border-navy/45",
  private: "bg-navy",
};

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-cream/90 px-3 py-1.5 text-[10.5px] font-bold tracking-[0.16em] text-navy uppercase ring-1 ring-navy/10 backdrop-blur ${className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${statusDot[status]}`} />
      {statusLabels[status]}
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      <span aria-hidden className="h-px w-8 bg-accent" />
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
  action,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="headline mt-5 text-4xl sm:text-5xl lg:text-6xl">{title}</h2>
        {children && <p className="mt-5 text-lg text-pretty text-muted">{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c.6 7 5 11.4 12 12-7 .6-11.4 5-12 12-.6-7-5-11.4-12-12C7 11.4 11.4 7 12 0z" />
    </svg>
  );
}

/** Concentric orbit lines with slowly travelling dots — the logo's orbit motif. Pass positioning + size + text colour. */
export function Orbits({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  // Dots ride on rotating HTML layers (compositor-only) rather than animated SVG groups (repaint every frame).
  return (
    <div aria-hidden className={className}>
      <svg viewBox="0 0 200 200" fill="none" className="absolute inset-0 size-full">
        <circle cx="100" cy="100" r="99.5" stroke="currentColor" strokeWidth=".35" />
        <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth=".35" strokeDasharray=".8 2.4" />
      </svg>
      <div className="absolute inset-0 animate-orbit">
        <span className="absolute top-0 left-1/2 size-[2%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
      </div>
      <div className="absolute inset-[10%] animate-orbit-reverse">
        <span className="absolute top-1/2 right-0 size-[1.5%] translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
      </div>
      {children}
    </div>
  );
}

/** The ALVN emblem, shown on its own paper-coloured disc (the artwork's faces are drawn in that colour). */
export function Emblem({ className = "", preload = false }: { className?: string; preload?: boolean }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <Orbits className="absolute inset-0 size-full text-navy/15" />
      <div className="absolute inset-[9%] rounded-full bg-paper shadow-[0_40px_80px_-40px_rgb(7_26_45/0.35)] ring-1 ring-navy/8" />
      <Image
        src="/brand/alvn-emblem.png"
        alt="ALVN emblem: Gemini twins and an astronaut in orbit"
        width={491}
        height={492}
        preload={preload}
        sizes="(min-width: 1024px) 460px, 80vw"
        className="absolute inset-[12%] size-[76%] animate-fade-in object-contain"
      />
      <Sparkle className="absolute top-[14%] left-[3%] size-3.5 text-navy" />
      <Sparkle className="absolute right-[4%] bottom-[20%] size-5 text-accent" />
      <span aria-hidden className="absolute top-[5%] right-[16%] size-4 rounded-full bg-linear-to-br from-[#ffc596] to-accent" />
    </div>
  );
}

export function AppIcon({ project, className = "size-14 text-2xl" }: { project: Project; className?: string }) {
  return project.logo ? (
    <Image src={project.logo} alt="" width={112} height={112} className={`rounded-[22%] ${className}`} />
  ) : (
    <span aria-hidden className={`relative grid shrink-0 place-items-center rounded-[22%] bg-navy font-bold text-cream ${className}`}>
      {project.name[0]}
      <span className="absolute top-[18%] right-[18%] size-[12%] rounded-full bg-accent" />
    </span>
  );
}

export function StartProject() {
  return (
    <section className="shell pb-24 lg:pb-32">
      <div className="on-dark relative isolate overflow-hidden rounded-[36px] bg-navy px-6 py-16 text-cream sm:px-12 sm:py-20 lg:px-20 lg:py-28">
        <Orbits className="absolute top-1/2 -right-48 -z-10 size-[560px] -translate-y-1/2 text-cream/12 sm:-right-24 lg:size-[680px]">
          <OrbitGallery items={projects.map((p) => ({ slug: p.slug, name: p.name, image: p.coverImage }))} />
        </Orbits>
        <Eyebrow className="text-cream/60!">Start a Project</Eyebrow>
        <h2 className="headline mt-6 max-w-3xl text-5xl sm:text-7xl">Have an idea?</h2>
        <p className="mt-6 max-w-xl text-lg text-cream/70">Tell me what you’re thinking. Let’s turn it into something real.</p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/contact" variant="accent">
            Start a Project
          </ButtonLink>
          <ButtonLink href="/projects" variant="light">
            Explore My Work
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
