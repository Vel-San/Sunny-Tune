import { Wrench } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const AdvancedSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const a = editingConfig.advanced;
  const set = <K extends keyof typeof a>(k: K, val: (typeof a)[K]) =>
    updateField("advanced", k, val);

  return (
    <ConfigSection
      id="advanced"
      icon={Wrench}
      title="Advanced"
      subtitle="Device startup options"
      defaultOpen={false}
    >
      <ParamRow
        label="Quick Boot"
        source="sunnypilot"
        since="2025"
        spKey="QuickBootToggle"
        description="QuickBootToggle — skip the boot animation for faster device startup."
      >
        <Toggle checked={a.quickBoot} onChange={(v) => set("quickBoot", v)} />
      </ParamRow>
    </ConfigSection>
  );
};
