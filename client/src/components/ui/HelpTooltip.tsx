/**
 * HelpTooltip — a small ⓘ icon that reveals a rich tooltip panel on hover
 * (desktop) or tap (mobile).
 *
 * Shows field description, tips, tradeoffs, default value, and an optional
 * link to the SunnyLink wiki entry.
 *
 * The panel is rendered via a React Portal at document.body so it is never
 * clipped by any ancestor's overflow:hidden (e.g. the section collapse
 * animation container or the rounded card).
 */

import { ExternalLink, X } from "lucide-react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { FieldHelp } from "../../lib/fieldHelp";

const PANEL_WIDTH = 288; // w-72

interface PanelPos {
  top: number;
  left: number;
}

interface HelpTooltipProps extends FieldHelp {
  /** The field label — shown as the tooltip heading. */
  label: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  label,
  summary,
  tips,
  tradeoffs,
  recommended,
  defaultNote,
  wikiUrl,
}) => {
  const [open, setOpen] = useState(false);
  /** When true the panel was opened by a click and hover-out won't close it. */
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setPinned(false);
  };

  // Compute fixed-position coordinates for the panel whenever it opens or
  // the viewport changes so the panel is never clipped.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Prefer placing the panel to the right of the trigger; flip left if
    // there is not enough room.
    const spaceRight = vw - r.right - 8;
    const left =
      spaceRight >= PANEL_WIDTH
        ? r.right + 8
        : Math.max(8, r.left - PANEL_WIDTH - 4);

    // Align panel top with the trigger top and clamp so it never runs off the
    // bottom of the viewport (use an estimated max height of 400px).
    const top = Math.min(r.top, vh - 400 - 8);

    setPos({ top, left });
  }, [open]);

  // Close on outside click / escape — only when not pinned by a click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const hasContent =
    summary ||
    tips?.length ||
    tradeoffs?.length ||
    defaultNote ||
    recommended ||
    wikiUrl;
  if (!hasContent) return null;

  const panel =
    open && pos
      ? createPortal(
          <div
            ref={panelRef}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => {
              if (!pinned) setOpen(false);
            }}
            style={{ top: pos.top, left: pos.left, width: PANEL_WIDTH }}
            className="
              fixed z-[9999]
              bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl
              text-xs text-zinc-300
              pointer-events-auto
            "
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2 border-b border-zinc-800">
              <span className="font-semibold text-zinc-100 leading-tight text-[11px]">
                {label}
              </span>
              <button
                onClick={close}
                className="text-zinc-600 hover:text-zinc-300 flex-shrink-0 mt-0.5"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            <div className="px-3 py-2.5 space-y-2.5">
              {/* Summary */}
              {summary && (
                <p className="text-zinc-400 leading-relaxed">{summary}</p>
              )}

              {/* Default / Recommended row */}
              {(defaultNote || recommended) && (
                <div className="flex flex-wrap gap-3 text-[10px]">
                  {defaultNote && (
                    <span className="text-zinc-600">
                      Default:{" "}
                      <span className="text-zinc-400 font-mono">
                        {defaultNote}
                      </span>
                    </span>
                  )}
                  {recommended && (
                    <span className="text-zinc-600">
                      Recommended:{" "}
                      <span className="text-blue-400 font-mono">
                        {recommended}
                      </span>
                    </span>
                  )}
                </div>
              )}

              {/* Tips */}
              {tips && tips.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    Tips
                  </p>
                  <ul className="space-y-1">
                    {tips.map((tip, i) => (
                      <li
                        key={i}
                        className="flex gap-1.5 text-zinc-400 leading-snug"
                      >
                        <span className="text-blue-500 flex-shrink-0 mt-0.5">
                          •
                        </span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tradeoffs */}
              {tradeoffs && tradeoffs.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1">
                    Tradeoffs & Pitfalls
                  </p>
                  <ul className="space-y-1">
                    {tradeoffs.map((t, i) => (
                      <li
                        key={i}
                        className="flex gap-1.5 text-amber-400/80 leading-snug"
                      >
                        <span className="flex-shrink-0 mt-0.5">⚠</span>
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Wiki link footer */}
            {wikiUrl && (
              <div className="px-3 py-2 border-t border-zinc-800">
                <a
                  href={wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                  SunnyLink Wiki
                </a>
              </div>
            )}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="inline-flex items-center">
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (open && pinned) {
            // Second click on a pinned panel — close it
            close();
          } else if (open && !pinned) {
            // Hover-open panel — pin it in place
            setPinned(true);
          } else {
            // Panel is closed — open and pin
            setOpen(true);
            setPinned(true);
          }
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={(e) => {
          // Never close on mouse-leave when the panel is pinned by a click
          if (pinned) return;
          // Keep open if the mouse moves directly into the portal panel
          if (
            panelRef.current &&
            panelRef.current.contains(e.relatedTarget as Node)
          )
            return;
          setOpen(false);
        }}
        className={`
          w-4 h-4 rounded-full border flex items-center justify-center
          text-[9px] font-bold select-none transition-colors flex-shrink-0
          ${
            pinned
              ? "bg-blue-600/30 border-blue-400/80 text-blue-300 ring-1 ring-blue-500/40"
              : open
                ? "bg-blue-500/20 border-blue-500/60 text-blue-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
          }
        `}
        aria-label={`Help for ${label}`}
        aria-expanded={open}
        title={pinned ? "Click to close" : "Click to pin open"}
      >
        ?
      </button>

      {panel}
    </div>
  );
};
