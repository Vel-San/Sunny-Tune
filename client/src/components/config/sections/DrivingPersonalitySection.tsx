import { Gauge } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { RadioGroup } from "../../ui/RadioGroup";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const LONG_PERSONALITY_OPTS = [
  {
    value: "relaxed",
    label: "Relaxed",
    description: "Smooth acceleration, larger follow gap — ideal for comfort",
  },
  {
    value: "standard",
    label: "Standard",
    description: "Balanced behaviour matching most driving conditions",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    description: "Quicker acceleration, tighter follow gap — sport feel",
  },
];

export const DrivingPersonalitySection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const d = editingConfig.drivingPersonality;
  const ai = editingConfig.commaAI;
  const lon = editingConfig.longitudinal;
  const ifc = editingConfig.interface;
  const setD = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) =>
    updateField("drivingPersonality", k, v);
  const setAi = <K extends keyof typeof ai>(k: K, v: (typeof ai)[K]) =>
    updateField("commaAI", k, v);
  const setLon = <K extends keyof typeof lon>(k: K, v: (typeof lon)[K]) =>
    updateField("longitudinal", k, v);
  const setIfc = <K extends keyof typeof ifc>(k: K, v: (typeof ifc)[K]) =>
    updateField("interface", k, v);

  return (
    <ConfigSection
      id="toggles"
      icon={Gauge}
      title="Toggles"
      subtitle="Core driving behaviour, safety, and recording toggles"
    >
      {/* ─── Driving Personality ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Driving Personality
      </p>

      <ParamRow
        label="Longitudinal Personality"
        spKey="DrivingPersonality"
        description="LongitudinalPersonality — coarse-level tuning that controls follow distance and acceleration feel."
        wide
      >
        <RadioGroup
          name="long-personality"
          value={d.longitudinalPersonality}
          onChange={(v) =>
            setD(
              "longitudinalPersonality",
              v as typeof d.longitudinalPersonality,
            )
          }
          options={LONG_PERSONALITY_OPTS}
          layout="vertical"
        />
      </ParamRow>

      <div className="divider" />

      {/* ─── Experimental Mode ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Experimental Mode
      </p>

      <ParamRow
        label="End-to-End Longitudinal"
        spKey="ExperimentalMode"
        description="ExperimentalMode — use Comma AI’s neural-network E2E model for longitudinal control. Best on well-mapped US highways. Overrides manual tuning."
      >
        <Toggle
          checked={lon.e2eEnabled}
          onChange={(v) => setLon("e2eEnabled", v)}
        />
      </ParamRow>

      <div className="divider" />

      {/* ─── Safety ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Safety
      </p>

      <ParamRow
        label="Always-On Driver Monitoring"
        spKey="AlwaysOnDM"
        description="AlwaysOnDM — keep driver monitoring active even when ACC is disengaged."
      >
        <Toggle
          checked={ifc.alwaysOnDM}
          onChange={(v) => setIfc("alwaysOnDM", v)}
        />
      </ParamRow>

      <ParamRow
        label="Disengage on Accelerator"
        spKey="DisengageOnAccelerator"
        description="DisengageOnAccelerator — press the accelerator to immediately disengage openpilot longitudinal."
      >
        <Toggle
          checked={ai.disengageOnAccelerator}
          onChange={(v) => setAi("disengageOnAccelerator", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lane Departure Warning"
        spKey="IsLdwEnabled"
        description="IsLdwEnabled — audible chime when openpilot detects the vehicle crossing a lane line without a turn signal."
      >
        <Toggle
          checked={ai.ldwEnabled}
          onChange={(v) => setAi("ldwEnabled", v)}
        />
      </ParamRow>

      <div className="divider" />

      {/* ─── Recording & Uploads ─── */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">
        Recording &amp; Uploads
      </p>

      <ParamRow
        label="Record Drives"
        spKey="RecordFront"
        description="RecordFront — continuously record all cameras to onboard storage."
      >
        <Toggle
          checked={ai.recordDrives}
          onChange={(v) => setAi("recordDrives", v)}
        />
      </ParamRow>

      <ParamRow
        label="Upload Only on Wi-Fi"
        spKey="GsmMetered"
        description="GsmMetered — restrict uploads to Wi-Fi only. Prevents unexpected cellular data charges."
      >
        <Toggle
          checked={ai.uploadOnlyOnWifi}
          onChange={(v) => setAi("uploadOnlyOnWifi", v)}
          disabled={!ai.recordDrives}
        />
      </ParamRow>

      <ParamRow
        label="Record Audio Feedback"
        spKey="RecordAudioFeedback"
        description="RecordAudioFeedback — record cabin audio alongside onroad drive footage."
      >
        <Toggle
          checked={ai.recordAudioFeedback}
          onChange={(v) => setAi("recordAudioFeedback", v)}
          disabled={!ai.recordDrives}
        />
      </ParamRow>
    </ConfigSection>
  );
};
