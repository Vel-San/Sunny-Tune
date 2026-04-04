import { clsx } from "clsx";
import {
  Book,
  BookOpen,
  ChevronRight,
  Code2,
  GitBranch,
  Globe,
  HelpCircle,
  KeyRound,
  Layers,
  Lock,
  Share2,
  Users,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface DocBlock {
  title: string;
  content: React.ReactNode;
}

// ─── Sidebar sections ─────────────────────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: "getting-started", label: "Getting Started", icon: BookOpen },
  { id: "editor", label: "Config Editor", icon: Wrench },
  { id: "sharing", label: "Sharing & QR", icon: Share2 },
  { id: "explore", label: "Explore", icon: Globe },
  { id: "collections", label: "Collections", icon: Layers },
  { id: "history", label: "Version History", icon: GitBranch },
  { id: "community", label: "Community", icon: Users },
  { id: "authentication", label: "Authentication", icon: KeyRound },
  { id: "api", label: "API Reference", icon: Code2 },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

// ─── Inline helpers ────────────────────────────────────────────────────────────

function Code({ children }: { children: string }) {
  return (
    <code className="font-mono text-xs bg-zinc-900 border border-zinc-700 text-blue-300 px-1.5 py-0.5 rounded">
      {children}
    </code>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-zinc-200 mt-6 mb-2">
      {children}
    </h3>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-zinc-400 leading-relaxed mb-3">{children}</p>
  );
}

function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc list-inside space-y-1.5 mb-4">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-zinc-400 leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Callout({
  icon: Icon,
  color,
  children,
}: {
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "flex items-start gap-3 p-3 rounded-lg border mb-4",
        color,
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="text-sm">{children}</div>
    </div>
  );
}

function LockedBadge() {
  return (
    <span title="Requires Authorization: Bearer <token>">
      <Lock className="inline-block w-3 h-3 text-amber-400 mx-1 -mt-0.5 flex-shrink-0" />
    </span>
  );
}

// ─── Content map ──────────────────────────────────────────────────────────────

const CONTENT: Record<string, DocBlock[]> = {
  "getting-started": [
    {
      title: "What is SunnyTune?",
      content: (
        <>
          <P>
            SunnyTune is a community platform for creating, sharing, and
            discovering SunnyPilot / OpenPilot driver-assistance configurations.
            Instead of manually editing <Code>params</Code> on your Comma
            device, you design your config in a rich web UI and either sync it
            directly to your device or share it with the community.
          </P>
          <H3>Key features</H3>
          <UL
            items={[
              "Full 10-section config editor covering Vehicle & Version, Driving Personality, Lateral Control, Longitudinal Control, Speed Control, Lane Change, Navigation, Interface, Comma AI, and Advanced settings",
              "One-click sharing with a public URL and QR code",
              "Browse the Explore page to find configs from other drivers sorted by rating, views, clones, or trending this week",
              "Version history — every save creates a snapshot you can browse, diff, and restore",
              "Collections to group related configs into named playlists",
              "Community ratings, comments, and reply threads",
            ]}
          />
          <H3>Quick start</H3>
          <UL
            items={[
              <>
                Click <strong className="text-zinc-200">New Config</strong> from
                the home page or My Configs page.
              </>,
              <>
                Fill in your vehicle details (make, model, year) so the
                community can find your config.
              </>,
              <>Adjust settings across the 10 sections using the sidebar.</>,
              <>
                Hit <strong className="text-zinc-200">Save</strong> — your
                config is stored privately until you choose to share.
              </>,
              <>
                When ready, click{" "}
                <strong className="text-zinc-200">Share</strong> to publish it
                and generate a public URL + QR code.
              </>,
            ]}
          />
        </>
      ),
    },
  ],
  editor: [
    {
      title: "The Config Editor",
      content: (
        <>
          <P>
            The editor is split into 10 sections, accessible via the left
            sidebar (desktop) or by scrolling. Each section maps to a group of
            SunnyPilot parameters.
          </P>
          <H3>Sections overview</H3>
          <UL
            items={[
              <>
                <strong className="text-zinc-200">Vehicle &amp; Version</strong>{" "}
                — Make, model, year, SP version, branch (stable-sp / dev-sp /
                staging-sp / nightly), and active driving model
                (ModelManager_ActiveBundle)
              </>,
              <>
                <strong className="text-zinc-200">Driving Personality</strong> —
                Longitudinal personality (relaxed / standard / sport / traffic)
              </>,
              <>
                <strong className="text-zinc-200">Lateral Control</strong> —
                Torque controller tuning (camera offset, live torque, torque
                friction, deadzone, lateral accel, friction override),
                lane-centering strength, path offset
              </>,
              <>
                <strong className="text-zinc-200">Longitudinal Control</strong>{" "}
                — E2E long toggle, dynamic follow distance, following distance
                override, lead filtering
              </>,
              <>
                <strong className="text-zinc-200">Speed Control</strong> — Speed
                Limit Control (SLC) policy and offset, curve speed reduction
              </>,
              <>
                <strong className="text-zinc-200">Lane Change</strong> —
                Auto-lane-change timer, blinker-required threshold, BSM pause,
                lane-change direction preference
              </>,
              <>
                <strong className="text-zinc-200">Navigation</strong> — OSM
                speed-limit data toggle
              </>,
              <>
                <strong className="text-zinc-200">Interface</strong> — Dev
                overlays, screen brightness, metric units, sidebar visibility,
                sound settings
              </>,
              <>
                <strong className="text-zinc-200">Comma AI</strong> — MADS
                (multi-model assisted driving), drive recording, disengage
                behaviour, SunnyLink Connect integration
              </>,
              <>
                <strong className="text-zinc-200">Advanced</strong> — Quick-boot
                toggle
              </>,
            ]}
          />
          <H3>Unsaved-change guard</H3>
          <P>
            If you navigate away before saving, a confirmation dialog will
            appear. Your browser will also warn you on tab close or refresh.
          </P>
          <H3>Import / Export</H3>
          <P>
            Use the <strong className="text-zinc-200">Import</strong> button to
            load a config file. Two formats are accepted:
          </P>
          <UL
            items={[
              <>
                <strong className="text-zinc-200">SunnyTune JSON</strong> — the
                app's own export format (<Code>.sunnytune.json</Code>),
                versioned and schema-validated on import.
              </>,
              <>
                <strong className="text-zinc-200">SunnyLink v2 JSON</strong> —
                the raw parameter export from the SunnyLink mobile app.
                SunnyTune automatically maps all known SP/OP params, including
                the active driving model name and date.
              </>,
            ]}
          />
          <P>
            <strong className="text-zinc-200">Export</strong> downloads the
            current config as a <Code>.json</Code> file.
          </P>
          <H3>Deep links</H3>
          <P>
            Append a section hash to the editor URL to jump directly to that
            section, e.g. <Code>/configure/&lt;id&gt;#lateral</Code>. Valid
            hashes: <Code>vehicle</Code>, <Code>driving-personality</Code>,{" "}
            <Code>lateral</Code>, <Code>longitudinal</Code>,{" "}
            <Code>speed-control</Code>, <Code>lane-change</Code>,{" "}
            <Code>navigation</Code>, <Code>interface</Code>,{" "}
            <Code>comma-ai</Code>, <Code>advanced</Code>.
          </P>
        </>
      ),
    },
  ],
  sharing: [
    {
      title: "Sharing & QR Code",
      content: (
        <>
          <P>
            Sharing publishes your config to the Explore page and gives you a
            permanent public URL and QR code.
          </P>
          <H3>How to share</H3>
          <UL
            items={[
              "Open the config in the editor.",
              <>
                Click the <strong className="text-zinc-200">Share</strong>{" "}
                button (only enabled when there are no unsaved changes).
              </>,
              "Optionally add tags and a category to help others find it.",
              <>
                Click{" "}
                <strong className="text-zinc-200">Publish &amp; Share</strong>.
              </>,
              "Copy the link or scan the QR code.",
            ]}
          />
          <H3>QR code</H3>
          <P>
            The share success screen displays a QR code you can scan from your
            Comma device's web browser to instantly open the config.
          </P>
          <Callout
            icon={BookOpen}
            color="border-blue-800/40 bg-blue-950/20 text-blue-300"
          >
            Sharing no longer locks your config. You can continue editing and
            saving a shared config — each save increments its version number.
          </Callout>
          <H3>Version number</H3>
          <P>
            Each config starts at v1. Every save increments the version counter.
            The current version is shown on the config card (v2, v3…) whenever
            it's been updated at least once.
          </P>
        </>
      ),
    },
  ],
  explore: [
    {
      title: "Explore Page",
      content: (
        <>
          <P>
            The Explore page shows all shared configs from the community. Use
            the filters and sort to find the right config for your vehicle.
          </P>
          <H3>Sort options</H3>
          <UL
            items={[
              <>
                <strong className="text-zinc-200">Trending</strong> — weighted
                score of recent (7-day) ratings × 5, recent clones × 3, and
                log(viewCount)
              </>,
              <>
                <strong className="text-zinc-200">Top Rated</strong> — highest
                average rating, tie-broken by count
              </>,
              <>
                <strong className="text-zinc-200">Most Recent</strong> — newest
                shared date first
              </>,
              <>
                <strong className="text-zinc-200">Most Viewed</strong> — total
                lifetime view count
              </>,
              <>
                <strong className="text-zinc-200">Most Cloned</strong> — total
                clone count
              </>,
              <>
                <strong className="text-zinc-200">Most Discussed</strong> —
                highest comment count
              </>,
            ]}
          />
          <H3>Filters</H3>
          <UL
            items={[
              "Full-text search (name, description, make, model, tags, category)",
              "Vehicle make, model, and year",
              "Category (Daily Driver, Comfort, Performance, Economy, Highway, City, Experimental, Developer, Community Pick)",
              "Tags (multi-select)",
              "Min SP Version (semver prefix — shows configs at or above the given version)",
            ]}
          />
          <H3>Load More</H3>
          <P>
            Results are paginated (20 per page). Click{" "}
            <strong className="text-zinc-200">Load More</strong> to append the
            next page. Changing any filter resets to page 1 automatically.
          </P>
        </>
      ),
    },
  ],
  collections: [
    {
      title: "Collections",
      content: (
        <>
          <P>
            Collections let you group related configs into named playlists.
            Think: "My Toyota Highway Builds" or "E2E Experiments".
          </P>
          <H3>Creating a collection</H3>
          <UL
            items={[
              <>
                Open <strong className="text-zinc-200">My Configs</strong> and
                switch to the{" "}
                <strong className="text-zinc-200">Collections</strong> tab.
              </>,
              <>
                Click <strong className="text-zinc-200">New Collection</strong>{" "}
                and enter a name.
              </>,
              <>Optionally add a description and toggle it public.</>,
            ]}
          />
          <H3>Adding configs</H3>
          <P>
            Click any collection to open its detail page. Use the{" "}
            <strong className="text-zinc-200">Add Config</strong> button to pick
            from your configs or paste a config ID.
          </P>
          <H3>Public collections</H3>
          <P>
            Toggle a collection to "Public" to make it accessible via its URL
            without authentication.
          </P>
        </>
      ),
    },
  ],
  history: [
    {
      title: "Version History",
      content: (
        <>
          <P>
            Every time you save an existing config, SunnyTune automatically
            stores an immutable snapshot of the previous state. This gives you a
            full edit history.
          </P>
          <H3>Accessing history</H3>
          <P>
            In the config editor, click the{" "}
            <strong className="text-zinc-200">History</strong> button (clock
            icon) in the top bar. A modal lists all saved snapshots in
            reverse-version order.
          </P>
          <H3>Comparing snapshots</H3>
          <P>
            Click a snapshot row to select it, then click{" "}
            <strong className="text-zinc-200">Diff</strong> to open a
            parameter-level comparison between that snapshot and the current
            state.
          </P>
          <H3>Restoring a snapshot</H3>
          <P>
            Click <strong className="text-zinc-200">Restore</strong> on a
            selected snapshot. This loads that snapshot's data into the editor —
            you still need to click Save to persist the restoration.
          </P>
          <Callout
            icon={BookOpen}
            color="border-amber-800/40 bg-amber-950/20 text-amber-300"
          >
            SunnyTune keeps the most recent 20 snapshots per config. Older ones
            are automatically pruned.
          </Callout>
        </>
      ),
    },
  ],
  community: [
    {
      title: "Community Features",
      content: (
        <>
          <H3>Ratings</H3>
          <P>
            Give shared configs a rating from 1 to 5 stars. You can update your
            rating at any time. You cannot rate your own config.
          </P>
          <H3>Comments</H3>
          <P>
            Leave comments on any shared config. Comments support threaded
            replies up to 2 levels deep. Click{" "}
            <strong className="text-zinc-200">Reply</strong> under any comment
            to start a thread.
          </P>
          <H3>Notifications</H3>
          <P>
            The bell icon in the header shows unread notifications. You get
            notified when someone clones your config, rates it, or replies to
            your comment.
          </P>
          <H3>Favorites</H3>
          <P>
            Click the heart icon on any Explore card to bookmark a config to
            your Favorites tab in My Configs.
          </P>
          <H3>Reporting</H3>
          <P>
            Click the flag icon on a config or comment to submit a report to the
            moderation queue. Reports are reviewed by admins.
          </P>
        </>
      ),
    },
  ],
  authentication: [
    {
      title: "Authentication",
      content: (
        <>
          <P>
            SunnyTune uses anonymous user tokens — no email or password
            required. You are identified by a random bearer token stored in your
            browser's <Code>localStorage</Code>.
          </P>
          <H3>How it works</H3>
          <UL
            items={[
              "On first visit, SunnyTune automatically registers an anonymous user and stores the token.",
              "All API requests include this token as a Bearer Authorization header.",
              "Your configs are associated with this token — keep it safe.",
            ]}
          />
          <H3>Revoking / rolling your token</H3>
          <P>
            Click your token badge in the header to open the Token modal. You
            can copy your token or roll it (generate a new one). Rolling your
            token will break access from other devices.
          </P>
          <Callout
            icon={Lock}
            color="border-red-800/40 bg-red-950/20 text-red-300"
          >
            If you clear browser storage you will lose access to your configs.
            Export important configs as JSON before clearing.
          </Callout>
        </>
      ),
    },
  ],
  api: [
    {
      title: "API Reference",
      content: (
        <>
          <P>
            SunnyTune exposes a REST API at <Code>/api</Code>. All authenticated
            endpoints require <Code>Authorization: Bearer &lt;token&gt;</Code>.
          </P>
          <H3>Configs</H3>
          <UL
            items={[
              <>
                <Code>GET /api/configs?page=1&amp;limit=24</Code>
                <LockedBadge /> — paginated list of your configs (returns{" "}
                <Code>{"{ configs, total, page, limit }"}</Code>)
              </>,
              <>
                <Code>POST /api/configs</Code>
                <LockedBadge /> — create a new config
              </>,
              <>
                <Code>GET /api/configs/:id</Code>
                <LockedBadge /> — get single config (owner only)
              </>,
              <>
                <Code>PUT /api/configs/:id</Code>
                <LockedBadge /> — update config (increments version, saves
                snapshot)
              </>,
              <>
                <Code>DELETE /api/configs/:id</Code>
                <LockedBadge /> — delete config
              </>,
              <>
                <Code>POST /api/configs/:id/share</Code>
                <LockedBadge /> — publish config, returns{" "}
                <Code>shareToken</Code>
              </>,
              <>
                <Code>POST /api/configs/:id/clone</Code>
                <LockedBadge /> — clone config into your account
              </>,
              <>
                <Code>GET /api/configs/:id/history</Code>
                <LockedBadge /> — list version snapshots
              </>,
              <>
                <Code>GET /api/configs/:id/history/:snapshotId</Code>
                <LockedBadge /> — get snapshot data
              </>,
            ]}
          />
          <H3>Explore</H3>
          <UL
            items={[
              <>
                <Code>
                  GET /api/explore?q=&amp;make=&amp;sort=trending&amp;page=1
                </Code>{" "}
                — public browse
              </>,
              <>
                <Code>GET /api/explore/stats</Code> — community stats
                (sharedConfigs, ratings, comments)
              </>,
              <>
                <Code>GET /api/explore/vehicles</Code> — verified vehicle list
                (make, models[])
              </>,
              <>
                <Code>GET /api/shared/:shareToken</Code> — public config detail
                (no auth)
              </>,
            ]}
          />
          <H3>Collections</H3>
          <UL
            items={[
              <>
                <Code>GET /api/collections</Code>
                <LockedBadge /> — list your collections
              </>,
              <>
                <Code>POST /api/collections</Code>
                <LockedBadge /> — create collection
              </>,
              <>
                <Code>PUT /api/collections/:id</Code>
                <LockedBadge /> — update
              </>,
              <>
                <Code>DELETE /api/collections/:id</Code>
                <LockedBadge /> — delete
              </>,
              <>
                <Code>GET /api/collections/:id</Code>
                <LockedBadge /> — get collection with items
              </>,
              <>
                <Code>POST /api/collections/:id/items</Code>
                <LockedBadge /> — add config
              </>,
              <>
                <Code>DELETE /api/collections/:id/items/:configId</Code>
                <LockedBadge /> — remove config
              </>,
            ]}
          />
          <H3>Community</H3>
          <UL
            items={[
              <>
                <Code>PUT /api/community/configs/:id/rate</Code>
                <LockedBadge /> — upsert rating ({"{ value: 1–5 }"})
              </>,
              <>
                <Code>DELETE /api/community/configs/:id/rate</Code>
                <LockedBadge /> — remove own rating
              </>,
              <>
                <Code>GET /api/community/configs/:id/my-rating</Code>
                <LockedBadge /> — fetch current user's rating
              </>,
              <>
                <Code>POST /api/community/configs/:id/comments</Code>
                <LockedBadge /> — post comment (
                {"{ body, authorName?, parentId? }"})
              </>,
              <>
                <Code>DELETE /api/community/comments/:id</Code>
                <LockedBadge /> — delete own comment
              </>,
            ]}
          />
          <H3>Notifications</H3>
          <UL
            items={[
              <>
                <Code>GET /api/notifications</Code>
                <LockedBadge /> — list notifications
              </>,
              <>
                <Code>GET /api/notifications/unread-count</Code>
                <LockedBadge />
              </>,
              <>
                <Code>POST /api/notifications/mark-read</Code>
                <LockedBadge />
              </>,
              <>
                <Code>DELETE /api/notifications/:id</Code>
                <LockedBadge />
              </>,
            ]}
          />
        </>
      ),
    },
  ],
  faq: [
    {
      title: "FAQ",
      content: (
        <>
          <H3>Is SunnyTune official?</H3>
          <P>
            No. SunnyTune is a community project and is not affiliated with or
            endorsed by SunnyPilot or Comma AI.
          </P>
          <H3>Do I need a Comma device to use SunnyTune?</H3>
          <P>
            No. You can create and share configs without a device. The configs
            are designed to be applied to SunnyPilot but SunnyTune itself runs
            entirely in the browser.
          </P>
          <H3>How do I apply a SunnyTune config to my device?</H3>
          <P>
            Currently configs are exported as JSON for manual application.
            Future versions may integrate with the Comma Connect API for direct
            sync.
          </P>
          <H3>Are my configs private by default?</H3>
          <P>
            Yes. Configs are private until you explicitly click Share. Shared
            configs are publicly readable; only you can edit or delete them.
          </P>
          <H3>Can I edit a shared config?</H3>
          <P>
            Yes — sharing no longer locks a config. You can continue editing and
            saving; each save increments the version number. The public share
            URL always shows the latest version.
          </P>
          <H3>What happens to my data if I clear browser storage?</H3>
          <P>
            Your anonymous token is stored in <Code>localStorage</Code>. If you
            clear it, you lose access to your configs unless you export them
            first. Export configs as JSON before clearing.
          </P>
        </>
      ),
    },
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [active, setActive] = useState("getting-started");

  const blocks = CONTENT[active] ?? [];
  const activeSection = SECTIONS.find((s) => s.id === active);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex gap-8 min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="hidden lg:block w-52 flex-shrink-0">
        <div className="sticky top-20 space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-2 mb-2">
            <Book className="w-3 h-3 inline-block mr-1 -mt-0.5" /> Documentation
          </p>
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={clsx(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors",
                active === id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden w-full">
        <div className="flex flex-wrap gap-1.5 mb-6">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={clsx(
                "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors",
                active === id
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600 mb-6">
          <span>Docs</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-400">{activeSection?.label}</span>
        </div>

        {blocks.map((block) => (
          <article key={block.title} className="mb-10">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">
              {block.title}
            </h2>
            <hr className="border-zinc-800 mb-6" />
            {block.content}
          </article>
        ))}
      </main>
    </div>
  );
}
