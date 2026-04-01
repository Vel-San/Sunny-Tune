import {
  ArrowRight,
  Compass,
  Cpu,
  GitBranch,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

const FEATURES = [
  {
    icon: GitBranch,
    title: "Full Lateral Tuning",
    desc: "Torque, PID, INDI, LQR — every parameter exposed with explanations.",
  },
  {
    icon: TrendingUp,
    title: "SP Speed Controls",
    desc: "SLC, VTSC, MTSC fully configurable with source, offset, and engagement mode.",
  },
  {
    icon: Cpu,
    title: "Comma AI Core",
    desc: "E2E mode, live parameters, LDW, recording, and all upstream OP params.",
  },
  {
    icon: Compass,
    title: "Community Explore",
    desc: "Browse shared configs by vehicle, rating, tags. Rate and comment on builds.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            SunnyTune — SunnyPilot &amp; Comma AI Config Tuner
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">
              Forge your perfect
              <br />
              <span className="text-blue-400">SunnyPilot config</span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
              Configure every parameter — lateral control, speed limits, lane
              change, navigation, and Comma AI core settings — then share with
              the community.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/configure">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Config
              </Button>
            </Link>
            <Link to="/explore">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Compass className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Explore Community
              </Button>
            </Link>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3 text-left mt-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card rounded-xl p-4 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-200">{title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-xs text-zinc-600">
            No account needed. A unique access token is auto-generated in your
            browser.
          </p>
        </div>
      </div>
    </div>
  );
}
