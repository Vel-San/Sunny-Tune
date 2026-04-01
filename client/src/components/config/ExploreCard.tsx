import { clsx } from "clsx";
import {
  Calendar,
  ChevronRight,
  Copy,
  Eye,
  MessageSquare,
  Tag,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import type { ConfigRecord } from "../../types/config";
import { Badge } from "../ui/Badge";
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
  lincoln: "Lincoln",
  chrysler: "Chrysler",
  jeep: "Jeep",
  ram: "Ram",
  volkswagen: "VW",
  audi: "Audi",
  subaru: "Subaru",
  mazda: "Mazda",
  nissan: "Nissan",
  infiniti: "Infiniti",
};

interface ExploreCardProps {
  config: ConfigRecord;
  className?: string;
}

export const ExploreCard: React.FC<ExploreCardProps> = ({
  config,
  className,
}) => {
  const make = config.vehicleMake
    ? (MAKE_LABELS[config.vehicleMake] ?? config.vehicleMake.toUpperCase())
    : null;
  const shownTags = config.tags.slice(0, 3);
  const extraTags = config.tags.length - shownTags.length;

  return (
    <Link
      to={`/shared/${config.shareToken}`}
      className={clsx(
        "group block card border border-zinc-800 hover:border-zinc-600 rounded-xl p-4 space-y-3",
        "transition-colors duration-150",
        className,
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
        {config.category && (
          <Badge variant="info" className="flex-shrink-0 text-[10px]">
            {config.category.replace(/-/g, " ")}
          </Badge>
        )}
      </div>

      {/* Description */}
      {config.description && (
        <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
          {config.description}
        </p>
      )}

      {/* Tags */}
      {shownTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {shownTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded"
            >
              <Tag className="w-2 h-2" />
              {tag}
            </span>
          ))}
          {extraTags > 0 && (
            <span className="text-[10px] font-mono text-zinc-600">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-zinc-800" />

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
  );
};
