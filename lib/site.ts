export const site = {
  name: "ALVN",
  title: "ALVN — Built by Leou",
  descriptor: "Digital Products & Experiences",
  resumeUrl: "https://leoudev.github.io/LeouComendador/",
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
