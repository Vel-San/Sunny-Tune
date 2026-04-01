import { clsx } from "clsx";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Compass,
  Copy,
  GitFork,
  Info,
  KeyRound,
  LayoutList,
  Plus,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const { user, token } = useAuthStore();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navItems = [
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/configs", label: "My Configs", icon: LayoutList },
    { to: "/about", label: "About", icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 h-[57px] bg-zinc-950 border-b border-zinc-800 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <GitFork className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors">
              SunnyTune
            </span>
            <span className="hidden sm:block text-[10px] font-mono text-zinc-600 border border-zinc-800 px-1.5 py-0.5 rounded">
              SP · comma
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  isActive(to)
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right: new config + user token */}
          <div className="flex items-center gap-2">
            <Link to="/configure">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                <span className="hidden sm:block">New Config</span>
              </Button>
            </Link>

            {/* User token pill */}
            <button
              onClick={() => setTokenModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500
                         hover:text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700
                         px-2.5 py-1.5 rounded-md transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              {token ? token.slice(0, 14) + "…" : "No token"}
              <ChevronDown className="w-3 h-3 text-zinc-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Token modal */}
      <Modal
        open={tokenModalOpen}
        onClose={() => setTokenModalOpen(false)}
        title="Your Access Token"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300 leading-relaxed">
              This token is your only credential. Save it securely — you'll need
              it to access your configs from another device.
            </p>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500">Bearer Token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 font-mono text-xs text-zinc-300 bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 break-all select-all">
                {token ?? "—"}
              </code>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={copyToken}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {user && (
            <div className="space-y-1 text-xs text-zinc-600 font-mono">
              <p>User ID: {user.id}</p>
              <p>Configs saved: {user._count.configurations}</p>
              <p>
                Member since: {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
