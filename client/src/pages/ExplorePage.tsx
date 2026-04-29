import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  Filter,
  Loader2,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  ThumbsUp,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCommunityStats, fetchExplore, fetchFavorites } from "../api";
import { ExploreCard } from "../components/config/ExploreCard";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { tagColor } from "../lib/colorUtils";
import { clearAllSeen } from "../lib/seenConfigs";
import { useAuthStore } from "../store/authStore";
import type {
  CommunityStats,
  ConfigRecord,
  ExploreResponse,
  FavoriteRecord,
} from "../types/config";
import { CATEGORIES } from "../types/config";

const SORT_OPTIONS = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "rating", label: "Top Rated", icon: Star },
  { value: "recent", label: "Most Recent", icon: Clock },
  { value: "views", label: "Most Viewed", icon: Eye },
  { value: "clones", label: "Most Cloned", icon: Copy },
  { value: "comments", label: "Most Discussed", icon: MessageSquare },
  { value: "likes", label: "Most Liked", icon: ThumbsUp },
];

const ALL_MAKES = [
  { value: "", label: "All Makes" },
  { value: "acura", label: "Acura" },
  { value: "audi", label: "Audi" },
  { value: "chevrolet", label: "Chevrolet" },
  { value: "chrysler", label: "Chrysler" },
  { value: "comma", label: "comma (body)" },
  { value: "cupra", label: "CUPRA" },
  { value: "dodge", label: "Dodge" },
  { value: "ford", label: "Ford" },
  { value: "genesis", label: "Genesis" },
  { value: "gmc", label: "GMC" },
  { value: "honda", label: "Honda" },
  { value: "hyundai", label: "Hyundai" },
  { value: "jeep", label: "Jeep" },
  { value: "kia", label: "Kia" },
  { value: "lexus", label: "Lexus" },
  { value: "lincoln", label: "Lincoln" },
  { value: "man", label: "MAN" },
  { value: "mazda", label: "Mazda" },
  { value: "nissan", label: "Nissan" },
  { value: "ram", label: "Ram" },
  { value: "rivian", label: "Rivian" },
  { value: "seat", label: "SEAT" },
  { value: "subaru", label: "Subaru" },
  { value: "skoda", label: "\u0160koda" },
  { value: "tesla", label: "Tesla" },
  { value: "toyota", label: "Toyota" },
  { value: "volkswagen", label: "Volkswagen" },
];

const BRANCH_OPTIONS = [
  { value: "", label: "All Branches" },
  { value: "stable-sp", label: "release.sunnypilot.ai (Stable)" },
  { value: "staging-sp", label: "staging.sunnypilot.ai (Staging)" },
  { value: "dev-sp", label: "dev.sunnypilot.ai (Dev)" },
];

export default function ExplorePage() {
  const token = useAuthStore((s) => s.token);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [debouncedModel, setDebouncedModel] = useState("");
  const [category, setCategory] = useState("");
  const [branch, setBranch] = useState("");
  const [spVersion, setSpVersion] = useState("");
  const [debouncedSpVersion, setDebouncedSpVersion] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sort, setSort] = useState<
    "trending" | "rating" | "recent" | "views" | "clones" | "comments" | "likes"
  >("trending");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const LIMIT = 20;

  /** Accumulated configs across Load More pages. Resets on any filter change. */
  const [allConfigs, setAllConfigs] = useState<ConfigRecord[]>([]);
  /** When true, the next data arrival appends rather than replaces allConfigs. */
  const loadMoreRef = useRef(false);

  /** Call before any filter change — resets page + clears accumulated results. */
  const resetForFilters = useCallback(() => {
    loadMoreRef.current = false;
    setAllConfigs([]);
    setPage(1);
  }, []);

  /** Fetches the next page and appends results to the current list. */
  const loadMore = useCallback(() => {
    loadMoreRef.current = true;
    setPage((p) => p + 1);
  }, []);

  // Debounce all free-text inputs — resets accumulated configs on change
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
      resetForFilters();
    }, 400);
    return () => clearTimeout(t);
  }, [q, resetForFilters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedModel(model);
      resetForFilters();
    }, 400);
    return () => clearTimeout(t);
  }, [model, resetForFilters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSpVersion(spVersion);
      resetForFilters();
    }, 400);
    return () => clearTimeout(t);
  }, [spVersion, resetForFilters]);

  const resetFilters = useCallback(() => {
    setQ("");
    setDebouncedQ("");
    setMake("");
    setModel("");
    setDebouncedModel("");
    setCategory("");
    setBranch("");
    setSpVersion("");
    setDebouncedSpVersion("");
    setActiveTags([]);
    setSort("rating");
    resetForFilters();
  }, [resetForFilters]);

  const hasFilters =
    debouncedQ ||
    make ||
    debouncedModel ||
    category ||
    branch ||
    debouncedSpVersion ||
    activeTags.length > 0;

  const { data, isLoading, isFetching, isError, refetch } =
    useQuery<ExploreResponse>({
      queryKey: [
        "explore",
        debouncedQ,
        make,
        debouncedModel,
        category,
        branch,
        debouncedSpVersion,
        activeTags,
        sort,
        page,
      ],
      queryFn: () =>
        fetchExplore({
          q: debouncedQ || undefined,
          make: make || undefined,
          model: debouncedModel || undefined,
          category: category || undefined,
          tags: activeTags.length ? activeTags : undefined,
          spVersion: debouncedSpVersion || undefined,
          branch: branch || undefined,
          sort,
          page,
          limit: LIMIT,
        }),
      staleTime: 30_000,
      placeholderData: (prev) => prev,
    });

  const { data: stats } = useQuery<CommunityStats>({
    queryKey: ["community-stats"],
    queryFn: fetchCommunityStats,
    staleTime: 60_000,
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: fetchFavorites,
    enabled: !!token,
    staleTime: 30_000,
  });

  const favoritedIds = useMemo(
    () => new Set((favorites ?? []).map((f: FavoriteRecord) => f.id)),
    [favorites],
  );

  // Accumulate results across pages; replace on filter change
  useEffect(() => {
    if (!data?.configs) return;
    if (loadMoreRef.current) {
      loadMoreRef.current = false;
      setAllConfigs((prev) => [...prev, ...data.configs]);
    } else {
      setAllConfigs(data.configs);
    }
  }, [data]);

  /**
   * Use accumulated configs when available; fall back to the latest fetched
   * data on the first render cycle before the useEffect fires. This prevents
   * a one-frame "No configs found" flash when stale cache data is returned
   * synchronously (isFetching=false) but allConfigs hasn't been populated yet.
   */
  const displayConfigs =
    allConfigs.length > 0 ? allConfigs : (data?.configs ?? []);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    resetForFilters();
  };

  return (
    <div className="min-h-screen">
      {/* Page heading */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 sticky top-[57px] z-20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
          {/* Title row */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">
                Community Configs
              </h1>
              {stats && stats.totalDrafts > 0 && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {stats.totalDrafts} drafts
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Sort selector — desktop */}
              <div className="hidden sm:flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setSort(value as typeof sort);
                      resetForFilters();
                    }}
                    className={clsx(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      sort === value
                        ? "bg-zinc-700 text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-300",
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
              {/* Mobile sort */}
              <div className="sm:hidden">
                <Select
                  value={sort}
                  onChange={(v) => {
                    setSort(v as typeof sort);
                    resetForFilters();
                  }}
                  options={SORT_OPTIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                  className="text-xs py-1.5"
                />
              </div>
              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw
                  className={clsx("w-4 h-4", isFetching && "animate-spin")}
                />
              </button>
            </div>
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, vehicle, model, tag…"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-9 pr-8 py-2 text-sm text-zinc-100
                           placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {/* Filter toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={clsx(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
                filtersOpen || hasFilters
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-400"
                  : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-zinc-300",
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {hasFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              )}
              {filtersOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-slide-down">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">
                  Make
                </label>
                <Select
                  value={make}
                  onChange={(v) => {
                    setMake(v);
                    resetForFilters();
                  }}
                  options={ALL_MAKES}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">
                  Model
                </label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Ioniq 5, Camry…"
                  className="input-base text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">
                  Category
                </label>
                <Select
                  value={category}
                  onChange={(v) => {
                    setCategory(v);
                    resetForFilters();
                  }}
                  options={[
                    { value: "", label: "All Categories" },
                    ...CATEGORIES.map((c) => ({
                      value: c.value,
                      label: c.label,
                    })),
                  ]}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">
                  Branch
                </label>
                <Select
                  value={branch}
                  onChange={(v) => {
                    setBranch(v);
                    resetForFilters();
                  }}
                  options={BRANCH_OPTIONS}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1 block">
                  SP Version
                </label>
                <input
                  value={spVersion}
                  onChange={(e) => setSpVersion(e.target.value)}
                  placeholder="e.g. 0.9.8"
                  className="input-base text-sm"
                />
              </div>
              {hasFilters && (
                <div className="sm:col-span-3">
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" /> Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Popular tags (from facets — always global across all shared configs) */}
          {data?.facets.tags && data.facets.tags.length > 0 && (
            <div className="flex items-start gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 mt-0.5" />
              {data.facets.tags.slice(0, 20).map(({ tag, count }) => {
                const isActive = activeTags.includes(tag);
                const color = tagColor(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border transition-all",
                      isActive
                        ? [color, "opacity-100 ring-1 ring-current/40"]
                        : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300",
                    )}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {tag}
                    <span className={isActive ? "opacity-60" : "text-zinc-600"}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Active filter chips */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {activeTags.map((t) => (
              <button
                key={t}
                onClick={() => toggleTag(t)}
                className="inline-flex items-center gap-1 text-xs font-mono bg-blue-600/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
              >
                <Tag className="w-2.5 h-2.5" /> {t}{" "}
                <X className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-zinc-500">
            {isFetching && displayConfigs.length === 0 ? (
              "Loading…"
            ) : (
              <>
                <span className="font-mono text-zinc-300">
                  {data?.total ?? 0}
                </span>{" "}
                configs
                {hasFilters && " found"}
              </>
            )}
          </p>
          <div className="flex items-center gap-4">
            {displayConfigs.length > 0 &&
              displayConfigs.length < (data?.total ?? 0) && (
                <p className="text-xs text-zinc-600 font-mono">
                  {displayConfigs.length} / {data?.total} loaded
                </p>
              )}
            <button
              onClick={clearAllSeen}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Mark all as seen
            </button>
            <Link to="/configure">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                New Config
              </Button>
            </Link>
          </div>
        </div>

        {/* Grid */}
        {isError ? (
          <div className="text-center py-16 space-y-3">
            <TrendingUp className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-zinc-400 text-sm">Failed to load configs</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (isLoading || isFetching) && displayConfigs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="card animate-pulse rounded-xl h-52" />
            ))}
          </div>
        ) : displayConfigs.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Search className="w-10 h-10 text-zinc-700 mx-auto" />
            <p className="text-zinc-300 text-sm font-medium">
              No configs found
            </p>
            <p className="text-zinc-600 text-xs">
              {hasFilters
                ? "Try adjusting your filters or search terms."
                : "Be the first to share a config!"}
            </p>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                leftIcon={<X className="w-3 h-3" />}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayConfigs.map((config) => (
                <ExploreCard
                  key={config.id}
                  config={config}
                  isFavorited={favoritedIds.has(config.id)}
                />
              ))}
            </div>

            {/* Load More */}
            {displayConfigs.length < (data?.total ?? 0) ? (
              <div className="flex flex-col items-center gap-3 mt-10">
                <p className="text-xs text-zinc-600 font-mono">
                  Showing {displayConfigs.length} of {data?.total} configs
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadMore}
                  disabled={isFetching}
                  rightIcon={
                    isFetching ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : undefined
                  }
                >
                  {isFetching
                    ? "Loading…"
                    : `Load ${Math.min(LIMIT, (data?.total ?? 0) - displayConfigs.length)} more`}
                </Button>
              </div>
            ) : displayConfigs.length > 0 ? (
              <p className="text-center text-xs text-zinc-700 mt-10 font-mono">
                All {displayConfigs.length} configs loaded
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
