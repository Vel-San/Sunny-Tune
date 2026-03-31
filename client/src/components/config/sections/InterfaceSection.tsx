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
      subtitle="On-device UI overlays, screen power management, and HUD elements"
    >
      <ParamRow
        label="Developer UI"
        description="dp_ui_dev — show extended data overlay with speed, acceleration, lead car info, lat/long error"
      >
        <Toggle checked={ui.devUI} onChange={(v) => set("devUI", v)} />
      </ParamRow>

      <ParamRow
        label="Mini Developer UI"
        description="dp_ui_dev_mini — smaller compact developer overlay. Toggles alongside Developer UI."
      >
        <Toggle
          checked={ui.devUIMini}
          onChange={(v) => set("devUIMini", v)}
          disabled={!ui.devUI}
        />
      </ParamRow>

      <ParamRow
        label="Standstill Timer"
        description="dp_ui_standstill_timer — display duration of current complete stop on the HUD"
      >
        <Toggle
          checked={ui.standstillTimer}
          onChange={(v) => set("standstillTimer", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show SLC Offset"
        description="Display the active speed limit control offset value on the HUD (e.g. +5 mph)"
      >
        <Toggle
          checked={ui.showSLCOffset}
          onChange={(v) => set("showSLCOffset", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show VTSC State"
        description="Display vision turn control active status indicator on HUD"
      >
        <Toggle
          checked={ui.showVTSCState}
          onChange={(v) => set("showVTSCState", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show MTSC State"
        description="Display map turn control active status indicator on HUD"
      >
        <Toggle
          checked={ui.showMTSCState}
          onChange={(v) => set("showMTSCState", v)}
        />
      </ParamRow>

      <ParamRow
        label="Distance Following Alert"
        description="dp_ui_df_alert — audible alert when following distance drops below safe threshold"
      >
        <Toggle checked={ui.dfAlert} onChange={(v) => set("dfAlert", v)} />
      </ParamRow>

      <ParamRow
        label="Max Acceleration Alert"
        description="dp_ui_max_acc_alert — visual/audible alert when reaching configured acceleration limit"
      >
        <Toggle
          checked={ui.maxAccAlert}
          onChange={(v) => set("maxAccAlert", v)}
        />
      </ParamRow>

      <ParamRow
        label="Show Braking State"
        description="Display active/inactive indicator on HUD when openpilot applies brakes"
      >
        <Toggle
          checked={ui.showBrakingState}
          onChange={(v) => set("showBrakingState", v)}
        />
      </ParamRow>

      <ParamRow
        label="Sidebar Visible"
        description="dp_ui_sidebar — show the left sidebar (battery, signal, etc.) in openpilot UI"
      >
        <Toggle checked={ui.sidebar} onChange={(v) => set("sidebar", v)} />
      </ParamRow>

      <ParamRow
        label="Map on Left"
        description="Place the map panel on the left side of the openpilot UI instead of right"
      >
        <Toggle checked={ui.mapOnLeft} onChange={(v) => set("mapOnLeft", v)} />
      </ParamRow>

      <div className="divider" />
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Screen Power
      </p>

      <ParamRow
        label="Screen Brightness"
        description="dp_ui_screen_off_br — brightness level 0–100%"
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
        description="dp_ui_screen_off_timer — turn off screen after idle period while driving"
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
        description="Display speeds in km/h and distances in km across all UI elements"
      >
        <Toggle checked={ui.useMetric} onChange={(v) => set("useMetric", v)} />
      </ParamRow>

      <ParamRow
        label="Disable Onroad Uploads"
        description="Prevent drive footage from uploading while the vehicle is in motion. Uploads resume after parking."
      >
        <Toggle
          checked={ui.disableOnroadUploads}
          onChange={(v) => set("disableOnroadUploads", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
