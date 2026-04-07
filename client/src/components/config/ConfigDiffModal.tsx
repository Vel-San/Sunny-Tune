/**
 * ConfigDiffModal — shows a parameter-level diff between two SPConfig objects.
 *
 * Usage:
 *   <ConfigDiffModal
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     original={originalConfig}
 *     modified={modifiedConfig}
 *     originalName="Original config name"
 *   />
 */

import { clsx } from "clsx";
import { ArrowRight } from "lucide-react";
import React, { useMemo } from "react";
import { computeConfigDiff } from "../../lib/configDiff";
import type { SPConfig } from "../../types/config";
import { Modal } from "../ui/Modal";

interface ConfigDiffModalProps {
  open: boolean;
  onClose: () => void;
  original: SPConfig;
  modified: SPConfig;
  originalName?: string;
  modifiedName?: string;
}

export const ConfigDiffModal: React.FC<ConfigDiffModalProps> = ({
  open,
  onClose,
  original,
  modified,
  originalName = "Original",
  modifiedName = "This config",
}) => {
  const diff = useMemo(
    () => computeConfigDiff(original, modified),
    [original, modified],
  );

  // Group by section
  const grouped = useMemo(() => {
    const map: Record<string, typeof diff> = {};
    for (const entry of diff) {
      (map[entry.sectionLabel] ??= []).push(entry);
    }
    return map;
  }, [diff]);

  return (
    <Modal open={open} onClose={onClose} title="What changed" width="lg">
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-zinc-500 border-b border-zinc-800 pb-3">
          <span className="font-medium text-zinc-400">
            {diff.length} change{diff.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-zinc-500">{originalName}</span>
            <ArrowRight className="w-3 h-3 text-zinc-700" />
            <span className="text-zinc-300">{modifiedName}</span>
          </span>
        </div>

        {diff.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-6">
            No differences found between the two configs.
          </p>
        )}

        {/* Diff groups */}
        <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
          {Object.entries(grouped).map(([sectionLabel, entries]) => (
            <div key={sectionLabel}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                {sectionLabel}
              </p>
              <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                {entries.map((entry) => (
                  <div
                    key={entry.field}
                    className="flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
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
      </div>
    </Modal>
  );
};
