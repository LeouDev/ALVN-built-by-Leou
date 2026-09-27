import { ButtonLink, Eyebrow } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[65vh] flex-col justify-center py-24">
      <Eyebrow>404</Eyebrow>
      <h1 className="headline mt-6 max-w-3xl text-[clamp(2.75rem,7vw,5.5rem)]">This page drifted out of orbit.</h1>
      <p className="mt-6 max-w-md text-lg text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/">Back to ALVN</ButtonLink>
        <ButtonLink href="/projects" variant="outline">
          Browse the work
        </ButtonLink>
      </div>
    </section>
  );
}
