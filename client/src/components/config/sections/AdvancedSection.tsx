import { Wrench } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const AdvancedSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const a = editingConfig.advanced;
  const lon = editingConfig.longitudinal;
  const set = <K extends keyof typeof a>(k: K, val: (typeof a)[K]) =>
    updateField("advanced", k, val);
  const setLon = <K extends keyof typeof lon>(k: K, val: (typeof lon)[K]) =>
    updateField("longitudinal", k, val);

  return (
    <ConfigSection
      id="developer"
      icon={Wrench}
      title="Developer"
      subtitle="Advanced developer and device startup options"
      defaultOpen={false}
    >
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Longitudinal
      </p>

      <ParamRow
        label="Alpha Longitudinal"
        spKey="AlphaLongitudinalEnabled"
        description="AlphaLongitudinalEnabled — next-generation experimental SP longitudinal improvements. Disables AEB. Test in a safe environment first."
      >
        <Toggle
          checked={lon.alphaLongEnabled}
          onChange={(v) => setLon("alphaLongEnabled", v)}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        System
      </p>

      <ParamRow
        label="Quick Boot"
        spKey="QuickBootToggle"
        description="QuickBootToggle — skip the boot animation for faster device startup."
      >
        <Toggle checked={a.quickBoot} onChange={(v) => set("quickBoot", v)} />
      </ParamRow>
    </ConfigSection>
  );
};
