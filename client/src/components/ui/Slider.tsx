import { clsx } from "clsx";
import React from "react";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  decimals?: number;
  showValue?: boolean;
  id?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  disabled = false,
  unit = "",
  decimals = 2,
  showValue = true,
  id,
}) => {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={clsx(
          "flex-1 h-1.5 rounded-full appearance-none cursor-pointer",
          "bg-zinc-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "[&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5",
          "[&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-blue-500",
          "[&::-webkit-slider-thumb]:cursor-pointer",
          "[&::-webkit-slider-thumb]:transition-colors",
          "[&::-webkit-slider-thumb]:hover:bg-blue-400",
          "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5",
          "[&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:bg-blue-500",
          "[&::-moz-range-thumb]:border-0",
          "[&::-moz-range-thumb]:cursor-pointer",
        )}
        style={{
          background: disabled
            ? undefined
            : `linear-gradient(to right, #3b82f6 ${pct}%, #3f3f46 ${pct}%)`,
        }}
      />
      {showValue && (
        <span className="font-mono text-xs text-zinc-300 w-16 text-right flex-shrink-0">
          {value.toFixed(decimals)}
          {unit && <span className="text-zinc-500 ml-0.5">{unit}</span>}
        </span>
      )}
    </div>
  );
};
