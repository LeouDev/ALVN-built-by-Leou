import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

// The public site's chrome. The admin area (app/admin) has its own layout.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
