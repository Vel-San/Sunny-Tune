import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";
import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  id,
  className,
}) => {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          "w-full appearance-none bg-zinc-950 border border-zinc-700 rounded-md",
          "px-3 py-2 pr-8 text-sm text-zinc-100",
          "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-colors duration-150",
          className,
        )}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
    </div>
  );
};
