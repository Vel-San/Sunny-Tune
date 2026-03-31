import {
    BookOpen,
    Code2,
    Container,
    Database,
    ExternalLink,
    FlaskConical,
    GitFork,
    Server,
    Star,
} from "lucide-react";
import React from "react";
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

// ─── Tech Stack ───────────────────────────────────────────────────────────────

const STACK: { icon: React.ElementType; label: string; items: string[] }[] = [
  {
    icon: Code2,
    label: "Frontend",
    items: [
      "React 18 + TypeScript",
      "Vite 5 (build tool)",
      "Tailwind CSS · dark zinc theme",
      "Zustand (global state)",
      "TanStack Query (async/cache)",
      "React Router v6",
      "Lucide React (icons)",
    ],
  },
  {
    icon: Server,
    label: "Backend",
    items: [
      "Node.js + Express + TypeScript",
      "Prisma ORM (type-safe DB access)",
      "Zod (runtime validation)",
      "express-rate-limit + Helmet",
      "nanoid (share tokens)",
      "uuid (anonymous user tokens)",
    ],
  },
  {
    icon: Database,
    label: "Database",
    items: [
      "PostgreSQL 16",
      "Prisma migrations",
      "Indexed queries",
      "Page-view analytics (hashed IPs)",
      "Read-only shared config locking",
    ],
  },
  {
    icon: FlaskConical,
    label: "Testing",
    items: [
      "Vitest (server + client)",
      "@testing-library/react (UI tests)",
      "Supertest (HTTP API tests)",
      "vi.mock + vi.hoisted (mocking)",
      "46 tests · 0 skipped",
    ],
  },
  {
    icon: Container,
    label: "Infrastructure",
    items: [
      "Docker + Docker Compose",
      "Multi-stage prod builds",
      "nginx 1.25 (production client)",
      "Prisma auto-migrate on start",
      "Vercel-ready (frontend)",
    ],
  },
  {
    icon: BookOpen,
    label: "Security",
    items: [
      "Anonymous UUID bearer tokens",
      "Admin: crypto.timingSafeEqual",
      "Admin: sessionStorage (tab-scoped)",
      "Rate limiting on all admin routes",
      "Helmet HTTP security headers",
      "Hashed visitor tracking (SHA-256)",
    ],
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  "Configure every SunnyPilot parameter: lateral control (Torque/PID/INDI/LQR), longitudinal, speed limiting (SLC/VTSC/MTSC), lane change, navigation, UI, Comma AI core, and advanced tuning",
  "Share configs via a unique read-only URL. Once published, the config is immutable.",
  "Explore community-shared configs — filter by vehicle make/model, tags, and category",
  "Rate (1–5 stars) and comment on shared configs",
  "Clone any public config as your own starting point",
  "Secure admin panel with user management, config management, and page-view analytics",
  "Feature registry: adding a new SP or Comma AI parameter is a one-liner in featureRegistry.ts",
  "No account needed — a unique token is auto-generated and stored in your browser",
];

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * About page — describes SunnyTune, its tech stack, community links, and credits.
 */
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
          SunnyTune is a community web app for building, storing, and sharing{" "}
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
          openpilot configurations. No sign-up needed — a unique anonymous token
          is auto-generated directly in your browser.
        </p>
      </div>

      {/* ── What it does ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          What it does
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
          Tech Stack
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STACK.map(({ icon: Icon, label, items }) => (
            <div
              key={label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  {label}
                </span>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="text-xs text-zinc-500 flex gap-2">
                    <span className="text-zinc-700 flex-shrink-0">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Community Links ── */}
      <section className="space-y-6">
        <h2 className="text-base font-semibold text-zinc-100 border-b border-zinc-800 pb-2">
          Community Links
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
          <span className="font-semibold text-zinc-200">Vel</span> with the
          definite usage and help of{" "}
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
