import { clsx } from "clsx";
import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
  description?: string;
  id?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "md",
  label,
  description,
  id,
}) => {
  const inputId = id ?? `toggle-${Math.random().toString(36).slice(2)}`;
  const trackW = size === "sm" ? "w-8" : "w-10";
  const trackH = size === "sm" ? "h-4" : "h-5";
  const dotSize = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  const dotOff = size === "sm" ? "translate-x-0.5" : "translate-x-0.5";
  const dotOn = size === "sm" ? "translate-x-[17px]" : "translate-x-[21px]";

  return (
    <label
      htmlFor={inputId}
      className={clsx(
        "flex items-start gap-3 cursor-pointer select-none",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      )}
    >
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          id={inputId}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        {/* Track */}
        <div
          className={clsx(
            trackW,
            trackH,
            "relative rounded-full transition-colors duration-200",
            checked ? "bg-blue-600" : "bg-zinc-700",
          )}
        />
        {/* Dot */}
        <div
          className={clsx(
            dotSize,
            "absolute top-[3px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked ? dotOn : dotOff,
          )}
        />
      </div>

      {(label || description) && (
        <div className="leading-none">
          {label && (
            <p className="text-sm font-medium text-zinc-200">{label}</p>
          )}
          {description && (
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      )}
    </label>
  );
};
