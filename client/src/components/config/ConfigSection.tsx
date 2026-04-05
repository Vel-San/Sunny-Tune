import { clsx } from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { HelpTooltip } from "../ui/HelpTooltip";

interface ConfigSectionProps {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}

export const ConfigSection: React.FC<ConfigSectionProps> = ({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
  badge,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="card rounded-xl overflow-hidden scroll-mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-zinc-800/40 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-zinc-100">{title}</span>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0" />
        )}
      </button>

      <div
        className={clsx(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="border-t border-zinc-800 px-5 pt-4 pb-5 space-y-5">
          {children}
        </div>
      </div>
    </section>
  );
};

/** Reusable param row: label + description on left, control on right */
export const ParamRow: React.FC<{
  label: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
  wide?: boolean;
  /**
   * The exact openpilot / sunnypilot parameter name.
   * When provided, a ⓘ tooltip icon is shown sourced from FIELD_HELP.
   */
  spKey?: string;
}> = ({ label, description, children, htmlFor, wide = false, spKey }) => {
  const help = spKey ? FIELD_HELP[spKey] : undefined;

  return (
    <div
      className={clsx(
        "flex gap-4",
        wide
          ? "flex-col"
          : "flex-col sm:flex-row sm:items-start sm:justify-between",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <label htmlFor={htmlFor} className="param-label cursor-pointer">
            {label}
          </label>
          {help && (
            <HelpTooltip
              label={typeof label === "string" ? label : String(spKey ?? "")}
              {...help}
            />
          )}
        </div>
        {description && <p className="param-desc">{description}</p>}
      </div>
      <div
        className={clsx(
          "flex-shrink-0",
          wide ? "w-full" : "w-full sm:w-auto sm:max-w-xs",
        )}
      >
        {children}
      </div>
    </div>
  );
};
