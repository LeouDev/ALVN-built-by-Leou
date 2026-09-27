import { PhoneStage } from "@/components/PhoneMockup";
import { AppIcon, ButtonLink } from "@/components/ui";
import { type Project, statusLabels } from "@/data/projects";

/** Mobile app showcase. Stacks when narrow; goes side-by-side when its container is wide. */
export function AppCard({ project }: { project: Project }) {
  const platforms = project.platforms?.filter((p) => p !== "Web") ?? [];
  return (
    <article className="@container overflow-hidden rounded-[32px] border border-line bg-white/55">
      <div className="grid @3xl:grid-cols-2">
        <div className="flex flex-col p-7 sm:p-10 @3xl:p-14">
          <div className="flex items-center gap-4">
            <AppIcon project={project} />
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">{project.name}</h3>
              <p className="mt-0.5 text-sm text-muted">{[...platforms, statusLabels[project.status]].join(" · ")}</p>
            </div>
          </div>
          <p className="mt-8 text-2xl font-semibold tracking-tight text-balance @3xl:text-3xl">{project.tagline}</p>
          <p className="mt-3 text-pretty text-muted">{project.description}</p>
          <div className="mt-8 flex flex-wrap gap-3 @3xl:mt-auto @3xl:pt-12">
            <ButtonLink href={`/projects/${project.slug}`}>View Project</ButtonLink>
            {project.appStoreUrl && (
              <ButtonLink href={project.appStoreUrl} external variant="outline">
                App Store
              </ButtonLink>
            )}
            {project.googlePlayUrl && (
              <ButtonLink href={project.googlePlayUrl} external variant="outline">
                Google Play
              </ButtonLink>
            )}
          </div>
        </div>
        <PhoneStage project={project} className="order-first min-h-[340px] sm:min-h-[420px] @3xl:order-none @3xl:min-h-[560px]" />
      </div>
    </article>
  );
}
