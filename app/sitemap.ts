import type { MetadataRoute } from "next";
import { projects } from "@/data/projects";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "/projects", "/apps", "/about", "/contact", ...projects.map((p) => `/projects/${p.slug}`)];
  return paths.map((path) => ({ url: `${site.url}${path}` }));
}
