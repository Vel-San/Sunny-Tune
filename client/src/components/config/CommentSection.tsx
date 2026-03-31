import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { deleteComment, fetchComments, postComment } from "../../api";
import type { CommentRecord } from "../../types/config";
import { Button } from "../ui/Button";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface CommentSectionProps {
  configId: string;
  isOwner: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  configId,
  isOwner,
}) => {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [nickname, setNickname] = useState(
    () => localStorage.getItem("sp_comment_name") ?? "",
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const MAX = 2000;

  const handleNicknameChange = (val: string) => {
    setNickname(val);
    localStorage.setItem("sp_comment_name", val);
  };

  const { data: comments = [], isLoading } = useQuery<CommentRecord[]>({
    queryKey: ["comments", configId],
    queryFn: () => fetchComments(configId),
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: ({ body: text, authorName }: { body: string; authorName?: string }) =>
      postComment(configId, text, authorName),
    onSuccess: (newComment) => {
      qc.setQueryData<CommentRecord[]>(["comments", configId], (prev = []) => [
        ...prev,
        newComment,
      ]);
      setBody("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteComment(id),
    onSuccess: (_, id) => {
      qc.setQueryData<CommentRecord[]>(["comments", configId], (prev = []) =>
        prev.filter((c) => c.id !== id),
      );
    },
  });

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [body]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || addMutation.isPending) return;
    addMutation.mutate({ body: body.trim(), authorName: nickname.trim() || undefined });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>Discussion</span>
        {comments.length > 0 && (
          <span className="font-mono text-zinc-600">({comments.length})</span>
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-zinc-500">
            Your name / nickname{" "}
            <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value.slice(0, 50))}
            placeholder="Anonymous"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm
                       text-zinc-200 placeholder:text-zinc-600 focus:outline-none
                       focus:border-blue-500 transition-colors"
          />
        </div>
        <div
          className={clsx(
            "relative bg-zinc-950 border rounded-lg transition-colors",
            body.length > MAX * 0.9
              ? "border-amber-500/50"
              : "border-zinc-700 focus-within:border-blue-500",
          )}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            placeholder="Share your experience with this config…"
            rows={4}
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-zinc-200
                       placeholder:text-zinc-600 focus:outline-none leading-relaxed"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span
              className={clsx(
                "text-xs font-mono",
                body.length > MAX * 0.9 ? "text-amber-400" : "text-zinc-600",
              )}
            >
              {body.length}/{MAX}
            </span>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={addMutation.isPending}
              disabled={!body.trim()}
              leftIcon={<Send className="w-3 h-3" />}
            >
              Post
            </Button>
          </div>
        </div>
        {addMutation.isError && (
          <p className="text-xs text-red-400">{addMutation.error?.message}</p>
        )}
        {isOwner && (
          <p className="text-xs text-zinc-600">
            You own this config — your comments will be marked as author.
          </p>
        )}
      </form>

      {/* Comment list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-zinc-600 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading comments…
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg">
          <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
          <p className="text-sm text-zinc-500">No comments yet.</p>
          <p className="text-xs text-zinc-600 mt-1">
            Be the first to share your experience.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className={clsx(
                "group relative rounded-lg border px-4 py-3 space-y-1.5",
                comment.isOwn
                  ? "border-blue-500/20 bg-blue-500/5"
                  : "border-zinc-800 bg-[#111117]",
              )}
            >
              {/* Author row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-300">
                    {comment.authorName ?? comment.authorHandle}
                  </span>
                  {comment.isOwn && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                      you
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-600">
                    {timeAgo(comment.createdAt)}
                  </span>
                  {comment.isOwn && (
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all"
                      title="Delete comment"
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === comment.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              {/* Body */}
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {comment.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
