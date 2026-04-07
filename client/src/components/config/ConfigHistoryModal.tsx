import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowLeftRight } from "lucide-react";
import React, { useState } from "react";
import { fetchConfigHistory, fetchConfigSnapshot } from "../../api";
import type { ConfigSnapshotMeta, SPConfig } from "../../types/config";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { ConfigDiffModal } from "./ConfigDiffModal";

interface ConfigHistoryModalProps {
  open: boolean;
  onClose: () => void;
  configId: string;
  /** The current live config to diff against. */
  currentConfig: SPConfig;
  currentName?: string;
  /**
   * When provided, a "Restore" button is shown on the selected snapshot.
   * Called with the snapshot config + name so the parent can apply it.
   */
  onRestore?: (snapshotConfig: SPConfig, snapshotName: string) => void;
}

export const ConfigHistoryModal: React.FC<ConfigHistoryModalProps> = ({
  open,
  onClose,
  configId,
  currentConfig,
  currentName = "Current",
  onRestore,
}) => {
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<ConfigSnapshotMeta | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: historyList = [], isError: historyError } = useQuery({
    queryKey: ["config-history", configId],
    queryFn: () => fetchConfigHistory(configId),
    enabled: open,
  });

  const { data: snapshotData } = useQuery({
    queryKey: ["config-snapshot", configId, selectedSnapshot?.id],
    queryFn: () => fetchConfigSnapshot(configId, selectedSnapshot!.id),
    enabled: !!selectedSnapshot,
  });

  const handleClose = () => {
    setSelectedSnapshot(null);
    setDiffOpen(false);
    onClose();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={handleClose}
        title="Version History"
        width="md"
      >
        <div className="space-y-2">
          {historyError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Failed to load version history. Make sure you are logged in as the
              config owner or that the config is shared publicly.
            </div>
          )}
          {!historyError && historyList.length === 0 && (
            <p className="text-sm text-zinc-500 py-4 text-center">
              No snapshots yet. Snapshots are saved automatically each time you
              save the config.
            </p>
          )}
          {historyList.map((snap) => (
            <div
              key={snap.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSnapshot?.id === snap.id
                  ? "border-blue-500/50 bg-blue-950/20"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => setSelectedSnapshot(snap)}
            >
              <div>
                <p className="text-sm text-zinc-200 font-medium">
                  v{snap.version} — {snap.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(snap.createdAt).toLocaleString()}
                </p>
              </div>
              {selectedSnapshot?.id === snap.id && snapshotData?.data && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={<ArrowLeftRight className="w-3 h-3" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDiffOpen(true);
                    }}
                  >
                    Diff
                  </Button>
                  {onRestore && (
                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Restore to v${snap.version}? Unsaved changes will be overwritten.`,
                          )
                        ) {
                          onRestore(snapshotData.data!, snap.name);
                          handleClose();
                        }
                      }}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {selectedSnapshot && snapshotData?.data && (
        <ConfigDiffModal
          open={diffOpen}
          onClose={() => setDiffOpen(false)}
          original={snapshotData.data}
          modified={currentConfig}
          originalName={`v${selectedSnapshot.version} (${new Date(selectedSnapshot.createdAt).toLocaleDateString()})`}
          modifiedName={currentName}
        />
      )}
    </>
  );
};
