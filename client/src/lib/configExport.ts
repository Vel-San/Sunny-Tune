/**
 * Config import/export utilities.
 *
 * Export format (`SunnyTuneExport`):
 *   A JSON envelope with `exportVersion: 1`, metadata about the config,
 *   and the full `SPConfig` payload.
 *
 * Import:
 *   `parseImportFile(file)` reads the JSON file, validates its shape with
 *   Zod, and returns a strongly-typed `SunnyTuneExport` or throws an
 *   `ImportValidationError` with a human-readable message.
 */

import { z } from "zod";
import type { ConfigRecord, SPConfig } from "../types/config";

// ─── Export format type ───────────────────────────────────────────────────────

export interface SunnyTuneExport {
  exportVersion: 1;
  exportedAt: string;
  name: string;
  description?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  tags?: string[];
  category?: string;
  config: SPConfig;
}

// ─── Zod validation schema for imports ───────────────────────────────────────

const VALID_CONFIG_SECTIONS = new Set([
  "metadata",
  "vehicle",
  "drivingPersonality",
  "lateral",
  "longitudinal",
  "speedControl",
  "laneChange",
  "navigation",
  "interface",
  "commaAI",
  "advanced",
]);

const importSchema = z.object({
  exportVersion: z.literal(1),
  exportedAt: z.string().optional(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(100).optional(),
  vehicleYear: z.number().int().min(2012).max(2030).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  category: z.string().max(50).optional(),
  config: z
    .record(z.unknown())
    .refine(
      (data) => Object.keys(data).every((k) => VALID_CONFIG_SECTIONS.has(k)),
      { message: "Config contains unrecognised top-level sections" },
    )
    .refine(
      (data) => VALID_CONFIG_SECTIONS.has("metadata") || "metadata" in data,
      { message: "Config is missing the required 'metadata' section" },
    ),
});

// ─── Errors ───────────────────────────────────────────────────────────────────

export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Triggers a browser download of the config as a `.sunnytune.json` file.
 * Works in all modern browsers without any dependencies.
 */
export function exportConfigAsJson(
  config: ConfigRecord,
  filename?: string,
): void {
  const payload: SunnyTuneExport = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    name: config.name,
    ...(config.description ? { description: config.description } : {}),
    ...(config.vehicleMake ? { vehicleMake: config.vehicleMake } : {}),
    ...(config.vehicleModel ? { vehicleModel: config.vehicleModel } : {}),
    ...(config.vehicleYear ? { vehicleYear: config.vehicleYear } : {}),
    ...(config.tags?.length ? { tags: config.tags } : {}),
    ...(config.category ? { category: config.category } : {}),
    config: config.config,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    filename ?? `${config.name.replace(/[^a-z0-9_-]/gi, "_")}.sunnytune.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Import ───────────────────────────────────────────────────────────────────

/**
 * Reads a File, parses its JSON content, and validates it against the
 * SunnyTuneExport schema.
 *
 * @throws {ImportValidationError} If the file cannot be read, parsed, or validated.
 */
export async function parseImportFile(file: File): Promise<SunnyTuneExport> {
  if (file.size > 512_000) {
    throw new ImportValidationError(
      "File is too large (max 512 KB). Only valid SunnyTune export files are accepted.",
    );
  }

  let raw: string;
  try {
    raw = await file.text();
  } catch {
    throw new ImportValidationError("Could not read the selected file.");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ImportValidationError(
      "The file is not valid JSON. Make sure you're importing a .sunnytune.json export.",
    );
  }

  const result = importSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.errors[0];
    const path = first.path.join(".");
    throw new ImportValidationError(
      `Invalid export file: ${path ? `"${path}" — ` : ""}${first.message}`,
    );
  }

  return result.data as unknown as SunnyTuneExport;
}
