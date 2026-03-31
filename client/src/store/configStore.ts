import { create } from "zustand";
import type { SPConfig } from "../types/config";
import { createDefaultConfig } from "../types/config";

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
      editingConfig: config,
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
