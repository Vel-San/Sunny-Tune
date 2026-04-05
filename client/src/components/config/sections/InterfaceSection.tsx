import { Monitor } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Select } from "../../ui/Select";
import { Slider } from "../../ui/Slider";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

const SCREEN_OFF_OPTS = [
  { value: "0", label: "Never" },
  { value: "15", label: "15 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "60", label: "1 minute" },
  { value: "120", label: "2 minutes" },
  { value: "300", label: "5 minutes" },
];

export const InterfaceSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const ui = editingConfig.interface;
  const set = <K extends keyof typeof ui>(k: K, val: (typeof ui)[K]) =>
    updateField("interface", k, val);

  return (
    <ConfigSection
      id="interface"
      icon={Monitor}
      title="Interface & Display"
      subtitle="On-device UI overlays and screen power management"
    >
      {/* ─── HUD overlays ─── */}
      <ParamRow
        label="Developer UI"
        source="sunnypilot"
        since="2022"
        spKey="DevUIInfo"
        description="DevUIInfo — show extended data overlay: speed, acceleration, lead car distance, and lat/long error."
      >
        <Toggle checked={ui.devUI} onChange={(v) => set("devUI", v)} />
      </ParamRow>

      <ParamRow
        label="Standstill Timer"
        source="sunnypilot"
        since="2023"
        spKey="StandstillTimer"
        description="StandstillTimer — display the duration of the current complete stop on the HUD."
      >
        <Toggle
          checked={ui.standstillTimer}
          onChange={(v) => set("standstillTimer", v)}
        />
      </ParamRow>

      <ParamRow
        label="Green Light Alert"
        source="sunnypilot"
        since="2023"
        spKey="GreenLightAlert"
        description="GreenLightAlert — chime and HUD notification when a traffic light ahead turns green."
      >
        <Toggle
          checked={ui.greenLightAlert}
          onChange={(v) => set("greenLightAlert", v)}
        />
      </ParamRow>

      <ParamRow
        label="Lead Depart Alert"
        source="sunnypilot"
        since="2023"
        spKey="LeadDepartAlert"
        description="LeadDepartAlert — alert when the lead vehicle begins moving away while you are stationary."
      >
        <Toggle
          checked={ui.leadDepartAlert}
          onChange={(v) => set("leadDepartAlert", v)}
        />
      </ParamRow>

      <ParamRow
        label="Always-On Driver Monitoring"
        source="sunnypilot"
        since="2023"
        spKey="AlwaysOnDM"
        description="AlwaysOnDM — keep driver monitoring active even when ACC is disengaged."
      >
        <Toggle
          checked={ui.alwaysOnDM}
          onChange={(v) => set("alwaysOnDM", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show Turn Signals"
        source="sunnypilot"
        since="2023"
        spKey="ShowTurnSignals"
        description="ShowTurnSignals — display animated turn signal arrows on the onroad HUD."
      >
        <Toggle
          checked={ui.showTurnSignals}
          onChange={(v) => set("showTurnSignals", v)}
        />
      </ParamRow>

      <ParamRow
        label="Road Name Display"
        source="sunnypilot"
        since="2023"
        spKey="RoadNameToggle"
        description="RoadNameToggle — show the current road name on the HUD using OSM data."
      >
        <Toggle
          checked={ui.roadNameDisplay}
          onChange={(v) => set("roadNameDisplay", v)}
        />
      </ParamRow>

      <ParamRow
        label="Quiet Mode"
        source="sunnypilot"
        since="2024"
        spKey="QuietMode"
        description="QuietMode — suppress non-critical audio chimes. Critical safety warnings still play."
      >
        <Toggle checked={ui.quietMode} onChange={(v) => set("quietMode", v)} />
      </ParamRow>

      <ParamRow
        label="Hide Speed on HUD"
        source="sunnypilot"
        since="2024"
        spKey="HideVEgoUI"
        description="HideVEgoUI — remove the vehicle speed (vEgo) readout from the onroad HUD."
      >
        <Toggle
          checked={ui.hideVegoUI}
          onChange={(v) => set("hideVegoUI", v)}
        />
      </ParamRow>

      <ParamRow
        label="Torque Bar"
        source="sunnypilot"
        since="2024"
        spKey="TorqueBar"
        description="TorqueBar — display a visual bar showing the current lateral torque output on the HUD."
      >
        <Toggle checked={ui.torqueBar} onChange={(v) => set("torqueBar", v)} />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Screen Power
      </p>

      <ParamRow
        label="Screen Brightness"
        source="openpilot"
        since="2021"
        description="Brightness — onroad screen brightness 0–100%."
      >
        <Slider
          value={ui.screenBrightness}
          onChange={(v) => set("screenBrightness", v)}
          min={0}
          max={100}
          step={5}
          decimals={0}
          unit="%"
        />
      </ParamRow>

      <ParamRow
        label="Screen Off Timer"
        source="openpilot"
        since="2021"
        description="OnroadScreenOffTimer — dim the screen after an idle period while driving."
      >
        <Select
          value={String(ui.screenOffTimer)}
          onChange={(v) => set("screenOffTimer", parseInt(v))}
          options={SCREEN_OFF_OPTS}
        />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Data & Units
      </p>

      <ParamRow
        label="Use Metric Units"
        source="openpilot"
        since="2021"
        description="IsMetric — display speeds in km/h and distances in km across all UI elements."
      >
        <Toggle checked={ui.useMetric} onChange={(v) => set("useMetric", v)} />
      </ParamRow>

      <ParamRow
        label="Disable Onroad Uploads"
        source="sunnypilot"
        since="2023"
        spKey="OnroadUploads"
        description="OnroadUploads — prevent drive footage from uploading while the vehicle is in motion."
      >
        <Toggle
          checked={ui.disableOnroadUploads}
          onChange={(v) => set("disableOnroadUploads", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
