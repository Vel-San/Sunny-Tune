import { clsx } from "clsx";
import { Minus, Plus } from "lucide-react";
import React from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  decimals?: number;
  unit?: string;
  disabled?: boolean;
  id?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  decimals = 0,
  unit,
  disabled = false,
  id,
}) => {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    if (!isNaN(parsed)) onChange(clamp(parsed));
  };

  const increment = () =>
    onChange(clamp(parseFloat((value + step).toFixed(decimals + 2))));
  const decrement = () =>
    onChange(clamp(parseFloat((value - step).toFixed(decimals + 2))));

  return (
    <div
      className={clsx(
        "inline-flex items-center bg-zinc-950 border border-zinc-700 rounded-md overflow-hidden",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min || disabled}
        className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400
                   hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-100
                   disabled:opacity-40 disabled:cursor-not-allowed border-r border-zinc-700"
      >
        <Minus className="w-3 h-3" />
      </button>

      <div className="flex items-center gap-1 px-2">
        <input
          id={id}
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleInput}
          disabled={disabled}
          className="w-16 bg-transparent text-center text-sm font-mono text-zinc-100
                     focus:outline-none [appearance:textfield]
                     [&::-webkit-outer-spin-button]:appearance-none
                     [&::-webkit-inner-spin-button]:appearance-none"
        />
        {unit && (
          <span className="text-xs text-zinc-500 flex-shrink-0">{unit}</span>
        )}
      </div>

      <button
        type="button"
        onClick={increment}
        disabled={value >= max || disabled}
        className="flex-shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center text-zinc-400
                   hover:text-zinc-100 hover:bg-zinc-800 transition-colors duration-100
                   disabled:opacity-40 disabled:cursor-not-allowed border-l border-zinc-700"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
};
