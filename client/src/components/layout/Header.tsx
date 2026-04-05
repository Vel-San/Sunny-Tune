import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  AlertCircle,
  BarChart2,
  Bell,
  Book,
  Check,
  ChevronDown,
  Compass,
  Copy,
  ExternalLink,
  GitBranch,
  GitFork,
  Info,
  KeyRound,
  LayoutList,
  Menu,
  RotateCcw,
  Star,
  Tag,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  deleteNotification,
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsRead,
} from "../../api";
import { useAuthStore } from "../../store/authStore";
import type { NotificationRecord } from "../../types/config";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

export const Header: React.FC = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, token, rerolling, rerollToken } = useAuthStore();
  const [tokenModalOpen, setTokenModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rollConfirm, setRollConfirm] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 60 s — skip entirely when the user has no token
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchUnreadCount,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    enabled: !!token,
  });

  const { data: notifications = [], refetch: refetchNotifs } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: notifOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      qc.setQueryData(["notifications", "unread-count"], 0);
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, id) => {
      qc.setQueryData<NotificationRecord[]>(["notifications"], (prev = []) =>
        prev.filter((n) => n.id !== id),
      );
    },
  });

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const openNotifications = () => {
    setNotifOpen((prev) => !prev);
    if (!notifOpen) refetchNotifs();
  };

  const notifLabel = (n: NotificationRecord) => {
    if (n.type === "clone")
      return `Someone cloned "${n.config?.name ?? "your config"}"`;
    if (n.type === "rating") {
      const v = (n.payload as { ratingValue?: number } | null)?.ratingValue;
      return `Your config "${n.config?.name ?? ""}" received a ${v ?? "new"}-star rating`;
    }
    if (n.type === "comment_reply") return `Someone replied to your comment`;
    return "New notification";
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReroll = async () => {
    await rerollToken();
    setRollConfirm(false);
  };

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const navItems = [
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/configs", label: "My Configs", icon: LayoutList },
    { to: "/dashboard", label: "Dashboard", icon: BarChart2 },
    { to: "/changelog", label: "Changelog", icon: Tag },
    { to: "/docs", label: "Docs", icon: Book },
    { to: "/about", label: "About", icon: Info },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950 border-b border-zinc-800">
        <div className="w-full max-w-7xl mx-auto px-4 h-[57px] relative flex items-center">
          {/* Logo — left-anchored */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0 group"
            >
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
                <GitFork className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm text-zinc-100 group-hover:text-blue-400 transition-colors whitespace-nowrap">
                SunnyTune
              </span>
            </Link>
          </div>

          {/* Desktop nav — absolutely centered so it's always equidistant from both sides */}
          <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  isActive(to)
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
            <a
              href="https://sunnylink.wiki/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Wiki
            </a>
          </nav>

          {/* Right: notifications + user token + hamburger */}
          <div className="ml-auto flex items-center gap-2">
            {/* Notification bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={openNotifications}
                className="relative p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-300">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markReadMutation.mutate()}
                        className="text-[11px] text-blue-400 hover:text-blue-300"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-zinc-600">
                      No notifications yet
                    </div>
                  ) : (
                    <ul className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
                      {notifications.map((n) => (
                        <li
                          key={n.id}
                          className={clsx(
                            "flex items-start gap-3 px-4 py-3 hover:bg-zinc-900 transition-colors cursor-pointer",
                            !n.readAt && "bg-blue-500/5",
                          )}
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.config?.shareToken) {
                              navigate(`/shared/${n.config.shareToken}`);
                            }
                          }}
                        >
                          <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
                            {n.type === "clone" && (
                              <GitBranch className="w-3 h-3 text-blue-400" />
                            )}
                            {n.type === "rating" && (
                              <Star className="w-3 h-3 text-amber-400" />
                            )}
                            {n.type === "comment_reply" && (
                              <Bell className="w-3 h-3 text-zinc-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-300 leading-snug">
                              {notifLabel(n)}
                            </p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissMutation.mutate(n.id);
                            }}
                            className="text-zinc-700 hover:text-zinc-400 flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* User token pill — desktop only */}
            <button
              onClick={() => setTokenModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500
                         hover:text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700
                         px-2.5 py-1.5 rounded-md transition-colors"
            >
              <KeyRound className="w-3 h-3" />
              {token ? token.slice(0, 14) + "…" : "No token"}
              <ChevronDown className="w-3 h-3 text-zinc-600" />
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(to)
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900",
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            ))}
            <a
              href="https://sunnylink.wiki/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              SunnyLink Wiki
            </a>

            {/* Token row in mobile menu */}
            <div className="pt-2 border-t border-zinc-800 mt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTokenModalOpen(true);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
              >
                <KeyRound className="w-4 h-4 flex-shrink-0" />
                <span className="font-mono text-xs truncate">
                  {token ? token.slice(0, 20) + "…" : "No token"}
                </span>
              </button>
            </div>
          </div>
        )}
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

          {/* Revoke / re-roll token */}
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            {!rollConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                onClick={() => setRollConfirm(true)}
                className="w-full text-zinc-500"
              >
                Regenerate token…
              </Button>
            ) : (
              <>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  <span className="text-red-400 font-medium">Warning: </span>
                  This permanently invalidates the current token. Any other
                  device using it will be signed out immediately.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={rerolling}
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={handleReroll}
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={rerolling}
                    onClick={() => setRollConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
