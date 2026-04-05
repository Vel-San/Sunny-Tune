import { Gauge } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { RadioGroup } from "../../ui/RadioGroup";
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
  const set = <K extends keyof typeof d>(k: K, val: (typeof d)[K]) =>
    updateField("drivingPersonality", k, val);

  return (
    <ConfigSection
      id="driving-personality"
      icon={Gauge}
      title="Driving Personality"
      subtitle="Longitudinal follow distance and acceleration behaviour"
    >
      <ParamRow
        label="Longitudinal Personality"
        spKey="DrivingPersonality"
        description="LongitudinalPersonality — Comma AI's coarse-level tuning layer that controls follow distance and acceleration feel."
        source="openpilot"
        since="2022"
        wide
      >
        <RadioGroup
          name="long-personality"
          value={d.longitudinalPersonality}
          onChange={(v) =>
            set(
              "longitudinalPersonality",
              v as typeof d.longitudinalPersonality,
            )
          }
          options={LONG_PERSONALITY_OPTS}
          layout="vertical"
        />
      </ParamRow>
    </ConfigSection>
  );
};
