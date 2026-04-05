import { Cpu } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const CommaAISection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const ai  = editingConfig.commaAI;
  const ifc = editingConfig.interface;
  const setAi  = <K extends keyof typeof ai >(k: K, v: (typeof ai )[K]) => updateField("commaAI",  k, v);
  const setIfc = <K extends keyof typeof ifc>(k: K, v: (typeof ifc)[K]) => updateField("interface", k, v);

  return (
    <ConfigSection
      id="device"
      icon={Cpu}
      title="Device"
      subtitle="Connectivity, units, and onroad data settings"
    >
      {/* ─── Connectivity ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Connectivity
      </p>

      <ParamRow
        label="SunnyLink Connect"
        spKey="SunnylinkEnabled"
        description="SunnylinkEnabled — enable SunnyLink cloud connection for remote config import/export and drive sync."
      >
        <Toggle checked={ai.connectEnabled} onChange={(v) => setAi("connectEnabled", v)} />
      </ParamRow>

      <div className="divider" />

      {/* ─── Device Settings ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Device Settings
      </p>

      <ParamRow
        label="Use Metric Units"
        description="IsMetric — display speeds in km/h and distances in km across all UI elements."
      >
        <Toggle checked={ifc.useMetric} onChange={(v) => setIfc("useMetric", v)} />
      </ParamRow>

      <ParamRow
        label="Quiet Mode"
        spKey="QuietMode"
        description="QuietMode — suppress non-critical audio chimes. Critical safety warnings still play."
      >
        <Toggle checked={ifc.quietMode} onChange={(v) => setIfc("quietMode", v)} />
      </ParamRow>

      <ParamRow
        label="Disable Onroad Uploads"
        spKey="OnroadUploads"
        description="OnroadUploads — prevent drive footage from uploading while the vehicle is in motion."
      >
        <Toggle checked={ifc.disableOnroadUploads} onChange={(v) => setIfc("disableOnroadUploads", v)} />
      </ParamRow>
    </ConfigSection>
  );
};


// MadsSteeringMode — behaviour when the brake pedal is pressed.
