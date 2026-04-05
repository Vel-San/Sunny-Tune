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
  const cfg = structuredClone(raw) as SPConfig & {
    speedControl?: {
      speedLimitControl?: Record<string, unknown>;
      icbmEnabled?: boolean;
    };
    interface?: Record<string, unknown>;
  };

  const slc = cfg.speedControl?.speedLimitControl as
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

  // Forward-fill new speedControl fields
  if (cfg.speedControl && typeof cfg.speedControl.icbmEnabled !== "boolean") {
    (cfg.speedControl as Record<string, unknown>)["icbmEnabled"] = false;
  }

  // Forward-fill new interface fields
  const iface = cfg.interface as Record<string, unknown> | undefined;
  if (iface) {
    const boolDefaults: string[] = [
      "blindSpotHUD",
      "steeringArc",
      "trueVegoUI",
      "chevronInfo",
      "rainbowMode",
    ];
    for (const key of boolDefaults) {
      if (typeof iface[key] !== "boolean") iface[key] = false;
    }
  }

  return cfg as SPConfig;
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
