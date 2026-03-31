import { clsx } from "clsx";
import { Plus, Tag, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { PREDEFINED_TAGS } from "../../types/config";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  disabled?: boolean;
}

export const TagInput: React.FC<TagInputProps> = ({
  value,
  onChange,
  max = 10,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = PREDEFINED_TAGS.filter(
    (t) => t.includes(inputVal.toLowerCase()) && !value.includes(t),
  );

  const addTag = (tag: string) => {
    const sanitized = tag
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 30);
    if (!sanitized || value.includes(sanitized) || value.length >= max) return;
    onChange([...value, sanitized]);
    setInputVal("");
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    if (!disabled) onChange(value.filter((t) => t !== tag));
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && inputVal.trim()) {
      e.preventDefault();
      addTag(inputVal);
    }
    if (e.key === "Backspace" && !inputVal && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Input area */}
      <div
        className={clsx(
          "flex flex-wrap gap-1.5 min-h-[38px] bg-zinc-950 border rounded-md px-2 py-1.5 cursor-text",
          disabled
            ? "opacity-50 pointer-events-none"
            : "border-zinc-700 focus-within:border-blue-500",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-mono px-2 py-0.5 rounded"
          >
            <Tag className="w-2.5 h-2.5 text-zinc-500" />
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="text-zinc-500 hover:text-zinc-300 ml-0.5"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        {value.length < max && (
          <input
            ref={inputRef}
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKey}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={
              value.length === 0 ? "Add tags… (Enter or comma to add)" : ""
            }
            className="flex-1 min-w-[120px] bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none py-0.5"
          />
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && inputVal && suggestions.length > 0 && (
        <div className="card-elevated border border-zinc-700 rounded-md p-2 flex flex-wrap gap-1.5">
          {suggestions.slice(0, 12).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 hover:text-zinc-100
                         bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 px-2 py-0.5 rounded transition-colors"
            >
              <Plus className="w-2.5 h-2.5" /> {s}
            </button>
          ))}
        </div>
      )}

      {/* Quick-add predefined tags */}
      {!inputVal && value.length < max && (
        <div className="flex flex-wrap gap-1.5">
          {PREDEFINED_TAGS.filter((t) => !value.includes(t))
            .slice(0, 14)
            .map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => addTag(t)}
                className="inline-flex items-center gap-1 text-xs font-mono text-zinc-600 hover:text-zinc-300
                         hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-2 py-0.5 rounded transition-colors"
              >
                <Plus className="w-2.5 h-2.5" /> {t}
              </button>
            ))}
        </div>
      )}
      <p className="text-xs text-zinc-600">
        {value.length}/{max} tags used
      </p>
    </div>
  );
};
