export const site = {
  name: "ALVN",
  title: "ALVN — Built by Leou",
  descriptor: "Digital Products & Experiences",
  resumeUrl: "https://leoudev.github.io/LeouComendador/",
  description:
    "I build digital products that turn ideas into businesses: websites, apps, and custom digital experiences, designed and built from the ground up.",
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
