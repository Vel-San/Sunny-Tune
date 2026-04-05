import { create } from "zustand";
import type { SLCOffsetType, SPConfig } from "../types/config";
import { createDefaultConfig } from "../types/config";

/**
 * Normalises a config loaded from the server, applying forward-migrations so
 * that configs saved with older schema shapes still load correctly.
 *
 * - SpeedLimitMode: old `enabled: boolean` → new `mode: 0|1|2|3`
 * - SLCOffsetType:  `fixed_mph` / `fixed_kph` → `fixed`
 * - New interface fields: default to false if missing (blindSpotHUD, steeringArc, trueVegoUI, chevronInfo, rainbowMode)
 * - New speedControl fields: default to false if missing (icbmEnabled)
 */
function normalizeConfig(raw: SPConfig): SPConfig {
  // Deep-merge with defaults so any newly added top-level sections (e.g.
  // vehicleSpecific, advanced.maxTimeOffroad) are always present even on
  // configs that were saved before those fields existed.
  const defaults = createDefaultConfig();
  const cfg = structuredClone(raw) as unknown as Record<string, unknown>;
  for (const key of Object.keys(defaults) as (keyof SPConfig)[]) {
    if (cfg[key] === undefined || cfg[key] === null) {
      (cfg as Record<string, unknown>)[key] = structuredClone(
        defaults[key] as unknown,
      );
    } else if (
      typeof defaults[key] === "object" &&
      defaults[key] !== null &&
      !Array.isArray(defaults[key])
    ) {
      // Shallow-merge: fill missing keys inside each section
      const section = cfg[key] as Record<string, unknown>;
      const defSection = defaults[key] as Record<string, unknown>;
      for (const field of Object.keys(defSection)) {
        if (section[field] === undefined) {
          section[field] = structuredClone(defSection[field]);
        }
      }
    }
  }

  const typed = cfg as unknown as SPConfig & {
    speedControl?: {
      speedLimitControl?: Record<string, unknown>;
    };
  };

  const slc = typed.speedControl?.speedLimitControl as
    | Record<string, unknown>
    | undefined;
  if (slc) {
    // Migration 1: boolean enabled → integer mode
    if (typeof slc["enabled"] === "boolean") {
      slc["mode"] = slc["enabled"] ? 3 : 0;
      delete slc["enabled"];
    }
    // Ensure mode is a valid 0-3 integer
    if (typeof slc["mode"] !== "number" || slc["mode"] < 0 || slc["mode"] > 3) {
      slc["mode"] = 0;
    }
    // Migration 2: fixed_mph / fixed_kph → fixed
    if (
      slc["offsetType"] === "fixed_mph" ||
      slc["offsetType"] === "fixed_kph"
    ) {
      slc["offsetType"] = "fixed" as SLCOffsetType;
    }
  }

  return cfg as unknown as SPConfig;
}

interface ConfigEditorState {
  /** Config currently being edited (null = not in edit mode) */
  editingConfig: SPConfig;
  /** Database ID of the config being edited (null = new unsaved) */
  editingId: string | null;
  /** Name for the current config */
  editingName: string;
  editingDescription: string;
  editingTags: string[];
  editingCategory: string;
  /** Whether any unsaved changes exist */
  isDirty: boolean;
  /** Active section key in the editor sidebar */
  activeSection: string;

  initNew: () => void;
  loadConfig: (
    id: string,
    name: string,
    description: string,
    config: SPConfig,
    tags?: string[],
    category?: string,
  ) => void;
  updateSection: <K extends keyof SPConfig>(
    section: K,
    value: SPConfig[K],
  ) => void;
  updateField: <K extends keyof SPConfig, F extends keyof SPConfig[K]>(
    section: K,
    field: F,
    value: SPConfig[K][F],
  ) => void;
  setName: (name: string) => void;
  setDescription: (desc: string) => void;
  setTags: (tags: string[]) => void;
  setCategory: (cat: string) => void;
  setActiveSection: (key: string) => void;
  markClean: () => void;
}

export const useConfigStore = create<ConfigEditorState>((set) => ({
  editingConfig: createDefaultConfig(),
  editingId: null,
  editingName: "My Config",
  editingDescription: "",
  editingTags: [],
  editingCategory: "",
  isDirty: false,
  activeSection: "vehicle",

  initNew: () =>
    set({
      editingConfig: createDefaultConfig(),
      editingId: null,
      editingName: "My Config",
      editingDescription: "",
      editingTags: [],
      editingCategory: "",
      isDirty: false,
      activeSection: "vehicle",
    }),

  loadConfig: (id, name, description, config, tags = [], category = "") =>
    set({
      editingId: id,
      editingName: name,
      editingDescription: description,
      editingConfig: normalizeConfig(config),
      editingTags: tags,
      editingCategory: category,
      isDirty: false,
    }),

  updateSection: (section, value) =>
    set((state) => ({
      editingConfig: { ...state.editingConfig, [section]: value },
      isDirty: true,
    })),

  updateField: (section, field, value) =>
    set((state) => ({
      editingConfig: {
        ...state.editingConfig,
        [section]: { ...state.editingConfig[section], [field]: value },
      },
      isDirty: true,
    })),

  setName: (name) => set({ editingName: name, isDirty: true }),
  setDescription: (desc) => set({ editingDescription: desc, isDirty: true }),
  setTags: (tags) => set({ editingTags: tags, isDirty: true }),
  setCategory: (cat) => set({ editingCategory: cat, isDirty: true }),
  setActiveSection: (key) => set({ activeSection: key }),
  markClean: () => set({ isDirty: false }),
}));
