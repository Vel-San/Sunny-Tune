import React from "react";
import { Link } from "react-router-dom";
import { Header } from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-zinc-800 bg-zinc-950 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-600">
          <span>
            Built with <span className="text-red-500/70">♥</span> by{" "}
            <span className="text-zinc-400 font-medium">Vel</span> with the
            definite usage and help of{" "}
            <span className="text-zinc-400 font-medium">AI tools</span>.
          </span>
          <Link to="/about" className="hover:text-zinc-400 transition-colors">
            About SunnyTune
          </Link>
        </div>
      </footer>
    </div>
  );
};
