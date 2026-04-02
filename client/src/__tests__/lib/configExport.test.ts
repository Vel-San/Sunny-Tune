import { describe, expect, it } from "vitest";
import { ImportValidationError, parseImportFile } from "../../lib/configExport";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a fake File whose `.text()` method is stubbed to resolve synchronously.
 * jsdom's File does not implement `text()`, so we must provide our own.
 */
function makeFile(content: string, name = "export.sunnytune.json"): File {
  const file = new File([content], name, { type: "application/json" });
  // Stub text() for jsdom
  (file as unknown as { text: () => Promise<string> }).text = () =>
    Promise.resolve(content);
  return file;
}

const VALID_PAYLOAD = JSON.stringify({
  exportVersion: 1,
  exportedAt: "2024-01-01T00:00:00.000Z",
  name: "My Test Config",
  config: {
    metadata: {},
    vehicle: {},
    drivingPersonality: {},
    lateral: {},
    longitudinal: {},
    speedControl: {},
    laneChange: {},
    navigation: {},
    interface: {},
    commaAI: {},
    advanced: {},
  },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("parseImportFile", () => {
  it("parses and returns a valid export file", async () => {
    const file = makeFile(VALID_PAYLOAD);
    const result = await parseImportFile(file);
    expect(result.exportVersion).toBe(1);
    expect(result.name).toBe("My Test Config");
  });

  it("includes optional fields when present", async () => {
    const payload = JSON.stringify({
      exportVersion: 1,
      name: "With extras",
      description: "A test",
      vehicleMake: "toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2022,
      tags: ["highway", "smooth"],
      category: "daily",
      config: { metadata: {}, vehicle: {} },
    });
    const result = await parseImportFile(makeFile(payload));
    expect(result.description).toBe("A test");
    expect(result.vehicleMake).toBe("toyota");
    expect(result.tags).toEqual(["highway", "smooth"]);
  });

  it("throws ImportValidationError for a file larger than 512 KB", async () => {
    const bigContent = "x".repeat(513_000);
    const file = makeFile(bigContent, "big.json");
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(file)).rejects.toThrow(/too large/i);
  });

  it("throws ImportValidationError for invalid JSON", async () => {
    const file = makeFile("{ not valid json }");
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(file)).rejects.toThrow(/not valid JSON/i);
  });

  it("throws ImportValidationError when exportVersion is not 1", async () => {
    const bad = JSON.stringify({
      exportVersion: 2,
      name: "Config",
      config: { metadata: {} },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
  });

  it("throws ImportValidationError when name is missing", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      config: { metadata: {} },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(makeFile(bad))).rejects.toThrow(/name/i);
  });

  it("throws ImportValidationError for an unrecognised config section key", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      name: "Bad sections",
      config: {
        metadata: {},
        unknownSection: { foo: "bar" },
      },
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
    await expect(parseImportFile(makeFile(bad))).rejects.toThrow(
      /unrecognised/i,
    );
  });

  it("throws ImportValidationError if config is not an object", async () => {
    const bad = JSON.stringify({
      exportVersion: 1,
      name: "Broken",
      config: "this-is-not-an-object",
    });
    await expect(parseImportFile(makeFile(bad))).rejects.toBeInstanceOf(
      ImportValidationError,
    );
  });
});
