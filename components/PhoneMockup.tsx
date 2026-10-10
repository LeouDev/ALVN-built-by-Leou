import Image from "next/image";
import { AppIcon, Orbits } from "@/components/ui";
import type { GalleryItem, Project } from "@/data/projects";

type Placeholder = "splash" | "feed" | "list";

/** A phone frame showing a real screenshot, or a styled placeholder screen until one is added. */
export function PhoneMockup({
  project,
  screen,
  placeholder = "splash",
  className = "",
}: {
  project: Project;
  screen?: GalleryItem;
  placeholder?: Placeholder;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[9/18.83] shrink-0 rounded-[16%/7.4%] bg-[#1a1a19] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.6)] ring-1 ring-white/15 ${className}`}
    >
      {/* Bezel via insets (not % padding, which resolves against the parent). Frame 9:18.83 leaves a 9:19.5 screen. */}
      <div className="@container absolute inset-x-[3.2%] inset-y-[1.53%] overflow-hidden rounded-[13%/6%] bg-cream">
        {screen ? (
          <Image src={screen.src} alt={screen.alt} fill sizes="(min-width: 1024px) 260px, 45vw" className="object-cover" />
        ) : (
          <PlaceholderScreen project={project} kind={placeholder} />
        )}
        <span aria-hidden className="absolute top-[1.8%] left-1/2 h-[3.3%] w-[30%] -translate-x-1/2 rounded-full bg-navy" />
      </div>
    </div>
  );
}

function PlaceholderScreen({ project, kind }: { project: Project; kind: Placeholder }) {
  if (kind === "splash")
    return (
      <div className="flex size-full flex-col items-center justify-center gap-[7cqw] bg-paper px-[10cqw] text-center">
        <AppIcon project={project} className="size-[26cqw] text-[12cqw]" />
        <div>
          <p className="text-[11cqw] leading-none font-bold tracking-[-0.03em] text-navy">{project.name}</p>
          <p className="mt-[3cqw] text-[5.5cqw] leading-snug text-muted">{project.tagline}</p>
        </div>
      </div>
    );

  const bar = "block h-[3.2cqw] rounded-full bg-navy/15";
  if (kind === "feed")
    return (
      <div aria-hidden className="flex size-full flex-col gap-[5cqw] bg-cream px-[6cqw] pt-[20cqw]">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-[7cqw] bg-white p-[5cqw]">
            <div className="flex items-center gap-[3cqw]">
              <span className="size-[9cqw] rounded-full bg-navy/12" />
              <span className={`${bar} w-[36cqw]`} />
            </div>
            <div className={`mt-[4cqw] aspect-[4/3] rounded-[4cqw] ${i ? "bg-navy" : "bg-linear-to-b from-[#8a8780] to-accent"}`} />
            <span className={`${bar} mt-[4cqw] w-[64cqw]`} />
          </div>
        ))}
      </div>
    );

  return (
    <div aria-hidden className="flex size-full flex-col bg-cream px-[6cqw] pt-[20cqw]">
      <span className="block h-[5cqw] w-[44cqw] rounded-full bg-navy" />
      <span className={`${bar} mt-[3cqw] w-[30cqw]`} />
      <div className="mt-[7cqw] space-y-[3.5cqw]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-[3.5cqw] rounded-[5cqw] bg-white p-[3.5cqw]">
            <span className="size-[13cqw] shrink-0 rounded-[3.5cqw] bg-navy/10" />
            <span className="flex-1 space-y-[2cqw]">
              <span className={`${bar} w-4/5`} />
              <span className={`${bar} w-1/2 bg-navy/8`} />
            </span>
            {i === 1 && <span className="h-[6cqw] w-[13cqw] rounded-full bg-accent" />}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Three phones on a navy stage: real mobile screenshots first, placeholders for any missing slots. */
export function PhoneStage({ project, className = "" }: { project: Project; className?: string }) {
  const screens = project.gallery?.filter((g) => g.kind === "mobile") ?? [];
  return (
    <div className={`on-dark relative isolate flex items-end justify-center gap-[3%] overflow-hidden bg-navy px-[7%] pt-14 ${className}`}>
      <Orbits className="absolute top-1/2 left-1/2 -z-10 size-[130%] -translate-x-1/2 -translate-y-1/3 text-cream/10" />
      <PhoneMockup project={project} screen={screens[1]} placeholder="list" className="w-[28%] translate-y-[16%]" />
      <PhoneMockup project={project} screen={screens[0]} placeholder="splash" className="z-10 w-[34%] translate-y-[6%]" />
      <PhoneMockup project={project} screen={screens[2]} placeholder="feed" className="w-[28%] translate-y-[16%]" />
    </div>
  );
}
