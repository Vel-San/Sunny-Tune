/**
 * Config diff computation.
 *
 * `computeConfigDiff(original, modified)` returns a flat list of every
 * parameter that changed between two SPConfig objects.  Each entry includes:
 *   - section     — top-level SPConfig key (e.g. "lateral")
 *   - field       — nested field key (e.g. "steerRateCost")
 *   - label       — human-readable label from the feature registry (falls back
 *                   to the raw field key when the registry has no entry)
 *   - oldValue    — the original value (serialised to string for display)
 *   - newValue    — the modified value (serialised to string)
 *   - sectionLabel — capitalised section display name
 *
 * Only leaf-level scalar values are compared (nested objects like
 * `torque`, `pid`, `indi`, `lqr` are recursed into).
 */

import type { SPConfig } from "../types/config";
import { ALL_FEATURES } from "./featureRegistry";

export interface DiffEntry {
  section: string;
  sectionLabel: string;
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

// Human-readable section names
const SECTION_LABELS: Record<string, string> = {
  metadata: "Metadata",
  vehicle: "Vehicle",
  drivingPersonality: "Driving Personality",
  lateral: "Lateral Control",
  longitudinal: "Longitudinal Control",
  speedControl: "Speed Control",
  laneChange: "Lane Change",
  navigation: "Navigation",
  interface: "Interface & Display",
  commaAI: "Comma AI Core",
  advanced: "Advanced",
};

/** Build a quick lookup: "section.field" → registry label */
function buildLabelMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of ALL_FEATURES) {
    map[`${f.section}.${f.id}`] = f.label;
  }
  return map;
}

const LABEL_MAP = buildLabelMap();

/** Convert any primitive to a display-friendly string. */
function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "On" : "Off";
  return String(v);
}

/** Recursively collect leaf diffs between two arbitrary objects. */
function diffObjects(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  section: string,
  path: string,
  out: DiffEntry[],
  labelMap: Record<string, string>,
) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const va = a[key];
    const vb = b[key];
    const fullPath = path ? `${path}.${key}` : key;

    if (
      va !== null &&
      vb !== null &&
      typeof va === "object" &&
      typeof vb === "object" &&
      !Array.isArray(va) &&
      !Array.isArray(vb)
    ) {
      // Recurse into nested objects (e.g. torque, pid, speedLimitControl)
      diffObjects(
        va as Record<string, unknown>,
        vb as Record<string, unknown>,
        section,
        fullPath,
        out,
        labelMap,
      );
    } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
      // The field `section.key` may map to a registry entry
      const registryKey = `${section}.${key}`;
      const label = labelMap[registryKey] ?? key;
      out.push({
        section,
        sectionLabel: SECTION_LABELS[section] ?? section,
        field: fullPath,
        label,
        oldValue: fmt(va),
        newValue: fmt(vb),
      });
    }
  }
}

/**
 * Returns every parameter that differs between `original` and `modified`.
 * Results are grouped (sorted) by section order matching SECTION_LABELS.
 */
export function computeConfigDiff(
  original: SPConfig,
  modified: SPConfig,
): DiffEntry[] {
  const entries: DiffEntry[] = [];
  const sections = Object.keys(SECTION_LABELS) as (keyof SPConfig)[];

  for (const section of sections) {
    const a = original[section] as Record<string, unknown> | undefined;
    const b = modified[section] as Record<string, unknown> | undefined;
    if (!a || !b) continue;
    diffObjects(a, b, section, "", entries, LABEL_MAP);
  }

  return entries;
}
