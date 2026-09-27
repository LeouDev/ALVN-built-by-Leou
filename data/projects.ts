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
  | "zap" | "gauge" | "box" | "chat" | "admin" | "publish"
  | "activity" | "sparkles" | "mail" | "globe" | "dashboard" | "qr" | "shield" | "palette" | "checklist" | "share";

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
      "A platform designed to make discovering pickleball venues, checking availability, and booking courts simple — on the web and in the iOS app.",
    categories: ["web-app", "mobile-app"],
    status: "live",
    year: 2026,
    featured: true,
    coverImage: "/projects/air-rally/desktop-1.webp",
    logo: "/projects/air-rally/icon.png",
    // videoUrl: "https://…",
    gallery: [
      { src: "/projects/air-rally/desktop-2.webp", alt: "Exploring courts with filters on air-rally.com", kind: "desktop" },
      { src: "/projects/air-rally/desktop-3.webp", alt: "AIR/Rally HQ venue page with the booking panel", kind: "desktop" },
      { src: "/projects/air-rally/desktop-4.webp", alt: "Why AIR/Rally and how booking works", kind: "desktop" },
      // iOS screens are the app's own App Store screenshots.
      { src: "/projects/air-rally/ios-1.webp", alt: "Finding a court in the iOS app", kind: "mobile" },
      { src: "/projects/air-rally/ios-2.webp", alt: "Setting up a ranked game", kind: "mobile" },
      { src: "/projects/air-rally/ios-3.webp", alt: "A ranked match found", kind: "mobile" },
      { src: "/projects/air-rally/ios-4.webp", alt: "The COURT/Side community feed", kind: "mobile" },
      { src: "/projects/air-rally/ios-5.webp", alt: "Player profile with rank", kind: "mobile" },
      { src: "/projects/air-rally/ios-6.webp", alt: "Choosing a referee for a ranked match", kind: "mobile" },
    ],
    technologies: ["Next.js", "React Native", "Expo", "TypeScript", "Tailwind CSS", "Supabase", "PayMongo", "Vercel"],
    platforms: ["Web", "iOS"],
    features: [
      { icon: "compass", title: "Discover", description: "Find courts by city, price, surface, and rating." },
      { icon: "calendar", title: "Booking", description: "Reserve open slots with live availability — double bookings are blocked at the database." },
      { icon: "card", title: "Payments", description: "Pay online at checkout through PayMongo." },
      { icon: "trophy", title: "Rankings", description: "Ranked matches with rank tiers, referees, and matchmaking." },
      { icon: "community", title: "COURT/Side", description: "A social feed where players share, follow, and rally together." },
      { icon: "dashboard", title: "For venue owners", description: "List a court, set hours and pricing, and follow bookings and earnings." },
    ],
    challenge:
      "Discovering venues, checking court availability, and booking a slot is often fragmented and manual.",
    solution:
      "AIR/Rally brings discovery, live availability, booking, payments, and ranked play into one platform — on the web and in the iOS app, on a shared Supabase backend.",
    role: "Concept, product design, and development across web and mobile.",
    liveUrl: "https://air-rally.com",
    appStoreUrl: "https://apps.apple.com/app/id6803324731",
    githubUrl: "https://github.com/LeouDev/AIR-Rally",
  },
  {
    id: "aprrc-2027",
    slug: "aprrc-2027",
    name: "APRRC '27",
    tagline: "Event website, organizer dashboard, and QR check-in for a regional conference.",
    description:
      "The official website for the Asia Pacific Regional Rotaract Conference 2027 in Cebu, Philippines — with an organizer dashboard for managing delegates and a phone-first QR check-in app for event-day staff.",
    categories: ["website", "web-app", "client"],
    status: "live",
    year: 2026,
    featured: true,
    coverImage: "/projects/aprrc-2027/desktop-1.webp",
    logo: "/projects/aprrc-2027/icon.png",
    gallery: [
      { src: "/projects/aprrc-2027/desktop-2.webp", alt: "About the event section on the APRRC '27 website", kind: "desktop" },
      { src: "/projects/aprrc-2027/desktop-3.webp", alt: "Welcome to Cebu destination guide", kind: "desktop" },
      { src: "/projects/aprrc-2027/desktop-4.webp", alt: "Event highlights and registration call to action", kind: "desktop" },
      { src: "/projects/aprrc-2027/mobile-1.webp", alt: "APRRC '27 homepage on a phone", kind: "mobile" },
      { src: "/projects/aprrc-2027/mobile-2.webp", alt: "Cebu destination guide on a phone", kind: "mobile" },
      { src: "/projects/aprrc-2027/mobile-3.webp", alt: "Event highlights on a phone", kind: "mobile" },
    ],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Prisma", "Supabase", "PostgreSQL", "Recharts", "Radix UI", "Vercel"],
    platforms: ["Web"],
    features: [
      { icon: "globe", title: "Event website", description: "Program, venue, and a destination guide for delegates across the Asia Pacific." },
      { icon: "dashboard", title: "Organizer dashboard", description: "Manage delegates, import registrations from CSV, and chart them by country and over time." },
      { icon: "qr", title: "QR check-in", description: "A phone-first scanner registration staff can install to their home screen." },
      { icon: "shield", title: "Staff access", description: "Admins approve scanner accounts and can revoke access instantly." },
    ],
    challenge:
      "A four-day international conference needed a public home for delegates, plus tools for organizers to track registrations and check people in on the day.",
    solution:
      "A Next.js site backed by Supabase Postgres through Prisma, with custom cookie-based admin auth, registration charts, and a QR scanner for the registration desk.",
    role: "Design and full-stack development.",
    liveUrl: "https://www.aprrc27cebuph.org",
    githubUrl: "https://github.com/LeouDev/APRRC2027",
  },
  {
    id: "roll-up-cinnamons",
    slug: "roll-up-cinnamons",
    name: "Roll Up Cinnamons",
    tagline: "Website and build-your-box ordering for a homemade bakery.",
    description:
      "A website for Roll Up Cinnamons, homemade cinnamon rolls in Lapu-Lapu City. Visitors build a box of four with their own mix of flavors, review the order, and send it through Messenger, where the bakery confirms every order.",
    categories: ["website", "client"],
    status: "live",
    year: 2026,
    featured: true,
    coverImage: "/projects/roll-up-cinnamons/desktop-1.webp",
    logo: "/projects/roll-up-cinnamons/icon.png",
    gallery: [
      { src: "/projects/roll-up-cinnamons/desktop-2.webp", alt: "The build-your-box flavor picker", kind: "desktop" },
      { src: "/projects/roll-up-cinnamons/desktop-3.webp", alt: "The Fresh From The Oven menu", kind: "desktop" },
      { src: "/projects/roll-up-cinnamons/desktop-4.webp", alt: "Ready to roll call to action and footer", kind: "desktop" },
      { src: "/projects/roll-up-cinnamons/mobile-1.webp", alt: "Roll Up Cinnamons homepage on a phone", kind: "mobile" },
      { src: "/projects/roll-up-cinnamons/mobile-2.webp", alt: "Building a box on a phone", kind: "mobile" },
      { src: "/projects/roll-up-cinnamons/mobile-3.webp", alt: "The menu on a phone", kind: "mobile" },
    ],
    technologies: ["React", "TypeScript", "Vite", "Tailwind CSS", "Vercel"],
    platforms: ["Web"],
    features: [
      { icon: "box", title: "Build your box", description: "Pick any four flavors for one box and review the order." },
      { icon: "chat", title: "Order via Messenger", description: "The finished order goes straight to the bakery’s Messenger — no checkout." },
      { icon: "admin", title: "Menu admin", description: "Update prices, flavors, photos, and sold-out items from a phone." },
      { icon: "publish", title: "One-tap publishing", description: "Each change is saved as a commit and the site rebuilds in about a minute." },
    ],
    challenge:
      "Customers needed an easy way to browse the menu and put an order together before messaging — and the bakery needed to keep prices and availability current without touching code.",
    solution:
      "A fast, prerendered site with a build-your-box flow that hands the order to Messenger, plus a password-protected admin that publishes menu changes through GitHub.",
    role: "Design and development.",
    liveUrl: "https://www.rollup-cinnamon.online",
    githubUrl: "https://github.com/LeouDev/Roll-Up-Cinnamons",
  },
  {
    id: "fat-fueled",
    slug: "fat-fueled",
    name: "Fat Fueled",
    tagline: "Marketing website for an endurance coaching brand.",
    description:
      "A marketing site for Fat Fueled, endurance coaching for triathlon, cycling, running, and swimming led by a UESCA-certified coach. Built around the brand’s own race-day photography.",
    categories: ["website", "client"],
    status: "live",
    year: 2026,
    featured: true,
    coverImage: "/projects/fat-fueled/desktop-1.webp",
    logo: "/projects/fat-fueled/icon.png",
    gallery: [
      { src: "/projects/fat-fueled/desktop-2.webp", alt: "Find your discipline section", kind: "desktop" },
      { src: "/projects/fat-fueled/desktop-3.webp", alt: "Athlete stories gallery", kind: "desktop" },
      { src: "/projects/fat-fueled/desktop-4.webp", alt: "Meet your coach section", kind: "desktop" },
      { src: "/projects/fat-fueled/mobile-1.webp", alt: "Fat Fueled homepage on a phone", kind: "mobile" },
      { src: "/projects/fat-fueled/mobile-2.webp", alt: "Disciplines on a phone", kind: "mobile" },
      { src: "/projects/fat-fueled/mobile-3.webp", alt: "Athlete stories on a phone", kind: "mobile" },
    ],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Brevo", "Vercel"],
    platforms: ["Web"],
    features: [
      { icon: "activity", title: "Four disciplines", description: "Clear paths into coaching for triathlon, cycling, running, and swimming." },
      { icon: "camera", title: "Real photography", description: "Every photo comes from the brand’s own Instagram feed." },
      { icon: "sparkles", title: "Bold motion", description: "Editorial type and restrained motion with Framer Motion." },
      { icon: "mail", title: "Enquiry form", description: "Validated on the server and emailed to the coach, ready to reply to." },
    ],
    challenge: "A coaching brand needed one place to explain its coaching across four disciplines and turn interest into enquiries.",
    solution:
      "A statically prerendered Next.js site built around the brand’s photography, with a server-validated contact form that emails each enquiry directly.",
    role: "Design and development.",
    liveUrl: "https://fat-fueled.vercel.app",
    githubUrl: "https://github.com/LeouDev/FatFueled",
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
    tagline: "A place where thoughts become art.",
    description:
      "An iOS-first social network where every post is a designed quote card: write a thought, then choose its typography, colors, background, and layout. Followers see the card, not plain text.",
    categories: ["mobile-app"],
    status: "coming-soon",
    year: 2026,
    featured: false, // shown in the home page's Mobile Apps section instead
    coverImage: "/projects/dicta/cover.webp",
    logo: "/projects/dicta/icon.png",
    // appStoreUrl: "https://apps.apple.com/…", // once it's on the App Store
    gallery: [
      // Screens cropped from the app's App Store screenshots.
      { src: "/projects/dicta/ios-1.webp", alt: "The DICTA feed of designed quote cards", kind: "mobile" },
      { src: "/projects/dicta/ios-2.webp", alt: "Designing a card with templates, fonts, and colors", kind: "mobile" },
      { src: "/projects/dicta/ios-3.webp", alt: "Sharing a card as a Story, post, or square", kind: "mobile" },
      { src: "/projects/dicta/ios-4.webp", alt: "A profile gallery of cards", kind: "mobile" },
      { src: "/projects/dicta/ios-5.webp", alt: "Discover trending quotes, topics, and creators", kind: "mobile" },
    ],
    technologies: ["Expo", "React Native", "TypeScript", "Supabase", "React Native Skia", "TanStack Query", "Zustand"],
    platforms: ["iOS"],
    features: [
      { icon: "quote", title: "Your thoughts, as art", description: "Every post is a designed quote card." },
      { icon: "palette", title: "Design it in seconds", description: "18 templates, 13 fonts, your colors and photos." },
      { icon: "share", title: "Share it everywhere", description: "Instagram and Facebook Stories, Threads, and X." },
      { icon: "community", title: "A gallery of your words", description: "Your cover photo, your cards, your people." },
      { icon: "compass", title: "Find words that move you", description: "Trending quotes, topics, and creators." },
      { icon: "chat", title: "Real conversation", description: "Likes, threaded comments, follows, saves, and realtime activity." },
    ],
    challenge: "In most feeds, words are just plain text — easy to scroll past.",
    solution:
      "DICTA turns every post into a designed quote card, with a visual editor, 18 templates, and a full social layer around it.",
    role: "Concept, product design, and development.",
    liveUrl: "https://dicta-orcin.vercel.app",
    githubUrl: "https://github.com/LeouDev/dicta",
  },
  {
    id: "prior-authorization-emr",
    slug: "prior-authorization-emr",
    name: "Prior Authorization EMR",
    tagline: "A productivity and performance tool for prior authorization operations.",
    description:
      "An internal performance command center for a prior authorization team. It imports the weekly performance workbook, checks every KPI against its threshold, and tracks the actions, scorecards, and quality audits that follow.",
    categories: ["web-app"],
    status: "private",
    year: 2026,
    featured: false,
    // Private project: screenshots must have every name (and anything identifying the company)
    // redacted before they're added, and never show patient data. No liveUrl or githubUrl, ever:
    // the owner asked that nothing here shows where or how to access it.
    coverImage: "/projects/prior-authorization-emr/cover.webp",
    gallery: [
      { src: "/projects/prior-authorization-emr/signing-in.webp", alt: "The EMR sign-in screen: Bringing the center online", kind: "desktop" },
    ],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "PostgreSQL", "Drizzle ORM", "Vercel"],
    platforms: ["Web"],
    features: [
      { icon: "table", title: "Workbook import", description: "Reads the weekly performance workbook instead of re-keying it." },
      { icon: "gauge", title: "KPI thresholds", description: "Evaluates each KPI against its target and flags what needs attention." },
      { icon: "checklist", title: "Action items", description: "Opens development actions and tracks them through to completion." },
      { icon: "dashboard", title: "Scorecards", description: "Monthly scorecards, quality audits, and a leader’s daily board in one place." },
    ],
    challenge:
      "Team performance lived in a weekly workbook, so spotting who needed support — and following through — was slow and manual.",
    solution: "A focused internal tool that turns the weekly workbook into KPI checks, action items, and scorecards leaders can act on.",
    role: "Design and full-stack development.",
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
  "React Native": "Mobile", Expo: "Mobile", iOS: "Mobile", Swift: "Mobile", "React Native Skia": "Mobile",
  PayMongo: "Backend", "Drizzle ORM": "Backend",
  Supabase: "Backend", PostgreSQL: "Backend", Prisma: "Backend", "Node.js": "Backend", APIs: "Backend", Authentication: "Backend",
  Resend: "Backend", Brevo: "Backend",
  Vercel: "Tools", GitHub: "Tools", Figma: "Tools", "AI development tools": "Tools",
};

/** Technologies actually used across the projects above, grouped for display. */
export function getStack() {
  const groups = new Map(["Frontend", "Mobile", "Backend", "Tools"].map((g) => [g, new Set<string>()]));
  for (const tech of projects.flatMap((p) => p.technologies)) groups.get(techGroups[tech] ?? "Frontend")!.add(tech);
  return [...groups].filter(([, items]) => items.size).map(([group, items]) => ({ group, items: [...items] }));
}
