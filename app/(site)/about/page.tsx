import type { Metadata } from "next";
import { LogoAnimation } from "@/components/LogoAnimation";
import { ButtonLink, Eyebrow, StartProject } from "@/components/ui";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description:
    "ALVN is Leou’s digital product portfolio — websites, applications, experiments, and ideas turned into working products.",
};

const practice = [
  "Thinking through products",
  "Designing interfaces",
  "Building websites",
  "Building mobile applications",
  "Creating web applications",
  "Experimenting with new ideas",
  "Turning concepts into working products",
];

export default function AboutPage() {
  return (
    <>
      <section className="shell pt-10 lg:pt-16">
        <Eyebrow>About</Eyebrow>
        <h1 className="headline mt-6 text-[clamp(3rem,9vw,7rem)] leading-[0.9]">Built by Leou.</h1>
        <div className="mt-12 grid gap-8 lg:grid-cols-12">
          <p className="text-2xl leading-snug font-medium tracking-tight text-balance sm:text-3xl lg:col-span-7">
            ALVN is my digital product portfolio — a place where I showcase the websites, applications, experiments, and ideas I’ve
            turned into working products.
          </p>
          <div className="lg:col-span-4 lg:col-start-9 lg:pt-2">
            <p className="text-lg text-muted">
              I enjoy taking an idea from a rough concept and turning it into something people can actually use.
            </p>
            <ButtonLink href={site.resumeUrl} external variant="outline" className="mt-8">
              More about the developer
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="shell py-16 lg:py-24">
        <figure className="overflow-hidden rounded-[36px] border border-line bg-paper">
          <LogoAnimation />
          <figcaption className="relative flex flex-col gap-2 border-t border-line px-8 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-10">
            <span className="eyebrow">ALVN · Digital Products &amp; Experiences</span>
            <span className="text-lg font-semibold">Built by Leou.</span>
          </figcaption>
        </figure>
        <p className="mt-6 max-w-2xl text-muted">
          ALVN is the brand; Leou is the person behind it. It’s a personal digital product brand — not an agency.
        </p>
      </section>

      <section className="section pt-0 lg:pt-0">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <h2 className="eyebrow self-start lg:col-span-3">What I do</h2>
          <ul className="border-t border-line lg:col-span-9">
            {practice.map((item, i) => (
              <li key={item} className="flex items-baseline gap-6 border-b border-line py-5">
                <span className="text-xs font-semibold text-muted tabular-nums">0{i + 1}</span>
                <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <StartProject />
    </>
  );
}
