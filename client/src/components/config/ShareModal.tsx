import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Share2, Tag } from "lucide-react";
import React, { useState } from "react";
import QRCode from "react-qr-code";
import { shareConfig } from "../../api";
import { useConfigStore } from "../../store/configStore";
import { CATEGORIES } from "../../types/config";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Select } from "../ui/Select";
import { TagInput } from "./TagInput";

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
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isAlreadyShared ? "Update Tags & Category" : "Share Configuration"}
      width="md"
    >
      {/* ── Edit form: shown for drafts (before sharing) or already-shared configs ── */}
      {(!shareToken || isAlreadyShared) && !updateDone ? (
        <div className="space-y-5">
          {/* Existing share link (already-shared only) */}
          {isAlreadyShared && shareUrl && (
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
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Tag className="w-3 h-3" /> Tags
            </label>
            <TagInput value={editingTags} onChange={setTags} />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Category
            </label>
            <Select
              value={editingCategory}
              onChange={setCategory}
              placeholder="Choose a category…"
              options={CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
            />
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
              {isAlreadyShared ? "Update" : "Publish & Share"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {updateDone && (
            <p className="text-xs text-green-400">Tags and category updated.</p>
          )}

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
                <QRCode value={shareUrl} size={160} />
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
