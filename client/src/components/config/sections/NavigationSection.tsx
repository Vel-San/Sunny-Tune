import { Map } from "lucide-react";
import React from "react";
import { useConfigStore } from "../../../store/configStore";
import { Toggle } from "../../ui/Toggle";
import { ConfigSection, ParamRow } from "../ConfigSection";

export const NavigationSection: React.FC = () => {
  const { editingConfig, updateField } = useConfigStore();
  const nav = editingConfig.navigation;
  const set = <K extends keyof typeof nav>(k: K, val: (typeof nav)[K]) =>
    updateField("navigation", k, val);

  return (
    <ConfigSection
      id="navigation"
      icon={Map}
      title="Navigation & Maps"
      subtitle="OSM map data for speed limits and road information"
    >
      <ParamRow
        label="OSM Integration"
        source="sunnypilot"
        since="2024"
        spKey="OsmLocal"
        description="OsmLocal — download and use OpenStreetMap data for speed limits, road classifications, and curve speed control."
      >
        <Toggle
          checked={nav.osmEnabled}
          onChange={(v) => set("osmEnabled", v)}
        />
      </ParamRow>
    </ConfigSection>
  );
};
