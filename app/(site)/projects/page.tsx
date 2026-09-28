import type { Metadata } from "next";
import { ProjectCatalog } from "@/components/ProjectCatalog";
import { Eyebrow, StartProject } from "@/components/ui";

export const metadata: Metadata = {
  title: "Work",
  description: "Everything I’ve built — websites, applications, experiments, and digital products.",
};

export default function ProjectsPage() {
  return (
    <>
      <section className="shell pt-10 pb-24 lg:pt-16">
        <Eyebrow>Work</Eyebrow>
        <h1 className="headline mt-6 max-w-4xl text-[clamp(2.75rem,7vw,5.75rem)]">Everything I’ve Built</h1>
        <p className="mt-6 max-w-xl text-lg text-muted">Websites, applications, experiments, and digital products.</p>
        <div className="mt-14">
          <ProjectCatalog />
        </div>
      </section>
      <StartProject />
    </>
  );
}
