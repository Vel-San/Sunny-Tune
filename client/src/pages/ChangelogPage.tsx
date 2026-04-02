import { Tag } from "lucide-react";

interface Release {
  version: string;
  date: string;
  tags?: string[];
  changes: { type: "added" | "changed" | "fixed" | "removed"; text: string }[];
}

const RELEASES: Release[] = [
  {
    version: "1.6.0",
    date: "2026-04-03",
    tags: ["feature", "backend"],
    changes: [
      {
        type: "added",
        text: "Config version history — each save creates a snapshot; browse and restore via the History button in the editor",
      },
      {
        type: "added",
        text: "Config A/B comparison — select two configs in My Configs and open a parameter-level diff",
      },
      {
        type: "added",
        text: "Collections / playlists — group related configs into named collections from the My Configs page",
      },
      {
        type: "added",
        text: "Trending this week sort on Explore (weighted by recent ratings, clones, and views over 7 days)",
      },
      {
        type: "added",
        text: "QR code on share links — instantly scan to open on your Comma device",
      },
      {
        type: "added",
        text: "Verified vehicle list — 200+ supported makes/models with autocomplete",
      },
      {
        type: "added",
        text: "Server-side pagination for My Configs (up to 12 per page, with total count)",
      },
      {
        type: "added",
        text: "GIN index on configurations.config JSONB column for fast SP-version filtering",
      },
      {
        type: "added",
        text: "Dashboard page with personal stats and community overviews",
      },
      { type: "added", text: "Changelog and Documentation pages" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-04-02",
    tags: ["feature", "backend"],
    changes: [
      {
        type: "added",
        text: "Config versioning — version counter increments on every save (shown as v2, v3… on cards)",
      },
      {
        type: "added",
        text: "SP version and branch badges on config cards and Explore cards",
      },
      {
        type: "added",
        text: "Enhanced card details — rating count, comment count, branch, SP version",
      },
      {
        type: "changed",
        text: "Shared configs are now editable by their owner — removed read-only lock on share",
      },
      {
        type: "added",
        text: "server-side comment threading — reply button up to depth 2, buildTree client helper",
      },
      {
        type: "added",
        text: "In-app notifications — bell icon in header, polls unread count every 60 s, notified on clone/rating/reply",
      },
      {
        type: "added",
        text: "Content reporting — flag button on configs and comments (up to 2000-char reason)",
      },
      {
        type: "added",
        text: "Config history pagination (My Configs), section deep-links (hash routing), unsaved-changes navigation guard",
      },
      {
        type: "added",
        text: "/health endpoint with live DB ping and environment info",
      },
      { type: "added", text: "Structured JSON logging (server-side)" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-04-01",
    tags: ["feature"],
    changes: [
      {
        type: "added",
        text: "Config import from JSON file (drag-and-drop or file picker) with Zod schema validation",
      },
      {
        type: "added",
        text: "Config export — downloads full SPConfig JSON from editor or My Configs cards",
      },
      {
        type: "added",
        text: "Config diff viewer (A/B) on SharedConfigPage — compare shared configs against clones or prior versions",
      },
      {
        type: "added",
        text: "Min SP Version filter on Explore page (semver prefix match)",
      },
      {
        type: "added",
        text: "Favorites / bookmarks — heart icon on Explore cards, Favorites tab in My Configs",
      },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-03-31",
    tags: ["security"],
    changes: [
      {
        type: "added",
        text: "Bcrypt-hashed admin secret support (ADMIN_SECRET_HASH env var)",
      },
      {
        type: "added",
        text: "Global and per-route write rate limiting (express-rate-limit)",
      },
      { type: "added", text: "Helmet HTTP headers with strict CSP" },
      {
        type: "added",
        text: "Zod validation on all query parameters and request bodies",
      },
      {
        type: "added",
        text: "Control-character stripping on all user-supplied text (XSS hardening)",
      },
      {
        type: "added",
        text: "Page-view deduplication (24-hour TTL per visitor)",
      },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-31",
    tags: ["feature"],
    changes: [
      {
        type: "added",
        text: "Clone tracking with lineage link (clonedFrom on config cards)",
      },
      {
        type: "added",
        text: "Community ratings (1–5 stars) with per-config summary and breakdown",
      },
      { type: "added", text: "Comments with author handle and timestamps" },
      {
        type: "added",
        text: "Admin panel — users list, configs list, page-view dashboard, force-unshare",
      },
      {
        type: "added",
        text: "Explore facets — tag and make filters update dynamically based on shared configs",
      },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-31",
    tags: ["feature"],
    changes: [
      {
        type: "added",
        text: "Explore page — browse all shared configs with multi-filter search",
      },
      { type: "added", text: "Share modal with one-click link copy" },
      {
        type: "added",
        text: "Shared config detail page (public, no auth required)",
      },
      {
        type: "added",
        text: "Anonymous user tokens (UUID bearer auth with revoke support)",
      },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-03-30",
    tags: ["release"],
    changes: [
      {
        type: "added",
        text: "Initial release — full 10-section SunnyPilot config editor",
      },
      {
        type: "added",
        text: "Create, update, delete, and save configurations (PostgreSQL + Prisma)",
      },
      {
        type: "added",
        text: "Dark zinc-themed UI (React 18 + Vite + Tailwind CSS)",
      },
      { type: "added", text: "Docker Compose dev and production environments" },
      {
        type: "added",
        text: "TypeScript throughout (client + server); 100% type-safe API layer",
      },
    ],
  },
];

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  added: {
    label: "Added",
    className: "text-green-400  bg-green-950/50  border-green-800/50",
  },
  changed: {
    label: "Changed",
    className: "text-blue-400   bg-blue-950/50   border-blue-800/50",
  },
  fixed: {
    label: "Fixed",
    className: "text-amber-400  bg-amber-950/50  border-amber-800/50",
  },
  removed: {
    label: "Removed",
    className: "text-red-400    bg-red-950/50    border-red-800/50",
  },
};

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Changelog</h1>
        <p className="text-sm text-zinc-500 mt-1">
          A history of every SunnyTune release — what changed and when.
        </p>
      </div>

      <div className="relative border-l-2 border-zinc-800 pl-6 space-y-10">
        {RELEASES.map((release, idx) => (
          <div key={release.version} className="relative">
            {/* Timeline dot */}
            <div className="absolute -left-[29px] top-1 w-3 h-3 rounded-full bg-zinc-700 border-2 border-zinc-900" />

            {/* Header */}
            <div className="flex flex-wrap items-baseline gap-3 mb-3">
              <h2 className="text-lg font-bold text-zinc-100">
                v{release.version}
              </h2>
              <span className="text-xs text-zinc-500 font-mono">
                {release.date}
              </span>
              {idx === 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-950/50 border border-blue-800/50 px-2 py-0.5 rounded">
                  Latest
                </span>
              )}
              {release.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded"
                >
                  <Tag className="w-2.5 h-2.5" /> {tag}
                </span>
              ))}
            </div>

            {/* Changes */}
            <ul className="space-y-2">
              {release.changes.map((change, i) => {
                const meta = TYPE_LABELS[change.type];
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className={`inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border mt-0.5 flex-shrink-0 ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                    <span className="text-sm text-zinc-400 leading-relaxed">
                      {change.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
