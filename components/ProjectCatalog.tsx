"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { type Category, categoryFilters, categoryLabels, projects } from "@/data/projects";

export function ProjectCatalog() {
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const inCategory = (c: Category | "all") => projects.filter((p) => c === "all" || p.categories.includes(c));
  const results = inCategory(category).filter(
    (p) =>
      !q ||
      [p.name, p.tagline, p.description, ...p.technologies, ...p.categories.map((c) => categoryLabels[c])]
        .join(" ")
        .toLowerCase()
        .includes(q),
  );

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
          {categoryFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={category === f.value}
              onClick={() => setCategory(f.value)}
              className="rounded-full border border-line bg-white/50 px-4 py-2 text-sm font-semibold text-navy/75 transition-colors hover:border-navy/30 hover:text-navy aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-cream"
            >
              {f.label}
              <sup className="ml-1 text-[10px] font-bold opacity-60">{inCategory(f.value).length}</sup>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-80">
          <span className="sr-only">Search projects</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full rounded-full border border-line bg-white/70 py-3 pr-4 pl-11 text-base outline-none placeholder:text-muted/80 focus:border-navy focus:ring-4 focus:ring-navy/10 sm:text-sm"
          />
        </label>
      </div>

      <p aria-live="polite" className="mt-8 text-sm text-muted">
        {results.length} {results.length === 1 ? "project" : "projects"}
      </p>

      {results.length ? (
        <ul className="mt-5 grid gap-6 md:grid-cols-2">
          {results.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-5 rounded-[28px] border border-dashed border-navy/20 px-6 py-20 text-center">
          <p className="text-2xl font-semibold tracking-tight">Nothing here yet.</p>
          <p className="mt-2 text-muted">Try another category or search term.</p>
        </div>
      )}
    </div>
  );
}
