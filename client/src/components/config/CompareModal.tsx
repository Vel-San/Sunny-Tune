/**
 * CompareModal — lets a user compare the current shared config against
 * any other public config (by share URL / token) or one of their own configs.
 *
 * Usage:
 *   <CompareModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     baseConfig={config.config}
 *     baseName={config.name}
 *   />
 */

import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { ArrowRight, GitCompare, Loader2, Search } from "lucide-react";
import React, { useMemo, useState } from "react";
import { fetchAllConfigs, fetchSharedConfig } from "../../api";
import { computeConfigDiff } from "../../lib/configDiff";
import { useAuthStore } from "../../store/authStore";
import type { SPConfig } from "../../types/config";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface CompareModalProps {
  open: boolean;
  onClose: () => void;
  baseConfig: SPConfig;
  baseName: string;
}

/** Extract a raw share token from either a URL or a bare token string. */
function parseShareToken(raw: string): string {
  const trimmed = raw.trim();
  // Match /shared/<token> path in any URL
  const m = trimmed.match(/\/shared\/([^/?#]+)/);
  if (m) return m[1];
  return trimmed;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  open,
  onClose,
  baseConfig,
  baseName,
}) => {
  const { token: authToken } = useAuthStore();

  // ── Input state ────────────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState("");
  const [compareConfig, setCompareConfig] = useState<SPConfig | null>(null);
  const [compareName, setCompareName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── My configs (shown when authenticated) ──────────────────────────────────
  const { data: myConfigs = [] } = useQuery({
    queryKey: ["configs", "all"],
    queryFn: fetchAllConfigs,
    enabled: !!authToken && open,
  });

  // ── Diff computation ────────────────────────────────────────────────────────
  const diff = useMemo(
    () => (compareConfig ? computeConfigDiff(baseConfig, compareConfig) : []),
    [baseConfig, compareConfig],
  );

  const grouped = useMemo(() => {
    const map: Record<string, typeof diff> = {};
    for (const entry of diff) {
      (map[entry.sectionLabel] ??= []).push(entry);
    }
    return map;
  }, [diff]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleFetchByToken = async () => {
    const rawToken = parseShareToken(urlInput);
    if (!rawToken) return;
    setLoading(true);
    setFetchError(null);
    setCompareConfig(null);
    try {
      const record = await fetchSharedConfig(rawToken);
      setCompareConfig(record.config);
      setCompareName(record.name);
    } catch {
      setFetchError("Could not find a public config with that URL or token.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOwn = (id: string) => {
    const found = myConfigs.find((c) => c.id === id);
    if (found) {
      setCompareConfig(found.config);
      setCompareName(found.name);
      setFetchError(null);
    }
  };

  const handleClose = () => {
    setUrlInput("");
    setCompareConfig(null);
    setCompareName("");
    setFetchError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Compare Configs" width="lg">
      <div className="space-y-4">
        {/* Base config label */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="text-zinc-400 font-medium truncate">{baseName}</span>
          <ArrowRight className="w-3 h-3 flex-shrink-0 text-zinc-700" />
          {compareName ? (
            <span className="text-blue-400 font-medium truncate">{compareName}</span>
          ) : (
            <span className="italic">pick a config to compare</span>
          )}
        </div>

        {/* ── Fetch by share URL/token ─────────────────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
            Compare against a shared config
          </p>
          <div className="flex gap-2">
            <Input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste share URL or token…"
              className="flex-1 text-xs font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleFetchByToken()}
            />
            <Button
              variant="secondary"
              size="sm"
              loading={loading}
              disabled={!urlInput.trim()}
              leftIcon={loading ? undefined : <Search className="w-3.5 h-3.5" />}
              onClick={handleFetchByToken}
            >
              Fetch
            </Button>
          </div>
          {fetchError && (
            <p className="mt-1.5 text-xs text-red-400">{fetchError}</p>
          )}
        </div>

        {/* ── My configs picker (authenticated only) ───────────────────────── */}
        {authToken && myConfigs.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
              Or compare against one of your configs
            </p>
            <select
              onChange={(e) => handleSelectOwn(e.target.value)}
              defaultValue=""
              className="w-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="" disabled>
                — Select a config —
              </option>
              {myConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.vehicleMake ? ` — ${c.vehicleMake} ${c.vehicleModel ?? ""}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ── Diff results ─────────────────────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Fetching config…</span>
          </div>
        )}

        {compareConfig && !loading && (
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              <span
                className={clsx(
                  "font-semibold",
                  diff.length === 0 ? "text-green-400" : "text-zinc-300",
                )}
              >
                {diff.length === 0
                  ? "Configs are identical"
                  : `${diff.length} difference${diff.length !== 1 ? "s" : ""}`}
              </span>
              {diff.length > 0 && (
                <span className="flex items-center gap-1.5 text-[11px]">
                  <GitCompare className="w-3 h-3" />
                  <span className="text-zinc-500">{baseName}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-700" />
                  <span className="text-blue-400">{compareName}</span>
                </span>
              )}
            </div>

            {diff.length > 0 && (
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {Object.entries(grouped).map(([sectionLabel, entries]) => (
                  <div key={sectionLabel}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                      {sectionLabel}
                    </p>
                    <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                      {entries.map((entry) => (
                        <div
                          key={entry.field}
                          className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                        >
                          <span className="text-xs text-zinc-400 truncate">
                            {entry.label}
                          </span>
                          <span
                            className={clsx(
                              "text-xs font-mono px-1.5 py-0.5 rounded",
                              "bg-red-500/10 text-red-400 border border-red-500/20",
                              "line-through decoration-red-400/50",
                            )}
                          >
                            {entry.oldValue}
                          </span>
                          <span
                            className={clsx(
                              "text-xs font-mono px-1.5 py-0.5 rounded",
                              "bg-green-500/10 text-green-400 border border-green-500/20",
                            )}
                          >
                            {entry.newValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
