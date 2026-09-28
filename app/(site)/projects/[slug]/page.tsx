import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity, ArrowLeft, ArrowRight, CalendarCheck, Camera, ChartColumn, Compass, CreditCard, Gauge, Globe,
  LayoutDashboard, ListChecks, Lock, Mail, MessageCircle, MessagesSquare, Package, QrCode, Quote, Rocket, ShieldCheck,
  Palette, Share2, Shuffle, SlidersHorizontal, Sparkles, Table2, Trophy, Users, Workflow, Zap, type LucideIcon,
} from "lucide-react";
import { PhoneMockup } from "@/components/PhoneMockup";
import { ButtonLink, StartProject, StatusBadge } from "@/components/ui";
import { type IconName, categoryLabels, getProject, projects, statusLabels } from "@/data/projects";

const featureIcons: Record<IconName, LucideIcon> = {
  compass: Compass, calendar: CalendarCheck, card: CreditCard, trophy: Trophy,
  workflow: Workflow, transform: Shuffle, table: Table2, chart: ChartColumn,
  thought: MessageCircle, quote: Quote, camera: Camera, community: Users,
  zap: Zap, gauge: Gauge, box: Package, chat: MessagesSquare, admin: SlidersHorizontal, publish: Rocket,
  activity: Activity, sparkles: Sparkles, mail: Mail, globe: Globe, dashboard: LayoutDashboard, qr: QrCode,
  shield: ShieldCheck, palette: Palette, checklist: ListChecks, share: Share2,
};

export const dynamicParams = false;
export const generateStaticParams = () => projects.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const project = getProject((await params).slug);
  return project ? { title: project.name, description: `${project.tagline} ${project.description}` } : {};
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  const next = projects[(projects.indexOf(project) + 1) % projects.length];
  const links = [
    { href: project.liveUrl, label: "Visit Website" },
    { href: project.appStoreUrl, label: "View on App Store" },
    { href: project.googlePlayUrl, label: "View on Google Play" },
    { href: project.githubUrl, label: "GitHub" },
    { href: project.videoUrl, label: "Watch Demo" },
  ].filter((l): l is { href: string; label: string } => Boolean(l.href));
  const story = [
    ["Problem", project.challenge],
    ["Solution", project.solution],
    ["My Role", project.role],
  ].filter((s): s is [string, string] => Boolean(s[1]));
  const gallery = project.gallery ?? [];
  const desktop = gallery.filter((g) => (g.kind ?? "desktop") === "desktop");
  const videos = gallery.filter((g) => g.kind === "video");
  const screens = gallery.filter((g) => g.kind === "mobile");
  const isMobile = project.categories.includes("mobile-app");

  return (
    <article>
      <header className="shell pt-10 lg:pt-14">
        <Link href="/projects" className="group eyebrow transition-colors hover:text-navy">
          <ArrowLeft aria-hidden className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
          All work
        </Link>
        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="eyebrow">{project.categories.map((c) => categoryLabels[c]).join(" · ")}</p>
            <h1 className="headline mt-5 text-[clamp(3rem,9vw,7.5rem)] leading-[0.9]">{project.name}</h1>
            <p className="mt-6 max-w-2xl text-2xl font-medium tracking-tight text-balance text-navy/75 sm:text-3xl">{project.tagline}</p>
          </div>
          <div className="space-y-8 lg:col-span-4">
            <dl className="grid grid-cols-3 gap-4 border-t border-line pt-5">
              <div>
                <dt className="eyebrow">Status</dt>
                <dd className="mt-2 text-sm font-semibold">{statusLabels[project.status]}</dd>
              </div>
              <div>
                <dt className="eyebrow">Year</dt>
                <dd className="mt-2 text-sm font-semibold tabular-nums">{project.year}</dd>
              </div>
              {project.platforms && (
                <div>
                  <dt className="eyebrow">Platform</dt>
                  <dd className="mt-2 text-sm font-semibold">{project.platforms.join(" · ")}</dd>
                </div>
              )}
            </dl>
            {links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {links.map((l, i) => (
                  <ButtonLink key={l.href} href={l.href} external variant={i ? "outline" : "primary"}>
                    {l.label}
                  </ButtonLink>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="shell mt-12">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[32px] border border-line bg-navy/5">
          <Image
            src={project.coverImage}
            alt={`${project.name} cover`}
            fill
            preload
            sizes="(min-width: 1280px) 1216px, 100vw"
            className="object-cover"
          />
          <StatusBadge status={project.status} className="absolute top-5 left-5" />
        </div>
        {project.note && (
          <p className="mt-4 flex items-start gap-3 rounded-2xl border border-line bg-white/60 px-5 py-4 text-sm text-muted">
            {project.status === "private" && <Lock aria-hidden className="mt-0.5 size-4 shrink-0 text-navy" />}
            {project.note}
          </p>
        )}
      </div>

      <section className="section">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <h2 className="eyebrow self-start lg:col-span-3">Overview</h2>
          <div className="lg:col-span-9">
            <p className="text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl">{project.description}</p>
            {story.length > 0 && (
              <dl className="mt-14 grid gap-10 md:grid-cols-3">
                {story.map(([label, text]) => (
                  <div key={label} className="border-t border-line pt-5">
                    <dt className="eyebrow">{label}</dt>
                    <dd className="mt-4 leading-relaxed text-pretty text-muted">{text}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      {project.features && project.features.length > 0 && (
        <section className="section pt-0 lg:pt-0">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2 className="eyebrow self-start lg:col-span-3">Features</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:col-span-9">
              {project.features.map(({ icon, title, description }) => {
                const Icon = featureIcons[icon];
                return (
                  <li key={title} className="reveal rounded-[24px] border border-line bg-white/55 p-7">
                    <span className="grid size-11 place-items-center rounded-full bg-navy text-cream">
                      <Icon aria-hidden className="size-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="mt-8 text-xl font-semibold tracking-tight">{title}</h3>
                    <p className="mt-2 text-muted">{description}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {(desktop.length > 0 || videos.length > 0) && (
        <section className="section pt-0 lg:pt-0">
          <h2 className="eyebrow">Gallery</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {desktop.map((g, i) => (
              <figure key={g.src} className={`reveal overflow-hidden rounded-[28px] border border-line bg-white ${i % 3 === 0 ? "md:col-span-2" : ""}`}>
                <Image src={g.src} alt={g.alt} width={1600} height={1000} sizes="(min-width: 1280px) 1216px, 100vw" className="h-auto w-full" />
              </figure>
            ))}
            {videos.map((v) => (
              <video
                key={v.src}
                src={v.src}
                aria-label={v.alt}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-[28px] border border-line bg-navy md:col-span-2"
              />
            ))}
          </div>
        </section>
      )}

      {(isMobile || screens.length > 0) && (
        <section className="section pt-0 lg:pt-0">
          <h2 className="eyebrow">{isMobile ? "Screens" : "On mobile"}</h2>
          <div className="on-dark mt-8 overflow-x-auto rounded-[32px] bg-navy">
            <div className="mx-auto flex w-max gap-6 px-8 py-12 sm:px-12 lg:gap-10 lg:py-16">
              {(screens.length ? screens : [undefined, undefined, undefined]).map((screen, i) => (
                <PhoneMockup
                  key={screen?.src ?? i}
                  project={project}
                  screen={screen}
                  placeholder={(["splash", "list", "feed"] as const)[i % 3]}
                  className="w-[62vw] max-w-[260px] sm:w-[220px] lg:w-[260px]"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {project.technologies.length > 0 && (
        <section className="section pt-0 lg:pt-0">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2 className="eyebrow self-start lg:col-span-3">Built With</h2>
            <ul className="flex flex-wrap gap-2 lg:col-span-9">
              {project.technologies.map((tech) => (
                <li key={tech} className="rounded-full border border-line bg-white/60 px-4 py-2 font-medium">
                  {tech}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {project.outcome && (
        <section className="section pt-0 lg:pt-0">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2 className="eyebrow self-start lg:col-span-3">Outcome</h2>
            <p className="text-2xl leading-snug font-medium tracking-tight lg:col-span-9">{project.outcome}</p>
          </div>
        </section>
      )}

      {project.testimonial?.quote && (
        <section className="section pt-0 lg:pt-0">
          <figure className="grid gap-8 lg:grid-cols-12 lg:gap-12">
            <h2 className="eyebrow self-start lg:col-span-3">In their words</h2>
            <div className="lg:col-span-9">
              <blockquote className="text-2xl leading-snug font-medium tracking-tight text-pretty">“{project.testimonial.quote}”</blockquote>
              <figcaption className="mt-6 text-sm">
                <span className="font-semibold">{project.testimonial.name}</span>
                <span className="text-muted"> · {[project.testimonial.role, project.name].filter(Boolean).join(", ")}</span>
              </figcaption>
            </div>
          </figure>
        </section>
      )}

      <nav aria-label="Next project" className="shell pb-24">
        <Link href={`/projects/${next.slug}`} className="group flex items-center justify-between gap-6 border-y border-line py-10">
          <span>
            <span className="eyebrow">Next project</span>
            <span className="headline mt-3 block text-4xl sm:text-6xl">{next.name}</span>
          </span>
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-navy text-cream transition-colors group-hover:bg-accent group-hover:text-navy">
            <ArrowRight aria-hidden className="size-5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </nav>

      <StartProject />
    </article>
  );
}
