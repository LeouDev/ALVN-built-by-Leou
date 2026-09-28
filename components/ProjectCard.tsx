import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { StatusBadge } from "@/components/ui";
import { type Project, categoryLabels } from "@/data/projects";

export function ProjectCard({ project, size = "md" }: { project: Project; size?: "md" | "lg" }) {
  const lg = size === "lg";
  return (
    <Link
      href={`/projects/${project.slug}`}
      className={`group flex h-full flex-col rounded-[28px] border border-line bg-white/55 p-2 transition duration-500 ease-out hover:-translate-y-1 hover:border-navy/20 hover:bg-white/80 hover:shadow-[0_30px_60px_-30px_rgb(7_26_45/0.35)] active:scale-[0.99] ${
        lg ? "lg:grid lg:grid-cols-12" : ""
      }`}
    >
      <div className={`relative aspect-[16/10] overflow-hidden rounded-[22px] bg-navy/5 ${lg ? "lg:col-span-8 lg:aspect-auto lg:min-h-[500px]" : ""}`}>
        <Image
          src={project.coverImage}
          alt=""
          fill
          sizes={lg ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 768px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <StatusBadge status={project.status} className="absolute top-4 left-4" />
      </div>
      <div className={`flex flex-1 flex-col px-4 pt-6 pb-4 sm:px-5 ${lg ? "lg:col-span-4 lg:justify-center lg:px-10" : ""}`}>
        <div className="flex items-center justify-between gap-4 text-[10.5px] font-bold tracking-[0.18em] text-muted uppercase">
          <span>{project.categories.map((c) => categoryLabels[c]).join(" · ")}</span>
          <span className="tabular-nums">{project.year}</span>
        </div>
        <h3 className={`mt-4 flex items-center gap-3 font-semibold tracking-[-0.03em] ${lg ? "text-3xl lg:text-5xl" : "text-3xl"}`}>
          {project.logo && <Image src={project.logo} alt="" width={36} height={36} className="size-9 rounded-[22%]" />}
          {project.name}
        </h3>
        <p className={`mt-3 text-pretty text-muted ${lg ? "text-lg" : ""}`}>{project.tagline}</p>
        {project.result && (
          <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-navy">
            <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2.5} />
            {project.result}
          </p>
        )}
        {/* What was built, in a client's words; the tech stack is on the project page. */}
        {project.features && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.features.slice(0, lg ? 5 : 3).map((f) => (
              <li key={f.title} className="rounded-full border border-line bg-white/70 px-3 py-1 text-xs font-semibold text-navy/75">
                {f.title}
              </li>
            ))}
          </ul>
        )}
        <span className={`mt-auto flex items-center gap-2 pt-8 text-sm font-semibold ${lg ? "lg:mt-10" : ""}`}>
          View Project
          <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-accent" />
        </span>
      </div>
    </Link>
  );
}
