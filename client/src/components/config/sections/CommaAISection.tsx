import { Cpu } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Badge } from "../../ui/Badge";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const CommaAISection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const c = editingConfig.commaAI;
  const set = <K extends keyof typeof c>(k: K, val: (typeof c)[K]) =>
    updateField("commaAI", k, val);

  return (
    <ConfigSection
      id="comma-ai"
      icon={Cpu}
      title="Comma AI Core"
      subtitle="OpenPilot base parameters — recording, safety, and connectivity"
      badge={
        <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-sky-500/15 text-sky-400 border border-sky-500/20 select-none">
          All OpenPilot
        </span>
      }
    >
      <p className="text-xs text-zinc-600 -mt-1 mb-2">
        These parameters map directly to OpenPilot's param system and affect
        device-level behavior independent of SunnyPilot extensions.
      </p>

      <ParamRow
        label="Record Drives"
        description="RecordFront — continuously record all three cameras and log all sensor data to the device storage"
      >
        <Toggle
          checked={c.recordDrives}
          onChange={(v) => set("recordDrives", v)}
        />
      </ParamRow>

      <ParamRow
        label="Upload Only on WiFi"
        description="Queue footage for upload but only transmit when connected to WiFi. Prevents unexpected cellular data charges."
      >
        <Toggle
          checked={c.uploadOnlyOnWifi}
          onChange={(v) => set("uploadOnlyOnWifi", v)}
          disabled={!c.recordDrives}
        />
      </ParamRow>

      <ParamRow
        label="Upload on Cellular"
        description="dp_upload_on_cellular — allow drive uploads over cellular data (overrides WiFi-only if enabled)"
      >
        <Toggle
          checked={c.uploadOnCellular}
          onChange={(v) => set("uploadOnCellular", v)}
          disabled={!c.recordDrives}
        />
      </ParamRow>

      <ParamRow
        label="Disengage on Accelerator"
        description="DisengageOnAccelerator — press the accelerator pedal to immediately disengage openpilot longitudinal. Useful for manual overrides."
      >
        <Toggle
          checked={c.disengageOnAccelerator}
          onChange={(v) => set("disengageOnAccelerator", v)}
        />
      </ParamRow>

      <ParamRow
        label="Live Parameter Estimation"
        description="IsLiveParameters — continuously estimate and update steering ratio and other physical parameters from drive data. Improves accuracy over time."
      >
        <Toggle
          checked={c.enableLiveParameters}
          onChange={(v) => set("enableLiveParameters", v)}
        />
      </ParamRow>

      <ParamRow
        label={
          <span className="flex items-center gap-2">
            End-to-End Longitudinal
            <Badge variant="warning">Experimental</Badge>
          </span>
        }
        description="EndToEndLong — enable Comma's neural network end-to-end model for longitudinal control. Overrides SunnyPilot's manual longitudinal controller. Best on well-mapped US highways."
      >
        <Toggle
          checked={c.endToEndLong}
          onChange={(v) => set("endToEndLong", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lane Departure Warning"
        description="IsLdwEnabled — audible chime when openpilot detects the vehicle crossing a lane line without a turn signal"
      >
        <Toggle checked={c.ldwEnabled} onChange={(v) => set("ldwEnabled", v)} />
      </ParamRow>

      <ParamRow
        label="Wide Camera View"
        description="EnableWideCamera — display wide-angle fisheye camera feed on the openpilot UI instead of the standard road camera"
      >
        <Toggle
          checked={c.enableWideCameraView}
          onChange={(v) => set("enableWideCameraView", v)}
        />
      </ParamRow>

      <ParamRow
        label="WiFi Hotspot on Boot"
        description="dp_hotspot_on_boot — automatically enable the comma 3/3X WiFi hotspot when the device powers on"
      >
        <Toggle
          checked={c.hotspotOnBoot}
          onChange={(v) => set("hotspotOnBoot", v)}
        />
      </ParamRow>

      <ParamRow
        label="Comma Connect"
        description="Enable Comma Connect cloud integration for remote monitoring, trip history, and fleet management"
      >
        <Toggle
          checked={c.connectEnabled}
          onChange={(v) => set("connectEnabled", v)}
        />
      </ParamRow>

      <ParamRow
        label="Training Data Contribution"
        description="Allow anonymized drive data to be used for improving Comma AI's driving models. Opt-in."
      >
        <Toggle
          checked={c.trainingDataEnabled}
          onChange={(v) => set("trainingDataEnabled", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
