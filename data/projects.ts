// The single source of truth for the portfolio. To add a project:
//   1. add an entry to `projects` below
//   2. drop its assets in /public/projects/<slug>/
// Home, /projects, /projects/[slug], /apps, and the tech section pick it up automatically.
// Only fill in links that really exist — empty ones are never rendered.

export type Category = "website" | "web-app" | "mobile-app" | "experiment" | "client";
export type Status = "live" | "in-development" | "coming-soon" | "concept" | "private";
export type Platform = "Web" | "iOS" | "Android";
export type IconName =
  | "compass" | "calendar" | "card" | "trophy"
  | "workflow" | "transform" | "table" | "chart"
  | "thought" | "quote" | "camera" | "community"
  | "zap" | "gauge";

export type Feature = { title: string; description: string; icon: IconName };

export type GalleryItem = {
  src: string;
  alt: string;
  /** desktop: wide screenshot · mobile: phone screen (9:19.5) · video: .mp4/.webm file */
  kind?: "desktop" | "mobile" | "video";
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categories: Category[];
  status: Status;
  year: number;
  featured: boolean;
  coverImage: string;
  logo?: string;
  gallery?: GalleryItem[];
  technologies: string[];
  platforms?: Platform[];
  features?: Feature[];
  role?: string;
  liveUrl?: string;
  appStoreUrl?: string;
  googlePlayUrl?: string;
  githubUrl?: string;
  videoUrl?: string;
  challenge?: string;
  solution?: string;
  outcome?: string;
};

export const projects: Project[] = [
  {
    id: "air-rally",
    slug: "air-rally",
    name: "AIR/Rally",
    tagline: "Pickleball discovery and booking platform.",
    description:
      "A platform designed to make discovering pickleball venues, checking availability, and booking courts simple.",
    categories: ["web-app", "mobile-app"],
    status: "live",
    year: 2026,
    featured: true,
    coverImage: "/projects/air-rally/cover.svg",
    // logo: "/projects/air-rally/icon.png",
    // liveUrl: "https://…",
    // appStoreUrl: "https://apps.apple.com/…",
    // videoUrl: "https://…",
    gallery: [
      // { src: "/projects/air-rally/web-discover.webp", alt: "Venue discovery on desktop", kind: "desktop" },
      // { src: "/projects/air-rally/ios-booking.webp", alt: "Booking a court on iOS", kind: "mobile" },
      // { src: "/projects/air-rally/promo.mp4", alt: "AIR/Rally promo video", kind: "video" },
    ],
    technologies: ["React", "TypeScript", "Supabase", "Expo", "React Native", "Vercel"],
    platforms: ["Web", "iOS"],
    features: [
      { icon: "compass", title: "Discover", description: "Find pickleball courts and venues." },
      { icon: "calendar", title: "Booking", description: "Reserve available schedules." },
      { icon: "card", title: "Payments", description: "Support digital payment workflows." },
      { icon: "trophy", title: "Rankings", description: "Competitive ranking and matchmaking." },
    ],
    challenge:
      "Discovering venues, checking court availability, and booking a slot is often fragmented and manual.",
    solution:
      "AIR/Rally brings venue discovery, availability, booking, and payments into one platform — on the web and on mobile.",
    role: "Concept, product design, and development across web and mobile.",
  },
  {
    id: "dataverse",
    slug: "dataverse",
    name: "DataVerse",
    tagline: "Simplifying data analytics.",
    description:
      "A data analytics platform concept designed to simplify workflows normally handled through spreadsheets, pivot tables, Power Query, dashboards, and data transformation tools.",
    categories: ["web-app"],
    status: "in-development",
    year: 2026,
    featured: true,
    coverImage: "/projects/dataverse/cover.svg",
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "React Flow", "Recharts", "Zustand"],
    platforms: ["Web"],
    features: [
      { icon: "workflow", title: "Visual workflows", description: "Build data transformations as connected steps." },
      { icon: "transform", title: "Transform", description: "Clean, reshape, and combine data without Power Query." },
      { icon: "table", title: "Pivot & summarize", description: "Group and aggregate without wrestling pivot tables." },
      { icon: "chart", title: "Dashboards", description: "Turn results into charts and dashboards." },
    ],
    challenge:
      "Everyday analysis is spread across spreadsheets, pivot tables, Power Query, and separate dashboard tools — powerful, but fragmented and hard to learn.",
    solution: "DataVerse brings transformation, analysis, and visualization into a single, simpler workflow.",
    role: "Concept, product design, and development.",
  },
  {
    id: "dicta",
    slug: "dicta",
    name: "DICTA",
    tagline: "Thoughts worth sharing.",
    description:
      "A social platform combining thoughts, quotes, photography, and community interaction into a positive creative feed.",
    categories: ["mobile-app"],
    status: "coming-soon",
    year: 2026,
    featured: true,
    coverImage: "/projects/dicta/cover.svg",
    // logo: "/projects/dicta/icon.png",
    // liveUrl: "https://…",
    // appStoreUrl: "https://apps.apple.com/…",
    // videoUrl: "https://…",
    gallery: [
      // { src: "/projects/dicta/feed.webp", alt: "The DICTA feed", kind: "mobile" },
    ],
    technologies: [],
    platforms: ["iOS"],
    features: [
      { icon: "thought", title: "Thoughts", description: "Share short thoughts and ideas." },
      { icon: "quote", title: "Quotes", description: "Post and discover quotes worth keeping." },
      { icon: "camera", title: "Photography", description: "Pair words with images — or let photos speak." },
      { icon: "community", title: "Community", description: "Connect in a feed designed to stay positive." },
    ],
    challenge: "Social feeds often reward noise over substance, leaving little room for thoughtful, creative sharing.",
    solution:
      "DICTA combines thoughts, quotes, photography, and community interaction into one positive, creative feed.",
    role: "Concept, product design, and development.",
  },
  {
    id: "prior-authorization-emr",
    slug: "prior-authorization-emr",
    name: "Prior Authorization EMR",
    tagline: "A productivity and performance tool for prior authorization operations.",
    description:
      "An internal web application that supports prior authorization teams with tools for day-to-day productivity and performance visibility.",
    categories: ["web-app"],
    status: "private",
    year: 2026,
    featured: false,
    // Private project: only ever use sanitized, illustrative visuals. No patient, employee,
    // credential, or company data — in images, copy, or links.
    coverImage: "/projects/prior-authorization-emr/cover.svg",
    technologies: [],
    platforms: ["Web"],
    features: [
      { icon: "zap", title: "Productivity", description: "Tools that streamline day-to-day prior authorization work." },
      { icon: "gauge", title: "Performance", description: "Visibility into individual and team performance." },
    ],
    challenge:
      "Prior authorization operations involve high-volume, detail-heavy work where productivity and performance are hard to see.",
    solution: "A focused internal tool that helps teams work efficiently and understand performance at a glance.",
    role: "Design and development of an internal tool.",
  },
];

export const categoryLabels: Record<Category, string> = {
  website: "Website",
  "web-app": "Web App",
  "mobile-app": "Mobile App",
  experiment: "Experiment",
  client: "Client Project",
};

export const categoryFilters: { value: Category | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "website", label: "Websites" },
  { value: "web-app", label: "Web Apps" },
  { value: "mobile-app", label: "Mobile Apps" },
  { value: "experiment", label: "Experiments" },
  { value: "client", label: "Client Projects" },
];

export const statusLabels: Record<Status, string> = {
  live: "Live",
  "in-development": "In Development",
  "coming-soon": "Coming Soon",
  concept: "Concept",
  private: "Private",
};

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
export const mobileApps = projects.filter((p) => p.categories.includes("mobile-app"));

// Tech section groups. Anything not listed here counts as Frontend.
const techGroups: Record<string, string> = {
  "React Native": "Mobile", Expo: "Mobile", iOS: "Mobile", Swift: "Mobile",
  Supabase: "Backend", PostgreSQL: "Backend", "Node.js": "Backend", APIs: "Backend", Authentication: "Backend",
  Vercel: "Tools", GitHub: "Tools", Figma: "Tools", "AI development tools": "Tools",
};

/** Technologies actually used across the projects above, grouped for display. */
export function getStack() {
  const groups = new Map(["Frontend", "Mobile", "Backend", "Tools"].map((g) => [g, new Set<string>()]));
  for (const tech of projects.flatMap((p) => p.technologies)) groups.get(techGroups[tech] ?? "Frontend")!.add(tech);
  return [...groups].filter(([, items]) => items.size).map(([group, items]) => ({ group, items: [...items] }));
}
