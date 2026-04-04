import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import { Check, Copy, Share2, Tag, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useState } from "react";
import { shareConfig } from "../../api";
import { categoryColor, tagColor } from "../../lib/colorUtils";
import { useConfigStore } from "../../store/configStore";
import { CATEGORIES, PREDEFINED_TAGS } from "../../types/config";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  configId: string;
  configName: string;
  existingShareToken?: string;
  existingTags?: string[];
  existingCategory?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  configId,
  configName,
  existingShareToken,
  existingTags,
  existingCategory,
}) => {
  const qc = useQueryClient();
  const { editingTags, editingCategory, setTags, setCategory } =
    useConfigStore();

  // For already-shared configs we show the existing link immediately and
  // pre-populate tags/category from the saved values.
  const isAlreadyShared = !!existingShareToken;
  const [shareToken, setShareToken] = useState<string | null>(
    existingShareToken ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [updateDone, setUpdateDone] = useState(false);
  const [customTagInput, setCustomTagInput] = useState("");

  const addCustomTag = (raw: string) => {
    const t = raw
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 30);
    if (!t || editingTags.includes(t) || editingTags.length >= 20) return;
    setTags([...editingTags, t]);
    setCustomTagInput("");
  };

  const toggleTag = (tag: string) => {
    if (editingTags.includes(tag)) {
      setTags(editingTags.filter((t) => t !== tag));
    } else if (editingTags.length < 20) {
      setTags([...editingTags, tag]);
    }
  };

  const removeCustomTag = (tag: string) =>
    setTags(editingTags.filter((t) => t !== tag));

  // Seed the store fields when opening an already-shared config
  React.useEffect(() => {
    if (open && isAlreadyShared) {
      setTags(existingTags ?? []);
      setCategory(existingCategory ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const shareMutation = useMutation({
    mutationFn: () =>
      shareConfig(configId, {
        tags: editingTags,
        category: editingCategory || undefined,
      }),
    onSuccess: ({ shareToken: token }) => {
      setShareToken(token);
      setUpdateDone(true);
      qc.invalidateQueries({ queryKey: ["configs"] });
      qc.invalidateQueries({ queryKey: ["community-stats"] });
      qc.invalidateQueries({ queryKey: ["explore"] });
    },
  });

  const shareUrl = shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : null;

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    if (!isAlreadyShared) setShareToken(null);
    setCopied(false);
    setUpdateDone(false);
    setCustomTagInput("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isAlreadyShared ? "Update Tags & Category" : "Share Configuration"}
      width="lg"
    >
      {/* ── Already-shared: edit form + link + QR all on one screen ── */}
      {isAlreadyShared ? (
        <div className="space-y-5">
          {updateDone && (
            <p className="text-xs text-green-400">Tags and category updated.</p>
          )}

          {/* Share link + QR */}
          {shareUrl && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">Share link</p>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="font-mono text-xs"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={
                      copied ? (
                        <Check className="w-3.5 h-3.5 text-green-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )
                    }
                    onClick={copyLink}
                  >
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs text-zinc-500 self-start">QR code</p>
                <div className="bg-white p-3 rounded-lg inline-block">
                  <QRCodeSVG value={shareUrl} size={150} />
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4 space-y-4">
            {/* Tags */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Tags ({editingTags.length}/20)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                {PREDEFINED_TAGS.map((tag) => {
                  const active = editingTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={clsx(
                        "inline-flex items-center gap-0.5 text-[11px] font-mono px-2 py-0.5 rounded border transition-all",
                        active
                          ? tagColor(tag)
                          : "bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-600",
                      )}
                    >
                      {active && (
                        <Check className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                      )}
                      {tag}
                    </button>
                  );
                })}
              </div>
              {editingTags
                .filter(
                  (t) => !(PREDEFINED_TAGS as readonly string[]).includes(t),
                )
                .map((tag) => (
                  <span
                    key={tag}
                    className={clsx(
                      "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                      tagColor(tag),
                    )}
                  >
                    {tag}
                    <button type="button" onClick={() => removeCustomTag(tag)}>
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              {editingTags.length < 20 && (
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === ",") &&
                      customTagInput.trim()
                    ) {
                      e.preventDefault();
                      addCustomTag(customTagInput);
                    }
                  }}
                  placeholder="Custom tag… (Enter to add)"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  maxLength={30}
                />
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const active = editingCategory === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(active ? "" : cat.value)}
                      className={clsx(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all",
                        active
                          ? categoryColor(cat.value)
                          : "bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-600",
                      )}
                    >
                      {active && <Check className="w-2.5 h-2.5" />}
                      {cat.label.replace(/ \/ .+/, "")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={shareMutation.isPending}
                onClick={() => shareMutation.mutate()}
                leftIcon={<Share2 className="w-3.5 h-3.5" />}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      ) : !shareToken ? (
        /* ── Draft: tags/category form before first publish ── */
        <div className="space-y-5">
          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Tags ({editingTags.length}/20)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {PREDEFINED_TAGS.map((tag) => {
                const active = editingTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "inline-flex items-center gap-0.5 text-[11px] font-mono px-2 py-0.5 rounded border transition-all",
                      active
                        ? tagColor(tag)
                        : "bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-600",
                    )}
                  >
                    {active && (
                      <Check className="w-2.5 h-2.5 mr-0.5 flex-shrink-0" />
                    )}
                    {tag}
                  </button>
                );
              })}
            </div>
            {editingTags
              .filter(
                (t) => !(PREDEFINED_TAGS as readonly string[]).includes(t),
              )
              .map((tag) => (
                <span
                  key={tag}
                  className={clsx(
                    "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                    tagColor(tag),
                  )}
                >
                  {tag}
                  <button type="button" onClick={() => removeCustomTag(tag)}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            {editingTags.length < 20 && (
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === ",") &&
                    customTagInput.trim()
                  ) {
                    e.preventDefault();
                    addCustomTag(customTagInput);
                  }
                }}
                placeholder="Custom tag… (Enter to add)"
                className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                maxLength={30}
              />
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const active = editingCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(active ? "" : cat.value)}
                    className={clsx(
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border transition-all",
                      active
                        ? categoryColor(cat.value)
                        : "bg-zinc-900/50 text-zinc-600 border-zinc-800 hover:text-zinc-400 hover:border-zinc-600",
                    )}
                  >
                    {active && <Check className="w-2.5 h-2.5" />}
                    {cat.label.replace(/ \/ .+/, "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={shareMutation.isPending}
              onClick={() => shareMutation.mutate()}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Publish & Share
            </Button>
          </div>
        </div>
      ) : (
        /* ── Just published: show link + QR ── */
        <div className="space-y-4">
          {/* Share link */}
          <div className="space-y-1.5">
            <p className="text-xs text-zinc-500">Share link</p>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={shareUrl ?? ""}
                className="font-mono text-xs"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                variant="secondary"
                size="sm"
                leftIcon={
                  copied ? (
                    <Check className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )
                }
                onClick={copyLink}
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* QR code */}
          {shareUrl && (
            <div className="flex flex-col items-center gap-2 pt-1">
              <p className="text-xs text-zinc-500 self-start">QR code</p>
              <div className="bg-white p-3 rounded-lg inline-block">
                <QRCodeSVG value={shareUrl} size={160} />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-zinc-800">
            <Button variant="primary" size="sm" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
