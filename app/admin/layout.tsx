import type { Metadata, Viewport } from "next";
import { AdminAppBehavior } from "@/components/AdminAppBehavior";

// The admin doubles as a Home Screen app on iPhone and Android: installable, full screen, no zoom.
// Admin only: the public site stays zoomable (blocking zoom there would fail accessibility checks).
export const metadata: Metadata = {
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ALVN Admin", statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1, userScalable: false };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // `contents` keeps the wrapper out of the layout; it only marks admin pages for the CSS in globals.css.
  return (
    <div className="admin-app contents">
      <AdminAppBehavior />
      {children}
    </div>
  );
}
