import { Car } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import type { SPBranch } from "../../../types/config";
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

const BRANCHES: { value: SPBranch; label: string }[] = [
  { value: "stable-sp", label: "stable-sp (Stable)" },
  { value: "dev-sp", label: "dev-sp (Development)" },
  { value: "staging-sp", label: "staging-sp (Staging)" },
  { value: "nightly", label: "nightly (Nightly)" },
];

export const VehicleSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const v = editingConfig.vehicle;
  const m = editingConfig.metadata;
  const setV = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) =>
    updateField("vehicle", k, val);
  const setM = <K extends keyof typeof m>(k: K, val: (typeof m)[K]) =>
    updateField("metadata", k, val);

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
        description="Update channel / git branch used on the device"
        source="sunnypilot"
        since="2021"
      >
        <Select
          value={m.branch}
          onChange={(val) => setM("branch", val as SPBranch)}
          options={BRANCHES}
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
