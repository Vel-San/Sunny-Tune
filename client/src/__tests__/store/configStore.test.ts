/**
 * @fileoverview Unit tests for the configStore Zustand store.
 *
 * Tests cover:
 * - initNew resets to a clean default config
 * - loadConfig populates from a given config record
 * - updateSection merges partial section updates
 * - setName / setDescription / setTags / setCategory update fields
 * - isDirty flag is set correctly after mutations
 * - markClean resets the dirty flag
 * - setActiveSection updates the active section
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useConfigStore } from "../../store/configStore";

/** Resets the store to a known baseline before each test. */
function resetStore() {
  useConfigStore.getState().initNew();
}

describe("configStore — initialization", () => {
  beforeEach(resetStore);

  it("initNew sets isDirty to false", () => {
    expect(useConfigStore.getState().isDirty).toBe(false);
  });

  it("initNew clears editingId", () => {
    expect(useConfigStore.getState().editingId).toBeNull();
  });

  it("initNew sets a non-empty editingConfig", () => {
    const { editingConfig } = useConfigStore.getState();
    expect(editingConfig).toBeDefined();
    expect(editingConfig.vehicle).toBeDefined();
  });

  it("initNew resets editingTags to empty array", () => {
    expect(useConfigStore.getState().editingTags).toEqual([]);
  });
});

describe("configStore — setName / setDescription", () => {
  beforeEach(resetStore);

  it("setName updates editingName and marks dirty", () => {
    useConfigStore.getState().setName("My Config");
    const { editingName, isDirty } = useConfigStore.getState();
    expect(editingName).toBe("My Config");
    expect(isDirty).toBe(true);
  });

  it("setDescription updates editingDescription and marks dirty", () => {
    useConfigStore.getState().setDescription("Great config");
    const { editingDescription, isDirty } = useConfigStore.getState();
    expect(editingDescription).toBe("Great config");
    expect(isDirty).toBe(true);
  });
});

describe("configStore — setTags / setCategory", () => {
  beforeEach(resetStore);

  it("setTags updates editingTags and marks dirty", () => {
    useConfigStore.getState().setTags(["highway", "e2e"]);
    const { editingTags, isDirty } = useConfigStore.getState();
    expect(editingTags).toEqual(["highway", "e2e"]);
    expect(isDirty).toBe(true);
  });

  it("setCategory updates editingCategory and marks dirty", () => {
    useConfigStore.getState().setCategory("performance");
    const { editingCategory, isDirty } = useConfigStore.getState();
    expect(editingCategory).toBe("performance");
    expect(isDirty).toBe(true);
  });
});

describe("configStore — updateSection", () => {
  beforeEach(resetStore);

  it("updates a single field without affecting others", () => {
    useConfigStore.getState().updateField("vehicle", "model", "Ioniq 6");
    const { editingConfig } = useConfigStore.getState();
    expect(editingConfig.vehicle.model).toBe("Ioniq 6");
  });

  it("replaces the entire section (use updateField to merge)", () => {
    // updateSection sets the whole section value — it does NOT deep-merge.
    // Use updateField when you want to update a single key without touching others.
    const original = useConfigStore.getState().editingConfig.vehicle;
    const newVehicle = { ...original, model: "Ioniq 5" };
    useConfigStore.getState().updateSection("vehicle", newVehicle);
    // make is preserved because we spread original in the new value
    expect(useConfigStore.getState().editingConfig.vehicle.make).toBe(
      original.make,
    );
    expect(useConfigStore.getState().editingConfig.vehicle.model).toBe(
      "Ioniq 5",
    );
  });

  it("marks the config as dirty", () => {
    useConfigStore.getState().updateField("vehicle", "model", "Test");
    expect(useConfigStore.getState().isDirty).toBe(true);
  });
});

describe("configStore — markClean", () => {
  beforeEach(resetStore);

  it("resets isDirty to false after mutations", () => {
    useConfigStore.getState().setName("Dirty Config");
    expect(useConfigStore.getState().isDirty).toBe(true);
    useConfigStore.getState().markClean();
    expect(useConfigStore.getState().isDirty).toBe(false);
  });
});

describe("configStore — setActiveSection", () => {
  beforeEach(resetStore);

  it("updates the active section", () => {
    useConfigStore.getState().setActiveSection("lateral");
    expect(useConfigStore.getState().activeSection).toBe("lateral");
  });
});

describe("configStore — loadConfig", () => {
  beforeEach(resetStore);

  it("populates all editing fields from arguments", () => {
    const fakeConfig = useConfigStore.getState().editingConfig;
    useConfigStore
      .getState()
      .loadConfig(
        "id-123",
        "Test",
        "Desc",
        fakeConfig,
        ["fast"],
        "performance",
      );

    const s = useConfigStore.getState();
    expect(s.editingId).toBe("id-123");
    expect(s.editingName).toBe("Test");
    expect(s.editingDescription).toBe("Desc");
    expect(s.editingTags).toEqual(["fast"]);
    expect(s.editingCategory).toBe("performance");
    expect(s.isDirty).toBe(false);
  });

  it("always sets isDirty to false regardless of prior dirty state", () => {
    useConfigStore.getState().setName("Dirty before load");
    expect(useConfigStore.getState().isDirty).toBe(true);

    const cfg = useConfigStore.getState().editingConfig;
    useConfigStore.getState().loadConfig("id-999", "Fresh", "", cfg);
    expect(useConfigStore.getState().isDirty).toBe(false);
  });

  it("loads with empty id (new import pattern) — editingId is empty string", () => {
    const cfg = useConfigStore.getState().editingConfig;
    useConfigStore.getState().loadConfig("", "Imported", "", cfg);
    const s = useConfigStore.getState();
    // empty string editingId signals a new (unsaved) config
    expect(s.editingId).toBe("");
    expect(s.editingName).toBe("Imported");
    expect(s.isDirty).toBe(false);
  });

  it("defaults tags + category to empty when not provided", () => {
    const cfg = useConfigStore.getState().editingConfig;
    useConfigStore.getState().loadConfig("x", "No tags", "", cfg);
    expect(useConfigStore.getState().editingTags).toEqual([]);
    expect(useConfigStore.getState().editingCategory).toBe("");
  });
});

describe("configStore — syncTagsCategory", () => {
  beforeEach(resetStore);

  it("updates tags and category without marking dirty", () => {
    // First make the store dirty with a real mutation
    useConfigStore.getState().setName("Changed");
    expect(useConfigStore.getState().isDirty).toBe(true);

    // markClean, then call syncTagsCategory — should NOT flip dirty back on
    useConfigStore.getState().markClean();
    useConfigStore.getState().syncTagsCategory(["highway", "mads"], "daily");

    const s = useConfigStore.getState();
    expect(s.editingTags).toEqual(["highway", "mads"]);
    expect(s.editingCategory).toBe("daily");
    expect(s.isDirty).toBe(false);
  });

  it("does not require dirty state before calling", () => {
    useConfigStore.getState().syncTagsCategory(["smooth"], "performance");
    expect(useConfigStore.getState().isDirty).toBe(false);
    expect(useConfigStore.getState().editingTags).toEqual(["smooth"]);
  });
});

describe("configStore — initNew resets activeSection", () => {
  it("resets activeSection to 'vehicle'", () => {
    useConfigStore.getState().setActiveSection("steering");
    expect(useConfigStore.getState().activeSection).toBe("steering");
    useConfigStore.getState().initNew();
    expect(useConfigStore.getState().activeSection).toBe("vehicle");
  });
});
