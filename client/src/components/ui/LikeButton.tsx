import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { ThumbsUp } from "lucide-react";
import React from "react";
import { addLike, fetchLikeStatus, removeLike } from "../../api";
import { useAuthStore } from "../../store/authStore";

interface LikeButtonProps {
  configId: string;
  likeCount?: number;
  /** @deprecated No longer used — owners can like their own configs. Kept for API compat. */
  isOwn?: boolean;
  /** Display variant — compact for cards, full for detail pages */
  variant?: "compact" | "full";
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  configId,
  likeCount = 0,
  isOwn = false,
  variant = "compact",
  className,
}) => {
  const token = useAuthStore((s) => s.token);
  const qc = useQueryClient();

  const { data: isLiked = false } = useQuery<boolean>({
    queryKey: ["like-status", configId],
    queryFn: () => fetchLikeStatus(configId),
    enabled: !!token,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: () => (isLiked ? removeLike(configId) : addLike(configId)),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["like-status", configId] });
      qc.setQueryData(["like-status", configId], !isLiked);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["like-status", configId] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["like-status", configId] });
    },
  });

  // Optimistic count: if currently liked, clicking will unlike (−1); if not, clicking will like (+1)
  const optimisticDelta = mutation.isPending ? (isLiked ? -1 : 1) : 0;
  const displayCount = likeCount + optimisticDelta;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token) return;
    mutation.mutate();
  };

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        disabled={!token || mutation.isPending}
        title={
          !token
            ? "Sign in to like"
            : isLiked
              ? "Remove like"
              : "Like this config"
        }
        className={clsx(
          "inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
          isLiked
            ? "border-blue-500/50 bg-blue-950/30 text-blue-400"
            : "border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-blue-500/50 hover:text-blue-400",
          !token && "opacity-40 cursor-not-allowed",
          mutation.isPending && "opacity-60",
          className,
        )}
      >
        <ThumbsUp
          className={clsx(
            "w-4 h-4 transition-colors",
            isLiked && "fill-blue-400",
          )}
        />
        <span>{displayCount > 0 ? displayCount.toLocaleString() : "Like"}</span>
      </button>
    );
  }

  // compact variant — used in cards
  return (
    <button
      onClick={handleClick}
      disabled={!token || mutation.isPending}
      title={!token ? "Sign in to like" : isLiked ? "Remove like" : "Like"}
      className={clsx(
        "inline-flex items-center gap-1 text-xs transition-colors",
        isLiked ? "text-blue-400" : "text-zinc-500 hover:text-blue-400",
        !token && "cursor-default opacity-50",
        className,
      )}
    >
      <ThumbsUp className={clsx("w-3.5 h-3.5", isLiked && "fill-blue-400")} />
      {displayCount > 0 && <span className="tabular-nums">{displayCount}</span>}
    </button>
  );
};
