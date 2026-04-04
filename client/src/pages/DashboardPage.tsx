import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  BookMarked,
  Car,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  FolderOpen,
  GitBranch,
  Hash,
  Layers,
  MessageSquare,
  Plus,
  Share2,
  Star,
  Tag,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchAllConfigs, fetchCommunityStats, fetchExplore } from "../api";
import { Button } from "../components/ui/Button";
import type {
  CommunityStats,
  ConfigRecord,
  ExploreResponse,
} from "../types/config";

// ─── Chart primitives (CSS-only) ─────────────────────────────────────────────

function HBar({
  data,
  colorFn,
}: {
  data: { label: string; value: number; color?: string }[];
  colorFn?: (label: string, i: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 w-28 truncate flex-shrink-0 text-right">
            {d.label}
          </span>
          <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden min-w-0">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-500",
                colorFn ? colorFn(d.label, i) : (d.color ?? "bg-blue-500"),
              )}
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 w-7 text-right flex-shrink-0 tabular-nums">
            {d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DonutRing({
  pct,
  color,
  size = 56,
  children,
}: {
  pct: number;
  color: string;
  size?: number;
  children?: React.ReactNode;
}) {
  const safe = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} 0% ${safe}%, #27272a ${safe}% 100%)`,
      }}
    >
      <div
        className="rounded-full bg-zinc-950 flex items-center justify-center"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        {children ?? (
          <span className="text-[10px] font-bold text-zinc-300">{safe}%</span>
        )}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  accent = "zinc",
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  accent?: string;
}) {
  const accents: Record<string, string> = {
    blue: "bg-blue-950/20 border-blue-900/30",
    amber: "bg-amber-950/20 border-amber-900/30",
    green: "bg-green-950/20 border-green-900/30",
    purple: "bg-purple-950/20 border-purple-900/30",
    red: "bg-red-950/20 border-red-900/30",
    zinc: "bg-zinc-900/50 border-zinc-800",
  };
  return (
    <div
      className={clsx(
        "rounded-xl p-4 border space-y-2",
        accents[accent] ?? accents.zinc,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </span>
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
      </div>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 leading-snug">{sub}</p>}
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────

function ChartCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-4",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-zinc-500" />
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-end gap-3 mb-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {title}
        </h2>
        {sub && <p className="text-[11px] text-zinc-700 mt-0.5">{sub}</p>}
      </div>
      <div className="flex-1 border-t border-zinc-800/60" />
    </div>
  );
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderRow({
  rank,
  config,
  metric,
  metricLabel,
  metricColor = "text-zinc-300",
}: {
  rank: number;
  config: ConfigRecord;
  metric: string | number;
  metricLabel: string;
  metricColor?: string;
}) {
  const dest = config.shareToken
    ? `/shared/${config.shareToken}`
    : `/configure/${config.id}`;
  return (
    <Link
      to={dest}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors group"
    >
      <span className="text-xs font-bold text-zinc-700 w-4 text-center flex-shrink-0">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-300 truncate group-hover:text-blue-400 transition-colors">
          {config.name}
        </p>
        <p className="text-[10px] text-zinc-600 truncate">
          {[config.vehicleMake, config.vehicleModel]
            .filter(Boolean)
            .join(" ") || "No vehicle"}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={clsx("text-xs font-bold tabular-nums", metricColor)}>
          {metric}
        </p>
        <p className="text-[10px] text-zinc-600">{metricLabel}</p>
      </div>
    </Link>
  );
}

// ─── Tag pill cloud ───────────────────────────────────────────────────────────

function TagCloud({ tags }: { tags: { label: string; count: number }[] }) {
  const max = Math.max(...tags.map((t) => t.count), 1);
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => {
        const weight = t.count / max;
        const size =
          weight > 0.7 ? "text-sm" : weight > 0.4 ? "text-xs" : "text-[10px]";
        const bg =
          weight > 0.7
            ? "bg-blue-900/40 border-blue-700/40 text-blue-300"
            : weight > 0.4
              ? "bg-zinc-800 border-zinc-700 text-zinc-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-600";
        return (
          <span
            key={t.label}
            className={clsx(
              "border rounded-full px-2 py-0.5 font-medium",
              size,
              bg,
            )}
          >
            #{t.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function Empty({ msg }: { msg: string }) {
  return <p className="text-xs text-zinc-600 py-3 text-center">{msg}</p>;
}

// ─── Palette helpers ──────────────────────────────────────────────────────────

const PALETTE = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-cyan-500",
  "bg-pink-500",
  "bg-orange-500",
];
function paletteColor(_: string, i: number) {
  return PALETTE[i % PALETTE.length];
}

const PERSONALITY_COLORS: Record<string, string> = {
  relaxed: "bg-blue-500",
  standard: "bg-green-500",
  aggressive: "bg-orange-500",
};
const BRANCH_COLORS: Record<string, string> = {
  "stable-sp": "bg-green-500",
  "dev-sp": "bg-amber-500",
  nightly: "bg-red-500",
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();

  // ── Queries (all in parallel) ─────────────────────────────────────────────
  const { data: myConfigs = [], isLoading: configsLoading } = useQuery<
    ConfigRecord[]
  >({
    queryKey: ["dashboard-my-configs"],
    queryFn: fetchAllConfigs,
  });
  const { data: communityStats } = useQuery<CommunityStats>({
    queryKey: ["community-stats"],
    queryFn: fetchCommunityStats,
    staleTime: 2 * 60 * 1000,
  });
  const { data: trendingData } = useQuery<ExploreResponse>({
    queryKey: ["dashboard-trending"],
    queryFn: () => fetchExplore({ sort: "trending", limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: topViewedData } = useQuery<ExploreResponse>({
    queryKey: ["dashboard-top-viewed"],
    queryFn: () => fetchExplore({ sort: "views", limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: topRatedData } = useQuery<ExploreResponse>({
    queryKey: ["dashboard-top-rated"],
    queryFn: () => fetchExplore({ sort: "rating", limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });
  const { data: topClonedData } = useQuery<ExploreResponse>({
    queryKey: ["dashboard-top-cloned"],
    queryFn: () => fetchExplore({ sort: "clones", limit: 5 }),
    staleTime: 5 * 60 * 1000,
  });

  // ── Personal stats ────────────────────────────────────────────────────────
  const personalStats = useMemo(() => {
    const shared = myConfigs.filter((c) => c.isShared);
    const totalViews = myConfigs.reduce((s, c) => s + (c.viewCount ?? 0), 0);
    const totalClones = myConfigs.reduce((s, c) => s + (c.cloneCount ?? 0), 0);
    const totalRatings = myConfigs.reduce(
      (s, c) => s + (c.ratingCount ?? 0),
      0,
    );
    const ratedConfigs = myConfigs.filter((c) => c.avgRating != null);
    const avgRating =
      ratedConfigs.length > 0
        ? ratedConfigs.reduce((s, c) => s + c.avgRating!, 0) /
          ratedConfigs.length
        : null;
    const versioned = myConfigs.filter((c) => (c.version ?? 1) > 1).length;
    const totalTags = new Set(myConfigs.flatMap((c) => c.tags)).size;
    const sharedPct = myConfigs.length
      ? Math.round((shared.length / myConfigs.length) * 100)
      : 0;
    const versionedPct = myConfigs.length
      ? Math.round((versioned / myConfigs.length) * 100)
      : 0;
    return {
      shared: shared.length,
      totalViews,
      totalClones,
      totalRatings,
      avgRating,
      versioned,
      totalTags,
      sharedPct,
      versionedPct,
    };
  }, [myConfigs]);

  // ── Category distribution ─────────────────────────────────────────────────
  const categoryDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      const k = c.category || "uncategorized";
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({
        label,
        value,
        color: PALETTE[i % PALETTE.length],
      }));
  }, [myConfigs]);

  // ── Driving personality distribution ───────────────────────────────────────
  const personalityDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      const p =
        (c.config as any)?.drivingPersonality?.longitudinalPersonality ??
        "unknown";
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value,
        color: PERSONALITY_COLORS[label] ?? "bg-zinc-500",
      }));
  }, [myConfigs]);

  // ── SP branch distribution ───────────────────────────────────────────────
  const branchDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      const b = (c.config as any)?.metadata?.branch ?? "unknown";
      counts[b] = (counts[b] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        color: BRANCH_COLORS[label] ?? "bg-zinc-500",
      }));
  }, [myConfigs]);

  // ── SP version distribution ──────────────────────────────────────────────
  const versionDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      const v = (c.config as any)?.metadata?.sunnypilotVersion ?? "unknown";
      counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));
  }, [myConfigs]);

  // ── Tag distribution ─────────────────────────────────────────────────────
  const tagDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      for (const t of c.tags) {
        counts[t] = (counts[t] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([label, count]) => ({ label, count }));
  }, [myConfigs]);

  // ── Top personal configs ──────────────────────────────────────────────────
  const myTopByViews = useMemo(
    () =>
      [...myConfigs]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, 6)
        .map((c) => ({ label: c.name, value: c.viewCount ?? 0 })),
    [myConfigs],
  );
  const myTopByClones = useMemo(
    () =>
      [...myConfigs]
        .sort((a, b) => (b.cloneCount ?? 0) - (a.cloneCount ?? 0))
        .slice(0, 6)
        .map((c) => ({ label: c.name, value: c.cloneCount ?? 0 })),
    [myConfigs],
  );

  // ── Make distribution (personal) ─────────────────────────────────────────
  const makeDist = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of myConfigs) {
      const m = c.vehicleMake || "unknown";
      counts[m] = (counts[m] ?? 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value], i) => ({
        label,
        value,
        color: PALETTE[i % PALETTE.length],
      }));
  }, [myConfigs]);

  // ── Recent configs ───────────────────────────────────────────────────────
  const recentConfigs = useMemo(
    () =>
      [...myConfigs]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6),
    [myConfigs],
  );

  // ── Engagement score ─────────────────────────────────────────────────────
  const engagementScore = useMemo(() => {
    const numerator =
      personalStats.totalViews +
      personalStats.totalClones * 3 +
      personalStats.totalRatings * 5;
    if (personalStats.shared === 0) return null;
    return Math.round(numerator / personalStats.shared);
  }, [personalStats]);

  if (configsLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 h-24 bg-zinc-900/30"
            />
          ))}
        </div>
      </div>
    );
  }

  const hasConfigs = myConfigs.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Your performance + platform analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/explore")}
          >
            Explore
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate("/configure")}
          >
            New Config
          </Button>
        </div>
      </div>

      {/* ── YOUR ACCOUNT ─────────────────────────────────────────────────── */}
      <section>
        <SectionHead
          title="Your Account"
          sub="Aggregated stats across all your configs"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Configs"
            value={myConfigs.length}
            icon={FolderOpen}
          />
          <StatCard
            label="Shared"
            value={personalStats.shared}
            icon={Share2}
            accent="blue"
            sub={`${personalStats.sharedPct}% of total`}
          />
          <StatCard
            label="Total Views"
            value={personalStats.totalViews.toLocaleString()}
            icon={Eye}
            accent="blue"
            sub="views on shared configs"
          />
          <StatCard
            label="Total Clones"
            value={personalStats.totalClones}
            icon={Copy}
            accent="green"
            sub="times your configs were cloned"
          />
          <StatCard
            label="Ratings"
            value={personalStats.totalRatings}
            icon={Star}
            accent="amber"
            sub="community ratings received"
          />
          <StatCard
            label="Avg Rating"
            value={
              personalStats.avgRating != null
                ? personalStats.avgRating.toFixed(1) + " ★"
                : "—"
            }
            icon={Star}
            accent="amber"
            sub={
              personalStats.avgRating != null
                ? "across rated configs"
                : "no ratings yet"
            }
          />
        </div>

        {/* Ring indicators */}
        {hasConfigs && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-zinc-800 p-3 flex items-center gap-3">
              <DonutRing
                pct={personalStats.sharedPct}
                color="#3b82f6"
                size={52}
              />
              <div>
                <p className="text-xs font-semibold text-zinc-300">Shared</p>
                <p className="text-[10px] text-zinc-600">
                  {personalStats.shared} of {myConfigs.length} published
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 p-3 flex items-center gap-3">
              <DonutRing
                pct={personalStats.versionedPct}
                color="#22c55e"
                size={52}
              />
              <div>
                <p className="text-xs font-semibold text-zinc-300">Versioned</p>
                <p className="text-[10px] text-zinc-600">
                  {personalStats.versioned} configs updated &gt;1×
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 p-3 flex items-center gap-3">
              <DonutRing
                pct={Math.min(
                  100,
                  (personalStats.totalTags / Math.max(myConfigs.length, 1)) *
                    20,
                )}
                color="#a855f7"
                size={52}
              >
                <span className="text-[10px] font-bold text-zinc-300">
                  {personalStats.totalTags}
                </span>
              </DonutRing>
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Unique Tags
                </p>
                <p className="text-[10px] text-zinc-600">across all configs</p>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-800 p-3 flex items-center gap-3">
              <DonutRing
                pct={Math.min(100, (engagementScore ?? 0) / 2)}
                color="#f59e0b"
                size={52}
              >
                <span className="text-[10px] font-bold text-zinc-300">
                  {engagementScore ?? "—"}
                </span>
              </DonutRing>
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Engagement
                </p>
                <p className="text-[10px] text-zinc-600">
                  score per shared config
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── YOUR CONFIG BREAKDOWN ────────────────────────────────────────── */}
      {hasConfigs && (
        <section>
          <SectionHead
            title="Your Config Breakdown"
            sub="Distribution of your configs by key attributes"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <ChartCard title="Category" icon={FolderOpen}>
              {categoryDist.length > 0 ? (
                <HBar data={categoryDist} />
              ) : (
                <Empty msg="No categories set." />
              )}
            </ChartCard>
            <ChartCard title="Driving Personality" icon={Wrench}>
              {personalityDist.length > 0 ? (
                <HBar
                  data={personalityDist}
                  colorFn={(l) =>
                    PERSONALITY_COLORS[l.toLowerCase()] ?? "bg-zinc-500"
                  }
                />
              ) : (
                <Empty msg="No configs yet." />
              )}
            </ChartCard>
            <ChartCard title="SP Branch" icon={GitBranch}>
              {branchDist.length > 0 ? (
                <HBar
                  data={branchDist}
                  colorFn={(l) => BRANCH_COLORS[l] ?? "bg-zinc-500"}
                />
              ) : (
                <Empty msg="No configs yet." />
              )}
            </ChartCard>
            <ChartCard title="SP Version" icon={Zap}>
              {versionDist.length > 0 ? (
                <HBar data={versionDist} colorFn={paletteColor} />
              ) : (
                <Empty msg="No configs yet." />
              )}
            </ChartCard>
          </div>
        </section>
      )}

      {/* ── YOUR MAKES + TAGS ────────────────────────────────────────────── */}
      {hasConfigs && (makeDist.length > 0 || tagDist.length > 0) && (
        <section>
          <SectionHead
            title="Vehicles & Tags"
            sub="Which makes and tags appear most in your collection"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {makeDist.length > 0 && (
              <ChartCard title="Vehicle Makes" icon={Car}>
                <HBar data={makeDist} colorFn={paletteColor} />
              </ChartCard>
            )}
            {tagDist.length > 0 && (
              <ChartCard title="Your Tags" icon={Tag}>
                <TagCloud tags={tagDist} />
              </ChartCard>
            )}
          </div>
        </section>
      )}

      {/* ── YOUR TOP PERFORMERS ──────────────────────────────────────────── */}
      {hasConfigs && (
        <section>
          <SectionHead
            title="Your Top Performers"
            sub="Your most-engaged shared configs"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Top by Views" icon={Eye}>
              {myTopByViews.every((d) => d.value === 0) ? (
                <Empty msg="Share a config to start getting views." />
              ) : (
                <HBar data={myTopByViews} colorFn={paletteColor} />
              )}
            </ChartCard>
            <ChartCard title="Top by Clones" icon={Copy}>
              {myTopByClones.every((d) => d.value === 0) ? (
                <Empty msg="No clones recorded yet." />
              ) : (
                <HBar data={myTopByClones} colorFn={paletteColor} />
              )}
            </ChartCard>
          </div>
        </section>
      )}

      {/* ── PLATFORM OVERVIEW ────────────────────────────────────────────── */}
      {communityStats && (
        <section>
          <SectionHead
            title="Platform Overview"
            sub="All-time stats across the entire SunnyTune community"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label="Shared Configs"
              value={communityStats.sharedConfigs.toLocaleString()}
              icon={Share2}
              accent="blue"
            />
            <StatCard
              label="Total Views"
              value={(communityStats.totalViews ?? 0).toLocaleString()}
              icon={Eye}
              accent="blue"
            />
            <StatCard
              label="Total Clones"
              value={(communityStats.totalClones ?? 0).toLocaleString()}
              icon={Copy}
              accent="green"
            />
            <StatCard
              label="Ratings"
              value={communityStats.totalRatings.toLocaleString()}
              icon={Star}
              accent="amber"
            />
            <StatCard
              label="Comments"
              value={communityStats.totalComments.toLocaleString()}
              icon={MessageSquare}
              accent="purple"
            />
            <StatCard
              label="Makes Represented"
              value={communityStats.supportedMakes}
              icon={Car}
              accent="zinc"
            />
          </div>
        </section>
      )}

      {/* ── LEADERBOARDS + TRENDING ──────────────────────────────────────── */}
      <section>
        <SectionHead
          title="Community Leaderboards"
          sub="Top configs by views, rating, and clones"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Trending */}
          <ChartCard title="Trending This Week" icon={TrendingUp}>
            {trendingData?.configs.length ? (
              <div className="space-y-0.5">
                {trendingData.configs.map((c, i) => (
                  <LeaderRow
                    key={c.id}
                    rank={i + 1}
                    config={c}
                    metric={c.viewCount}
                    metricLabel="views"
                    metricColor="text-blue-400"
                  />
                ))}
              </div>
            ) : (
              <Empty msg="No trending data yet." />
            )}
          </ChartCard>

          {/* Top viewed */}
          <ChartCard title="Most Viewed" icon={Eye}>
            {topViewedData?.configs.length ? (
              <div className="space-y-0.5">
                {topViewedData.configs.map((c, i) => (
                  <LeaderRow
                    key={c.id}
                    rank={i + 1}
                    config={c}
                    metric={c.viewCount.toLocaleString()}
                    metricLabel="views"
                    metricColor="text-cyan-400"
                  />
                ))}
              </div>
            ) : (
              <Empty msg="No data yet." />
            )}
          </ChartCard>

          {/* Top rated */}
          <ChartCard title="Top Rated" icon={Star}>
            {topRatedData?.configs.length ? (
              <div className="space-y-0.5">
                {topRatedData.configs.map((c, i) => (
                  <LeaderRow
                    key={c.id}
                    rank={i + 1}
                    config={c}
                    metric={
                      c.avgRating != null ? c.avgRating.toFixed(1) + " ★" : "—"
                    }
                    metricLabel={`${c.ratingCount ?? 0} ratings`}
                    metricColor="text-amber-400"
                  />
                ))}
              </div>
            ) : (
              <Empty msg="No ratings yet." />
            )}
          </ChartCard>

          {/* Top cloned */}
          <ChartCard title="Most Cloned" icon={Copy}>
            {topClonedData?.configs.length ? (
              <div className="space-y-0.5">
                {topClonedData.configs.map((c, i) => (
                  <LeaderRow
                    key={c.id}
                    rank={i + 1}
                    config={c}
                    metric={c.cloneCount}
                    metricLabel="clones"
                    metricColor="text-green-400"
                  />
                ))}
              </div>
            ) : (
              <Empty msg="No clones yet." />
            )}
          </ChartCard>
        </div>
      </section>

      {/* ── COMMUNITY BREAKDOWN ──────────────────────────────────────────── */}
      {communityStats && (
        <section>
          <SectionHead
            title="Community Breakdown"
            sub="What makes, categories, and tags are most popular platform-wide"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ChartCard title="Top Vehicle Makes" icon={Car}>
              {communityStats.topMakes?.length ? (
                <HBar
                  data={communityStats.topMakes.map((m, i) => ({
                    label: m.make,
                    value: m.count,
                    color: PALETTE[i % PALETTE.length],
                  }))}
                  colorFn={paletteColor}
                />
              ) : (
                <Empty msg="No data yet." />
              )}
            </ChartCard>

            <ChartCard title="Top Categories" icon={BookMarked}>
              {communityStats.topCategories?.length ? (
                <HBar
                  data={communityStats.topCategories.map((c, i) => ({
                    label: c.category,
                    value: c.count,
                    color: PALETTE[i % PALETTE.length],
                  }))}
                  colorFn={paletteColor}
                />
              ) : (
                <Empty msg="No categories set." />
              )}
            </ChartCard>

            <ChartCard title="Popular Tags" icon={Hash}>
              {communityStats.topTags?.length ? (
                <TagCloud
                  tags={communityStats.topTags.map((t) => ({
                    label: t.tag,
                    count: t.count,
                  }))}
                />
              ) : (
                <Empty msg="No tags yet." />
              )}
            </ChartCard>
          </div>
        </section>
      )}

      {/* ── QUICK LINKS ──────────────────────────────────────────────────── */}
      <section>
        <SectionHead title="Quick Links" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              to: "/explore",
              label: "Explore Configs",
              icon: Layers,
              sub: "Browse the community",
            },
            {
              to: "/configs",
              label: "My Configs",
              icon: FolderOpen,
              sub: "Manage your library",
            },
            {
              to: "/changelog",
              label: "Changelog",
              icon: Clock,
              sub: "What's new",
            },
            {
              to: "/docs",
              label: "Documentation",
              icon: BookMarked,
              sub: "How everything works",
            },
          ].map(({ to, label, icon: Icon, sub }) => (
            <Link
              key={to}
              to={to}
              className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 flex items-center gap-3 hover:border-zinc-600 hover:bg-zinc-800/30 transition-colors group"
            >
              <Icon className="w-5 h-5 text-zinc-600 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100">
                  {label}
                </p>
                <p className="text-[10px] text-zinc-600">{sub}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-zinc-700 ml-auto flex-shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── RECENTLY UPDATED ─────────────────────────────────────────────── */}
      {recentConfigs.length > 0 && (
        <section>
          <SectionHead
            title="Recently Updated"
            sub="Your last 6 modified configs"
          />
          <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
            {recentConfigs.map((c) => (
              <Link
                key={c.id}
                to={`/configure/${c.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-800/30 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-300 group-hover:text-blue-400 truncate">
                      {c.name}
                    </p>
                    {c.isShared && (
                      <span className="text-[9px] font-semibold uppercase tracking-wider bg-green-900/30 border border-green-700/40 text-green-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Live
                      </span>
                    )}
                    {(c.version ?? 1) > 1 && (
                      <span className="text-[9px] font-mono text-zinc-600 flex-shrink-0">
                        v{c.version}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5 truncate">
                    {[c.vehicleMake, c.vehicleModel, c.vehicleYear]
                      .filter(Boolean)
                      .join(" · ") || "No vehicle set"}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-600 flex-shrink-0">
                  {c.isShared && (
                    <>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {c.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        {c.cloneCount}
                      </span>
                    </>
                  )}
                  {c.avgRating != null && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500" />
                      {c.avgRating.toFixed(1)}
                    </span>
                  )}
                  <span className="hidden sm:block">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Link
              to="/configs"
              className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
            >
              View all configs <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      )}

      {/* Empty state */}
      {!hasConfigs && (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-400 mb-1">
            No configs yet
          </h3>
          <p className="text-xs text-zinc-600 mb-4">
            Create your first config to see your personal stats here.
          </p>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => navigate("/configure")}
          >
            Create Config
          </Button>
        </div>
      )}
    </div>
  );
}
