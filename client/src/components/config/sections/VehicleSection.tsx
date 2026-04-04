import { Car } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import type { CommaHardware, SPBranch } from "../../../types/config";
import { Input } from "../../ui/Input";
import { NumberInput } from "../../ui/NumberInput";
import { Select } from "../../ui/Select";
import { ConfigSection, ParamRow } from "../ConfigSection";

const MAKES = [
  { value: "toyota", label: "Toyota" },
  { value: "lexus", label: "Lexus" },
  { value: "honda", label: "Honda" },
  { value: "acura", label: "Acura" },
  { value: "hyundai", label: "Hyundai" },
  { value: "kia", label: "Kia" },
  { value: "genesis", label: "Genesis" },
  { value: "gm", label: "GM" },
  { value: "ford", label: "Ford" },
  { value: "lincoln", label: "Lincoln" },
  { value: "chrysler", label: "Chrysler" },
  { value: "jeep", label: "Jeep" },
  { value: "ram", label: "Ram" },
  { value: "volkswagen", label: "Volkswagen" },
  { value: "audi", label: "Audi" },
  { value: "subaru", label: "Subaru" },
  { value: "mazda", label: "Mazda" },
  { value: "nissan", label: "Nissan" },
  { value: "infiniti", label: "Infiniti" },
  { value: "other", label: "Other" },
];

const HARDWARE_OPTIONS = [
  { value: "", label: "Unknown / Not specified" },
  { value: "comma4", label: "Comma 4 (C4)" },
  { value: "comma3x", label: "Comma 3X (C3X)" },
  { value: "comma3", label: "Comma 3 (C3)" },
];

/**
 * Branch options per hardware platform.
 * Branches that don't exist for a given device are hidden to prevent
 * users from entering an invalid branch for their hardware.
 *
 * C4:  staging.sunnypilot.ai · dev.sunnypilot.ai
 * C3X: release.sunnypilot.ai (release-tizi) · staging.sunnypilot.ai · dev.sunnypilot.ai
 * C3:  install.sunnypilot.ai/staging-tici only
 */
const BRANCHES_BY_HW: Record<string, { value: SPBranch; label: string }[]> = {
  comma4: [
    { value: "staging-sp", label: "staging.sunnypilot.ai (Staging)" },
    { value: "dev-sp", label: "dev.sunnypilot.ai (Dev)" },
  ],
  comma3x: [
    {
      value: "stable-sp",
      label: "release.sunnypilot.ai / release-tizi (Stable)",
    },
    { value: "staging-sp", label: "staging.sunnypilot.ai (Staging)" },
    { value: "dev-sp", label: "dev.sunnypilot.ai (Dev)" },
  ],
  comma3: [
    {
      value: "staging-sp",
      label: "install.sunnypilot.ai/staging-tici (Staging TICI)",
    },
  ],
  // Unknown hardware — show all known branches except nightly (removed; kept
  // in SPBranch type only for backward compat with old stored configs)
  "": [
    {
      value: "stable-sp",
      label: "release.sunnypilot.ai (Stable / release-tizi)",
    },
    { value: "staging-sp", label: "staging.sunnypilot.ai (Staging)" },
    { value: "dev-sp", label: "dev.sunnypilot.ai (Dev)" },
  ],
};

export const VehicleSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const v = editingConfig.vehicle;
  const m = editingConfig.metadata;
  const setV = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) =>
    updateField("vehicle", k, val);
  const setM = <K extends keyof typeof m>(k: K, val: (typeof m)[K]) =>
    updateField("metadata", k, val);

  const hw = m.hardware ?? "";
  const branchOptions = BRANCHES_BY_HW[hw] ?? BRANCHES_BY_HW[""];

  const handleHardwareChange = (val: string) => {
    const newHw = val as CommaHardware | undefined;
    setM("hardware", newHw || undefined);
    // If current branch is not valid for the new hardware, reset to first option
    const newBranches = BRANCHES_BY_HW[val] ?? BRANCHES_BY_HW[""];
    if (!newBranches.some((b) => b.value === m.branch)) {
      setM("branch", newBranches[0].value);
    }
  };

  return (
    <ConfigSection
      id="vehicle"
      icon={Car}
      title="Vehicle & Version"
      subtitle="Car make/model, sunnypilot version/branch, and driving model"
    >
      <ParamRow label="Make" description="Manufacturer of your vehicle">
        <Select
          value={v.make}
          onChange={(val) => setV("make", val as typeof v.make)}
          options={MAKES}
        />
      </ParamRow>

      <ParamRow
        label="Model"
        description="Specific model name (e.g. Ioniq 5, Camry, Model 3)"
      >
        <Input
          value={v.model}
          onChange={(e) => setV("model", e.target.value)}
          placeholder="e.g. Ioniq 5"
        />
      </ParamRow>

      <ParamRow label="Year">
        <NumberInput
          value={v.year}
          onChange={(val) => setV("year", val)}
          min={2012}
          max={2030}
          step={1}
          decimals={0}
        />
      </ParamRow>

      <ParamRow
        label="Comma AI HW"
        description="Comma AI hardware device. Determines which branches are available."
        source="sunnypilot"
        since="2022"
      >
        <Select
          value={hw}
          onChange={handleHardwareChange}
          options={HARDWARE_OPTIONS}
        />
      </ParamRow>

      <ParamRow
        label="SP Version"
        description="sunnypilot version installed on the device (e.g. 2026.001.000)"
        source="sunnypilot"
        since="2021"
      >
        <Input
          value={m.sunnypilotVersion}
          onChange={(e) => setM("sunnypilotVersion", e.target.value)}
          placeholder="e.g. 2026.001.000"
          className="font-mono"
        />
      </ParamRow>

      <ParamRow
        label="Branch"
        description="Update channel used on the device. Options depend on your hardware."
        source="sunnypilot"
        since="2021"
      >
        <Select
          value={m.branch}
          onChange={(val) => setM("branch", val as SPBranch)}
          options={branchOptions}
        />
      </ParamRow>

      <ParamRow
        label="Driving Model"
        description="ModelManager_ActiveBundle — active driving model name. Populated automatically when importing from SunnyLink. You can also type the model name/path from your device."
        source="sunnypilot"
        since="2024"
      >
        <Input
          value={m.activeModel}
          onChange={(e) => setM("activeModel", e.target.value)}
          placeholder="e.g. sunnypilot-2025"
          className="font-mono"
        />
      </ParamRow>
    </ConfigSection>
  );
};
