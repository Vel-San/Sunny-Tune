# Changelog

All notable changes to SunnyTune are documented here.

---

## [2.0.2] — 2026-04-05

### Added

- Context-sensitive help tooltips on every config parameter — hover the ⓘ icon to see a description, recommended value, tips, and tradeoffs sourced from the SunnyLink wiki
- SunnyLink export modal — review your config as a SunnyLink-compatible JSON payload, see pre-flight validation warnings (e.g. conflicting settings), and download a device-ready file
- SunnyLink export available on the Shared Config page for config owners, not just inside the editor
- Structured server logging: every HTTP request logged with method, path, status, and duration; requests slower than 500 ms are flagged. Dev outputs coloured human-readable lines; production emits newline-delimited JSON parseable by Railway, Vercel Log Drains, Datadog, Loki, etc.
- Client-side logger: API errors and unhandled exceptions always forwarded to `console.error` (visible in Vercel Runtime Logs and browser DevTools); debug/info/warn output suppressed in production builds
- `LOG_LEVEL` environment variable support — override the default log level per environment (`debug` | `info` | `warn` | `error`)
- Prisma DB errors and warnings now forwarded through the structured logger so database issues appear in Railway / production logs alongside application errors

### Changed

- All bare `catch` blocks across every server route and middleware now capture and log errors via the structured logger — previously all server-side exceptions were silently swallowed with no visible trace
- Admin auth failures (wrong secret, blocked IP, missing header) now logged at `warn` level for security visibility

### Fixed

- Help tooltip panel no longer clipped or hidden by section card borders — panel renders in a React Portal at `document.body` with viewport-aware smart positioning (auto-flips left/right near screen edge)
- Section auto-scroll (sidebar nav + mobile section pills + hash deep-links) now lands with correct clearance above the sticky header + name bar — was previously under-scrolled by ~33px on desktop

---

## [2.0.1] — 2026-04-05

### Added

- Config version number now always shown with a visible badge on all cards (My Configs, Explore, Favorites, Shared page) — was previously near-invisible or missing entirely
- History (version snapshots) button now accessible from config cards in My Configs and from the shared config page (owner only) — previously only available inside the editor
- Full mobile responsiveness: all pages, modals, cards, sliders, dropdowns, section navigation, and forms now work correctly on phones and small screens

### Changed

- Hyundai/Kia/Genesis longitudinal tune options renamed: 0=Off (default), 1=Dynamic (sportier acceleration & braking), 2=Predictive (smooth, comfort-focused anticipatory control). Import clamped to valid range 0–2.
- Modals now slide up from the bottom on mobile (sheet style) with scrollable body — previously could overflow off-screen
- Config editor gains a horizontal section pill scroller on mobile — replaces the desktop sidebar hidden on small screens
- Slider thumb size increased to 20px and number input ± buttons enlarged for better touch usability
- Home page hero heading scales down on narrow screens; feature grid switches to single column on mobile

### Fixed

- Animated particle background now shows on the Explore page — was hidden by an opaque background layer unique to that page
- Updated cards now show a purple "Updated" badge (top-left) matching the neon ring colour, alongside the existing spinning neon border
- New cards now have a subtle repeating shine/glare sweep effect in addition to the green "New" badge

---

## [2.0.0] — 2026-04-04

### Fixed

- Favorites heart now syncs immediately on Explore and My Configs pages — local state was not re-syncing when the parent query refetched after a toggle, causing stale heart icons until a hard refresh

### Added

- ShareModal: tags replaced with colored chip toggles — all 40+ predefined tags visible at once, click to select; custom tags still supported via text input. Category replaced with colored chip buttons (no more dropdown)
- Config cards now show a more/less toggle for tags — previously truncated at 5 with no expand option

### Changed

- MAKE_LABELS (vehicle make display names) consolidated into `colorUtils.ts` — removed duplicate definitions from ConfigCard, ExploreCard, and SharedConfigPage; SharedConfigPage now covers all 19 makes

### Removed

- Admin Panel and Deployment sections removed from in-app Docs — developer/ops content not relevant to regular users

---

## [1.9.0] — 2026-04-04

### Fixed

- Explore page now shows the heart icon filled for configs already in your favorites — favorites were being fetched but not passed to each card
- Hard refresh on any page (e.g. `/docs`, `/explore`) no longer returns 404 — Vercel rewrite catch-all now serves `index.html` for all non-API routes
- Production build was calling `http://localhost:3001` instead of the Railway API — fixed via `.env.production` setting `VITE_API_URL` empty so Vercel rewrites proxy to Railway

### Added

- Category badges are now color-coded across all cards and pages (Daily Driver → emerald, Comfort → teal, Performance → orange, Economy → lime, Highway → blue, City → violet, Experimental → amber, Developer → zinc, Community Pick → rose)
- Tags are now colored with deterministic pastel colors everywhere — ExploreCard, ConfigCard, SharedConfigPage, TagInput pills, and quick-add buttons
- API Reference in Docs now shows a lock icon (🔒) next to every authenticated endpoint; fixed wrong comment deletion route and added missing my-rating endpoint
- App version shown in footer (links to changelog) — single source of truth at `client/src/lib/version.ts`

### Changed

- Tag display limit raised from 3 to 5 on ExploreCard and ConfigCard; quick-add palette in TagInput raised from 14 to 20; ShareModal max tags raised from 10 to 20
- Home page 4 feature cards rewritten to reflect actual current features: 200+ parameters, Share & Collaborate, Explore Community, History/Diff/Collections

---

## [1.8.0] — 2026-04-04

### Fixed

- QR code replaced `react-qr-code` with `qrcode.react` (proper ESM, 10M+ weekly downloads) — eliminates CJS/Vite interop crash on Share modal
- Notification bell no longer fires a 401 on page load for unauthenticated users — query is now gated behind token presence

### Added

- SunnyTune is now live at [sunny-tune.vercel.app](https://sunny-tune.vercel.app) — deployed on Vercel (frontend) and Railway (API) with Neon PostgreSQL
- Vercel Speed Insights and Analytics integrated — real-time performance monitoring and visitor analytics
- Admin panel — Reports tab for content moderation: view flagged configs/comments, dismiss reports from a paginated queue with a red badge indicator when reports are pending
- Admin panel — Config name search with debounce; Version, Clones, and Rating columns added to configs table
- Admin panel — Expanded stats dashboard: total favorites, collections, pending reports; user rows now expand inline to show their configs
- Changelog now visible in the main navigation header

---

## [1.7.1] — 2026-04-03

### Fixed

- Driving model now reads `displayName` from `ModelManager_ActiveBundle` (e.g. "WMI V12 (January 13, 2026)") — previously only parsed separate name/generation fields which many bundles don't have

### Changed

- Tags refreshed — removed stale tags (`pid-ctrl`, `indi-ctrl`, `nudgeless-lc`, `sp-long`, `stock-long`); added `mads`, `bsm`, `osm`, `sunnylink`, `live-torque`, `nn-lateral`, `dynamic-e2e`, `alpha-long`, `planplus`, `hyundai-tune`, `custom-acc`, `staging`
- Categories refreshed — replaced `oem-plus` with Comfort / Smooth and added City / Urban; all categories now reflect actual config use-cases
- Added `docker:prod:build:clean`, `docker:prod:up`, `docker:prod:up:d`, and `docker:prod:fresh` scripts — prod now has full parity with dev docker scripts

---

## [1.7.0] — 2026-04-03

### Fixed

- Mobile responsive layout for config editor — parameter controls now stack below labels on small screens instead of overflowing
- Server config schema test updated to match current SPConfig structure after the v1.6.0 field cleanup

### Added

- Staging-sp branch option in Vehicle & Version section
- Driving model field (`ModelManager_ActiveBundle`) — imported automatically from SunnyLink, editable in the editor, shown on shared config pages
- Since year labels on all config parameters — small year badge next to each label showing when the feature was introduced
- SP / OP source chips on all parameters that were still missing them (Interface, SpeedControl, LaneChange, Navigation, Advanced)

### Changed

- Vehicle section renamed to Vehicle & Version — now includes SP version, branch, and driving model metadata

---

## [1.6.0] — 2026-04-03

### Added

- Config version history — each save creates a snapshot; browse and restore via the History button in the editor
- Config A/B comparison — select two configs in My Configs and open a parameter-level diff
- Collections / playlists — group related configs into named collections from the My Configs page
- Trending this week sort on Explore (weighted by recent ratings, clones, and views over 7 days)
- QR code on share links — instantly scan to open on your Comma device
- Verified vehicle list — 200+ supported makes/models with autocomplete
- Server-side pagination for My Configs (up to 12 per page, with total count)
- GIN index on `configurations.config` JSONB column for fast SP-version filtering
- Dashboard page with personal stats and community overviews
- Changelog and Documentation pages

---

## [1.5.0] — 2026-04-02

### Added

- Config versioning — version counter increments on every save (shown as v2, v3… on cards)
- SP version and branch badges on config cards and Explore cards
- Enhanced card details — rating count, comment count, branch, SP version
- Server-side comment threading — reply button up to depth 2, `buildTree` client helper
- In-app notifications — bell icon in header, polls unread count every 60 s, notified on clone/rating/reply
- Content reporting — flag button on configs and comments (up to 2000-char reason)
- Config history pagination (My Configs), section deep-links (hash routing), unsaved-changes navigation guard
- `/health` endpoint with live DB ping and environment info
- Structured JSON logging (server-side)

### Changed

- Shared configs are now editable by their owner — removed read-only lock on share

---

## [1.4.0] — 2026-04-01

### Added

- Config import from JSON file (drag-and-drop or file picker) with Zod schema validation
- Config export — downloads full SPConfig JSON from editor or My Configs cards
- Config diff viewer (A/B) on SharedConfigPage — compare shared configs against clones or prior versions
- Min SP Version filter on Explore page (semver prefix match)
- Favorites / bookmarks — heart icon on Explore cards, Favorites tab in My Configs

---

## [1.3.0] — 2026-03-31

### Added

- Bcrypt-hashed admin secret support (`ADMIN_SECRET_HASH` env var)
- Global and per-route write rate limiting (`express-rate-limit`)
- Helmet HTTP headers with strict CSP
- Zod validation on all query parameters and request bodies
- Control-character stripping on all user-supplied text (XSS hardening)
- Page-view deduplication (24-hour TTL per visitor)

---

## [1.2.0] — 2026-03-31

### Added

- Clone tracking with lineage link (`clonedFrom` on config cards)
- Community ratings (1–5 stars) with per-config summary and breakdown
- Comments with author handle and timestamps
- Admin panel — users list, configs list, page-view dashboard, force-unshare
- Explore facets — tag and make filters update dynamically based on shared configs

---

## [1.1.0] — 2026-03-31

### Added

- Explore page — browse all shared configs with multi-filter search
- Share modal with one-click link copy
- Shared config detail page (public, no auth required)
- Anonymous user tokens (UUID bearer auth with revoke support)

---

## [1.0.0] — 2026-03-30

### Added

- Initial release — full 10-section SunnyPilot config editor
- Create, update, delete, and save configurations (PostgreSQL + Prisma)
- Dark zinc-themed UI (React 18 + Vite + Tailwind CSS)
- Docker Compose dev and production environments
- TypeScript throughout (client + server); 100% type-safe API layer
