import { Wrench } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const MAX_OFFROAD_OPTS = [
  { value: "0", label: "No limit" },
  { value: "1800", label: "30 minutes" },
  { value: "3600", label: "1 hour" },
  { value: "7200", label: "2 hours" },
  { value: "18000", label: "5 hours" },
  { value: "36000", label: "10 hours" },
];

const WAKEUP_OPTS = [
  { value: "0", label: "Off (manual only)" },
  { value: "1", label: "On USB cable connection" },
  { value: "2", label: "Always on" },
];

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

      <ParamRow
        label="Max Time Offroad"
        spKey="MaxTimeOffroad"
        description="MaxTimeOffroad — how long the device stays powered before auto shutdown when the car is parked. 0 = no limit."
      >
        <Select
          value={String(a.maxTimeOffroad)}
          onChange={(v) => set("maxTimeOffroad", parseInt(v))}
          options={MAX_OFFROAD_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Disable Power Down"
        spKey="DisablePowerDown"
        description="DisablePowerDown — prevent the device from powering off when the car is parked. Useful for always-on dashcam setups."
      >
        <Toggle
          checked={a.disablePowerDown}
          onChange={(v) => set("disablePowerDown", v)}
        />
      </ParamRow>

      <ParamRow
        label="Wake Up Behavior"
        spKey="WakeupBehavior"
        description="WakeupBehavior — when the device wakes from sleep automatically."
      >
        <Select
          value={String(a.wakeupBehavior)}
          onChange={(v) => set("wakeupBehavior", parseInt(v))}
          options={WAKEUP_OPTS}
        />
      </ParamRow>

      <ParamRow
        label="Disable Updates"
        spKey="DisableUpdates"
        description="DisableUpdates — lock the installed version and prevent automatic OTA updates. Useful when staying pinned to a specific build."
      >
        <Toggle
          checked={a.disableUpdates}
          onChange={(v) => set("disableUpdates", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
