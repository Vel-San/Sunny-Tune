import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Copy, Lock, Share2, Tag } from "lucide-react";
import React, { useState } from "react";
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
}

export const ShareModal: React.FC<ShareModalProps> = ({
  open,
  onClose,
  configId,
  configName,
}) => {
  const qc = useQueryClient();
  const { editingTags, editingCategory, setTags, setCategory } =
    useConfigStore();
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareMutation = useMutation({
    mutationFn: () => shareConfig(configId),
    onSuccess: ({ shareToken: token }) => {
      setShareToken(token);
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
    setShareToken(null);
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Share Configuration"
      width="md"
    >
      {!shareToken ? (
        <div className="space-y-5">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-300 space-y-1">
              <p className="font-medium">This action is irreversible</p>
              <p className="text-amber-400/70">
                Once shared,{" "}
                <strong className="text-amber-300">{configName}</strong> becomes
                permanently read-only. You cannot edit it after sharing.
              </p>
            </div>
          </div>

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
              Publish & Share
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Success */}
          <div className="flex items-center gap-2.5 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Lock className="w-4 h-4 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-300 font-medium">
                Config shared successfully
              </p>
              <p className="text-xs text-green-500/70 mt-0.5">
                This config is now locked as read-only.
              </p>
            </div>
          </div>

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
