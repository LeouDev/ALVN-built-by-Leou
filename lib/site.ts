export const site = {
  name: "ALVN",
  title: "ALVN — Built by Leou",
  descriptor: "Digital Products & Experiences",
  resumeUrl: "https://leoudev.github.io/LeouComendador/",
  // Google Calendar appointment schedule. Use the full calendar.google.com URL: the calendar.app.google
  // short link refuses to load in an iframe. Empty hides the "Book a call" option on /contact.
  bookingUrl: "https://calendar.google.com/calendar/appointments/schedules/AcZssZ3bfCtciD93xo6RSa0rn4cnQ6C1Tyg5lal9-VTDeEdPUz2yCTyv9r1tnz6hBLJAzxH0JUvRbvGT",
  description:
    "Ideas, designed and built into digital experiences. A growing collection of websites, apps, experiments, and digital products built by Leou.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
};

export const navLinks = [
  { href: "/projects", label: "Work" },
  { href: "/apps", label: "Apps" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
