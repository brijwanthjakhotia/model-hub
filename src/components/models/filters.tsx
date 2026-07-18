"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import {
  CATEGORIES,
  EXPERIENCE_LEVELS,
  GENDERS,
  SORT_OPTIONS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function GalleryFiltersBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showMobile, setShowMobile] = useState(false);

  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  // Keep local input in sync when params change externally (e.g. Clear).
  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  // Debounce the search field.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (search === current) return;
    const t = setTimeout(() => updateParam("q", search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const category = searchParams.get("category") ?? "";
  const gender = searchParams.get("gender") ?? "";
  const experience = searchParams.get("experience") ?? "";
  const sort = searchParams.get("sort") ?? "featured";

  const activeCount = [category, gender, experience].filter(Boolean).length;
  const hasFilters = activeCount > 0 || !!searchParams.get("q");

  function clearAll() {
    setSearch("");
    startTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="card-surface p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city or keyword…"
            className="pl-10"
            aria-label="Search talent"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMobile((v) => !v)}
            aria-expanded={showMobile}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                {activeCount}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <FilterSelects
              category={category}
              gender={gender}
              experience={experience}
              sort={sort}
              onChange={updateParam}
            />
          </div>
        </div>
      </div>

      {showMobile && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
          <FilterSelects
            category={category}
            gender={gender}
            experience={experience}
            sort={sort}
            onChange={updateParam}
            stacked
          />
        </div>
      )}

      {hasFilters && (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className={cn("text-xs text-muted-foreground", isPending && "animate-pulse")}>
            {isPending ? "Updating…" : "Filters applied"}
          </span>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="h-4 w-4" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}

function FilterSelects({
  category,
  gender,
  experience,
  sort,
  onChange,
  stacked,
}: {
  category: string;
  gender: string;
  experience: string;
  sort: string;
  onChange: (key: string, value: string) => void;
  stacked?: boolean;
}) {
  const cls = stacked ? "w-full" : "w-[9.5rem]";
  return (
    <>
      <Select
        aria-label="Category"
        value={category}
        onChange={(e) => onChange("category", e.target.value)}
        className={cls}
      >
        <option value="">All categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Gender"
        value={gender}
        onChange={(e) => onChange("gender", e.target.value)}
        className={cls}
      >
        <option value="">All genders</option>
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Experience"
        value={experience}
        onChange={(e) => onChange("experience", e.target.value)}
        className={cls}
      >
        <option value="">Any experience</option>
        {EXPERIENCE_LEVELS.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Sort by"
        value={sort}
        onChange={(e) => onChange("sort", e.target.value)}
        className={cls}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
    </>
  );
}
