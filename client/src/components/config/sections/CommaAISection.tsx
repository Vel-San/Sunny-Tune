import { Cpu } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow, SourceLegend } from "../ConfigSection";

const MADS_STEERING_OPTS = [
  { value: "0", label: "0 — Blended (ACC + steering)" },
  { value: "1", label: "1 — No blending (steering only)" },
  { value: "2", label: "2 — Always active" },
];

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
      subtitle="Recording, safety, connectivity, and MADS"
    >
      <SourceLegend />

      {/* ─── Recording ─── */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Recording & Uploads
      </p>

      <ParamRow
        label="Record Drives"
        source="openpilot"
        since="2021"
        spKey="RecordFront"
        description="RecordFront — continuously record all cameras to onboard storage."
      >
        <Toggle
          checked={c.recordDrives}
          onChange={(v) => set("recordDrives", v)}
        />
      </ParamRow>

      <ParamRow
        label="Upload Only on Wi-Fi"
        source="openpilot"
        since="2021"
        spKey="GsmMetered"
        description="GsmMetered — restrict uploads to Wi-Fi only. Prevents unexpected cellular data charges."
      >
        <Toggle
          checked={c.uploadOnlyOnWifi}
          onChange={(v) => set("uploadOnlyOnWifi", v)}
          disabled={!c.recordDrives}
        />
      </ParamRow>

      <ParamRow
        label="Record Audio Feedback"
        source="sunnypilot"
        since="2023"
        spKey="RecordAudioFeedback"
        description="RecordAudioFeedback — record cabin audio alongside onroad drive footage."
      >
        <Toggle
          checked={c.recordAudioFeedback}
          onChange={(v) => set("recordAudioFeedback", v)}
          disabled={!c.recordDrives}
        />
      </ParamRow>

      <div className="divider" />
      {/* ─── Safety ─── */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Safety
      </p>

      <ParamRow
        label="Disengage on Accelerator"
        source="openpilot"
        since="2021"
        spKey="DisengageOnAccelerator"
        description="DisengageOnAccelerator — press the accelerator to immediately disengage openpilot longitudinal."
      >
        <Toggle
          checked={c.disengageOnAccelerator}
          onChange={(v) => set("disengageOnAccelerator", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lane Departure Warning"
        source="openpilot"
        since="2021"
        spKey="IsLdwEnabled"
        description="IsLdwEnabled — audible chime when openpilot detects the vehicle crossing a lane line without a turn signal."
      >
        <Toggle checked={c.ldwEnabled} onChange={(v) => set("ldwEnabled", v)} />
      </ParamRow>

      <div className="divider" />
      {/* ─── Connectivity ─── */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Connectivity
      </p>

      <ParamRow
        label="SunnyLink Connect"
        source="sunnypilot"
        since="2024"
        spKey="SunnylinkEnabled"
        description="SunnylinkEnabled — enable SunnyLink cloud connection for remote config import/export and drive sync."
      >
        <Toggle
          checked={c.connectEnabled}
          onChange={(v) => set("connectEnabled", v)}
        />
      </ParamRow>

      <div className="divider" />
      {/* ─── MADS ─── */}
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        MADS — Modified Assistive Driving
      </p>
      <p className="text-xs text-zinc-600 -mt-2">
        Allows lateral (steering) control independently of ACC speed control.
      </p>

      <ParamRow
        label="Enable MADS"
        source="sunnypilot"
        since="2023"
        spKey="Mads"
        description="Mads — allow steering assist to operate without ACC engaged."
      >
        <Toggle checked={c.mads} onChange={(v) => set("mads", v)} />
      </ParamRow>

      <ParamRow
        label="Main Cruise Toggle"
        source="sunnypilot"
        since="2023"
        spKey="MadsMainCruiseAllowed"
        description="MadsMainCruiseAllowed — allow the main cruise button to engage/disengage MADS lateral control."
      >
        <Toggle
          checked={c.madsMainCruise}
          onChange={(v) => set("madsMainCruise", v)}
          disabled={!c.mads}
        />
      </ParamRow>

      <ParamRow
        label="Steering Mode"
        source="sunnypilot"
        since="2023"
        spKey="MadsSteeringMode"
        description="MadsSteeringMode — controls how MADS steering blends with ACC."
      >
        <Select
          value={String(c.madsSteeringMode)}
          onChange={(v) => set("madsSteeringMode", parseInt(v) as 0 | 1 | 2)}
          options={MADS_STEERING_OPTS}
          disabled={!c.mads}
        />
      </ParamRow>

      <ParamRow
        label="Unified Engagement"
        source="sunnypilot"
        since="2023"
        spKey="MadsUnifiedEngagementMode"
        description="MadsUnifiedEngagementMode — engage both MADS lateral and ACC longitudinal together with a single button press."
      >
        <Toggle
          checked={c.madsUnifiedEngagement}
          onChange={(v) => set("madsUnifiedEngagement", v)}
          disabled={!c.mads}
        />
      </ParamRow>
    </ConfigSection>
  );
};
