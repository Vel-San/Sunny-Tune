import { Github } from "lucide-react";
import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION } from "../../lib/version";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

// Subtle drifting particle — pure CSS, no canvas, no deps
const Particle: React.FC<{
  style: React.CSSProperties;
  char: string;
}> = ({ style, char }) => (
  <span
    aria-hidden="true"
    className="pointer-events-none select-none fixed text-zinc-700/40"
    style={style}
  >
    {char}
  </span>
);

const CHARS = ["✦", "✧", "·", "⋆", "✦", "·", "⋆", "✧"];

function useParticles(count: number) {
  return useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const left = Math.random() * 100;
      const size = 8 + Math.random() * 10;
      const duration = 18 + Math.random() * 24;
      const delay = -(Math.random() * duration);
      const drift = (Math.random() - 0.5) * 60;
      const char = CHARS[i % CHARS.length];
      return {
        id: i,
        char,
        style: {
          left: `${left}vw`,
          top: "-2vh",
          fontSize: `${size}px`,
          animation: `particle-fall ${duration}s ${delay}s linear infinite`,
          "--drift": `${drift}px`,
          opacity: 0.3 + Math.random() * 0.4,
        } as React.CSSProperties,
      };
    });
  }, [count]);
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const particles = useParticles(28);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col relative overflow-x-hidden">
      {/* Particle layer */}
      {particles.map((p) => (
        <Particle key={p.id} char={p.char} style={p.style} />
      ))}

      <Header />
      <main className="flex-1 relative z-10">{children}</main>
      <footer className="border-t border-zinc-800 bg-zinc-950 py-4 mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
          <span>
            Built with <span className="text-red-500/70">♥</span> by{" "}
            <span className="text-zinc-400 font-medium">Vel</span> with the
            definite usage and help of{" "}
            <span className="text-zinc-400 font-medium">AI tools</span>.
          </span>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/Vel-San/Sunny-Tune"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-zinc-400 transition-colors"
              aria-label="View source on GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              Open Source
            </a>
            <Link
              to="/changelog"
              className="font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
            >
              v{APP_VERSION}
            </Link>
            <Link to="/about" className="hover:text-zinc-400 transition-colors">
              About SunnyTune
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
