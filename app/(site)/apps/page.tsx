import type { Metadata } from "next";
import { AppCard } from "@/components/AppCard";
import { Eyebrow, StartProject } from "@/components/ui";
import { mobileApps } from "@/data/projects";

export const metadata: Metadata = {
  alternates: { canonical: "/apps" },
  title: "Apps",
  description: "Mobile experiences — apps I’ve designed, developed, and experimented with.",
};

export default function AppsPage() {
  return (
    <>
      <section className="shell pt-10 lg:pt-16">
        <Eyebrow>Apps</Eyebrow>
        <h1 className="headline mt-6 text-[clamp(2.75rem,7vw,5.75rem)]">Mobile Experiences</h1>
        <p className="mt-6 max-w-xl text-lg text-muted">Apps I’ve designed, developed, and experimented with.</p>
      </section>
      <section className="shell space-y-8 py-14 lg:py-20">
        {mobileApps.map((p) => (
          <div key={p.id} className="reveal">
            <AppCard project={p} />
          </div>
        ))}
      </section>
      <StartProject />
    </>
  );
}
