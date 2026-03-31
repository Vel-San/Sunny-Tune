import { clsx } from "clsx";
import React from "react";

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  disabled?: boolean;
  name: string;
  layout?: "vertical" | "horizontal";
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  name,
  layout = "vertical",
}) => {
  return (
    <div
      className={clsx(
        "flex gap-2",
        layout === "vertical" ? "flex-col" : "flex-row flex-wrap",
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <label
            key={opt.value}
            className={clsx(
              "flex items-start gap-3 cursor-pointer rounded-md border px-3 py-2.5 transition-colors duration-150",
              isActive
                ? "border-blue-500 bg-blue-500/10 text-zinc-100"
                : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none",
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={isActive}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="sr-only"
            />
            {/* Custom radio dot */}
            <div
              className={clsx(
                "mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors duration-150",
                isActive ? "border-blue-500" : "border-zinc-600",
              )}
            >
              {isActive && <div className="w-2 h-2 rounded-full bg-blue-500" />}
            </div>
            <div>
              <span className="text-sm font-medium">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-zinc-500 mt-0.5">
                  {opt.description}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
};
