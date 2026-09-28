import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { ButtonLink, Eyebrow } from "@/components/ui";

// The site-wide 404 renders outside the (site) group, so it brings the public chrome itself.
export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main">
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
      </main>
      <Footer />
    </>
  );
}
