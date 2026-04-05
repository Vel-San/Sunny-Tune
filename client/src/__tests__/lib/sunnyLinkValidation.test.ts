/**
 * @fileoverview Unit tests for validateForSunnyLinkExport.
 *
 * Tests cover every validation rule:
 * — Dynamic E2E without Experimental Mode
 * — Alpha Longitudinal (AEB disabled)
 * — NN Lateral (info)
 * — Torque Override active
 * — MADS disabled with sub-settings active
 * — Camera offset near extremes
 * — Hyundai tune on non-HKG vehicle
 * — Planplus experimental (info)
 * — Speed Limit Control with offsetType "none" (info)
 * — NNModel + EnforceTorque conflict
 * — Clean config produces zero issues
 * — Multiple issues can fire independently
 */

import { describe, expect, it } from "vitest";
import { validateForSunnyLinkExport } from "../../lib/sunnyLinkValidation";
import { createDefaultConfig, type SPConfig } from "../../types/config";

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Clone the default config and apply a partial deep-ish override. */
function makeConfig(patch: (c: SPConfig) => void): SPConfig {
  const c = createDefaultConfig() as SPConfig;
  patch(c);
  return c;
}

// ─── No issues ─────────────────────────────────────────────────────────────────

describe("validateForSunnyLinkExport — clean config", () => {
  it("returns no issues for the default config", () => {
    const issues = validateForSunnyLinkExport(
      createDefaultConfig() as SPConfig,
    );
    expect(issues).toHaveLength(0);
  });
});

// ─── Rule: Dynamic E2E without Experimental Mode ─────────────────────────────

describe("rule: DynamicExperimentalControl", () => {
  it("warns when dynamicE2E=true but e2eEnabled=false", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.dynamicE2E = true;
      cfg.longitudinal.e2eEnabled = false;
    });
    const issues = validateForSunnyLinkExport(c);
    const issue = issues.find((i) => i.field === "DynamicExperimentalControl");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("does NOT warn when both dynamicE2E and e2eEnabled are true", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.dynamicE2E = true;
      cfg.longitudinal.e2eEnabled = true;
    });
    const issues = validateForSunnyLinkExport(c);
    expect(
      issues.find((i) => i.field === "DynamicExperimentalControl"),
    ).toBeUndefined();
  });

  it("does NOT warn when dynamicE2E is false", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.dynamicE2E = false;
      cfg.longitudinal.e2eEnabled = false;
    });
    const issues = validateForSunnyLinkExport(c);
    expect(
      issues.find((i) => i.field === "DynamicExperimentalControl"),
    ).toBeUndefined();
  });
});

// ─── Rule: Alpha Longitudinal ─────────────────────────────────────────────────

describe("rule: AlphaLongitudinalEnabled", () => {
  it("warns when alphaLongEnabled=true", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.alphaLongEnabled = true;
    });
    const issues = validateForSunnyLinkExport(c);
    const issue = issues.find((i) => i.field === "AlphaLongitudinalEnabled");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
    expect(issue!.wikiUrl).toContain("AlphaLongitudinal");
  });

  it("does NOT warn when alphaLongEnabled=false", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.alphaLongEnabled = false;
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "AlphaLongitudinalEnabled",
      ),
    ).toBeUndefined();
  });
});

// ─── Rule: NN Lateral (info) ─────────────────────────────────────────────────

describe("rule: NeuralNetworkLateralControl", () => {
  it("returns an info issue when useNNModel=true", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.useNNModel = true;
    });
    const issues = validateForSunnyLinkExport(c);
    const issue = issues.find((i) => i.field === "NeuralNetworkLateralControl");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("info");
  });

  it("does NOT fire when useNNModel=false", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.useNNModel = false;
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "NeuralNetworkLateralControl",
      ),
    ).toBeUndefined();
  });
});

// ─── Rule: Torque Override ────────────────────────────────────────────────────

describe("rule: TorqueParamsOverrideEnabled", () => {
  it("warns when torqueOverride.enabled=true", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.torqueOverride.enabled = true;
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "TorqueParamsOverrideEnabled",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("does NOT warn when override is disabled", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.torqueOverride.enabled = false;
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "TorqueParamsOverrideEnabled",
      ),
    ).toBeUndefined();
  });
});

// ─── Rule: MADS disabled with active sub-settings ────────────────────────────

describe("rule: Mads disabled with sub-settings active", () => {
  it("warns when mads=false and madsMainCruise=true", () => {
    const c = makeConfig((cfg) => {
      cfg.commaAI.mads = false;
      cfg.commaAI.madsMainCruise = true;
    });
    const issue = validateForSunnyLinkExport(c).find((i) => i.field === "Mads");
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("warns when mads=false and madsSteeringMode != 0", () => {
    const c = makeConfig((cfg) => {
      cfg.commaAI.mads = false;
      cfg.commaAI.madsSteeringMode = 1;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "Mads"),
    ).toBeDefined();
  });

  it("warns when mads=false and madsUnifiedEngagement=true", () => {
    const c = makeConfig((cfg) => {
      cfg.commaAI.mads = false;
      cfg.commaAI.madsUnifiedEngagement = true;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "Mads"),
    ).toBeDefined();
  });

  it("does NOT warn when mads=true even if sub-settings are active", () => {
    const c = makeConfig((cfg) => {
      cfg.commaAI.mads = true;
      cfg.commaAI.madsMainCruise = true;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "Mads"),
    ).toBeUndefined();
  });

  it("does NOT warn when mads=false and all sub-settings are at defaults", () => {
    const c = makeConfig((cfg) => {
      cfg.commaAI.mads = false;
      cfg.commaAI.madsMainCruise = false;
      cfg.commaAI.madsSteeringMode = 0;
      cfg.commaAI.madsUnifiedEngagement = false;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "Mads"),
    ).toBeUndefined();
  });
});

// ─── Rule: Camera offset extremes ────────────────────────────────────────────

describe("rule: CameraOffset extremes", () => {
  it("warns when cameraOffset >= 0.28", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.cameraOffset = 0.28;
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "CameraOffset",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("warns when cameraOffset <= -0.28", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.cameraOffset = -0.28;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "CameraOffset"),
    ).toBeDefined();
  });

  it("warns when cameraOffset is 0.30 (maximum)", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.cameraOffset = 0.3;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "CameraOffset"),
    ).toBeDefined();
  });

  it("does NOT warn for cameraOffset = 0.25 (safe)", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.cameraOffset = 0.25;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "CameraOffset"),
    ).toBeUndefined();
  });

  it("does NOT warn for cameraOffset = 0 (default)", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.cameraOffset = 0;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "CameraOffset"),
    ).toBeUndefined();
  });
});

// ─── Rule: Hyundai tune on non-HKG vehicle ───────────────────────────────────

describe("rule: HyundaiLongitudinalTuning on non-HKG vehicle", () => {
  it("warns when tune != 0 and make is toyota", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 1;
      cfg.vehicle.make = "toyota";
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "HyundaiLongitudinalTuning",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
    expect(issue!.message).toContain("toyota");
  });

  it("does NOT warn when make=hyundai", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 2;
      cfg.vehicle.make = "hyundai";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "HyundaiLongitudinalTuning",
      ),
    ).toBeUndefined();
  });

  it("does NOT warn when make=kia", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 1;
      cfg.vehicle.make = "kia";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "HyundaiLongitudinalTuning",
      ),
    ).toBeUndefined();
  });

  it("does NOT warn when make=genesis", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 2;
      cfg.vehicle.make = "genesis";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "HyundaiLongitudinalTuning",
      ),
    ).toBeUndefined();
  });

  it("does NOT warn when hyundaiLongTune=0 (Off) regardless of make", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 0;
      cfg.vehicle.make = "nissan";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "HyundaiLongitudinalTuning",
      ),
    ).toBeUndefined();
  });

  it("does NOT warn when vehicle make is empty string", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.hyundaiLongTune = 1;
      cfg.vehicle.make = "" as never; // empty make means unknown — rule skips it
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "HyundaiLongitudinalTuning",
      ),
    ).toBeUndefined();
  });
});

// ─── Rule: Planplus experimental (info) ──────────────────────────────────────

describe("rule: PlanplusControl", () => {
  it("returns an info issue when planplusEnabled=true", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.planplusEnabled = true;
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "PlanplusControl",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("info");
  });

  it("does NOT fire when planplusEnabled=false", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.planplusEnabled = false;
    });
    expect(
      validateForSunnyLinkExport(c).find((i) => i.field === "PlanplusControl"),
    ).toBeUndefined();
  });
});

// ─── Rule: Speed Limit Control with offsetType "none" ────────────────────────

describe("rule: SpeedLimitOffsetType", () => {
  it("returns an info issue when SLC is enabled with offsetType='none'", () => {
    const c = makeConfig((cfg) => {
      cfg.speedControl.speedLimitControl.enabled = true;
      cfg.speedControl.speedLimitControl.offsetType = "none";
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "SpeedLimitOffsetType",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("info");
  });

  it("does NOT fire when SLC is disabled", () => {
    const c = makeConfig((cfg) => {
      cfg.speedControl.speedLimitControl.enabled = false;
      cfg.speedControl.speedLimitControl.offsetType = "none";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "SpeedLimitOffsetType",
      ),
    ).toBeUndefined();
  });

  it("does NOT fire when offsetType is not 'none'", () => {
    const c = makeConfig((cfg) => {
      cfg.speedControl.speedLimitControl.enabled = true;
      cfg.speedControl.speedLimitControl.offsetType = "percentage";
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "SpeedLimitOffsetType",
      ),
    ).toBeUndefined();
  });
});

// ─── Rule: NNModel + EnforceTorque conflict ───────────────────────────────────

describe("rule: EnforceTorqueControl + NNModel conflict", () => {
  it("warns when both useNNModel and enforceTorqueControl are true", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.useNNModel = true;
      cfg.lateral.enforceTorqueControl = true;
    });
    const issue = validateForSunnyLinkExport(c).find(
      (i) => i.field === "EnforceTorqueControl",
    );
    expect(issue).toBeDefined();
    expect(issue!.severity).toBe("warning");
  });

  it("does NOT warn when only NNModel is true", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.useNNModel = true;
      cfg.lateral.enforceTorqueControl = false;
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "EnforceTorqueControl",
      ),
    ).toBeUndefined();
  });

  it("does NOT warn when only EnforceTorque is true", () => {
    const c = makeConfig((cfg) => {
      cfg.lateral.useNNModel = false;
      cfg.lateral.enforceTorqueControl = true;
    });
    expect(
      validateForSunnyLinkExport(c).find(
        (i) => i.field === "EnforceTorqueControl",
      ),
    ).toBeUndefined();
  });
});

// ─── Multiple issues can fire together ────────────────────────────────────────

describe("validateForSunnyLinkExport — multiple issues", () => {
  it("returns multiple issues when several rules trigger", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.alphaLongEnabled = true; // warning
      cfg.longitudinal.planplusEnabled = true; // info
      cfg.lateral.useNNModel = true; // info
    });
    const issues = validateForSunnyLinkExport(c);
    expect(issues.length).toBeGreaterThanOrEqual(3);
    expect(issues.map((i) => i.field)).toContain("AlphaLongitudinalEnabled");
    expect(issues.map((i) => i.field)).toContain("PlanplusControl");
    expect(issues.map((i) => i.field)).toContain("NeuralNetworkLateralControl");
  });

  it("all issues have a field string", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.alphaLongEnabled = true;
      cfg.lateral.useNNModel = true;
      cfg.lateral.cameraOffset = 0.3;
    });
    const issues = validateForSunnyLinkExport(c);
    for (const issue of issues) {
      expect(typeof issue.field).toBe("string");
      expect(issue.field.length).toBeGreaterThan(0);
    }
  });

  it("issues with wikiUrl have valid https URLs", () => {
    const c = makeConfig((cfg) => {
      cfg.longitudinal.alphaLongEnabled = true;
      cfg.longitudinal.dynamicE2E = true;
      cfg.longitudinal.e2eEnabled = false;
    });
    const issues = validateForSunnyLinkExport(c);
    const withUrl = issues.filter((i) => i.wikiUrl);
    expect(withUrl.length).toBeGreaterThan(0);
    for (const issue of withUrl) {
      expect(issue.wikiUrl!.startsWith("https://")).toBe(true);
    }
  });
});
