import { clsx } from "clsx";
import {
  Calendar,
  ChevronRight,
  Copy,
  Eye,
  GitBranch,
  Heart,
  MessageSquare,
  Tag,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addFavorite, removeFavorite } from "../../api";
import { MAKE_LABELS, categoryColor, tagColor } from "../../lib/colorUtils";
import { useConfigSeen } from "../../lib/seenConfigs";
import type { ConfigRecord } from "../../types/config";
import { CATEGORIES } from "../../types/config";
import { RatingDisplay } from "../ui/RatingStars";

function timeAgo(iso: string | undefined | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

interface ExploreCardProps {
  config: ConfigRecord;
  className?: string;
  /** Whether the current user has already favorited this config. */
  isFavorited?: boolean;
  /** Called after a favorite toggle succeeds so parent can refetch. */
  onFavoriteToggle?: () => void;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({
  config,
  className,
  isFavorited = false,
  onFavoriteToggle,
}) => {
  const make = config.vehicleMake
    ? (MAKE_LABELS[config.vehicleMake] ?? config.vehicleMake.toUpperCase())
    : null;

  const [favorited, setFavorited] = useState(isFavorited);
  const [toggling, setToggling] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [seen, handleMarkSeen] = useConfigSeen(config.id);

  const isNew = (config.version ?? 1) <= 1;
  const isUpdated = (config.version ?? 1) > 1;
  const showNew = !seen && isNew;
  const showUpdated = !seen && isUpdated;

  useEffect(() => {
    setFavorited(isFavorited);
  }, [isFavorited]);

  const catLabel = config.category
    ? (CATEGORIES.find((c) => c.value === config.category)?.label ??
      config.category.replace(/-/g, " "))
    : null;

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault(); // don't navigate to the shared page
    if (toggling) return;
    setToggling(true);
    try {
      if (favorited) {
        await removeFavorite(config.id);
        setFavorited(false);
      } else {
        await addFavorite(config.id);
        setFavorited(true);
      }
      onFavoriteToggle?.();
    } catch {
      // silently revert on error
    } finally {
      setToggling(false);
    }
  };

  return (
    <div
      className={clsx("relative isolate flex flex-col", className)}
      onClick={handleMarkSeen}
    >
      {showUpdated && <div className="neon-updated-ring" aria-hidden="true" />}
      {showUpdated && (
        <div className="neon-updated-badge" aria-hidden="true">
          Updated
        </div>
      )}
      {showNew && (
        <div
          className={
            showUpdated
              ? "neon-new-badge neon-new-badge--right"
              : "neon-new-badge"
          }
          aria-hidden="true"
        >
          New
        </div>
      )}
      <Link
        to={`/shared/${config.shareToken}`}
        className={clsx(
          "group flex flex-col flex-1 card border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 gap-3 transition-colors duration-150",
          showNew && "neon-new-shine overflow-hidden",
        )}
      >
        {/* Vehicle header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {make || config.vehicleModel ? (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 truncate">
                {[make, config.vehicleModel, config.vehicleYear]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            ) : (
              <p className="text-[11px] text-zinc-600 uppercase tracking-wider">
                No vehicle set
              </p>
            )}
            <h3 className="mt-1 text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
              {config.name}
            </h3>
          </div>
          {catLabel && (
            <span
              className={clsx(
                "flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                categoryColor(config.category),
              )}
            >
              {catLabel}
            </span>
          )}
          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            disabled={toggling}
            className={clsx(
              "flex-shrink-0 p-1 rounded transition-colors",
              favorited
                ? "text-red-400 hover:text-red-300"
                : "text-zinc-600 hover:text-zinc-400",
            )}
            title={favorited ? "Remove from favorites" : "Save to favorites"}
          >
            <Heart
              className={clsx("w-3.5 h-3.5", favorited && "fill-current")}
            />
          </button>
        </div>

        {/* Description — always 2-line space to keep cards uniform */}
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {config.description || ""}
        </p>

        {/* SP version + branch + config version — always rendered to keep height uniform */}
        <div className="flex flex-wrap items-center gap-1.5 min-h-[1.5rem]">
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
          {config.version != null && (
            <span className="inline-flex items-center text-[10px] font-mono font-semibold text-zinc-300 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded">
              v{config.version}
            </span>
          )}
        </div>

        {/* Tags — always rendered to keep height uniform */}
        <div className="flex flex-wrap gap-1 items-center min-h-[1.5rem]">
          {config.tags.length > 0 && (
            <>
              {(showAllTags ? config.tags : config.tags.slice(0, 3)).map(
                (tag) => (
                  <span
                    key={tag}
                    className={clsx(
                      "inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded border",
                      tagColor(tag),
                    )}
                  >
                    <Tag className="w-2 h-2" />
                    {tag}
                  </span>
                ),
              )}
              {!showAllTags && config.tags.length > 3 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAllTags(true);
                  }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  +{config.tags.length - 3} more
                </button>
              )}
              {showAllTags && config.tags.length > 3 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAllTags(false);
                  }}
                  className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  less
                </button>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div className="mt-auto border-t border-zinc-800" />

        {/* Rating + stats */}
        <div className="flex items-center justify-between gap-2">
          <RatingDisplay
            avg={config.avgRating ?? null}
            count={config.ratingCount ?? 0}
            size="sm"
          />
          <div className="flex items-center gap-3 text-zinc-600">
            <span className="inline-flex items-center gap-1 text-xs">
              <Eye className="w-3 h-3" /> {config.viewCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Copy className="w-3 h-3" /> {config.cloneCount}
            </span>
            <span className="inline-flex items-center gap-1 text-xs">
              <MessageSquare className="w-3 h-3" /> {config.commentCount ?? 0}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600">
            <Calendar className="w-3 h-3" />
            {timeAgo(config.sharedAt ?? config.createdAt)}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-600 group-hover:text-blue-400 transition-colors">
            View <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    </div>
  );
};
