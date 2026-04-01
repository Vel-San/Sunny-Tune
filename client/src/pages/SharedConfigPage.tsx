import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  Calendar,
  Car,
  ChevronDown,
  ChevronUp,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  Gauge,
  GitBranch,
  GitFork,
  Loader2,
  Lock,
  Map,
  Monitor,
  Share2,
  Star,
  Tag,
  TrendingUp,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  cloneConfig,
  deleteRating,
  fetchMyRating,
  fetchRatingSummary,
  fetchSharedConfig,
  rateConfig,
} from "../api";
import { CommentSection } from "../components/config/CommentSection";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { RatingDisplay, RatingStars } from "../components/ui/RatingStars";
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

const MAKE_LABELS: Record<string, string> = {
  toyota: "Toyota",
  lexus: "Lexus",
  honda: "Honda",
  acura: "Acura",
  hyundai: "Hyundai",
  kia: "Kia",
  genesis: "Genesis",
  gm: "GM",
  ford: "Ford",
  chrysler: "Chrysler",
  volkswagen: "Volkswagen",
  audi: "Audi",
  subaru: "Subaru",
  mazda: "Mazda",
  nissan: "Nissan",
};

// ─── Read-only section renderer ───────────────────────────────────────────────

const ROW: React.FC<{
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}> = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-800/60 last:border-0">
    <span className="text-xs text-zinc-500 flex-shrink-0 w-44">{label}</span>
    <span
      className={clsx("text-sm text-zinc-200 text-right", mono && "font-mono")}
    >
      {value}
    </span>
  </div>
);

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
            {catLabel && <Badge variant="info">{catLabel}</Badge>}
          </div>
        </div>

        {/* Tags */}
        {(config.tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {config.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded"
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: config details */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Configuration Details
          </h2>

          <SectionBlock icon={Car} title="Vehicle" defaultOpen>
            <ROW
              label="Make"
              value={MAKE_LABELS[c.vehicle.make] ?? c.vehicle.make}
            />
            <ROW label="Model" value={c.vehicle.model || "—"} />
            <ROW label="Year" value={c.vehicle.year} mono />
            <ROW label="Fingerprint" value={c.vehicle.fingerprintSource} mono />
            <ROW
              label="Cinematic Boot"
              value={c.vehicle.enableCinematic ? "Enabled" : "Disabled"}
            />
          </SectionBlock>

          <SectionBlock icon={Gauge} title="Driving Personality" defaultOpen>
            <ROW
              label="Active Profile"
              value={
                <Badge variant="primary">
                  {c.drivingPersonality.activeProfile}
                </Badge>
              }
            />
            <ROW
              label="Long. Personality"
              value={c.drivingPersonality.longitudinalPersonality}
              mono
            />
            <ROW
              label="Traffic Mode"
              value={c.drivingPersonality.trafficMode ? "On" : "Off"}
            />
            <ROW
              label="Eco — Accel / Decel"
              value={`${c.drivingPersonality.eco.accelMax} / ${c.drivingPersonality.eco.decelMax} m/s²`}
              mono
            />
            <ROW
              label="Normal — Accel / Decel"
              value={`${c.drivingPersonality.normal.accelMax} / ${c.drivingPersonality.normal.decelMax} m/s²`}
              mono
            />
            <ROW
              label="Sport — Accel / Decel"
              value={`${c.drivingPersonality.sport.accelMax} / ${c.drivingPersonality.sport.decelMax} m/s²`}
              mono
            />
          </SectionBlock>

          <SectionBlock icon={GitBranch} title="Lateral Control">
            <ROW
              label="Method"
              value={
                <Badge variant="info">{c.lateral.method.toUpperCase()}</Badge>
              }
            />
            {c.lateral.method === "torque" && (
              <>
                <ROW label="Friction" value={c.lateral.torque.friction} mono />
                <ROW
                  label="Lat Accel Factor"
                  value={c.lateral.torque.latAccelFactor}
                  mono
                />
                <ROW
                  label="Actuator Delay"
                  value={`${c.lateral.torque.steerActuatorDelay}s`}
                  mono
                />
                <ROW
                  label="NN Model"
                  value={c.lateral.torque.useNNModel ? "Enabled" : "Disabled"}
                />
              </>
            )}
            {c.lateral.method === "pid" && (
              <>
                <ROW
                  label="Kp (Hi/Lo)"
                  value={`${c.lateral.pid.kpHighSpeed} / ${c.lateral.pid.kpLowSpeed}`}
                  mono
                />
                <ROW
                  label="Ki (Hi/Lo)"
                  value={`${c.lateral.pid.kiHighSpeed} / ${c.lateral.pid.kiLowSpeed}`}
                  mono
                />
                <ROW label="Kf" value={c.lateral.pid.kf.toFixed(8)} mono />
              </>
            )}
            <ROW label="Steer Rate Cost" value={c.lateral.steerRateCost} mono />
            <ROW
              label="Angle Deadzone"
              value={`${c.lateral.steeringAngleDeadzone}°`}
              mono
            />
            <ROW
              label="Steer Offset"
              value={`${c.lateral.steerAngleOffset}°`}
              mono
            />
            <ROW
              label="Custom Steer Ratio"
              value={c.lateral.customSteeringRatio ?? "Auto"}
              mono
            />
          </SectionBlock>

          <SectionBlock
            icon={ArrowUpDown}
            title="Longitudinal Control"
            badge={
              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 select-none">
                SP
              </span>
            }
          >
            <ROW
              label="Controller"
              value={
                <Badge
                  variant={c.longitudinal.useSPLong ? "success" : "default"}
                >
                  {c.longitudinal.useSPLong ? "SunnyPilot Long" : "Stock"}
                </Badge>
              }
            />
            <ROW
              label="E2E Mode"
              value={
                c.longitudinal.e2eEnabled ? (
                  <Badge variant="warning">Enabled</Badge>
                ) : (
                  "Disabled"
                )
              }
            />
            <ROW
              label="Dynamic E2E"
              value={c.longitudinal.dynamicE2E ? "On" : "Off"}
            />
            <ROW
              label="Smooth Stop"
              value={c.longitudinal.smoothStop ? "On" : "Off"}
            />
            <ROW
              label="Coast Decel"
              value={c.longitudinal.coastDecelEnabled ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={TrendingUp} title="Speed Control">
            <ROW
              label="Speed Limit Control"
              value={
                c.speedControl.speedLimitControl.enabled
                  ? "Enabled"
                  : "Disabled"
              }
            />
            {c.speedControl.speedLimitControl.enabled && (
              <>
                <ROW
                  label="SLC Source"
                  value={c.speedControl.speedLimitControl.source}
                  mono
                />
                <ROW
                  label="SLC Offset"
                  value={`${c.speedControl.speedLimitControl.offsetValue} (${c.speedControl.speedLimitControl.offsetType})`}
                  mono
                />
                <ROW
                  label="Auto Engage"
                  value={
                    c.speedControl.speedLimitControl.autoEngage ? "On" : "Off"
                  }
                />
              </>
            )}
            <ROW
              label="Vision Turn Control"
              value={
                c.speedControl.visionTurnControl.enabled
                  ? `On (${c.speedControl.visionTurnControl.turnSpeed} mph)`
                  : "Off"
              }
            />
            <ROW
              label="Map Turn Control"
              value={
                c.speedControl.mapTurnControl.enabled
                  ? `On (+${c.speedControl.mapTurnControl.speedMargin} mph)`
                  : "Off"
              }
            />
            <ROW
              label="Set Speed Offset"
              value={`${c.speedControl.setSpeedOffset} ${c.speedControl.speedUnit}`}
              mono
            />
            <ROW
              label="Cruise Increment"
              value={`${c.speedControl.cruiseIncrement} ${c.speedControl.speedUnit}`}
              mono
            />
            <ROW
              label="Auto Resume"
              value={c.speedControl.autoResume ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock
            icon={ArrowLeftRight}
            title="Lane Change"
            badge={
              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25 select-none">
                SP
              </span>
            }
          >
            <ROW
              label="Auto Lane Change"
              value={c.laneChange.enabled ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Timer"
              value={
                c.laneChange.autoTimer === 0
                  ? "Nudge required"
                  : `${c.laneChange.autoTimer}s`
              }
              mono
            />
            <ROW
              label="Min Speed"
              value={`${c.laneChange.minimumSpeed} mph`}
              mono
            />
            <ROW
              label="BSM Integration"
              value={c.laneChange.bsmMonitoring ? "On" : "Off"}
            />
            <ROW
              label="Nudgeless"
              value={c.laneChange.nudgeless ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={Map} title="Navigation">
            <ROW
              label="Nav on OpenPilot"
              value={c.navigation.navigationOnOP ? "Enabled" : "Disabled"}
            />
            <ROW
              label="OSM Data"
              value={c.navigation.osmEnabled ? "Enabled" : "Disabled"}
            />
            <ROW
              label="Prefer Nav Limits"
              value={c.navigation.preferNavSpeedLimits ? "On" : "Off"}
            />
            <ROW
              label="Preload Maps"
              value={c.navigation.preloadMaps ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={Monitor} title="Interface">
            <ROW
              label="Developer UI"
              value={c.interface.devUI ? "On" : "Off"}
            />
            <ROW
              label="Standstill Timer"
              value={c.interface.standstillTimer ? "On" : "Off"}
            />
            <ROW
              label="Show SLC Offset"
              value={c.interface.showSLCOffset ? "On" : "Off"}
            />
            <ROW
              label="Show VTSC State"
              value={c.interface.showVTSCState ? "On" : "Off"}
            />
            <ROW
              label="Show MTSC State"
              value={c.interface.showMTSCState ? "On" : "Off"}
            />
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
            <ROW
              label="Map Position"
              value={c.interface.mapOnLeft ? "Left" : "Right"}
            />
          </SectionBlock>

          <SectionBlock
            icon={Cpu}
            title="Comma AI Core"
            badge={
              <span className="inline-flex items-center px-1.5 py-px rounded text-[9px] font-bold uppercase tracking-wide bg-sky-500/15 text-sky-400 border border-sky-500/20 select-none">
                All OpenPilot
              </span>
            }
          >
            <ROW
              label="Record Drives"
              value={c.commaAI.recordDrives ? "On" : "Off"}
            />
            <ROW
              label="Upload on WiFi Only"
              value={c.commaAI.uploadOnlyOnWifi ? "On" : "Off"}
            />
            <ROW
              label="Disengage on Accel"
              value={c.commaAI.disengageOnAccelerator ? "On" : "Off"}
            />
            <ROW
              label="Live Parameters"
              value={c.commaAI.enableLiveParameters ? "On" : "Off"}
            />
            <ROW
              label="E2E Long"
              value={
                c.commaAI.endToEndLong ? (
                  <Badge variant="warning">On</Badge>
                ) : (
                  "Off"
                )
              }
            />
            <ROW label="LDW" value={c.commaAI.ldwEnabled ? "On" : "Off"} />
            <ROW
              label="Hotspot on Boot"
              value={c.commaAI.hotspotOnBoot ? "On" : "Off"}
            />
            <ROW
              label="Comma Connect"
              value={c.commaAI.connectEnabled ? "On" : "Off"}
            />
          </SectionBlock>

          <SectionBlock icon={Wrench} title="Advanced">
            <ROW
              label="Custom Fingerprint"
              value={c.advanced.customFingerprint || "—"}
              mono
            />
            <ROW
              label="Prebuilt"
              value={
                c.advanced.enablePrebuilt ? (
                  <Badge variant="warning">On</Badge>
                ) : (
                  "Off"
                )
              }
            />
            <ROW
              label="Extended Logging"
              value={c.advanced.extendedLogging ? "On" : "Off"}
            />
            <ROW
              label="Developer Mode"
              value={c.advanced.dpDeveloperMode ? "On" : "Off"}
            />
            <ROW
              label="Safety Model"
              value={c.advanced.assertSafetyModel ? "Assert" : "Relaxed"}
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
    </div>
  );
}
