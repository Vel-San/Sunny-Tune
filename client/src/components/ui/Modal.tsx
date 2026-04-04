import { clsx } from "clsx";
import { X } from "lucide-react";
import React, { useEffect } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
}

const widthStyles = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  width = "md",
  closeOnBackdrop = true,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        <div
          className={clsx(
            "relative w-full bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl animate-slide-down",
            widthStyles[width],
          )}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};
