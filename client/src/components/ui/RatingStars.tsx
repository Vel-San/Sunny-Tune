import { clsx } from "clsx";
import { Star } from "lucide-react";
import React, { useState } from "react";

interface RatingStarsProps {
  /** Current rating value (0 = none) */
  value: number;
  /** If provided, stars are interactive */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  showEmpty?: boolean;
  disabled?: boolean;
}

const sizeMap = { sm: "w-3.5 h-3.5", md: "w-4.5 h-4.5", lg: "w-6 h-6" };
const gapMap = { sm: "gap-0.5", md: "gap-1", lg: "gap-1.5" };

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  size = "md",
  showEmpty = true,
  disabled = false,
}) => {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange && !disabled;
  const display = interactive && hovered > 0 ? hovered : value;

  return (
    <div
      className={clsx(
        "inline-flex items-center",
        gapMap[size],
        interactive && "cursor-pointer",
      )}
      onMouseLeave={() => interactive && setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star;
        const partial = !filled && display > star - 1 && display < star;
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            className={clsx(
              sizeMap[size],
              "transition-colors duration-100",
              !interactive && "cursor-default",
              interactive && "hover:scale-110 transition-transform",
            )}
            aria-label={`Rate ${star} out of 5`}
          >
            <Star
              className={clsx(
                "w-full h-full",
                filled
                  ? "text-amber-400 fill-amber-400"
                  : partial
                    ? "text-amber-400 fill-amber-400/40"
                    : showEmpty
                      ? "text-zinc-600 fill-transparent"
                      : "hidden",
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

/** Compact display: stars + number + count */
export const RatingDisplay: React.FC<{
  avg: number | null;
  count: number;
  size?: "sm" | "md";
}> = ({ avg, count, size = "sm" }) => {
  if (count === 0 || avg === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-zinc-600">
        <RatingStars value={0} size={size} showEmpty />
        <span>No ratings</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <RatingStars value={avg} size={size} />
      <span className="font-mono text-xs text-amber-400">{avg.toFixed(1)}</span>
      <span className="text-xs text-zinc-500">({count})</span>
    </span>
  );
};
