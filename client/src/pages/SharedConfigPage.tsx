import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
    ArrowLeft,
    ArrowUpDown,
    BarChart3,
    Calendar,
    Car,
    ChevronDown,
    ChevronUp,
    Clock,
    Copy,
    Cpu,
    Download,
    ExternalLink,
    Eye,
    Gauge,
    GitBranch,
    GitCompare,
    GitFork,
    Heart,
    Loader2,
    Lock,
    Map,
    Monitor,
    Share2,
    Star,
    Tag,
    Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    addFavorite,
    cloneConfig,
    deleteRating,
    fetchFavoriteStatus,
    fetchMyRating,
    fetchRatingSummary,
    fetchSharedConfig,
    rateConfig,
    removeFavorite,
} from "../api";
import { CommentSection } from "../components/config/CommentSection";
import { CompareModal } from "../components/config/CompareModal";
import { ConfigDiffModal } from "../components/config/ConfigDiffModal";
import { ConfigHistoryModal } from "../components/config/ConfigHistoryModal";
import { SunnyLinkExportModal } from "../components/config/SunnyLinkExportModal";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { HelpTooltip } from "../components/ui/HelpTooltip";
import { RatingDisplay, RatingStars } from "../components/ui/RatingStars";
import { MAKE_LABELS, categoryColor, tagColor } from "../lib/colorUtils";
import { exportConfigAsJson } from "../lib/configExport";
import { FIELD_HELP } from "../lib/fieldHelp";
import { useAuthStore } from "../store/authStore";
import type {
    ConfigRecord,
    RatingRecord,
    RatingSummary,
} from "../types/config";
import { CATEGORIES } from "../types/config";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Read-only section renderer ───────────────────────────────────────────────

const ROW: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  spKey?: string;
}> = ({ label, value, mono, spKey }) => {
  const help = spKey ? FIELD_HELP[spKey] : undefined;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-0.5 sm:gap-4 py-3 border-b border-zinc-700/70 last:border-0">
      <span className="text-sm text-zinc-400 sm:flex-shrink-0 sm:w-52 flex items-center gap-1">
        {label}
        {help && <HelpTooltip label={label} {...help} />}
      </span>
      <span
        className={clsx(
          "text-base text-zinc-200 sm:text-right",
          mono && "font-mono",
        )}
      >
        {value}
      </span>
    </div>
  );
};

const SectionBlock: React.FC<{
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}> = ({ icon: Icon, title, children, defaultOpen = false, badge }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <span className="text-sm font-medium text-zinc-200">{title}</span>
          {badge}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-zinc-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-zinc-600" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

/** Small subsection header inside a SectionBlock */
const SubH: React.FC<{ children: React.ReactNode; first?: boolean }> = ({
  children,
  first = false,
}) => (
  <p
    className={clsx(
      "text-xs font-bold uppercase tracking-widest text-zinc-400 pb-1",
      first ? "pt-4" : "border-t-2 border-zinc-700/60 pt-4 mt-3",
    )}
  >
    {children}
  </p>
);

// ─── Rating breakdown bar ─────────────────────────────────────────────────────

const RateBreakdown: React.FC<{ summary: RatingSummary }> = ({ summary }) => (
  <div className="space-y-1.5">
    {[5, 4, 3, 2, 1].map((star) => {
      const count = summary.breakdown[star] ?? 0;
      const pct = summary.count > 0 ? (count / summary.count) * 100 : 0;
      return (
        <div key={star} className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-500 w-3 flex-shrink-0">
            {star}
          </span>
          <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs font-mono text-zinc-600 w-4 flex-shrink-0 text-right">
            {count}
          </span>
        </div>
      );
    })}
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SharedConfigPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [ratingHover, setRatingHover] = useState(0);

  const {
    data: config,
    isLoading,
    isError,
  } = useQuery<ConfigRecord>({
    queryKey: ["shared-config", shareToken],
    queryFn: () => fetchSharedConfig(shareToken!),
    enabled: !!shareToken,
  });

  const { data: myRating } = useQuery<RatingRecord | null>({
    queryKey: ["my-rating", config?.id],
    queryFn: () => fetchMyRating(config!.id),
    enabled: !!config?.id,
  });

  const { data: ratingSummary } = useQuery<RatingSummary>({
    queryKey: ["rating-summary", config?.id],
    queryFn: () => fetchRatingSummary(config!.id),
    enabled: !!config?.id,
  });

  const rateMutation = useMutation({
    mutationFn: (value: number) => rateConfig(config!.id, value),
    onSuccess: (r) => {
      qc.setQueryData(["my-rating", config!.id], r);
      qc.invalidateQueries({ queryKey: ["rating-summary", config!.id] });
      qc.invalidateQueries({ queryKey: ["explore"] });
    },
  });

  const removeRatingMutation = useMutation({
    mutationFn: () => deleteRating(config!.id),
    onSuccess: () => {
      qc.setQueryData(["my-rating", config!.id], null);
      qc.invalidateQueries({ queryKey: ["rating-summary", config!.id] });
    },
  });

  const cloneMutation = useMutation({
    mutationFn: () => cloneConfig(config!.id),
  });

  // ── Favorite toggle ────────────────────────────────────────────────────────
  const { data: isFavorited = false } = useQuery<boolean>({
    queryKey: ["favorite-status", config?.id],
    queryFn: () => fetchFavoriteStatus(config!.id),
    enabled: !!config?.id,
  });

  const favMutation = useMutation({
    mutationFn: () =>
      isFavorited ? removeFavorite(config!.id) : addFavorite(config!.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["favorite-status", config!.id] });
      qc.setQueryData(["favorite-status", config!.id], !isFavorited);
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ["favorite-status", config!.id] });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite-status", config!.id] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  // ── Diff viewer ────────────────────────────────────────────────────────────
  const [diffOpen, setDiffOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sunnyLinkExportOpen, setSunnyLinkExportOpen] = useState(false);
  const canDiff = !!config?.clonedFrom?.shareToken;

  const { data: originalConfig } = useQuery<ConfigRecord>({
    queryKey: ["shared-config", config?.clonedFrom?.shareToken],
    queryFn: () => fetchSharedConfig(config!.clonedFrom!.shareToken!),
    enabled: canDiff && diffOpen,
  });

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-zinc-400">Config not found or no longer shared.</p>
        <Link to="/explore">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const make = config.vehicleMake
    ? (MAKE_LABELS[config.vehicleMake] ?? config.vehicleMake)
    : null;
  const catLabel = CATEGORIES.find((c) => c.value === config.category)?.label;
  const isOwner = config.isOwn ?? false;
  const c = config.config;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-600">
        <Link
          to="/explore"
          className="hover:text-zinc-400 transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3 h-3" /> Explore
        </Link>
        <span>/</span>
        <span className="text-zinc-500 truncate">{config.name}</span>
      </div>

      {/* Header card */}
      <div className="card rounded-xl p-5 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 min-w-0">
            {(make || config.vehicleModel) && (
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                {[make, config.vehicleModel, config.vehicleYear]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
            )}
            <h1 className="text-xl font-semibold text-zinc-100">
              {config.name}
            </h1>
            {config.description && (
              <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                {config.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="warning" dot>
              <Lock className="w-2.5 h-2.5 mr-0.5" /> Read-Only
            </Badge>
            {catLabel && (
              <span
                className={clsx(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                  categoryColor(config.category),
                )}
              >
                {catLabel}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {(config.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {config.tags.map((tag) => (
              <span
                key={tag}
                className={clsx(
                  "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                  tagColor(tag),
                )}
              >
                <Tag className="w-2.5 h-2.5" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 pt-1 border-t border-zinc-800">
          <span className="inline-flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {config.viewCount} views
          </span>
          <span className="inline-flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" /> {config.cloneCount} clones
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Shared{" "}
            {timeAgo(config.sharedAt ?? config.createdAt)}
          </span>
          {config.clonedFrom && (
            <span className="inline-flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" /> Cloned from{" "}
              {config.clonedFrom.shareToken ? (
                <Link
                  to={`/shared/${config.clonedFrom.shareToken}`}
                  className="text-blue-400 hover:text-blue-300 ml-1"
                >
                  {config.clonedFrom.name}
                </Link>
              ) : (
                <span className="text-zinc-400 ml-1">
                  {config.clonedFrom.name}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-1">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Share2 className="w-3.5 h-3.5" />}
            onClick={copyShareLink}
          >
            Copy link
          </Button>
          <Button
            variant={isFavorited ? "primary" : "outline"}
            size="sm"
            leftIcon={
              <Heart
                className={clsx("w-3.5 h-3.5", isFavorited && "fill-current")}
              />
            }
            loading={favMutation.isPending}
            onClick={() => favMutation.mutate()}
          >
            {isFavorited ? "Saved" : "Save"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<GitCompare className="w-3.5 h-3.5" />}
            onClick={() => setCompareOpen(true)}
            title="Compare this config against another shared or your own config"
          >
            Compare
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => exportConfigAsJson(config)}
            title="Export config as SunnyTune JSON"
          >
            Export
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Download className="w-3.5 h-3.5" />}
            onClick={() => setSunnyLinkExportOpen(true)}
            title="Export as SunnyLink device JSON (importable via SunnyLink app)"
          >
            SunnyLink
          </Button>
          {canDiff && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<GitCompare className="w-3.5 h-3.5" />}
              onClick={() => setDiffOpen(true)}
            >
              View diff from original
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Copy className="w-3.5 h-3.5" />}
            loading={cloneMutation.isPending}
            onClick={() => cloneMutation.mutate()}
          >
            Clone to edit
          </Button>
          {cloneMutation.isSuccess && (
            <Link to={`/configure/${cloneMutation.data.id}`}>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Open clone
              </Button>
            </Link>
          )}
          {isOwner && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Clock className="w-3.5 h-3.5" />}
              onClick={() => setHistoryOpen(true)}
            >
              History
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: config details */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Configuration Details
          </h2>

          <SectionBlock icon={Car} title="Vehicle" defaultOpen>
            <SubH first>Vehicle Info</SubH>
            <ROW
              label="Make"
              value={MAKE_LABELS[c.vehicle.make] ?? c.vehicle.make}
            />
            <ROW label="Model" value={c.vehicle.model || "—"} />
            <ROW label="Year" value={c.vehicle.year} mono />
            <SubH>Hardware &amp; Software</SubH>
            {c.metadata.hardware && (
              <ROW
                label="Comma AI HW"
                value={
                  c.metadata.hardware === "comma4"
                    ? "Comma 4 (C4)"
                    : c.metadata.hardware === "comma3x"
                      ? "Comma 3X (C3X)"
                      : "Comma 3 (C3)"
                }
              />
            )}
            <ROW label="SP Version" value={c.metadata.sunnypilotVersion} mono />
            <ROW label="Branch" value={c.metadata.branch} mono />
            {c.metadata.activeModel && (
              <ROW label="Driving Model" value={c.metadata.activeModel} mono />
            )}
          </SectionBlock>

          <SectionBlock icon={Gauge} title="Toggles" defaultOpen>
            <SubH first>Driving Personality</SubH>
            <ROW
              label="Longitudinal Personality"
              spKey="DrivingPersonality"
              value={c.drivingPersonality.longitudinalPersonality}
              mono
            />
            <SubH>Experimental Mode</SubH>
            <ROW
              label="E2E Mode"
              spKey="ExperimentalMode"
              value={
                c.longitudinal.e2eEnabled ? (
                  <Badge variant="warning">Enabled</Badge>
                ) : (
                  "Disabled"
                )
              }
            />
            <SubH>Safety</SubH>
            <ROW
              label="Always-on DM"
              spKey="AlwaysOnDM"
              value={c.interface.alwaysOnDM ? "On" : "Off"}
            />
            <ROW
              label="Disengage on Accel"
              spKey="DisengageOnAccelerator"
              value={c.commaAI.disengageOnAccelerator ? "On" : "Off"}
            />
            <ROW
              label="LDW"
              spKey="IsLdwEnabled"
              value={c.commaAI.ldwEnabled ? "On" : "Off"}
            />
            <SubH>Recording &amp; Uploads</SubH>
            <ROW
              label="Record Drives"
              spKey="RecordFront"
              value={c.commaAI.recordDrives ? "On" : "Off"}
            />
            <ROW
              label="Upload on WiFi Only"
              spKey="GsmMetered"
              value={c.commaAI.uploadOnlyOnWifi ? "On" : "Off"}
            />
            <ROW
              label="Record Audio Feedback"
              spKey="RecordAudioFeedback"
              value={c.commaAI.recordAudioFeedback ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={GitBranch} title="Steering">
            <SubH first>M.A.D.S.</SubH>
            <ROW
              label="MADS"
              spKey="Mads"
              value={c.commaAI.mads ? "On" : "Off"}
            />
            <ROW
              label="MADS Main Cruise"
              spKey="MadsMainCruiseAllowed"
              value={c.commaAI.madsMainCruise ? "On" : "Off"}
            />
            <ROW
              label="MADS Steering Mode"
              spKey="MadsSteeringMode"
              value={
                (["Remain Active", "Pause", "Disengage"] as const)[
                  c.commaAI.madsSteeringMode
                ] ?? String(c.commaAI.madsSteeringMode)
              }
            />
            <ROW
              label="MADS Unified Engage"
              spKey="MadsUnifiedEngagementMode"
              value={c.commaAI.madsUnifiedEngagement ? "On" : "Off"}
            />
            <SubH>Lateral Assist</SubH>
            <ROW
              label="Enforce Torque"
              spKey="EnforceTorqueControl"
              value={c.lateral.enforceTorqueControl ? "On" : "Off"}
            />
            <ROW
              label="NN Model"
              spKey="NeuralNetworkLateralControl"
              value={c.lateral.useNNModel ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Blinker Pause Lateral"
              spKey="BlinkerPauseLateralControl"
              value={c.laneChange.blinkerPauseLateral ? "On" : "Off"}
            />
            <ROW
              label="Min Speed (Blinker Pause)"
              spKey="BlinkerMinLateralControlSpeed"
              value={`${c.laneChange.minimumSpeed} kph`}
              mono
            />
            <ROW
              label="Blinker Re-engage Delay"
              spKey="BlinkerLateralReengageDelay"
              value={`${c.laneChange.blinkerReengageDelay}s`}
            />
            <SubH>Torque</SubH>
            <ROW
              label="Camera Offset"
              spKey="CameraOffset"
              value={c.lateral.cameraOffset}
              mono
            />
            <ROW
              label="Torque Tune"
              spKey="TorqueControlTune"
              value={
                c.lateral.torqueControlTune === 0
                  ? "0 — Comma stock"
                  : c.lateral.torqueControlTune === 1
                    ? "1 — SP"
                    : "2 — SP+"
              }
              mono
            />
            <ROW
              label="Live Torque"
              spKey="LiveTorqueParamsToggle"
              value={c.lateral.liveTorque ? "Enabled" : "Disabled"}
            />
            <ROW
              label="LAGD"
              spKey="LagdToggle"
              value={
                c.lateral.lagdEnabled
                  ? `On (${c.lateral.lagdDelay}s)`
                  : "Off"
              }
            />
            {c.lateral.torqueOverride?.enabled && (
              <>
                <ROW
                  label="Override Friction"
                  spKey="TorqueParamsOverrideFriction"
                  value={c.lateral.torqueOverride.friction}
                  mono
                />
                <ROW
                  label="Override Lat Accel"
                  spKey="TorqueParamsOverrideLatAccelFactor"
                  value={c.lateral.torqueOverride.latAccelFactor}
                  mono
                />
              </>
            )}
            <SubH>Lane Change</SubH>
            <ROW
              label="Auto Lane Change"
              value={c.laneChange.enabled ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Lane Change Timer"
              spKey="AutoLaneChangeTimer"
              value={
                c.laneChange.autoTimer === -1
                  ? "Off"
                  : c.laneChange.autoTimer === 0
                    ? "Nudge required"
                    : c.laneChange.autoTimer === 1
                      ? "Nudgeless"
                      : c.laneChange.autoTimer === 2
                        ? "0.5s"
                        : c.laneChange.autoTimer === 3
                          ? "1.0s"
                          : c.laneChange.autoTimer === 4
                            ? "2.0s"
                            : "3.0s"
              }
              mono
            />
            <ROW
              label="BSM Integration"
              spKey="BlindSpot"
              value={c.laneChange.bsmMonitoring ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock
            icon={ArrowUpDown}
            title="Cruise"
            badge={
              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 select-none">
                SP
              </span>
            }
          >
            <SubH first>Longitudinal Control</SubH>
            <ROW
              label="Dynamic E2E"
              spKey="DynamicExperimentalControl"
              value={c.longitudinal.dynamicE2E ? "On" : "Off"}
            />
            <ROW
              label="Hyundai Long Tune"
              spKey="HyundaiLongitudinalTuning"
              value={
                c.longitudinal.hyundaiLongTune === 0
                  ? "0 — Off"
                  : c.longitudinal.hyundaiLongTune === 1
                    ? "1 — Dynamic"
                    : "2 — Predictive"
              }
            />
            <ROW
              label="Plan+"
              spKey="PlanplusControl"
              value={c.longitudinal.planplusEnabled ? "On" : "Off"}
            />
            <ROW
              label="Custom Acc"
              spKey="CustomAccIncrementsEnabled"
              value={
                c.longitudinal.customAccEnabled
                  ? `On (${c.longitudinal.customAccShort}/${c.longitudinal.customAccLong} km/h)`
                  : "Off"
              }
            />
            <SubH>Smart Cruise Control</SubH>
            <ROW
              label="ICBM (Alpha)"
              spKey="IntelligentCruiseButtonManagement"
              value={c.speedControl.icbmEnabled ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Vision Turn Speed"
              spKey="SmartCruiseControlVision"
              value={c.speedControl.visionEnabled ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Map Turn Speed"
              spKey="SmartCruiseControlMap"
              value={c.speedControl.mapEnabled ? "Enabled" : "Disabled"}
            />
            <SubH>Speed Limit</SubH>
            <ROW
              label="Speed Limit Mode"
              spKey="SpeedLimitMode"
              value={
                (["Off", "Info", "Warning", "Assist"] as const)[
                  c.speedControl.speedLimitControl.mode
                ] ?? "Off"
              }
            />
            {c.speedControl.speedLimitControl.mode > 0 && (
              <>
                <ROW
                  label="SLC Policy"
                  spKey="SpeedLimitSource"
                  value={c.speedControl.speedLimitControl.policy ?? "—"}
                  mono
                />
                <ROW
                  label="SLC Offset"
                  spKey="SpeedLimitOffsetType"
                  value={`${c.speedControl.speedLimitControl.offsetValue} (${c.speedControl.speedLimitControl.offsetType})`}
                  mono
                />
              </>
            )}
          </SectionBlock>

          <SectionBlock icon={Map} title="Maps">
            <ROW
              label="OSM Data"
              spKey="OsmLocal"
              value={c.navigation.osmEnabled ? "Enabled" : "Disabled"}
            />
          </SectionBlock>

          <SectionBlock icon={Monitor} title="Visuals">
            <SubH first>HUD Overlays</SubH>
            <ROW
              label="Developer UI"
              spKey="DevUIInfo"
              value={c.interface.devUI ? "On" : "Off"}
            />
            <ROW
              label="Standstill Timer"
              spKey="StandstillTimer"
              value={c.interface.standstillTimer ? "On" : "Off"}
            />
            <ROW
              label="Green Light Alert"
              spKey="GreenLightAlert"
              value={c.interface.greenLightAlert ? "On" : "Off"}
            />
            <ROW
              label="Lead Depart Alert"
              spKey="LeadDepartAlert"
              value={c.interface.leadDepartAlert ? "On" : "Off"}
            />
            <ROW
              label="Turn Signals"
              spKey="ShowTurnSignals"
              value={c.interface.showTurnSignals ? "On" : "Off"}
            />
            <ROW
              label="Road Name Display"
              spKey="RoadNameToggle"
              value={c.interface.roadNameDisplay ? "On" : "Off"}
            />
            <ROW
              label="Hide Speed"
              spKey="HideVEgoUI"
              value={c.interface.hideVegoUI ? "On" : "Off"}
            />
            <ROW
              label="True Speed"
              spKey="TrueVEgoUI"
              value={c.interface.trueVegoUI ? "On" : "Off"}
            />
            <ROW
              label="Torque Bar"
              spKey="TorqueBar"
              value={c.interface.torqueBar ? "On" : "Off"}
            />
            <ROW
              label="Blind Spot Warnings"
              spKey="BlindSpotDetection"
              value={c.interface.blindSpotHUD ? "On" : "Off"}
            />
            <ROW
              label="Steering Arc"
              spKey="SteeringArc"
              value={c.interface.steeringArc ? "On" : "Off"}
            />
            <ROW
              label="Metrics Below Chevron"
              spKey="ChevronInfo"
              value={c.interface.chevronInfo ? "On" : "Off"}
            />
            <ROW
              label="Tesla Rainbow Mode"
              spKey="RainbowMode"
              value={c.interface.rainbowMode ? "On" : "Off"}
            />
            <SubH>Display</SubH>
            <ROW
              label="Screen Brightness"
              value={`${c.interface.screenBrightness}%`}
              mono
            />
            <ROW
              label="Screen Off Timer"
              value={
                c.interface.screenOffTimer === 0
                  ? "Never"
                  : `${c.interface.screenOffTimer}s`
              }
              mono
            />
          </SectionBlock>

          <SectionBlock icon={Cpu} title="Device">
            <SubH first>Connectivity</SubH>
            <ROW
              label="SunnyLink Connect"
              spKey="SunnylinkEnabled"
              value={c.commaAI.connectEnabled ? "On" : "Off"}
            />
            <SubH>Device Settings</SubH>
            <ROW
              label="Use Metric"
              value={c.interface.useMetric ? "On" : "Off"}
            />
            <ROW
              label="Quiet Mode"
              spKey="QuietMode"
              value={c.interface.quietMode ? "On" : "Off"}
            />
            <ROW
              label="Disable Onroad Uploads"
              spKey="OnroadUploads"
              value={c.interface.disableOnroadUploads ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={Wrench} title="Developer">
            <SubH first>Longitudinal</SubH>
            <ROW
              label="Alpha Long"
              spKey="AlphaLongitudinalEnabled"
              value={c.longitudinal.alphaLongEnabled ? "Enabled" : "Disabled"}
            />
            <SubH>System</SubH>
            <ROW
              label="Quick Boot"
              spKey="QuickBootToggle"
              value={c.advanced.quickBoot ? "Enabled" : "Disabled"}
            />
          </SectionBlock>
        </div>

        {/* Right: ratings + comments */}
        <div className="space-y-5">
          {/* Rating widget */}
          <div className="card rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Community Rating
            </h3>

            {ratingSummary && (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="font-mono text-3xl font-bold text-zinc-100">
                    {ratingSummary.avg !== null
                      ? ratingSummary.avg.toFixed(1)
                      : "—"}
                  </span>
                  <div className="pb-1 space-y-0.5">
                    <RatingDisplay
                      avg={ratingSummary.avg}
                      count={ratingSummary.count}
                      size="md"
                    />
                    <p className="text-xs text-zinc-600">
                      {ratingSummary.count} ratings
                    </p>
                  </div>
                </div>
                <RateBreakdown summary={ratingSummary} />
              </div>
            )}

            {/* Rate this config */}
            {isOwner ? (
              <div className="pt-3 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 italic">
                  You can&apos;t rate your own config.
                </p>
              </div>
            ) : user ? (
              <div className="pt-3 border-t border-zinc-800 space-y-2">
                <p className="text-xs text-zinc-500">Your rating</p>
                <div className="flex items-center gap-3">
                  <RatingStars
                    value={myRating?.value ?? ratingHover}
                    onChange={(v) => rateMutation.mutate(v)}
                    size="lg"
                    disabled={rateMutation.isPending}
                  />
                  {rateMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />
                  )}
                </div>
                {rateMutation.isError && (
                  <p className="text-xs text-red-400">
                    {(rateMutation.error as Error)?.message ??
                      "Failed to submit rating"}
                  </p>
                )}
                {myRating && (
                  <button
                    onClick={() => removeRatingMutation.mutate()}
                    disabled={removeRatingMutation.isPending}
                    className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    Remove rating
                  </button>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Full-width discussion */}
      <div className="card rounded-xl p-5">
        <CommentSection configId={config.id} isOwner={isOwner} />
      </div>

      {/* Diff viewer modal */}
      {/* SunnyLink export review modal */}
      {sunnyLinkExportOpen && (
        <SunnyLinkExportModal
          config={config.config}
          name={config.name}
          onClose={() => setSunnyLinkExportOpen(false)}
        />
      )}

      <CompareModal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        baseConfig={config.config}
        baseName={config.name}
      />

      {canDiff && diffOpen && originalConfig && (
        <ConfigDiffModal
          open={diffOpen}
          onClose={() => setDiffOpen(false)}
          original={originalConfig.config}
          modified={config.config}
          originalName={originalConfig.name}
          modifiedName={config.name}
        />
      )}

      {/* Version history modal (owner only) */}
      {isOwner && (
        <ConfigHistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          configId={config.id}
          currentConfig={config.config}
          currentName={config.name}
        />
      )}
    </div>
  );
}
