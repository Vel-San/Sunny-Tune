import { clsx } from "clsx";
import {
  Book,
  BookOpen,
  ChevronRight,
  Code2,
  GitBranch,
  GitCompare,
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
  { id: "compare", label: "Compare Configs", icon: GitCompare },
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
              "Full 8-section config editor (Vehicle, Toggles, Steering, Cruise, Maps, Visuals, Device, Developer) — each section broken into labelled subsections for easy navigation",
              "Vehicle Specific section: make-specific feature flags for Tesla (Cooperative Steering), Subaru (Stop & Go), and Toyota (Enforce Factory Longitudinal)",
              "Context-sensitive help tooltips on every parameter — hover the ⓘ icon for a description, recommended value, tips, and tradeoffs",
              "One-click sharing with a public URL and QR code",
              "Config comparison — diff any two public shared configs (or your own saved configs) side-by-side, grouped by section",
              "Browse the Explore page to find configs from other drivers sorted by rating, views, clones, or trending this week",
              "Version history — every save that changes your config creates a snapshot you can browse, diff, and restore",
              "Collections to group related configs into named playlists",
              "Community ratings, comments, and reply threads",
              "Changelog new-version pulse — the Changelog nav item glows blue when a new app version hasn't been viewed yet",
              "SP Docs Sync badge — amber badge in the header nav shows when the tooltip database was last audited against the sunnypilot docs",
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
              <>
                Adjust settings across the 8 sections using the sidebar.
                Subsection headers inside each section help you find specific
                parameters quickly.
              </>,
              <>
                Hover any <strong className="text-zinc-200">ⓘ</strong> icon to
                see a help tooltip with description, recommended value, and
                tips.
              </>,
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
            The editor is split into{" "}
            <strong className="text-zinc-200">8 sections</strong>, accessible
            via the left sidebar (desktop) or section pills on mobile. Each
            section is further divided into labelled subsections so you can
            quickly find the parameter you're looking for. Every parameter has a{" "}
            <strong className="text-zinc-200">ⓘ help tooltip</strong> — hover it
            to see a description, recommended value, tips, and a link to the
            community docs.
          </P>
          <H3>Sections overview</H3>
          <UL
            items={[
              <>
                <strong className="text-zinc-200">Vehicle</strong> —{" "}
                <em>Vehicle Info</em>: make, model, year.{" "}
                <em>Hardware &amp; Software</em>: Comma AI hardware, SP version,
                branch (stable-sp / dev-sp / staging-sp / nightly), and active
                driving model (ModelManager_ActiveBundle)
              </>,
              <>
                <strong className="text-zinc-200">Toggles</strong> —
                <em>Driving Personality</em>: relaxed / standard / sport /
                traffic. <em>Experimental Mode</em>: E2E long, dynamic
                experimental control. <em>Safety</em>: disengage on gas,
                close-to-road alert. <em>Recording &amp; Uploads</em>: drive
                recording, driver monitoring
              </>,
              <>
                <strong className="text-zinc-200">Steering</strong> —
                <em>M.A.D.S.</em>: steering mode, unified engagement, disengage
                behaviour. <em>Lateral Assist</em>: camera offset, NNLC, LAGD,
                enforce torque control. <em>Torque</em>: live torque, friction,
                lateral accel override. <em>Lane Change</em>: auto-lane-change
                timer, blinker threshold, BSM pause
              </>,
              <>
                <strong className="text-zinc-200">Cruise</strong> —
                <em>Longitudinal Control</em>: Alpha Longitudinal, Hyundai
                tuning, Plan+, ACC increments. <em>Smart Cruise Control</em>:
                dynamic experimental control, ICBM. <em>Speed Limit</em>: SLC
                mode, policy, and offset; curve speed reduction (SCC-V / SCC-M)
              </>,
              <>
                <strong className="text-zinc-200">Maps</strong> — OSM local maps
                speed-limit data toggle
              </>,
              <>
                <strong className="text-zinc-200">Visuals</strong> —
                <em>HUD Overlays</em>: blind spot warnings, steering arc, true
                speed, chevron info. <em>Display</em>: screen brightness, metric
                units, quiet mode
              </>,
              <>
                <strong className="text-zinc-200">Device</strong> —
                <em>Connectivity</em>: SunnyLink Connect integration, sunnypilot
                Enabled, GSM APN, GSM Roaming. <em>Device Settings</em>:
                always-on connectivity, wide-camera lead, auto-shutdown, Max
                Time Offroad, Disable Power Down, Wake Up Behavior, Disable
                Updates
              </>,
              <>
                <strong className="text-zinc-200">Developer</strong> —
                <em>Longitudinal</em>: longitudinal developer tune.{" "}
                <em>System</em>: quick-boot toggle
              </>,
              <>
                <strong className="text-zinc-200">Vehicle Specific</strong> —
                make-specific feature flags: <em>Tesla</em>: Cooperative
                Steering. <em>Subaru</em>: Stop &amp; Go. <em>Toyota</em>:
                Enforce Factory Longitudinal
              </>,
            ]}
          />
          <H3>Help tooltips</H3>
          <P>
            Every parameter row has a <Code>ⓘ</Code> icon. Hovering (or tapping
            on mobile) opens a tooltip panel showing the parameter’s
            description, recommended value, tips, tradeoffs, and a link to the
            sunnypilot community documentation. The panel auto-positions itself
            so it never clips off the screen edge.
          </P>
          <H3>Steering section (Cruise → Lane Change)</H3>
          <P>
            The Steering section also contains lane-change sub-parameters: Lane
            Turn Desire, Adjust Lane Turn Speed, Auto Lane Change Timer, BSM
            pause, and blinker re-engage delay.
          </P>
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
        </>
      ),
    },
  ],
  compare: [
    {
      title: "Compare Configs",
      content: (
        <>
          <P>
            The <strong className="text-zinc-200">Compare</strong> button
            appears in the action bar of every shared config page. It lets you
            diff the current config against any other config — public or your
            own.
          </P>
          <H3>Comparing against a public config</H3>
          <UL
            items={[
              "Open any shared config page.",
              <>
                Click the <strong className="text-zinc-200">Compare</strong>{" "}
                button in the action bar.
              </>,
              "Paste a share URL (e.g. sunny-tune.vercel.app/shared/abc123) or a bare share token into the input field.",
              <>
                Click <strong className="text-zinc-200">Fetch</strong> —
                SunnyTune fetches the other config and immediately computes the
                diff.
              </>,
              "The diff is grouped by section (Vehicle, Steering, Cruise…) and shows each changed parameter with its old value (red, strikethrough) and new value (green).",
            ]}
          />
          <H3>Comparing against your own configs</H3>
          <P>
            When you are signed in (have a token), a dropdown appears below the
            URL input listing all your saved configs. Selecting one immediately
            computes the diff — no URL needed.
          </P>
          <H3>Reading the diff</H3>
          <UL
            items={[
              <>
                Parameters are grouped by section label (e.g.{" "}
                <strong className="text-zinc-200">Steering</strong>,{" "}
                <strong className="text-zinc-200">Cruise</strong>).
              </>,
              <>
                The <strong className="text-zinc-200">base config</strong> (the
                page you opened Compare from) values appear in red with a
                strikethrough.
              </>,
              <>
                The <strong className="text-zinc-200">comparison config</strong>{" "}
                values appear in green.
              </>,
              'If the configs are identical, "Configs are identical" is shown instead of a diff table.',
            ]}
          />
          <Callout
            icon={GitCompare}
            color="border-blue-800/40 bg-blue-950/20 text-blue-300"
          >
            The diff is computed entirely in-browser — the same engine used by
            the Version History diff viewer. Only the second config requires an
            extra network request.
          </Callout>
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
            Each config starts at v1. Every save that{" "}
            <em>changes the config data</em> increments the version counter.
            Metadata-only saves (name, description, tags, category) do{" "}
            <strong className="text-zinc-200">not</strong> bump the version. The
            version is always shown on every config card across My Configs,
            Explore, Favorites, and the shared config page.
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
            Click the <strong className="text-zinc-200">History</strong> button
            (clock icon) on any config card in My Configs, on the shared config
            page (accessible by all users), or in the config editor top bar. A
            modal lists all saved snapshots in reverse-version order.
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
            SunnyTune keeps the most recent 20 snapshots per config. Snapshots
            are only created when the config data changes — saving only a name
            or description does not add an extra snapshot entry.
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
          <H3>Setting a display name</H3>
          <P>
            You can set a personal display name (username) in the Token modal
            (key icon in the header). Once set, it:
          </P>
          <UL
            items={[
              "Appears on all your shared configs so others can see who created them.",
              "Auto-fills the comment nickname field on shared config pages.",
              "Can be changed or cleared at any time from the same Token modal.",
            ]}
          />
          <P>
            On your first visit after display names were introduced, a
            dismissable banner will appear below the header inviting you to set
            one. It shows only once.
          </P>
          <H3>Viewing your token</H3>
          <P>
            Click the key icon (token pill) in the header to open the Token
            modal. It shows your display name, full token, user ID, config
            count, and member-since date.
          </P>
          <H3>Importing a token from another device</H3>
          <P>
            If you open SunnyTune on a new device it will generate a fresh
            token, disconnecting you from your existing configs. To restore
            access:
          </P>
          <UL
            items={[
              "Open the Token modal (key icon in the header).",
              <>
                Click{" "}
                <strong className="text-zinc-200">
                  Use token from another device…
                </strong>
              </>,
              "Paste your token (starts with sp_) into the input field.",
              <>
                Click <strong className="text-zinc-200">Confirm</strong> —
                SunnyTune validates the token server-side. If valid, it replaces
                the generated token and loads your account immediately. If
                invalid, your previous token is automatically restored.
              </>,
            ]}
          />
          <H3>Regenerating your token</H3>
          <P>
            In the Token modal click{" "}
            <strong className="text-zinc-200">Regenerate token…</strong> and
            confirm. This permanently invalidates the old token — any other
            device using it will be signed out immediately.
          </P>
          <Callout
            icon={Lock}
            color="border-red-800/40 bg-red-950/20 text-red-300"
          >
            If you clear browser storage you will lose access to your configs.
            Copy your token from the Token modal, or export configs as JSON,
            before clearing.
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
                <LockedBadge /> — update config (increments version and saves
                snapshot only when config data changes)
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
            clear it, you lose access to your configs unless you have saved the
            token elsewhere. Copy your token from the Token modal, or export
            configs as JSON, before clearing.
          </P>
          <H3>How do I use SunnyTune on a second device?</H3>
          <P>
            Copy your token from the Token modal on your original device. On the
            new device, open the Token modal and click{" "}
            <strong className="text-zinc-200">
              Use token from another device…
            </strong>
            , paste the token, and confirm. See the{" "}
            <strong className="text-zinc-200">Authentication</strong> section
            for full details.
          </P>
          <H3>What is the SP Docs Sync badge?</H3>
          <P>
            The faint amber badge in the header nav shows the date the SunnyTune
            team last audited the sunnypilot docs to update the help tooltips.
            Clicking it opens the GitHub Actions docs-audit workflow log.
          </P>
          <H3>What does the blue pulsing dot on Changelog mean?</H3>
          <P>
            You haven’t viewed the latest SunnyTune release notes yet. Click{" "}
            <strong className="text-zinc-200">Changelog</strong> to read what
            changed — the dot disappears once you visit the page.
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
