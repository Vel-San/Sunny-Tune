import { ExternalLink, GitFork, Star } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Community Links ──────────────────────────────────────────────────────────

const LINKS: {
  category: string;
  items: { label: string; href: string; desc: string }[];
}[] = [
  {
    category: "SunnyPilot",
    items: [
      {
        label: "Official Website",
        href: "https://www.sunnypilot.ai/",
        desc: "Homepage, feature overview, and getting started",
      },
      {
        label: "GitHub Repository",
        href: "https://github.com/sunnypilot/sunnypilot",
        desc: "Source code, issues, pull requests, and releases",
      },
      {
        label: "Community Forum",
        href: "https://community.sunnypilot.ai/",
        desc: "Guides, support, news, and user discussions",
      },
      {
        label: "Documentation",
        href: "https://docs.sunnypilot.ai/",
        desc: "Installation, features, FAQ, and branch guide",
      },
    ],
  },
  {
    category: "Comma AI",
    items: [
      {
        label: "Comma AI",
        href: "https://comma.ai/",
        desc: "The hardware and openpilot ecosystem behind it all",
      },
      {
        label: "openpilot GitHub",
        href: "https://github.com/commaai/openpilot",
        desc: "The upstream open-source ADAS project",
      },
      {
        label: "comma connect",
        href: "https://connect.comma.ai/",
        desc: "Access and review your driving data online",
      },
    ],
  },
];

// ─── Tech Stack (simplified) ──────────────────────────────────────────────────

const STACK = [
  { label: "Frontend", value: "React · TypeScript · Tailwind CSS · Vite" },
  { label: "Backend", value: "Node.js · Express · TypeScript · Prisma ORM" },
  { label: "Database", value: "PostgreSQL (Neon)" },
  { label: "Hosting", value: "Vercel (frontend + API serverless)" },
  { label: "Auth", value: "Anonymous UUID bearer tokens — no sign-up needed" },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  "Build and fine-tune every SunnyPilot parameter — lateral, longitudinal, speed control, lane change, navigation, UI, and more",
  "Share your config via a unique link. Published configs are publicly viewable and safe from accidental edits.",
  "Explore community configs — filter by vehicle, tags, category, or sort by trending, top-rated, and newest",
  "Rate and comment on shared configs, or clone any public config as your own starting point",
  "Track your config version history — browse snapshots and restore any previous version",
  "Compare two configs side-by-side with a parameter-level diff view",
  "Organise configs into named collections for easy access",
  "Import and export configs as JSON — works with SunnyLink and manual backups",
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-14">
      {/* ── Hero ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <GitFork className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">SunnyTune</h1>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              SP · comma AI Config Tuner
            </p>
          </div>
        </div>

        <blockquote className="border-l-2 border-blue-600/60 pl-4 italic text-zinc-400 text-sm">
          "Fine-tune your SunnyPilot. Share. Drive chill."
        </blockquote>

        <p className="text-zinc-400 leading-relaxed max-w-2xl">
          SunnyTune is a free community web app for building, storing, and
          sharing{" "}
          <a
            href="https://www.sunnypilot.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            SunnyPilot
          </a>{" "}
          and{" "}
          <a
            href="https://comma.ai/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Comma AI
          </a>{" "}
          openpilot configurations. No sign-up, no account — a unique anonymous
          token is generated automatically in your browser.
        </p>
      </div>

      {/* ── What it does ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          What you can do
        </h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-zinc-400">
          {FEATURES.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Tech Stack ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          Built with
        </h2>
        <div className="grid sm:grid-cols-2 gap-2">
          {STACK.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <span className="text-xs font-semibold text-zinc-400 w-20 flex-shrink-0 pt-0.5">
                {label}
              </span>
              <span className="text-xs text-zinc-500">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Community Links ── */}
      <section className="space-y-6">
        <h2 className="text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          Community & Resources
        </h2>
        {LINKS.map(({ category, items }) => (
          <div key={category} className="space-y-2">
            <h3 className="text-sm font-semibold text-zinc-300">{category}</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {items.map(({ label, href, desc }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors group"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                      {label}
                    </p>
                    <p className="text-xs text-zinc-600">{desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Credits ── */}
      <section className="border border-zinc-800 bg-zinc-900/50 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <h2 className="text-sm font-semibold text-zinc-200">
            Credits &amp; Disclaimer
          </h2>
        </div>
        <p className="text-sm text-zinc-400">
          SunnyTune was designed and built by{" "}
          <span className="font-semibold text-zinc-200">Vel</span> with the help
          of{" "}
          <span className="font-semibold text-zinc-200">AI coding tools</span>.
        </p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          This is an independent community project and is not affiliated with,
          endorsed by, or officially connected to SunnyPilot or Comma AI.
          SunnyPilot is a fork of Comma AI's openpilot — both are open-source
          projects released under the MIT licence. All trademarks and project
          names belong to their respective owners.
        </p>
        <Link
          to="/"
          className="inline-block text-xs text-blue-500 hover:text-blue-400 transition-colors"
        >
          ← Back to SunnyTune
        </Link>
      </section>
    </div>
  );
}
