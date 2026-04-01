/**
 * @fileoverview Admin panel page.
 *
 * Accessible at `/admin`. Protected by a login gate that asks for the
 * `ADMIN_SECRET` value and stores it in `sessionStorage` (auto-cleared on
 * tab close — never persisted to localStorage).
 *
 * The page has four tabs:
 * - Dashboard — overall platform statistics
 * - Users     — paginated list with delete action
 * - Configs   — all configs with unshare / delete actions
 * - Analytics — page view breakdown and sparkline chart
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  BarChart2,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  RefreshCw,
  Shield,
  Trash2,
  Unlink,
  User,
  Users,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  deleteAdminConfig,
  deleteAdminUser,
  fetchAdminConfigs,
  fetchAdminPageViews,
  fetchAdminStats,
  fetchAdminUsers,
  unshareAdminConfig,
  type AdminConfigSummary,
  type AdminStats,
  type AdminUser,
} from "../api/admin";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";

// ─── Session-storage helpers ──────────────────────────────────────────────────

/** Key used to store the admin secret in sessionStorage. */
const SESSION_KEY = "sp_admin_secret";

/**
 * Reads the admin secret from sessionStorage.
 * @returns The stored secret string, or null if not set.
 */
function getStoredSecret(): string | null {
  return sessionStorage.getItem(SESSION_KEY);
}

/**
 * Persists the admin secret to sessionStorage.
 * @param secret - The secret to store.
 */
function setStoredSecret(secret: string): void {
  sessionStorage.setItem(SESSION_KEY, secret);
}

/** Removes the admin secret from sessionStorage (logout). */
function clearStoredSecret(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * A single statistic tile used on the dashboard tab.
 */
function StatTile({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-5",
        accent
          ? "border-blue-600/40 bg-blue-500/10"
          : "border-zinc-800 bg-zinc-900",
      )}
    >
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-2xl font-bold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

/**
 * Confirmation dialog rendered inline before destructive actions.
 */
function ConfirmBanner({
  message,
  onConfirm,
  onCancel,
  loading,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
      <span className="flex-1">{message}</span>
      <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>
        Confirm
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

// ─── Dashboard tab ───────────────────────────────────────────────────────────

/**
 * Dashboard tab: shows platform-wide statistics.
 */
function DashboardTab({ secret }: { secret: string }) {
  const { data, isLoading, isError } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => fetchAdminStats(secret),
    retry: false,
  });

  if (isLoading) return <p className="text-zinc-500 text-sm">Loading stats…</p>;
  if (isError || !data)
    return (
      <p className="text-red-400 text-sm">
        Failed to load stats. Check your secret.
      </p>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Total Users"
          value={data.totalUsers}
          sub={`+${data.recentUsers} this month`}
          accent
        />
        <StatTile
          label="Total Configs"
          value={data.totalConfigs}
          sub={`+${data.recentConfigs} this month`}
        />
        <StatTile label="Shared Configs" value={data.sharedConfigs} />
        <StatTile label="Page Views" value={data.totalPageViews} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatTile label="Total Ratings" value={data.totalRatings} />
        <StatTile label="Total Comments" value={data.totalComments} />
        <StatTile
          label="Engagement"
          value={
            data.sharedConfigs > 0
              ? `${((data.totalRatings / data.sharedConfigs) * 100).toFixed(0)}%`
              : "—"
          }
          sub="Ratings per shared config"
        />
      </div>
    </div>
  );
}

// ─── Users tab ────────────────────────────────────────────────────────────────

/**
 * Users tab: paginated user list with delete capability.
 */
function UsersTab({ secret }: { secret: string }) {
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page],
    queryFn: () => fetchAdminUsers(secret, page),
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminUser(secret, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmDelete(null);
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          {data ? `${data.total} users total` : "Loading…"}
        </p>
      </div>

      {isLoading ? (
        <p className="text-zinc-500 text-sm">Loading users…</p>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  ID (prefix)
                </th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Registered
                </th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Last seen
                </th>
                <th className="text-right px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Configs
                </th>
                <th className="text-right px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Ratings
                </th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data?.users.map((u: AdminUser) => (
                <React.Fragment key={u.id}>
                  <tr className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {u.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {new Date(u.lastSeenAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {u._count.configurations}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {u._count.ratings}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirmDelete(u.id)}
                        className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                  {confirmDelete === u.id && (
                    <tr>
                      <td colSpan={6} className="px-4 py-2">
                        <ConfirmBanner
                          message={`Permanently delete user ${u.id.slice(0, 8)}… and all their data?`}
                          onConfirm={() => deleteMut.mutate(u.id)}
                          onCancel={() => setConfirmDelete(null)}
                          loading={deleteMut.isPending}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-zinc-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Configs tab ──────────────────────────────────────────────────────────────

/**
 * Configs tab: all configs across all users with delete and unshare actions.
 */
function ConfigsTab({ secret }: { secret: string }) {
  const [page, setPage] = useState(1);
  const [sharedOnly, setSharedOnly] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "configs", page, sharedOnly],
    queryFn: () => fetchAdminConfigs(secret, page, 50, sharedOnly),
    retry: false,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteAdminConfig(secret, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "configs"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      setConfirmDeleteId(null);
    },
  });

  const unshareMut = useMutation({
    mutationFn: (id: string) => unshareAdminConfig(secret, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "configs"] });
    },
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <p className="text-sm text-zinc-500 flex-1">
          {data ? `${data.total} configs` : "Loading…"}
        </p>
        <label className="flex items-center gap-2 text-xs text-zinc-500 cursor-pointer">
          <input
            type="checkbox"
            checked={sharedOnly}
            onChange={(e) => {
              setSharedOnly(e.target.checked);
              setPage(1);
            }}
            className="accent-blue-500"
          />
          Shared only
        </label>
      </div>

      {isLoading ? (
        <p className="text-zinc-500 text-sm">Loading configs…</p>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Vehicle
                </th>
                <th className="text-left px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wider">
                  Views
                </th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {data?.configs.map((c: AdminConfigSummary) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-zinc-900/50">
                    <td className="px-4 py-3 text-zinc-300 font-medium max-w-[200px] truncate">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {[c.vehicleMake, c.vehicleModel, c.vehicleYear]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.isShared ? (
                        <Badge variant="success">Shared</Badge>
                      ) : (
                        <Badge variant="default">Private</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 tabular-nums">
                      {c.viewCount}
                    </td>
                    <td className="px-4 py-3 flex items-center gap-1 justify-end">
                      {c.isShared && (
                        <button
                          onClick={() => unshareMut.mutate(c.id)}
                          className="p-1 rounded text-zinc-600 hover:text-amber-400 hover:bg-amber-400/10 transition-colors"
                          title="Force unshare"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Delete config"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                  {confirmDeleteId === c.id && (
                    <tr>
                      <td colSpan={5} className="px-4 py-2">
                        <ConfirmBanner
                          message={`Permanently delete "${c.name}"?`}
                          onConfirm={() => deleteMut.mutate(c.id)}
                          onCancel={() => setConfirmDeleteId(null)}
                          loading={deleteMut.isPending}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-zinc-500">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Analytics tab ────────────────────────────────────────────────────────────

/**
 * Analytics tab: page view breakdown by path + daily sparkline.
 */
function AnalyticsTab({ secret }: { secret: string }) {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pageviews", days],
    queryFn: () => fetchAdminPageViews(secret, days),
    retry: false,
  });

  const maxCount = data?.byPath.reduce((m, r) => Math.max(m, r.count), 1) ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <p className="text-sm text-zinc-500 flex-1">Page views by path</p>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-md px-2 py-1"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      {isLoading ? (
        <p className="text-zinc-500 text-sm">Loading analytics…</p>
      ) : (
        <>
          <div className="space-y-2">
            {data?.byPath.map((row) => (
              <div key={row.path} className="flex items-center gap-3">
                <span className="font-mono text-xs text-zinc-500 w-40 truncate shrink-0">
                  {row.path}
                </span>
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(row.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400 tabular-nums w-12 text-right">
                  {row.count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {data && data.daily.length > 0 && (
            <div>
              <p className="text-xs text-zinc-600 mb-2 uppercase tracking-widest font-medium">
                Daily trend
              </p>
              <div className="flex items-end gap-0.5 h-16">
                {data.daily.map((d) => {
                  const maxDay = Math.max(...data.daily.map((x) => x.count), 1);
                  return (
                    <div
                      key={d.day}
                      className="flex-1 bg-blue-500/60 rounded-sm min-w-0"
                      style={{ height: `${(d.count / maxDay) * 100}%` }}
                      title={`${d.day}: ${d.count}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <p className="text-xs text-zinc-600">
            Total: {data?.total.toLocaleString()} views in the last {days} days
          </p>
        </>
      )}
    </div>
  );
}

// ─── Login gate ───────────────────────────────────────────────────────────────

/**
 * Admin secret login form.
 *
 * @param onLogin - Called with the entered secret when the form is submitted.
 */
function AdminLogin({
  onLogin,
  verifying,
  loginError,
}: {
  onLogin: (secret: string) => void;
  verifying: boolean;
  loginError: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (verifying) return;
    const val = inputRef.current?.value.trim() ?? "";
    if (val.length < 8) {
      setError("Secret is too short");
      return;
    }
    setError("");
    onLogin(val);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Admin Panel</p>
            <p className="text-xs text-zinc-600">SP Configurator</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Admin Secret
            </label>
            <input
              ref={inputRef}
              type="password"
              autoComplete="off"
              placeholder="Enter ADMIN_SECRET…"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={verifying}
            disabled={verifying}
            leftIcon={verifying ? undefined : <Lock className="w-4 h-4" />}
          >
            {verifying ? "Verifying…" : "Enter Admin Panel"}
          </Button>
          {loginError && (
            <p className="text-xs text-red-400 text-center mt-1">
              {loginError}
            </p>
          )}
        </form>

        <p className="mt-6 text-[11px] text-zinc-700 text-center">
          Secret stored in sessionStorage only — clears on tab close.
        </p>
      </div>
    </div>
  );
}

// ─── Main admin page ──────────────────────────────────────────────────────────

type AdminTab = "dashboard" | "users" | "configs" | "analytics";

const TABS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Users", icon: Users },
  { id: "configs", label: "Configs", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart2 },
];

/**
 * Top-level admin page component.
 *
 * Renders the login gate if no secret is stored in sessionStorage,
 * otherwise renders the tabbed admin panel.
 */
export default function AdminPage() {
  // secret is ONLY set after the server has confirmed it is valid.
  // Never set optimistically — this closes the sessionStorage-manipulation bypass.
  const [secret, setSecret] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>("dashboard");
  // True while verifying a stored secret on page load (shows a spinner instead
  // of briefly flashing the login form or admin panel).
  const [initializing, setInitializing] = useState(() => !!getStoredSecret());
  // True while the login form is waiting for the server to confirm the secret.
  const [verifying, setVerifying] = useState(false);
  const [loginError, setLoginError] = useState("");
  const qc = useQueryClient();

  // On mount: verify any sessionStorage-loaded secret with the server before
  // rendering the admin panel. Prevents bypassing the login gate by manually
  // setting sessionStorage in DevTools.
  useEffect(() => {
    const stored = getStoredSecret();
    if (!stored) {
      setInitializing(false);
      return;
    }
    fetchAdminStats(stored)
      .then(() => setSecret(stored))
      .catch(() => clearStoredSecret())
      .finally(() => setInitializing(false));
  }, []);

  function handleLogin(s: string) {
    setVerifying(true);
    setLoginError("");
    fetchAdminStats(s)
      .then(() => {
        setStoredSecret(s);
        setSecret(s);
        qc.invalidateQueries({ queryKey: ["admin"] });
      })
      .catch(() => setLoginError("Invalid admin secret — please try again."))
      .finally(() => setVerifying(false));
  }

  function handleLogout() {
    clearStoredSecret();
    setSecret(null);
    qc.clear();
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (!secret) {
    return (
      <AdminLogin
        onLogin={handleLogin}
        verifying={verifying}
        loginError={loginError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Admin header */}
      <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-4 h-14 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
          <Shield className="w-3.5 h-3.5 text-red-400" />
        </div>
        <span className="text-sm font-semibold text-zinc-100">Admin Panel</span>
        <span className="text-xs text-zinc-600">SP Configurator</span>

        <div className="flex-1" />

        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["admin"] })}
          className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Refresh data"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<LogOut className="w-3.5 h-3.5" />}
          onClick={handleLogout}
        >
          Sign out
        </Button>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-48 shrink-0 border-r border-zinc-800 min-h-[calc(100vh-56px)] pt-6 px-2">
          <nav className="flex flex-col gap-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                  tab === id
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6 px-3">
            <div className="flex items-center gap-2 text-xs text-zinc-700">
              <User className="w-3 h-3" />
              Admin session
            </div>
            <p className="text-[10px] text-zinc-800 mt-0.5 font-mono">
              {secret.slice(0, 6)}••••••
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 min-w-0">
          <h1 className="text-base font-semibold text-zinc-100 mb-6 flex items-center gap-2">
            {TABS.find((t) => t.id === tab)?.label}
          </h1>

          {tab === "dashboard" && <DashboardTab secret={secret} />}
          {tab === "users" && <UsersTab secret={secret} />}
          {tab === "configs" && <ConfigsTab secret={secret} />}
          {tab === "analytics" && <AnalyticsTab secret={secret} />}
        </main>
      </div>
    </div>
  );
}
