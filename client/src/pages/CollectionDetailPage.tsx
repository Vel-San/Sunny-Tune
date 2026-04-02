import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, BookMarked, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addToCollection,
  fetchAllConfigs,
  fetchCollection,
  removeFromCollection,
} from "../api";
import { ConfigCard } from "../components/config/ConfigCard";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import type { CollectionRecord, ConfigRecord } from "../types/config";

// ─── Add-Config Modal ─────────────────────────────────────────────────────────

function AddConfigModal({
  open,
  onClose,
  collectionId,
  existingIds,
}: {
  open: boolean;
  onClose: () => void;
  collectionId: string;
  existingIds: Set<string>;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: allConfigs = [], isLoading } = useQuery<ConfigRecord[]>({
    queryKey: ["all-configs"],
    queryFn: fetchAllConfigs,
    enabled: open,
  });

  const available = allConfigs.filter((c) => !existingIds.has(c.id));

  const { mutate: addConfig, isPending } = useMutation({
    mutationFn: (configId: string) => addToCollection(collectionId, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] });
      onClose();
      setSelected(null);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Add Config to Collection">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : available.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-8">
            {allConfigs.length === 0
              ? "You have no configs yet."
              : "All your configs are already in this collection."}
          </p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {available.map((cfg) => (
              <button
                key={cfg.id}
                onClick={() => setSelected(cfg.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                  selected === cfg.id
                    ? "border-blue-500 bg-blue-950/20"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {cfg.name}
                  </p>
                  {cfg.vehicleMake && (
                    <p className="text-xs text-zinc-500">
                      {cfg.vehicleMake} {cfg.vehicleModel}
                    </p>
                  )}
                </div>
                {selected === cfg.id && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => selected && addConfig(selected)}
            disabled={!selected || isPending}
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);

  const {
    data: collection,
    isLoading,
    error,
  } = useQuery<CollectionRecord>({
    queryKey: ["collection", id],
    queryFn: () => fetchCollection(id!),
    enabled: !!id,
  });

  const { mutate: removeConfig, isPending: removing } = useMutation({
    mutationFn: (configId: string) => removeFromCollection(id!, configId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-zinc-500 mb-4">
          Collection not found or you don't have access.
        </p>
        <Button variant="ghost" onClick={() => navigate("/my-configs")}>
          <ArrowLeft className="w-4 h-4" />
          Back to My Configs
        </Button>
      </div>
    );
  }

  const items = (collection.items ?? []) as Array<{
    configId: string;
    config: ConfigRecord;
    addedAt: string;
  }>;
  const existingIds = new Set(items.map((i) => i.configId));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-configs")}
        >
          <ArrowLeft className="w-4 h-4" />
          Collections
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookMarked className="w-5 h-5 text-blue-400" />
            <h1 className="text-2xl font-bold text-zinc-100">
              {collection.name}
            </h1>
            {collection.isPublic && (
              <span className="text-[10px] uppercase tracking-wide font-semibold bg-green-900/30 border border-green-700/40 text-green-400 px-2 py-0.5 rounded-full">
                Public
              </span>
            )}
          </div>
          {collection.description && (
            <p className="text-sm text-zinc-500">{collection.description}</p>
          )}
          <p className="text-xs text-zinc-600 mt-1">
            {items.length} {items.length === 1 ? "config" : "configs"}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4" />
          Add Config
        </Button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
          <BookMarked className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 mb-4">This collection is empty.</p>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            Add your first config
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.configId} className="relative group">
              <ConfigCard config={item.config} />
              <button
                onClick={() => removeConfig(item.configId)}
                disabled={removing}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-500 hover:text-red-400 hover:border-red-700/50 opacity-0 group-hover:opacity-100 transition-all"
                title="Remove from collection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddConfigModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        collectionId={id!}
        existingIds={existingIds}
      />
    </div>
  );
}
