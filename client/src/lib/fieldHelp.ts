/**
 * Rich per-field help data sourced from the official sunnypilot user-docs
 * (https://github.com/sunnypilot/user-docs → https://docs.sunnypilot.ai).
 *
 * Keyed by the exact openpilot/sunnypilot parameter name (`spKey`).
 * Consumed by the HelpTooltip component in the configurator.
 */

export interface FieldHelp {
  /** One-sentence summary (may override the registry description). */
  summary?: string;
  /** Practical tips for the user. */
  tips?: string[];
  /** Known pitfalls, tradeoffs or warnings. */
  tradeoffs?: string[];
  /** Link to the official sunnypilot docs entry (https://docs.sunnypilot.ai/...). */
  docsUrl?: string;
  /** Recommended setting according to the wiki / community consensus. */
  recommended?: string;
  /** Default value description. */
  defaultNote?: string;
}

export const FIELD_HELP: Record<string, FieldHelp> = {
  // ── Lateral ──────────────────────────────────────────────────────────────

  CameraOffset: {
    summary:
      "Virtually shifts the camera's perspective to move the model's lane centre left or right.",
    tips: [
      "Default 0.00. Adjust if the car consistently drives too far left or right in the lane.",
      "Positive values shift the car toward the left side of the lane; negative toward the right.",
      "Make small tweaks (0.01–0.02 m) and observe over several drives before changing more.",
    ],
    tradeoffs: [
      "Too much offset can cause lane departure warnings.",
      "Incorrect values make the model's path planning inaccurate at all times.",
    ],
    defaultNote: "0.00 m",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  LiveTorqueParamsToggle: {
    summary:
      "Continuously updates the torque controller's friction and lat-accel values from real drive data.",
    tips: [
      "Keep ON — improves accuracy after a few drives to calibrate.",
      "If steering feels unstable after an update, disable temporarily and re-enable after a reset.",
    ],
    tradeoffs: [
      "Values drift during unusual conditions (wet roads, strong crosswinds).",
      "First few drives after enabling may feel slightly off while the model calibrates.",
    ],
    defaultNote: "ON",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  LiveTorqueParamsRelaxedToggle: {
    summary:
      "Uses a slower, more conservative learning rate for live torque updates.",
    tips: [
      "Enables smoother adaptation — less likely to overcorrect on noisy or winding roads.",
      "Best for daily commuters on mixed roads.",
    ],
    tradeoffs: [
      "Slower adaptation means it takes longer to calibrate after a vehicle suspension change.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  TorqueControlTune: {
    summary: "Selects the torque lateral controller tuning preset.",
    tips: [
      "'SP' (1) is recommended for most vehicles and provides a good balance of responsiveness and stability.",
      "'SP+' (2) is more aggressive — good for vehicles that feel sluggish with Stock/SP tuning.",
      "Try 'Comma stock' (0) if you experience strange behavior after an SP update.",
    ],
    tradeoffs: [
      "SP+ may cause oscillation on vehicles that don't need aggressive torque.",
      "Default value depends on the sunnypilot version installed.",
    ],
    defaultNote: "1 (SP)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  LagdToggle: {
    summary:
      "Live Actuator Group Delay — SP estimates the actual hardware steering delay from drive data.",
    tips: [
      "Keep ON for better prediction of how long it takes for steering input to take effect.",
      "Particularly helpful on older vehicles with slower power-steering actuators.",
    ],
    tradeoffs: [
      "If steering oscillates, try disabling LAGD and setting a fixed delay instead.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  LagdToggleDelay: {
    summary:
      "Sets the fixed software delay when Live Learning Steer Delay is used.",
    tips: [
      "Default is 0.20 s. Only modify if LAGD is disabled or producing unstable results.",
      "Adjust in small increments (0.05 s) and observe over multiple drives.",
    ],
    tradeoffs: [
      "Wrong values cause late steering corrections that feel 'drunk'.",
    ],
    defaultNote: "0.20 s",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  NeuralNetworkLateralControl: {
    summary:
      "Replaces the PID/torque controller with an on-device neural network for steering.",
    tips: [
      "Best used with legacy models (e.g. older North Dakota branches). Not recommended for modern models.",
      "Try this only if you experience persistent ping-ponging with the torque controller.",
    ],
    tradeoffs: [
      "Violent oscillation and wobbling on most modern models.",
      "Not recommended with current WMI / Tomb Raider model series.",
      "May be deprecated in a future sunnypilot release.",
    ],
    defaultNote: "OFF",
    recommended: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  EnforceTorqueControl: {
    summary:
      "Forces SP's torque-based lateral controller even when the car's native steering would normally take over.",
    tips: [
      "Usually kept OFF if using NNLC (Neural Network Lateral Control).",
      "May be needed on vehicles where stock lateral interferes with SP tuning.",
    ],
    tradeoffs: [
      "Can conflict with NNLC if both are enabled — only use one at a time.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  TorqueParamsOverrideEnabled: {
    summary:
      "Unlocks manual sliders for torque friction and lat-accel override values.",
    tips: [
      "Only for advanced users who understand vehicle dynamics.",
      "Start with small changes (±0.01) and drive carefully.",
    ],
    tradeoffs: [
      "Wrong values can make steering dangerous — incorrect friction causes oscillation.",
      "Requires deep understanding of your vehicle's steering characteristics.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  ManualTuneFriction: {
    summary: "Adjusts steering friction compensation in the torque controller.",
    tips: [
      "Default 0.10. Adjust in tiny increments (0.01).",
      "If steering feels too loose or snappy, try increasing slightly.",
    ],
    tradeoffs: [
      "Too high → oscillation / ping-ponging on straight roads.",
      "Too low → insufficient torque to hold the lane.",
    ],
    defaultNote: "0.10",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Longitudinal ──────────────────────────────────────────────────────────

  ExperimentalMode: {
    summary:
      "Activates end-to-end neural-net longitudinal control for city streets, traffic lights, and stop signs.",
    tips: [
      "Best for city driving with frequent lights and stop signs.",
      "Combine with Dynamic Experimental Control for automatic highway/city switching.",
    ],
    tradeoffs: [
      "Can brake suddenly for false positives (shadows, road markings).",
      "May not stop in time for all lights/signs — always be ready to brake.",
      "Requires sunnypilot longitudinal control — not available on stock ACC vehicles.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  DynamicExperimentalControl: {
    summary:
      "Automatically switches between Chill (highway) and Experimental (city) mode based on driving context.",
    tips: [
      "Great for mixed commutes — highway + city streets.",
      "Recommended ON if you use Experimental Mode.",
    ],
    tradeoffs: [
      "Can cause phantom braking if it falsely detects a red light or stop sign.",
      "May switch modes unpredictably at complex intersections.",
      "Makes evaluating specific model behaviour harder due to mode switching.",
    ],
    defaultNote: "OFF",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  AlphaLongitudinalEnabled: {
    summary:
      "Next-gen alpha longitudinal improvements — replaces stock ACC with sunnypilot's braking and acceleration.",
    tips: [
      "Only for vehicles without native sunnypilot longitudinal support.",
      "Test carefully in a safe environment before relying on it in traffic.",
    ],
    tradeoffs: [
      "⚠️ Disables AEB (Automatic Emergency Braking).",
      "Alpha quality — may behave unexpectedly in edge cases.",
      "Hidden on official release branches — only for dev/staging.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  HyundaiLongitudinalTuning: {
    summary:
      "Custom acceleration and braking tuning for Hyundai/Kia/Genesis vehicles.",
    tips: [
      "'Dynamic' fixes sluggish throttle response in Eco/Normal drive modes.",
      "'Predictive' is smoother and more comfort-focused.",
      "Only relevant on Hyundai, Kia, and Genesis vehicles.",
    ],
    tradeoffs: [
      "Dynamic can feel too aggressive for some users or in certain traffic conditions.",
      "May affect fuel efficiency.",
      "No effect on non-Hyundai/Kia/Genesis vehicles.",
    ],
    defaultNote: "Off (0)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  PlanplusControl: {
    summary:
      "Enables the Planplus planner for smoother, more predictive acceleration and braking.",
    tips: [
      "The slider value (0–2) controls aggressiveness. Default 1.0 is a good balance.",
      "Increase if the car drifts too much from target speed; decrease if it ping-pongs.",
    ],
    tradeoffs: [
      "Higher values = more aggressive recentering but potential hunts around setpoint.",
      "Experimental — test carefully before using in heavy traffic.",
    ],
    defaultNote: "OFF (0)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  CustomAccIncrementsEnabled: {
    summary:
      "Replaces stock cruise speed increment steps with custom short/long press values.",
    tips: [
      "Typical: short press = ±1 km/h for fine tuning, long press = ±5 km/h for rapid changes.",
      "Disable if you prefer the factory increment steps.",
    ],
    tradeoffs: ["Wrong values may make speed setting frustrating in traffic."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  CustomAccShortPressIncrement: {
    summary: "Speed change on a brief tap of the cruise ＋/－ button.",
    tips: ["Set to 1 km/h for fine-grained speed control."],
    tradeoffs: [
      "Too small a value requires many button presses to make large speed changes.",
    ],
    defaultNote: "1 km/h",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  CustomAccLongPressIncrement: {
    summary: "Speed change when the cruise ＋/－ button is held.",
    tips: ["Set to 5–10 km/h for fast speed adjustments on highways."],
    defaultNote: "5 km/h",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Driving Personality ──────────────────────────────────────────────────

  DrivingPersonality: {
    summary:
      "Controls follow distance and acceleration/braking aggressiveness.",
    tips: [
      "'Standard' is the default and safest option for most conditions.",
      "'Relaxed' gives more following distance — good for nervous drivers.",
      "'Aggressive' closes gaps faster — better for keeping up with traffic flow.",
    ],
    tradeoffs: [
      "Aggressive mode may feel unsafe in dense stop-and-go traffic.",
      "Relaxed mode may frustrate drivers behind you with large gaps.",
    ],
    defaultNote: "Standard",
    recommended: "Standard",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Lane Change ──────────────────────────────────────────────────────────

  AutoLaneChangeTimer: {
    summary:
      "Controls how lane changes are initiated when you activate the turn signal.",
    tips: [
      "'Nudge' is the default and safest — requires a light steering input to confirm.",
      "'Nudgeless' starts immediately on signal — faster but no human confirmation.",
      "Timed options (0.5–3 s) provide a delay before the lane change begins.",
    ],
    tradeoffs: [
      "Nudgeless/Timed: Faster but less human-in-the-loop confirmation.",
      "Nudge: Requires slight wheel input — good balance of safety and convenience.",
    ],
    defaultNote: "Nudge (0)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  BlindSpot: {
    summary:
      "Integrates the car's BSM radar to block lane changes when a vehicle is detected in the blind spot.",
    tips: [
      "Keep ON if your car has factory BSM hardware.",
      "The system waits for the blind spot to clear before executing the lane change.",
    ],
    tradeoffs: [
      "Only works on vehicles equipped with factory Blind Spot Monitoring hardware.",
      "Not effective if BSM sensors are blocked by dirt or covered.",
    ],
    defaultNote: "OFF",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  BlinkerMinLateralControlSpeed: {
    summary:
      "Minimum speed at which SP will continue steering while the blinker is on.",
    tips: [
      "Set to 0 to always allow steering even when blinker is active at low speeds.",
      "Prevents the steering assist from fighting you at slow intersection turns.",
    ],
    tradeoffs: [
      "Too high a value blocks steering at speeds where it's still useful.",
    ],
    defaultNote: "0 mph (steering always allowed with blinker)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  BlinkerPauseLateralControl: {
    summary:
      "Pauses steering assistance immediately when the blinker is activated.",
    tips: [
      "Preferred by drivers who want full manual control during lane changes.",
      "Good if SP's lane-keeping fights you when you're manually changing lanes.",
    ],
    tradeoffs: [
      "Steering releases immediately — can feel abrupt.",
      "No lane keeping during intentional lane changes.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  BlinkerLateralReengageDelay: {
    summary:
      "Seconds to wait after blinker turns off before lateral control re-engages.",
    tips: [
      "Set to 0.5–1 s to give yourself time to settle in the new lane before SP takes over.",
      "0 = re-engage immediately after blinker cancels.",
    ],
    tradeoffs: [
      "Too long a delay means you're steering manually for longer after a lane change.",
    ],
    defaultNote: "0 s",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Speed Control ────────────────────────────────────────────────────────

  IntelligentCruiseButtonManagement: {
    summary:
      "Alpha feature that intelligently manages the cruise control button behaviour for better sunnypilot integration.",
    tradeoffs: [
      "Alpha quality — test carefully before relying on it.",
      "Mutually exclusive with Alpha Longitudinal.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SmartCruiseControlVision: {
    summary:
      "Uses camera vision to detect road curvature and slow down for curves.",
    tips: [
      "Keep ON — usually faster and more reactive than map-based control.",
      "Best for winding back roads and highway curves.",
    ],
    tradeoffs: [
      "Often slows more aggressively than necessary — may annoy following drivers.",
      "Late braking compared to reading advisory warning signs early.",
    ],
    defaultNote: "ON",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SmartCruiseControlMap: {
    summary: "Uses OSM map data to slow down before curves.",
    tips: [
      "Good backup for when camera visibility is poor (rain, night).",
      "Enable alongside Vision for best coverage.",
    ],
    tradeoffs: [
      "Relies on map accuracy — may not reflect recent road changes.",
      "Can slow for curves that have been straightened.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SpeedLimitMode: {
    summary:
      "Controls how sunnypilot responds to detected speed limits from the car or map.",
    tips: [
      "'Off' (0) — speed limit system is entirely disabled.",
      "'Info' (1) — shows the current speed limit on the HUD. No speed adjustment.",
      "'Warning' (2) — shows the limit and plays an alert when you exceed it. No speed adjustment.",
      "'Assist' (3) — automatically adjusts cruise speed to match the limit (with optional offset). Requires sunnypilot longitudinal control.",
      "Start with 'Info' to get familiar with detected limits before enabling 'Assist'.",
    ],
    tradeoffs: [
      "Extremely reliant on map data accuracy — verify source gives correct limits in your region.",
      "'Assist' can cause sudden braking if it reads an off-ramp limit while on the highway.",
      "May trigger on conditional signs (school zones, construction) when not active.",
      "Not available in Assist mode on Tesla (release branches) or Rivian.",
    ],
    defaultNote: "Off (0)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SpeedLimitSource: {
    summary: "Selects which data source(s) provide the current speed limit.",
    tips: [
      "'Car State Priority' (2) is a good default for vehicles with built-in traffic sign recognition.",
      "'Map Data Only' (1) or 'Map Data Priority' (3) are best when your car has no sign recognition — download OSM data first.",
      "'Combined' (4) uses the higher of car and map values — widest coverage, may read advisory signs.",
    ],
    tradeoffs: [
      "Map data can be outdated in rural or recently changed areas.",
      "Car sign recognition may misread signs at speed or in poor lighting.",
      "'Combined' can pick up advisory/ramp speed limits unintentionally.",
    ],
    defaultNote: "Car State Priority (2)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SpeedLimitPolicy: {
    summary: "Selects where speed limit data comes from.",
    tips: [
      "'Map Data Priority' is usually most accurate in the US.",
      "'Car State Only' reads camera-detected signs — real-time but limited.",
      "'Combined' uses both systems for wider coverage.",
    ],
    tradeoffs: [
      "Map data can be outdated in rural areas.",
      "Car State only works where the camera can clearly read signs.",
    ],
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SpeedLimitOffsetType: {
    summary:
      "Choose a fixed mph/kph offset or a percentage offset above the speed limit.",
    tips: [
      "'Fixed' is easier to reason about — e.g. always 5 mph over.",
      "'Percentage' scales with the limit — 10% over 65 mph = 71.5 mph.",
    ],
    defaultNote: "Fixed",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SpeedLimitValueOffset: {
    summary: "Actual amount to cruise above the posted speed limit.",
    tips: [
      "5–10 mph over is common in most US states to match traffic flow.",
      "Set to 0 to strictly obey speed limits.",
    ],
    tradeoffs: ["Speeding is a legal risk — set responsibly."],
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Interface ────────────────────────────────────────────────────────────

  StandstillTimer: {
    summary:
      "Displays a HUD timer showing how long the vehicle has been stopped.",
    tips: ["Useful at traffic lights to track wait times."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  GreenLightAlert: {
    summary:
      "Plays a chime when the light ahead turns green while you're stopped with no lead car.",
    tips: [
      "Only triggers when stopped with no lead vehicle.",
      "Prevents getting honked at when daydreaming at red lights.",
    ],
    tradeoffs: [
      "May trigger on adjacent lanes' green lights in some intersections.",
    ],
    defaultNote: "OFF",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  LeadDepartAlert: {
    summary: "Alerts when the car ahead starts moving while you are stopped.",
    tips: ["Prevents being the car holding up traffic in stop-and-go."],
    defaultNote: "OFF",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  AlwaysOnDM: {
    summary:
      "Keeps driver monitoring active even when sunnypilot is not engaged.",
    tips: [
      "Useful for continuous attention monitoring during long drives with manual sections.",
    ],
    tradeoffs: [
      "Higher power consumption.",
      "Privacy consideration — driver is always watched.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  ShowTurnSignals: {
    summary:
      "Draws visual turn signal arrows on the HUD when blinkers are active.",
    tips: [
      "Visual confirmation that blinker is active — useful for dashcam footage review.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  HideVEgoUI: {
    summary: "Hides the speedometer from the driving screen.",
    tips: [
      "Minimize distractions — your car's own instrument cluster still shows speed.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  QuietMode: {
    summary:
      "Suppresses non-critical sounds: engagement chimes, standard alerts. Safety warnings still play.",
    tips: [
      "Can be toggled while driving.",
      "Safety alerts (immediate warnings, distraction prompts) always play regardless.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  DevUIInfo: {
    summary:
      "Shows extended developer metrics on the HUD: speed, acceleration, lead distance.",
    tips: [
      "For developers and advanced users only.",
      "Supported on comma 3X/3 — not available on comma 4.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  RoadNameToggle: {
    summary: "Shows the current road name on the HUD using OSM map data.",
    tips: [
      "Requires OSM data to be downloaded on the device.",
      "Great for situational awareness in unfamiliar areas.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  OnroadUploads: {
    summary:
      "Controls whether drive footage uploads while driving (ON) or waits until parked (OFF).",
    tips: ["Disable if using a metered mobile hotspot to avoid data overages."],
    defaultNote: "ON (uploads while driving)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  TorqueBar: {
    summary: "Shows a lateral torque visualisation bar on the HUD.",
    tips: [
      "Useful for diagnosing steering tuning — see if torque is maxing out on curves.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  BlindSpotDetection: {
    summary:
      "Shows blind spot warning icons on the HUD when vehicles are detected in the adjacent lane.",
    tips: [
      "Only works if your car has factory BSM hardware.",
      "Different from the BSM lane-change guard — this is purely a HUD display overlay.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SteeringArc: {
    summary:
      "Displays a projected steering arc on the onroad HUD based on the current steering angle.",
    tips: ["Useful for visualising the projected path during curves."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  TrueVEgoUI: {
    summary:
      "Always shows the GPS-derived ground speed on the HUD instead of the odometer-based speed.",
    tips: ["Useful for vehicles with inaccurate speedometers."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  ChevronInfo: {
    summary:
      "Displays additional metrics (distance to lead, speed delta) below the lead-car chevron.",
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  RainbowMode: {
    summary:
      "Enable Rainbow Mode on Tesla vehicles — cosmetic steering wheel colour effect on the HUD.",
    tips: [
      "Cosmetic only — no effect on driving behaviour.",
      "Tesla vehicles only.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Comma AI / MADS ──────────────────────────────────────────────────────

  Mads: {
    summary:
      "Modular Automated Driving System — decouples steering from ACC so lateral assist stays active during manual braking.",
    tips: [
      "The core SP feature. Keep ON for highway driving.",
      "Braking does NOT disengage steering when MADS is enabled.",
      "You can brake manually to adjust speed without losing lane centering.",
    ],
    tradeoffs: [
      "Requires changing your mental model — the car 'steers' even when you brake.",
      "Can feel like the car is fighting you if you change lanes without a blinker.",
    ],
    defaultNote: "OFF",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  MadsMainCruiseAllowed: {
    summary:
      "Allows MADS steering to be active simultaneously with main cruise control.",
    tips: ["Keep ON when using MADS for normal operation."],
    defaultNote: "ON",
    recommended: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  MadsSteeringMode: {
    summary:
      "Controls what MADS lateral (steering) assistance does when you press the brake pedal.",
    tips: [
      "'Remain Active' (0) — steering stays fully active while braking. Lets you manually slow for traffic without losing lane centering. Popular for highway driving.",
      "'Pause' (1) — steering pauses while braking and automatically resumes when you release the brake.",
      "'Disengage' (2) — steering fully disengages on brake input; you must re-engage MADS manually.",
      "Set to 'Remain Active' if you frequently tap the brake in stop-and-go traffic to maintain following distance.",
    ],
    tradeoffs: [
      "'Remain Active' requires a mental model shift — braking does NOT disengage steering.",
      "Can feel like the car is correcting your steering immediately after a manual brake.",
      "Forced to 'Disengage' on Rivian and Tesla (without vehicle bus) — setting has no effect.",
    ],
    defaultNote: "Remain Active (0)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  MadsUnifiedEngagementMode: {
    summary:
      "One button press engages both MADS steering and ACC speed control together.",
    tips: ["Convenient — single activation for full sunnypilot operation."],
    tradeoffs: [
      "Cannot engage steering-only without also enabling speed control.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  IsLdwEnabled: {
    summary:
      "Plays a chime when the car crosses a lane line without a turn signal.",
    tips: [
      "Keep ON for safety on long highway drives.",
      "Activates above 31 mph (50 km/h) only.",
    ],
    tradeoffs: ["Can be noisy on roads with poor or worn lane markings."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  DisengageOnAccelerator: {
    summary:
      "Pressing the accelerator pedal fully disengages sunnypilot longitudinal control.",
    tips: [
      "Keep OFF if you want to help the car accelerate through tight merges without disengaging SP.",
      "Keep ON if you want classic behaviour where any gas pedal input stops SP.",
    ],
    tradeoffs: [
      "OFF: Can assist with acceleration in merges while steering stays active.",
      "ON: Any gas pedal fully disengages the system — may feel safer to some users.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  GsmMetered: {
    summary:
      "Restricts all uploads to Wi-Fi only — prevents cellular data usage.",
    tips: [
      "Keep ON if using a mobile hotspot to avoid unexpected data charges.",
      "Disable if you want drives to upload via cellular for faster sync.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  SunnylinkEnabled: {
    summary:
      "Enables the SunnyLink cloud connection for remote configuration and drive sync.",
    tips: ["Required to use the SunnyLink dashboard for remote configuration."],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  RecordFront: {
    summary:
      "Records three-camera dashcam footage of every drive to device storage.",
    tips: ["Keep ON — footage is required if anything goes wrong."],
    tradeoffs: [
      "Uses significant storage — older drives are auto-deleted to free space.",
    ],
    defaultNote: "ON",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  RecordAudioFeedback: {
    summary: "Records microphone audio alongside drive footage.",
    tips: ["Useful for pairing voice notes with dashcam review."],
    tradeoffs: [
      "Privacy consideration — conversations in the car are recorded.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Advanced ─────────────────────────────────────────────────────────────

  QuickBootToggle: {
    summary: "Skips the boot animation and speeds up device startup.",
    tips: [
      "Useful when you need the device ready quickly.",
      "Requires 'Disable Updates' to be enabled first.",
    ],
    tradeoffs: ["Cannot be enabled on release or development branches."],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  // ── Navigation ───────────────────────────────────────────────────────────

  OsmLocal: {
    summary:
      "Downloads and uses offline OSM map data for speed limits and road names.",
    tips: [
      "Required for Road Name Display and OSM-based Speed Limit Control.",
      "Download the map on Wi-Fi — it can be quite large.",
    ],
    defaultNote: "OFF",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },

  IsMetric: {
    summary: "Switches the entire interface from mph to km/h.",
    tips: ["Enable if you're in a country that uses the metric system."],
    defaultNote: "OFF (mph)",
    docsUrl: "https://community.sunnypilot.ai/c/documentation/114",
  },
};
