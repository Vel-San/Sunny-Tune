import { Car } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Input } from "../../ui/Input";
import { NumberInput } from "../../ui/NumberInput";
import { Select } from "../../ui/Select";
import { Toggle } from "../../ui/Toggle";
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

const FINGERPRINT_METHODS = [
  { value: "firmware", label: "Firmware Query (recommended)" },
  { value: "vin", label: "VIN" },
  { value: "smart", label: "Smart DSP Firmware" },
];

export const VehicleSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const v = editingConfig.vehicle;
  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) =>
    updateField("vehicle", k, val);

  return (
    <ConfigSection
      id="vehicle"
      icon={Car}
      title="Vehicle"
      subtitle="Car make, model, and device detection method"
    >
      <ParamRow label="Make" description="Manufacturer of your vehicle">
        <Select
          value={v.make}
          onChange={(val) => set("make", val as typeof v.make)}
          options={MAKES}
        />
      </ParamRow>

      <ParamRow
        label="Model"
        description="Specific model name (e.g. Camry, Ioniq 5, Model 3)"
      >
        <Input
          value={v.model}
          onChange={(e) => set("model", e.target.value)}
          placeholder="e.g. Ioniq 5"
        />
      </ParamRow>

      <ParamRow label="Year">
        <NumberInput
          value={v.year}
          onChange={(val) => set("year", val)}
          min={2012}
          max={2030}
          step={1}
          decimals={0}
        />
      </ParamRow>

      <ParamRow
        label="Fingerprint Method"
        description="How openpilot identifies your vehicle. Firmware query is most reliable."
      >
        <Select
          value={v.fingerprintSource}
          onChange={(val) =>
            set("fingerprintSource", val as typeof v.fingerprintSource)
          }
          options={FINGERPRINT_METHODS}
        />
      </ParamRow>

      <ParamRow
        label="Fingerprint Override"
        description="Force a specific fingerprint ID string. Leave blank for automatic detection. Use with caution."
      >
        <Input
          value={v.fingerprintOverride}
          onChange={(e) => set("fingerprintOverride", e.target.value)}
          placeholder="Leave blank for auto"
          className="font-mono text-xs"
        />
      </ParamRow>

      <ParamRow
        label="Startup Cinematic"
        description="Show animated boot sequence on device startup"
      >
        <Toggle
          checked={v.enableCinematic}
          onChange={(val) => set("enableCinematic", val)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
