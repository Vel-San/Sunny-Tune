import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-transparent",
  secondary:
    "bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-750 text-zinc-100 border border-zinc-700",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-transparent",
  ghost:
    "bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-transparent",
  outline:
    "bg-transparent hover:bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-zinc-600",
};

const sizeStyles: Record<Size, string> = {
  xs: "h-6 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center font-medium rounded-md",
          "transition-colors duration-150",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
