import { Tag } from "lucide-react";
import { useEffect } from "react";
import { APP_VERSION } from "../lib/version";

interface Release {
  version: string;
  date: string;
  tags?: string[];
  changes: { type: "added" | "changed" | "fixed" | "removed"; text: string }[];
}

const RELEASES: Release[] = [
  {
    version: "2.2.3",
    date: "2026-04-30",
    tags: ["feature", "ux"],
    changes: [
      {
        type: "added",
        text: "Likes — thumbs-up social signal on every shared config; any user (including the owner) can like a config once; like count updates in real-time with optimistic UI",
      },
      {
        type: "added",
        text: "Like button on Explore cards — compact thumbs-up icon in the stats row (next to views, clones, and comments); turns blue when liked and reflects the live count immediately",
      },
      {
        type: "added",
        text: "Like button on shared config page — full-size button in the action row; shows the running count and updates optimistically on click",
      },
      {
        type: "added",
        text: "Like count on personal config cards (My Configs) — when a shared config has received likes the thumbs-up count appears in the stats row",
      },
      {
        type: "added",
        text: "Dashboard — Likes column in both personal (Your Account) and platform-wide (Platform Overview) stat grids; new 'Top by Likes' bar chart under Your Top Performers; likes contribute 2 points each to the Engagement score",
      },
      {
        type: "added",
        text: "Most Liked sort on Explore page — sort all shared configs by total like count descending",
      },
      {
        type: "added",
        text: "SunnyLink Wiki and sunnypilot Docs links added to the new Resources section in the Docs page",
      },
      {
        type: "fixed",
        text: "Dev Docker container: Prisma client is now regenerated on every container start so schema changes take effect without rebuilding the image",
      },
    ],
  },
  {
    version: "2.2.2",
    date: "2026-04-07",
    tags: ["feature", "fix", "ux"],
    changes: [
      {
        type: "added",
        text: "Import confirmation modal with diff — importing a config while an active session is open now shows a confirmation dialog with a full parameter-level diff before applying the new config, preventing accidental overwrites",
      },
      {
        type: "added",
        text: "Onroad Brightness Delay — new Display setting controlling how long to wait before applying a screen brightness change (Immediate to 30 s); fully supported in SunnyLink import/export",
      },
      {
        type: "added",
        text: "Save confirmation modal — clicking Save now shows a confirmation dialog with the config name, version, and a 'View what will change' button that opens a full parameter diff against the last saved version before committing",
      },
      {
        type: "added",
        text: "Username shown in the token pill — when a display name is set, it appears inside the token button in the top-right header (both desktop and mobile) so you always know which account is active",
      },
      {
        type: "fixed",
        text: "Save/Discard navigation guard no longer fires when importing a config — the blocker was capturing a stale isDirty value; it now reads live store state",
      },
      {
        type: "fixed",
        text: "Import button is hidden on already-saved or shared configs — it only appears on new unsaved configs to prevent unintended overwrites",
      },
      {
        type: "fixed",
        text: "Vehicle-specific parameter changes now appear correctly in diff views — they were previously silently ignored due to a missing section label",
      },
      {
        type: "fixed",
        text: "Version history (History modal) now loads correctly for all users on shared config pages — previously returned 403 Access Denied for non-owners even when the config was publicly shared",
      },
      {
        type: "fixed",
        text: "Saving a new config for the first time no longer immediately triggers the 'Unsaved changes' navigation guard — navigation now waits until React has committed the clean state before the URL changes",
      },
    ],
  },
  {
    version: "2.2.1",
    date: "2026-04-06",
    tags: ["feature", "ux"],
    changes: [
      {
        type: "added",
        text: "Display name (username) — set a personal name in the Access Token modal (key icon in header); it appears on your shared configs and auto-fills the comment nickname field across all shared config pages",
      },
      {
        type: "added",
        text: "One-time setup banner — on your first visit after this update, a dismissable blue banner prompts you to set your display name; it won't appear again once dismissed or a username is saved",
      },
      {
        type: "changed",
        text: "Vehicle makes list updated to 27 brands: Acura, Audi, Chevrolet, Chrysler, comma (body), CUPRA, Dodge, Ford, Genesis, GMC, Honda, Hyundai, Jeep, Kia, Lexus, Lincoln, MAN, Mazda, Nissan, Ram, Rivian, SEAT, Subaru, Škoda, Tesla, Toyota, Volkswagen — replaces the previous 19-make list",
      },
    ],
  },
  {
    version: "2.2.0",
    date: "2026-04-05",
    tags: ["feature", "fix", "ux"],
    changes: [
      {
        type: "added",
        text: "17 new sunnypilot parameters: Lane Turn Desire, Adjust Lane Turn Speed, Map Advisory Speed Limit, Show Advanced Controls, Language, Interactivity Timeout, Real-time Acceleration Bar, sunnypilot Enabled, GSM APN, GSM Roaming, Max Time Offroad, Disable Power Down, Wake Up Behavior, Disable Updates — and a brand new Vehicle Specific section with Tesla Cooperative Steering, Subaru Stop & Go, and Toyota Enforce Factory Longitudinal",
      },
      {
        type: "added",
        text: "SP Docs audit: TorqueParamsOverrideFriction key corrected, 4 missing FIELD_HELP entries added, plus entries for all 17 new parameters; docs sync date updated to 2026-04-08",
      },
      {
        type: "changed",
        text: "Save button is now disabled (greyed out) for existing configs when there are no unsaved changes",
      },
      {
        type: "changed",
        text: "Version counter only increments when config data actually changes — metadata-only saves (name, description, tags, category) no longer bump the version or create a history snapshot",
      },
      {
        type: "changed",
        text: "ShareModal now uses local state — editing the share form no longer marks the config as dirty, so the Unsaved Changes navigation guard no longer fires after sharing",
      },
      {
        type: "fixed",
        text: "Old configs missing newly added sections (e.g. vehicleSpecific) no longer crash when loaded — deep-merged with createDefaultConfig() defaults on load",
      },
      {
        type: "fixed",
        text: "Server now accepts configs containing the new vehicleSpecific section — previously returned 400 Invalid payload",
      },
      {
        type: "fixed",
        text: "Config cards now have fully uniform height regardless of whether a config is shared, has tags, has stats, or was cloned — all optional slot containers now reserve a fixed minimum height",
      },
      {
        type: "fixed",
        text: "New + Updated badges now both display simultaneously on a card; neon rings are constrained to card bounds",
      },
      {
        type: "fixed",
        text: "History button on the shared config page is now visible to all users, not only the config owner",
      },
      {
        type: "fixed",
        text: "Dashboard Top Configs charts no longer log React duplicate-key warnings when multiple configs share the same name",
      },
    ],
  },
  {
    version: "2.1.0",
    date: "2026-04-06",
    tags: ["feature", "ux", "fix"],
    changes: [
      {
        type: "added",
        text: "Subsection headers inside every config section — both in the config editor and the shared config viewer, making it easier to navigate large parameter sets at a glance",
      },
      {
        type: "added",
        text: "Config comparison feature — compare any public shared config (or your own saved configs) against the currently viewed config, with a per-section diff showing old and new values",
      },
      {
        type: "added",
        text: "Token import — in the Access Token modal, paste a token from another device to take over your existing account without regenerating a new token",
      },
      {
        type: "added",
        text: "Changelog glow pulse — the Changelog nav item shows a blue pulsing dot when a new app version has been released and the user hasn't visited the page yet",
      },
      {
        type: "added",
        text: "SP Docs Sync badge — a small badge in the header nav links to the GitHub Actions docs-audit workflow, showing the last date the sunnypilot docs were synced with the tooltip database",
      },
      {
        type: "changed",
        text: "All help-tooltip doc links now point to the sunnypilot community documentation hub (community.sunnypilot.ai) instead of individual docs.sunnypilot.ai anchors",
      },
    ],
  },
  {
    version: "2.0.2",
    date: "2026-04-05",
    tags: ["feature", "fix", "ux"],
    changes: [
      {
        type: "added",
        text: "Context-sensitive help tooltips on every config parameter — hover the ⓘ icon to see a description, recommended value, tips, and tradeoffs sourced from the official sunnypilot docs",
      },
      {
        type: "added",
        text: "SunnyLink export modal — review your config as a SunnyLink-compatible JSON payload, see pre-flight validation warnings (e.g. conflicting settings), and download a device-ready file",
      },
      {
        type: "added",
        text: "SunnyLink export available on the Shared Config page for config owners, not just inside the editor",
      },
      {
        type: "fixed",
        text: "Help tooltip panel no longer clipped or hidden by section card borders — panel now renders in a React Portal at document.body level with viewport-aware smart positioning (auto-flips left/right when near screen edge)",
      },
      {
        type: "fixed",
        text: "Section auto-scroll (sidebar nav + mobile section pills + hash deep-links) now lands with correct clearance above the sticky header + name bar — was previously under-scrolled by ~33px on desktop",
      },
      {
        type: "added",
        text: "Structured server logging: every HTTP request now logged with method, path, status, and duration; slow requests (>500 ms) flagged automatically. Dev shows coloured human-readable output; production emits newline-delimited JSON parseable by Vercel Log Drains, Datadog, etc.",
      },
      {
        type: "added",
        text: "Client-side logger: API errors and unhandled exceptions always reported (visible in Vercel Runtime Logs); debug/info/warn output only shown in development builds",
      },
      {
        type: "changed",
        text: "All bare catch blocks across every server route and middleware now capture and log errors via the structured logger — previously all server-side exceptions were silently swallowed with no trace in logs",
      },
      {
        type: "added",
        text: "Prisma DB errors and warnings now forwarded through the structured logger so database issues appear in Vercel / production logs alongside application errors",
      },
    ],
  },
  {
    version: "2.0.1",
    date: "2026-04-05",
    tags: ["feature", "fix", "ux", "mobile"],
    changes: [
      {
        type: "added",
        text: "Config version number now always shown with a visible badge on all cards (My Configs, Explore, Favorites, Shared page) — was previously near-invisible or missing entirely",
      },
      {
        type: "added",
        text: "History (version snapshots) button now accessible from config cards in My Configs and from the shared config page (owner only) — previously only available inside the editor",
      },
      {
        type: "changed",
        text: "Hyundai/Kia/Genesis longitudinal tune options renamed: 0=Off (default), 1=Dynamic (sportier acceleration & braking), 2=Predictive (smooth, comfort-focused anticipatory control). Import clamped to valid range 0–2.",
      },
      {
        type: "fixed",
        text: "Animated particle background now shows on the Explore page — was hidden by an opaque background layer unique to that page",
      },
      {
        type: "added",
        text: 'Updated cards now show a purple "Updated" badge (top-left) matching the neon ring colour, complementing the existing spinning neon border',
      },
      {
        type: "added",
        text: 'New cards now have a subtle repeating shine/glare sweep in addition to the green "New" badge',
      },
      {
        type: "added",
        text: "Full mobile responsiveness: all pages, modals, cards, sliders, dropdowns, section navigation, and forms now work correctly on phones and small screens",
      },
      {
        type: "changed",
        text: "Modals now slide up from bottom on mobile (sheet style) with a scrollable body — previously could overflow off-screen",
      },
      {
        type: "changed",
        text: "Config editor gains a horizontal section pill scroller on mobile — replaces the desktop sidebar that was hidden on small screens",
      },
      {
        type: "changed",
        text: "Slider thumb size increased from 14px to 20px and number input ± buttons enlarged for better touch usability",
      },
      {
        type: "changed",
        text: "Home page hero heading now scales down on narrow screens; feature grid switches to single column on mobile",
      },
    ],
  },
  {
    version: "2.0.0",
    date: "2026-04-04",
    tags: ["feature", "fix", "ux", "cleanup"],
    changes: [
      {
        type: "fixed",
        text: "Favorites heart now syncs immediately on Explore and My Configs pages — local state was not re-syncing when the parent query refetched after a toggle, causing stale heart icons until a hard refresh",
      },
      {
        type: "added",
        text: "ShareModal: tags replaced with colored chip toggles — all 40+ predefined tags visible at once, click to select; custom tags still supported via text input. Category replaced with colored chip buttons (no more dropdown)",
      },
      {
        type: "added",
        text: "Config cards now show a more/less toggle for tags — previously truncated at 5 with no expand option",
      },
      {
        type: "changed",
        text: "MAKE_LABELS (vehicle make display names) consolidated into colorUtils.ts — removed duplicate definitions from ConfigCard, ExploreCard, and SharedConfigPage; SharedConfigPage now covers all 19 makes",
      },
      {
        type: "removed",
        text: "Admin Panel and Deployment sections removed from in-app Docs — developer/ops content not relevant to regular users",
      },
    ],
  },
  {
    version: "1.9.0",
    date: "2026-04-04",
    tags: ["feature", "fix", "ux"],
    changes: [
      {
        type: "fixed",
        text: "Explore page now shows the heart icon filled for configs already in your favorites — favorites were being fetched but not passed to each card",
      },
      {
        type: "added",
        text: "Category badges are now color-coded across all cards and pages (Daily Driver → emerald, Comfort → teal, Performance → orange, Economy → lime, Highway → blue, City → violet, Experimental → amber, Developer → zinc, Community Pick → rose)",
      },
      {
        type: "added",
        text: "Tags are now colored with deterministic pastel colors everywhere — ExploreCard, ConfigCard, SharedConfigPage, TagInput pills, and quick-add buttons",
      },
      {
        type: "changed",
        text: "Tag display limit raised from 3 to 5 on ExploreCard and ConfigCard; quick-add palette in TagInput raised from 14 to 20; ShareModal max tags raised from 10 to 20",
      },
      {
        type: "added",
        text: "API Reference in Docs now shows a lock icon (🔒) next to every authenticated endpoint; fixed wrong comment deletion route and added missing my-rating endpoint",
      },
      {
        type: "fixed",
        text: "Hard refresh on any page (e.g. /docs, /explore) no longer returns 404 — Vercel rewrite catch-all now serves index.html for all non-API routes",
      },
      {
        type: "fixed",
        text: "Production build was calling http://localhost:3001 instead of the production API — fixed via .env.production setting VITE_API_URL empty so Vercel rewrites proxy to the backend",
      },
      {
        type: "changed",
        text: "Home page 4 feature cards rewritten to reflect actual current features: 200+ parameters, Share & Collaborate, Explore Community, History/Diff/Collections",
      },
      {
        type: "added",
        text: "App version shown in footer (links to changelog) — single source of truth at client/src/lib/version.ts",
      },
    ],
  },
  {
    version: "1.8.0",
    date: "2026-04-04",
    tags: ["release", "feature", "ux"],
    changes: [
      {
        type: "added",
        text: "SunnyTune is now live at sunny-tune.vercel.app — deployed on Vercel (frontend + API serverless) with Neon PostgreSQL",
      },
      {
        type: "added",
        text: "Vercel Speed Insights and Analytics integrated — real-time performance monitoring and visitor analytics",
      },
      {
        type: "added",
        text: "Admin panel — Reports tab for content moderation: view flagged configs/comments, dismiss reports from a paginated queue with a red badge indicator when reports are pending",
      },
      {
        type: "added",
        text: "Admin panel — Config name search with debounce; Version, Clones, and Rating columns added to configs table",
      },
      {
        type: "added",
        text: "Admin panel — Expanded stats dashboard: total favorites, collections, pending reports; user rows now expand inline to show their configs",
      },
      {
        type: "fixed",
        text: "QR code replaced react-qr-code with qrcode.react (proper ESM, 10M+ weekly downloads) — eliminates CJS/Vite interop crash on Share modal",
      },
      {
        type: "fixed",
        text: "Notification bell no longer fires a 401 on page load for unauthenticated users — query is now gated behind token presence",
      },
      {
        type: "added",
        text: "Changelog now visible in the main navigation header",
      },
    ],
  },
  {
    version: "1.7.1",
    date: "2026-04-03",
    tags: ["fix", "ux"],
    changes: [
      {
        type: "fixed",
        text: 'Driving model now reads displayName from ModelManager_ActiveBundle (e.g. "WMI V12 (January 13, 2026)") — previously only parsed separate name/generation fields which many bundles don\'t have',
      },
      {
        type: "changed",
        text: "Tags refreshed — removed stale tags (pid-ctrl, indi-ctrl, nudgeless-lc, sp-long, stock-long); added mads, bsm, osm, sunnylink, live-torque, nn-lateral, dynamic-e2e, alpha-long, planplus, hyundai-tune, custom-acc, staging",
      },
      {
        type: "changed",
        text: "Categories refreshed — replaced oem-plus with Comfort / Smooth and added City / Urban; all categories now reflect actual config use-cases",
      },
      {
        type: "added",
        text: "docker:prod:build:clean, docker:prod:up (foreground), docker:prod:up:d, and docker:prod:fresh scripts — prod now has full parity with dev docker scripts",
      },
    ],
  },
  {
    version: "1.7.0",
    date: "2026-04-03",
    tags: ["feature", "ux"],
    changes: [
      {
        type: "added",
        text: "Staging-sp branch option in Vehicle & Version section",
      },
      {
        type: "added",
        text: "Driving model field (ModelManager_ActiveBundle) — imported automatically from SunnyLink, editable in the editor, shown on shared config pages",
      },
      {
        type: "added",
        text: "Since year labels on all config parameters — small year badge next to each label showing when the feature was introduced",
      },
      {
        type: "added",
        text: "SP / OP source chips on all parameters that were still missing them (Interface, SpeedControl, LaneChange, Navigation, Advanced)",
      },
      {
        type: "fixed",
        text: "Mobile responsive layout for config editor — parameter controls now stack below labels on small screens instead of overflowing",
      },
      {
        type: "fixed",
        text: "Server config schema test updated to match current SPConfig structure after the v1.6.0 field cleanup",
      },
      {
        type: "changed",
        text: "Vehicle section renamed to Vehicle & Version — now includes SP version, branch, and driving model metadata",
      },
    ],
  },
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
  // Mark current version as seen so the header glow dot goes away
  useEffect(() => {
    localStorage.setItem("sunnyTune_lastSeenVersion", APP_VERSION);
  }, []);

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
