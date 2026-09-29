import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Globe, LayoutDashboard, Smartphone } from "lucide-react";
import { AppCard } from "@/components/AppCard";
import { ProjectCard } from "@/components/ProjectCard";
import { ButtonLink, Emblem, Eyebrow, SectionHeader, StartProject, StatusBadge } from "@/components/ui";
import { categoryLabels, getProject, getStack, mobileApps, projects } from "@/data/projects";

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Written from a client's side: what they need, what they get, and a real example.
const services = [
  // Prices are Leou's starting rates; keep them in step with the budgets in lib/inquiry.ts.
  { icon: Globe, title: "Need a website?", body: "Modern websites that make your business look credible and turn visitors into inquiries.", price: "Starting at ₱25,000", priceNote: "up to 5 pages", example: "roll-up-cinnamons" },
  { icon: LayoutDashboard, title: "Need an internal tool?", body: "Dashboards, automation, portals, and systems built around your workflow.", price: "Starting at ₱50,000", example: "prior-authorization-emr" },
  { icon: Smartphone, title: "Have an app idea?", body: "From prototype to production, I’ll take your idea and turn it into a working product.", price: "Custom pricing", priceNote: "let’s scope it together", example: "air-rally" },
];

export default function Home() {
  const featured = projects.filter((p) => p.featured);
  const quoted = projects.filter((p) => p.testimonial?.quote);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="bg-grid absolute inset-0 animate-grid-in" />
        <div className="shell relative grid items-center gap-14 pt-10 pb-20 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-28">
          <div className="lg:col-span-7">
            <p className="eyebrow animate-fade-up">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              ALVN / Digital Products &amp; Experiences
            </p>
            <p className="mt-10 flex animate-fade-up items-end gap-4 [animation-delay:80ms]">
              <Image src="/brand/alvn-wordmark.png" alt="ALVN" width={219} height={64} preload className="h-12 w-auto sm:h-16" />
              <span className="pb-1 text-xs font-bold tracking-[0.24em] uppercase sm:text-sm">Built by Leou</span>
            </p>
            <h1 className="headline mt-8 animate-fade-up text-[clamp(2.75rem,5.4vw,4.75rem)] [animation-delay:160ms]">
              I turn business ideas into websites, apps, and digital products<span className="text-accent">.</span>
            </h1>
            <p className="mt-7 max-w-xl animate-fade-up text-lg text-pretty text-muted [animation-delay:240ms] sm:text-xl">
              From concept to launch, I design and build digital experiences that are made to actually work.
            </p>
            <div className="mt-10 flex animate-fade-up flex-wrap gap-3 [animation-delay:320ms]">
              <ButtonLink href="#work">Explore My Work</ButtonLink>
              <ButtonLink href="/contact" variant="outline">
                Start a Project
              </ButtonLink>
            </div>
            <p className="mt-14 animate-fade-up text-[11px] font-bold tracking-[0.32em] text-muted [animation-delay:400ms]">
              WEB · MOBILE · PRODUCT · EXPERIMENTS
            </p>
          </div>
          <Emblem preload className="mx-auto w-full max-w-[520px] lg:col-span-5" />
        </div>
      </section>

      {/* Selected work */}
      <section id="work" className="section pt-8 lg:pt-12">
        <SectionHeader
          eyebrow="01 — Work"
          title="Selected Work"
          action={
            <ButtonLink href="/projects" variant="outline">
              All projects
            </ButtonLink>
          }
        >
          A few things I’ve designed, built, and brought to life.
        </SectionHeader>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {featured.map((p, i) => {
            // The lead spans the row; with an even count the last one does too, so no card sits alone.
            const wide = i === 0 || (featured.length % 2 === 0 && i === featured.length - 1);
            return (
              <div key={p.id} className={`reveal ${wide ? "md:col-span-2" : ""}`}>
                <ProjectCard project={p} size={wide ? "lg" : "md"} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Services */}
      <section className="section">
        <SectionHeader eyebrow="02 — Services" title="How I Can Help">
          Whether you’re launching, streamlining how your team works, or starting from an idea.
        </SectionHeader>
        <div className="reveal mt-12 grid gap-px overflow-hidden rounded-[28px] border border-line bg-line sm:grid-cols-2">
          {services.map(({ icon: Icon, title, body, price, priceNote, example }, i) => {
            const project = getProject(example)!;
            const cut = project.name.lastIndexOf(" ") + 1; // the arrow wraps with the last word, never alone
            return (
              <div key={title} className="flex flex-col bg-cream p-8 lg:p-10">
                <div className="flex items-center justify-between">
                  <Icon aria-hidden className="size-6" strokeWidth={1.5} />
                  <span className="text-xs font-semibold text-muted tabular-nums">0{i + 1}</span>
                </div>
                <h3 className="mt-12 text-2xl font-semibold tracking-tight">{title}</h3>
                <p className="mt-3 text-pretty text-muted">{body}</p>
                <p className="mt-5 text-sm">
                  <span className="font-semibold text-navy">{price}</span>
                  {priceNote && <span className="text-muted"> · {priceNote}</span>}
                </p>
                <Link href={`/projects/${project.slug}`} className="group mt-auto w-fit pt-8 text-sm font-semibold">
                  See an example: {project.name.slice(0, cut)}
                  <span className="whitespace-nowrap">
                    {project.name.slice(cut)}
                    <ArrowRight aria-hidden className="ml-2 inline-block size-4 align-[-3px] text-accent transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </div>
            );
          })}
          <Link href="/contact" className="group on-dark flex flex-col justify-between gap-12 bg-navy p-8 text-cream lg:p-10">
            <span className="eyebrow text-cream/60!">Something else?</span>
            <span>
              <span className="block text-2xl font-semibold tracking-tight text-balance">Have an idea that doesn’t fit a box?</span>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                Start a Project
                <ArrowRight aria-hidden className="size-4 text-accent transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        </div>
        {quoted.length > 0 && (
          <div className="mt-16">
            <p className="eyebrow">What clients say</p>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {quoted.map((p) => (
                <figure key={p.slug} className="flex flex-col justify-between gap-8 rounded-[28px] border border-line bg-white/60 p-8">
                  <blockquote className="text-lg leading-relaxed text-pretty">“{p.testimonial!.quote}”</blockquote>
                  <figcaption className="flex items-center gap-3">
                    {p.logo && <Image src={p.logo} alt="" width={36} height={36} className="size-9 rounded-[22%]" />}
                    <span>
                      <span className="block font-semibold">{p.testimonial!.name}</span>
                      <Link href={`/projects/${p.slug}`} className="block text-sm text-muted hover:text-navy">
                        {[p.testimonial!.role, p.name].filter(Boolean).join(", ")}
                      </Link>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Catalog preview */}
      <section className="section">
        <SectionHeader
          eyebrow="03 — Catalog"
          title="Project Catalog"
          action={
            <ButtonLink href="/projects" variant="outline">
              Browse the catalog
            </ButtonLink>
          }
        >
          Websites, applications, experiments, and digital products.
        </SectionHeader>
        <ul className="mt-12 border-t border-line">
          {projects.map((p, i) => (
            <li key={p.id} className="border-b border-line">
              <Link
                href={`/projects/${p.slug}`}
                className="group flex items-center gap-5 py-6 transition-colors md:grid md:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)_13rem] md:gap-8 md:py-7"
              >
                <span className="self-start pt-1.5 text-xs font-semibold text-muted tabular-nums md:self-center md:pt-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 md:contents">
                  <span className="block text-xl font-semibold tracking-tight transition-colors sm:text-2xl">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted md:mt-0 md:text-base">{p.tagline}</span>
                </span>
                <span className="hidden text-[10.5px] font-bold tracking-[0.16em] text-muted uppercase md:block">
                  {p.categories.map((c) => categoryLabels[c]).join(" · ")}
                </span>
                <span className="flex items-center justify-end gap-4">
                  <StatusBadge status={p.status} className="hidden sm:inline-flex" />
                  <span className="grid size-10 place-items-center rounded-full ring-1 ring-line transition-colors group-hover:bg-navy group-hover:text-cream">
                    <ArrowUpRight aria-hidden className="size-4 transition-transform group-hover:rotate-45" />
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Mobile apps */}
      <section className="section">
        <SectionHeader
          eyebrow="04 — Mobile"
          title="Mobile Apps"
          action={
            <ButtonLink href="/apps" variant="outline">
              All apps
            </ButtonLink>
          }
        >
          Apps I’ve designed, developed, and experimented with.
        </SectionHeader>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {mobileApps.map((p) => (
            <div key={p.id} className="reveal">
              <AppCard project={p} />
            </div>
          ))}
        </div>
      </section>

      {/* Technology */}
      <section className="section">
        <SectionHeader eyebrow="05 — Stack" title="Technologies I Build With">
          The tools behind the work — drawn directly from the projects in this catalog.
        </SectionHeader>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {getStack().map(({ group, items }) => (
            <div key={group} className="border-t border-navy pt-6">
              <h3 className="eyebrow">{group}</h3>
              <ul className="mt-6 flex flex-wrap gap-2">
                {items.map((tech) => (
                  <li key={tech} className="rounded-full border border-line bg-white/60 px-3.5 py-1.5 text-sm font-medium">
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* About ALVN */}
      <section className="section">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="reveal rounded-[32px] border border-line bg-paper p-8 sm:p-12 lg:col-span-5">
            <Image
              src="/brand/alvn-lockup.png"
              alt="ALVN — Digital Products & Experiences"
              width={921}
              height={399}
              sizes="(min-width: 1024px) 400px, 85vw"
              className="h-auto w-full"
            />
            <p className="mt-10 border-t border-line pt-8 text-3xl font-semibold tracking-tight">Built by Leou.</p>
          </div>
          <div className="lg:col-span-7">
            <Eyebrow>06 — About ALVN</Eyebrow>
            <h2 className="headline mt-5 text-4xl sm:text-5xl">About ALVN</h2>
            <p className="mt-8 max-w-2xl text-xl leading-relaxed text-pretty sm:text-2xl">
              ALVN is my digital product portfolio — a place where I showcase the websites, applications, experiments, and ideas I’ve
              turned into working products.
            </p>
            <p className="mt-5 max-w-xl text-lg text-muted">
              I enjoy taking an idea from a rough concept and turning it into something people can actually use.
            </p>
            <ButtonLink href="/about" variant="outline" className="mt-10">
              More about ALVN
            </ButtonLink>
          </div>
        </div>
      </section>

      <StartProject />
    </>
  );
}
