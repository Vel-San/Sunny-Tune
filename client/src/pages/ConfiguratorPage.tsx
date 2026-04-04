import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowUpDown,
  Car,
  CheckCircle2,
  Clock,
  Cpu,
  Download,
  Gauge,
  GitBranch,
  Map,
  Monitor,
  RotateCcw,
  Save,
  Share2,
  TrendingUp,
  Upload,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createConfig,
  fetchConfig,
  fetchConfigHistory,
  fetchConfigSnapshot,
  updateConfig,
} from "../api";
import { ConfigDiffModal } from "../components/config/ConfigDiffModal";
import { ShareModal } from "../components/config/ShareModal";
import { AdvancedSection } from "../components/config/sections/AdvancedSection";
import { CommaAISection } from "../components/config/sections/CommaAISection";
import { DrivingPersonalitySection } from "../components/config/sections/DrivingPersonalitySection";
import { InterfaceSection } from "../components/config/sections/InterfaceSection";
import { LaneChangeSection } from "../components/config/sections/LaneChangeSection";
import { LateralControlSection } from "../components/config/sections/LateralControlSection";
import { LongitudinalSection } from "../components/config/sections/LongitudinalSection";
import { NavigationSection } from "../components/config/sections/NavigationSection";
import { SpeedControlSection } from "../components/config/sections/SpeedControlSection";
import { VehicleSection } from "../components/config/sections/VehicleSection";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import {
  exportAsSunnyLink,
  exportConfigAsJson,
  ImportValidationError,
  parseImportFile,
} from "../lib/configExport";
import { useConfigStore } from "../store/configStore";
import type { ConfigSnapshotMeta } from "../types/config";

const SECTIONS = [
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "driving-personality", label: "Driving", icon: Gauge },
  { id: "lateral", label: "Lateral", icon: GitBranch },
  { id: "longitudinal", label: "Longitudinal", icon: ArrowUpDown },
  { id: "speed-control", label: "Speed", icon: TrendingUp },
  { id: "lane-change", label: "Lane Change", icon: ArrowLeftRight },
  { id: "navigation", label: "Navigation", icon: Map },
  { id: "interface", label: "Interface", icon: Monitor },
  { id: "comma-ai", label: "Comma AI", icon: Cpu },
  { id: "advanced", label: "Advanced", icon: Wrench },
];

export default function ConfiguratorPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const {
    editingConfig,
    editingId,
    editingName,
    editingDescription,
    editingTags,
    editingCategory,
    isDirty,
    initNew,
    loadConfig,
    setName,
    setDescription,
    activeSection,
    setActiveSection,
    markClean,
  } = useConfigStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] =
    useState<ConfigSnapshotMeta | null>(null);
  const [snapshotDiffOpen, setSnapshotDiffOpen] = useState(false);

  // Warn on browser refresh / tab close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Load existing config for editing
  const { data: existingConfig } = useQuery({
    queryKey: ["config", id],
    queryFn: () => fetchConfig(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (id && existingConfig) {
      loadConfig(
        existingConfig.id,
        existingConfig.name,
        existingConfig.description ?? "",
        existingConfig.config,
        existingConfig.tags ?? [],
        existingConfig.category ?? "",
      );
    } else if (!id) {
      initNew();
    }
    // Honour a hash-based deep-link (e.g. /configure/abc#lateral)
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => scrollToSection(hash), 300);
    }
  }, [id, existingConfig]);

  // History (version snapshots)
  const { data: historyList = [] } = useQuery({
    queryKey: ["config-history", editingId],
    queryFn: () => fetchConfigHistory(editingId!),
    enabled: !!editingId && historyOpen,
  });

  const { data: snapshotData } = useQuery({
    queryKey: ["config-snapshot", editingId, selectedSnapshot?.id],
    queryFn: () => fetchConfigSnapshot(editingId!, selectedSnapshot!.id),
    enabled: !!editingId && !!selectedSnapshot,
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: editingName,
        description: editingDescription || undefined,
        vehicleMake: editingConfig.vehicle.make,
        vehicleModel: editingConfig.vehicle.model || undefined,
        vehicleYear: editingConfig.vehicle.year,
        config: editingConfig,
        tags: editingTags,
        category: editingCategory || undefined,
      };
      return editingId
        ? updateConfig(editingId, payload)
        : createConfig(payload);
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["configs"] });
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (!editingId) {
        navigate(`/configure/${data.id}`, { replace: true });
      }
    },
  });

  const handleExport = () => {
    if (!existingConfig) return;
    exportConfigAsJson(existingConfig);
  };

  const handleImportClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.sunnytune.json,.sunnylink.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setImportError(null);
      try {
        const imported = await parseImportFile(file);
        // Load the imported config into the editor — it starts as a new unsaved config
        loadConfig(
          "", // no id — treat as a new config
          imported.name,
          imported.description ?? "",
          imported.config as import("../types/config").SPConfig,
          imported.tags ?? [],
          imported.category ?? "",
        );
        // Clear the editing id so Save creates a new DB row
        navigate("/configure", { replace: true });
      } catch (err) {
        setImportError(
          err instanceof ImportValidationError
            ? err.message
            : "Failed to import file.",
        );
      }
    };
    input.click();
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    // Keep the URL hash in sync so the link can be shared / book-marked
    history.replaceState(null, "", `#${sectionId}`);
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const isReadOnly = false; // isReadOnly no longer locks editing; admin-locked configs use admin routes

  return (
    <div className="min-h-[calc(100vh-57px)] flex">
      {/* Sidebar nav */}
      <aside className="hidden lg:flex flex-col w-48 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto py-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 px-4 mb-2">
          Sections
        </p>
        <nav className="flex flex-col gap-0.5 px-2">
          {SECTIONS.map(({ id: sid, label, icon: Icon }) => (
            <button
              key={sid}
              onClick={() => scrollToSection(sid)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-left transition-colors",
                activeSection === sid
                  ? "bg-zinc-800 text-zinc-100 border-l-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900",
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main form area */}
      <div className="flex-1 min-w-0">
        {/* Sticky top bar */}
        <div className="sticky top-[57px] z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <Input
              value={editingName}
              onChange={(e) => setName(e.target.value)}
              placeholder="Config name…"
              className="bg-transparent border-transparent hover:border-zinc-700 focus:border-blue-500 h-8 text-sm font-semibold"
              readOnly={isReadOnly}
            />
          </div>

          {isReadOnly ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <AlertCircle className="w-3.5 h-3.5" />
              Read-only
            </div>
          ) : (
            <>
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-xs text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {isDirty && !saved && (
                <span className="text-xs text-zinc-600">Unsaved changes</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={handleImportClick}
                title="Import config from JSON file"
              >
                <span className="hidden md:inline">Import</span>
              </Button>
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Clock className="w-3.5 h-3.5" />}
                  onClick={() => setHistoryOpen(true)}
                  title="Version history"
                >
                  <span className="hidden md:inline">History</span>
                </Button>
              )}
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleExport}
                  title="Export config as SunnyTune JSON"
                >
                  <span className="hidden md:inline">Export</span>
                </Button>
              )}
              {editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  onClick={() =>
                    existingConfig && exportAsSunnyLink(existingConfig)
                  }
                  title="Export as SunnyLink device JSON (importable via SunnyLink app)"
                >
                  <span className="hidden md:inline">SunnyLink</span>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                Save
              </Button>
              {editingId && (
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Share2 className="w-3.5 h-3.5" />}
                  onClick={() => setShareOpen(true)}
                  disabled={isDirty}
                >
                  Share
                </Button>
              )}
            </>
          )}
        </div>

        {/* Description bar */}
        {!isReadOnly && (
          <div className="px-4 pt-3 pb-1">
            <input
              value={editingDescription}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description (optional)…"
              className="w-full bg-transparent text-xs text-zinc-500 placeholder:text-zinc-700 focus:outline-none focus:text-zinc-300 py-1"
            />
          </div>
        )}

        {/* Config sections */}
        <div className="px-4 pt-3 pb-12 space-y-3 max-w-3xl mx-auto w-full">
          {importError && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {importError}
            </div>
          )}
          {saveMutation.isError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {saveMutation.error?.message ?? "Failed to save"}
            </div>
          )}

          <div id="vehicle" className="scroll-mt-20">
            <VehicleSection />
          </div>
          <div id="driving-personality" className="scroll-mt-20">
            <DrivingPersonalitySection />
          </div>
          <div id="lateral" className="scroll-mt-20">
            <LateralControlSection />
          </div>
          <div id="longitudinal" className="scroll-mt-20">
            <LongitudinalSection />
          </div>
          <div id="speed-control" className="scroll-mt-20">
            <SpeedControlSection />
          </div>
          <div id="lane-change" className="scroll-mt-20">
            <LaneChangeSection />
          </div>
          <div id="navigation" className="scroll-mt-20">
            <NavigationSection />
          </div>
          <div id="interface" className="scroll-mt-20">
            <InterfaceSection />
          </div>
          <div id="comma-ai" className="scroll-mt-20">
            <CommaAISection />
          </div>
          <div id="advanced" className="scroll-mt-20">
            <AdvancedSection />
          </div>
        </div>
      </div>

      {editingId && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          configId={editingId}
          configName={editingName}
        />
      )}

      {/* Version history modal */}
      <Modal
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setSelectedSnapshot(null);
        }}
        title="Version History"
        width="md"
      >
        <div className="space-y-2">
          {historyList.length === 0 && (
            <p className="text-sm text-zinc-500 py-4 text-center">
              No snapshots yet. Snapshots are saved automatically each time you
              save the config.
            </p>
          )}
          {historyList.map((snap) => (
            <div
              key={snap.id}
              className={`flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedSnapshot?.id === snap.id
                  ? "border-blue-500/50 bg-blue-950/20"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => setSelectedSnapshot(snap)}
            >
              <div>
                <p className="text-sm text-zinc-200 font-medium">
                  v{snap.version} — {snap.name}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {new Date(snap.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {selectedSnapshot?.id === snap.id && snapshotData?.data && (
                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={<ArrowLeftRight className="w-3 h-3" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSnapshotDiffOpen(true);
                    }}
                  >
                    Diff
                  </Button>
                )}
                {selectedSnapshot?.id === snap.id && snapshotData?.data && (
                  <Button
                    variant="secondary"
                    size="xs"
                    leftIcon={<RotateCcw className="w-3 h-3" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (
                        confirm(
                          `Restore to v${snap.version}? Unsaved changes will be overwritten.`,
                        )
                      ) {
                        loadConfig(
                          editingId!,
                          snap.name,
                          existingConfig?.description ?? "",
                          snapshotData.data!,
                          existingConfig?.tags ?? [],
                          existingConfig?.category ?? "",
                        );
                        setHistoryOpen(false);
                        setSelectedSnapshot(null);
                      }
                    }}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Snapshot diff modal */}
      {selectedSnapshot && snapshotData?.data && (
        <ConfigDiffModal
          open={snapshotDiffOpen}
          onClose={() => setSnapshotDiffOpen(false)}
          original={snapshotData.data}
          modified={editingConfig}
          originalName={`v${selectedSnapshot.version} (${new Date(selectedSnapshot.createdAt).toLocaleDateString()})`}
          modifiedName="Current"
        />
      )}
    </div>
  );
}
