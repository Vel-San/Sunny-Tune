import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { ThumbsUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
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

  // Server-sourced like status — the authoritative value, fetched on mount and
  // after mutations. Cache-Control: no-store is set server-side so this is
  // always fresh.
  const { data: serverIsLiked } = useQuery<boolean>({
    queryKey: ["like-status", configId],
    queryFn: () => fetchLikeStatus(configId),
    enabled: !!token,
    staleTime: 0, // always consider stale so refetches get fresh data
  });

  // Optimistic override: null = use server value, boolean = use this instantly.
  // Cleared explicitly in onSuccess/onError — NOT via a useEffect watching
  // serverIsLiked (which caused race conditions with stale HTTP-cached responses).
  const [localIsLiked, setLocalIsLiked] = useState<boolean | null>(null);
  const isLiked =
    localIsLiked !== null ? localIsLiked : (serverIsLiked ?? false);

  // Local count — persists correctly after mutation until the parent query
  // (explore/configs) refetches and delivers the real server count.
  const [displayCount, setDisplayCount] = useState(likeCount);
  const prevLikeCountRef = useRef(likeCount);
  useEffect(() => {
    if (likeCount !== prevLikeCountRef.current) {
      prevLikeCountRef.current = likeCount;
      setDisplayCount(likeCount);
    }
  }, [likeCount]);

  // Snapshot of state just before the mutation fires (used by onError rollback)
  const prevStateRef = useRef({ isLiked: false, count: 0 });

  // Pass the desired state as a variable to mutate() so it survives the
  // React re-render that happens between onMutate and mutationFn.  Without
  // this, the optimistic setLocalIsLiked(true) in onMutate triggers a
  // re-render that updates the mutationFn closure to see isLiked=true,
  // causing it to call removeLike (DELETE) instead of addLike (POST).
  const mutation = useMutation({
    mutationFn: (shouldLike: boolean) =>
      shouldLike ? addLike(configId) : removeLike(configId),
    onMutate: (shouldLike: boolean) => {
      // Capture state BEFORE the click for rollback purposes
      prevStateRef.current = { isLiked, count: displayCount };
      // Immediately update UI
      setLocalIsLiked(shouldLike);
      setDisplayCount((c) => c + (shouldLike ? 1 : -1));
    },
    onSuccess: (_data, shouldLike: boolean) => {
      // Write the new status directly into the query cache — no HTTP round-trip.
      // This is safe because the server just confirmed the action with 201/204.
      qc.setQueryData(["like-status", configId], shouldLike);
      // Clear the local override now that the cache is authoritative
      setLocalIsLiked(null);
      // Invalidate the parent list queries so likeCount updates everywhere
      qc.invalidateQueries({ queryKey: ["explore"] });
      qc.invalidateQueries({ queryKey: ["configs"] });
      qc.invalidateQueries({ queryKey: ["shared-config"] });
    },
    onError: () => {
      // Roll back to pre-click state
      setLocalIsLiked(prevStateRef.current.isLiked);
      setDisplayCount(prevStateRef.current.count);
      // Invalidate so the next render fetches the real server state
      qc.invalidateQueries({ queryKey: ["like-status", configId] });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!token || mutation.isPending) return;
    mutation.mutate(!isLiked);
  };

  if (variant === "full") {
    // Sized to match Button size="sm": h-8 px-3 text-xs gap-1.5 rounded-md
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
          "inline-flex items-center justify-center gap-1.5 h-8 px-3 text-xs font-medium rounded-md border transition-all",
          isLiked
            ? "border-blue-500/50 bg-blue-950/30 text-blue-400 hover:bg-blue-950/50"
            : "border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:border-zinc-600",
          (!token || mutation.isPending) && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <ThumbsUp className={clsx("w-3.5 h-3.5", isLiked && "fill-blue-400")} />
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
        isLiked ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300",
        (!token || mutation.isPending) && "cursor-default opacity-50",
        className,
      )}
    >
      <ThumbsUp className={clsx("w-3.5 h-3.5", isLiked && "fill-blue-400")} />
      {displayCount > 0 && <span className="tabular-nums">{displayCount}</span>}
    </button>
  );
};
