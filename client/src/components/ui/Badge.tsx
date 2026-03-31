import { clsx } from "clsx";
import React from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-zinc-800 text-zinc-400 border-zinc-700",
  primary: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  muted: "bg-transparent text-zinc-600 border-zinc-800",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-zinc-500",
  primary: "bg-blue-400",
  success: "bg-green-400",
  warning: "bg-amber-400",
  danger: "bg-red-400",
  info: "bg-cyan-400",
  muted: "bg-zinc-600",
};

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  children,
  dot = false,
  className,
}) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border",
        variantStyles[variant],
        className,
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full flex-shrink-0",
            dotColors[variant],
          )}
        />
      )}
      {children}
    </span>
  );
};
