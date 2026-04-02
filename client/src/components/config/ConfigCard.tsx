import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  Calendar,
  Copy,
  Download,
  ExternalLink,
  Eye,
  GitBranch,
  GitFork,
  MessageSquare,
  Pencil,
  Share2,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { cloneConfig, deleteConfig } from "../../api";
import { exportConfigAsJson } from "../../lib/configExport";
import type { ConfigRecord } from "../../types/config";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { ShareModal } from "./ShareModal";

interface ConfigCardProps {
  config: ConfigRecord;
}

const MAKE_LABELS: Record<string, string> = {
  toyota: "Toyota",
  lexus: "Lexus",
  honda: "Honda",
  acura: "Acura",
  hyundai: "Hyundai",
  kia: "Kia",
  genesis: "Genesis",
  gm: "GM",
  ford: "Ford",
  chrysler: "Chrysler",
  volkswagen: "VW",
  audi: "Audi",
  subaru: "Subaru",
  mazda: "Mazda",
  nissan: "Nissan",
  infiniti: "Infiniti",
};

export const ConfigCard: React.FC<ConfigCardProps> = ({ config }) => {
  const qc = useQueryClient();
  const [shareOpen, setShareOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteConfig(config.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configs"] }),
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneConfig(config.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configs"] }),
  });

  const make = config.vehicleMake
    ? (MAKE_LABELS[config.vehicleMake] ?? config.vehicleMake)
    : null;

  return (
    <>
      <div className={clsx("card rounded-xl p-4 space-y-3 group")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {(make || config.vehicleModel) && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 truncate">
                {[make, config.vehicleModel, config.vehicleYear]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
            <h3 className="text-sm font-semibold text-zinc-100 mt-0.5 truncate">
              {config.name}
            </h3>
          </div>
          {config.isShared ? (
            <Badge variant="success" dot>
              Shared
            </Badge>
          ) : (
            <Badge variant="muted">Draft</Badge>
          )}
        </div>

        {/* Description */}
        {config.description && (
          <p className="text-xs text-zinc-500 line-clamp-2">
            {config.description}
          </p>
        )}

        {/* SP version + branch + config version */}
        <div className="flex flex-wrap items-center gap-1.5">
          {config.config.metadata?.sunnypilotVersion && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-400/80 bg-blue-950/40 border border-blue-800/40 px-1.5 py-0.5 rounded">
              SP {config.config.metadata.sunnypilotVersion}
            </span>
          )}
          {config.config.metadata?.branch && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
              <GitBranch className="w-2.5 h-2.5" />
              {config.config.metadata.branch}
            </span>
          )}
          {config.version != null && config.version > 1 && (
            <span className="text-[10px] text-zinc-600 font-mono">
              v{config.version}
            </span>
          )}
        </div>

        {/* Clone provenance */}
        {config.clonedFrom && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-500">
            <GitFork className="w-3 h-3 flex-shrink-0" />
            <span>Cloned from</span>
            {config.clonedFrom.shareToken ? (
              <Link
                to={`/shared/${config.clonedFrom.shareToken}`}
                className="text-blue-400 hover:text-blue-300 truncate max-w-[140px]"
              >
                {config.clonedFrom.name}
              </Link>
            ) : (
              <span className="text-zinc-400 truncate max-w-[140px]">
                {config.clonedFrom.name}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {config.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {config.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-600 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded"
              >
                <Tag className="w-2 h-2" /> {tag}
              </span>
            ))}
            {config.tags.length > 3 && (
              <span className="text-[10px] text-zinc-600">
                +{config.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {config.isShared && (
          <div className="flex items-center gap-3 text-xs text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" /> {config.viewCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <Copy className="w-3 h-3" /> {config.cloneCount}
            </span>
            {config.ratingCount != null && config.ratingCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <Star className="w-3 h-3" /> {config.ratingCount}
              </span>
            )}
            {config.commentCount != null && config.commentCount > 0 && (
              <span className="inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> {config.commentCount}
              </span>
            )}
          </div>
        )}

        <div className="border-t border-zinc-800 pt-3 flex items-center justify-between gap-2">
          {/* Date */}
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
            <Calendar className="w-3 h-3" />
            {new Date(config.updatedAt).toLocaleDateString()}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {config.isShared && config.shareToken && (
              <Link to={`/shared/${config.shareToken}`} title="View shared">
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<ExternalLink className="w-3 h-3" />}
                />
              </Link>
            )}

            <>
              <Link to={`/configure/${config.id}`}>
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<Pencil className="w-3 h-3" />}
                />
              </Link>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={<Share2 className="w-3 h-3" />}
                onClick={() => setShareOpen(true)}
                title={config.isShared ? "Update tags / category" : "Share"}
              />
            </>

            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Download className="w-3 h-3" />}
              onClick={() => exportConfigAsJson(config)}
              title="Export as JSON"
            />

            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Copy className="w-3 h-3" />}
              loading={cloneMutation.isPending}
              onClick={() => cloneMutation.mutate()}
              title="Clone"
            />

            <Button
              variant="ghost"
              size="xs"
              leftIcon={<Trash2 className="w-3 h-3 text-red-500/70" />}
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm(`Delete "${config.name}"?`))
                  deleteMutation.mutate();
              }}
              title="Delete"
            />
          </div>
        </div>
      </div>

      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        configId={config.id}
        configName={config.name}
        existingShareToken={config.shareToken ?? undefined}
        existingTags={config.tags}
        existingCategory={config.category}
      />
    </>
  );
};
