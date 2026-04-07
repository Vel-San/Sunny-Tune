import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  AlertCircle,
  ArrowRight,
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
  Save,
  Share2,
  Upload,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { createConfig, fetchConfig, updateConfig } from "../api";
import { ConfigDiffModal } from "../components/config/ConfigDiffModal";
import { ConfigHistoryModal } from "../components/config/ConfigHistoryModal";
import { ShareModal } from "../components/config/ShareModal";
import { SunnyLinkExportModal } from "../components/config/SunnyLinkExportModal";
import { AdvancedSection } from "../components/config/sections/AdvancedSection";
import { CommaAISection } from "../components/config/sections/CommaAISection";
import { DrivingPersonalitySection } from "../components/config/sections/DrivingPersonalitySection";
import { InterfaceSection } from "../components/config/sections/InterfaceSection";
import { LateralControlSection } from "../components/config/sections/LateralControlSection";
import { LongitudinalSection } from "../components/config/sections/LongitudinalSection";
import { NavigationSection } from "../components/config/sections/NavigationSection";
import { VehicleSection } from "../components/config/sections/VehicleSection";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { computeConfigDiff } from "../lib/configDiff";
import {
  exportConfigAsJson,
  ImportValidationError,
  parseImportFile,
  type SunnyTuneExport,
} from "../lib/configExport";
import { unmarkSeen } from "../lib/seenConfigs";
import { useConfigStore } from "../store/configStore";

const SECTIONS = [
  { id: "vehicle", label: "Vehicle", icon: Car },
  { id: "toggles", label: "Toggles", icon: Gauge },
  { id: "steering", label: "Steering", icon: GitBranch },
  { id: "cruise", label: "Cruise", icon: ArrowUpDown },
  { id: "maps", label: "Maps", icon: Map },
  { id: "visuals", label: "Visuals", icon: Monitor },
  { id: "device", label: "Device", icon: Cpu },
  { id: "developer", label: "Developer", icon: Wrench },
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
    syncTagsCategory,
    activeSection,
    setActiveSection,
    markClean,
  } = useConfigStore();
  const [shareOpen, setShareOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sunnyLinkExportOpen, setSunnyLinkExportOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [saveConfirmDiffOpen, setSaveConfirmDiffOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<SunnyTuneExport | null>(
    null,
  );

  // Block in-app SPA navigation when there are unsaved changes.
  // Use getState() to read the live Zustand value, not the stale React-closure
  // value — this prevents the blocker from firing right after loadConfig() sets
  // isDirty=false but before the component has re-rendered.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      useConfigStore.getState().isDirty &&
      currentLocation.pathname !== nextLocation.pathname,
  );

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

  // Keep a ref to isDirty so the effect below can read the latest value
  // without adding it to the dependency array (avoids re-running on every
  // keystroke while still preventing background refetches from wiping edits).
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  useEffect(() => {
    if (id && existingConfig) {
      // Only re-seed the store when there are no unsaved edits in progress.
      // This prevents a ShareModal tag/category update (which invalidates
      // ["config", id] and triggers a background refetch) from wiping the
      // user's unsaved configurator changes.
      if (!isDirtyRef.current) {
        loadConfig(
          existingConfig.id,
          existingConfig.name,
          existingConfig.description ?? "",
          existingConfig.config,
          existingConfig.tags ?? [],
          existingConfig.category ?? "",
        );
      }
    } else if (!id) {
      initNew();
    }
    // Honour a hash-based deep-link (e.g. /configure/abc#lateral)
    const hash = window.location.hash.slice(1);
    if (hash && SECTIONS.some((s) => s.id === hash)) {
      setTimeout(() => scrollToSection(hash), 300);
    }
  }, [id, existingConfig]);

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
      if (editingId) {
        // Reset the "seen" flag so the Updated badge re-appears on the
        // My Configs page now that the version has (potentially) bumped.
        unmarkSeen(editingId);
      } else {
        // Defer navigation until after React re-renders with isDirty=false so
        // the useBlocker closure sees the clean state and does not fire.
        setTimeout(
          () => navigate(`/configure/${data.id}`, { replace: true }),
          0,
        );
      }
    },
  });

  const handleExport = () => {
    if (!existingConfig) return;
    exportConfigAsJson(existingConfig);
  };

  /** Perform the actual import once confirmed (or immediately if no existing config). */
  const doImport = (imported: SunnyTuneExport) => {
    loadConfig(
      "", // no id — treat as a new config
      imported.name,
      imported.description ?? "",
      imported.config as import("../types/config").SPConfig,
      imported.tags ?? [],
      imported.category ?? "",
    );
    // Navigate away from any existing /configure/:id URL so Save creates a new DB row.
    // isDirty is already false after loadConfig(), so useBlocker won't fire.
    navigate("/configure", { replace: true });
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
        // If there's already a saved config loaded or unsaved changes, ask the
        // user to confirm before overwriting anything.
        if (editingId || isDirty) {
          setPendingImport(imported);
        } else {
          doImport(imported);
        }
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

  // Diff between the currently-loaded config and the pending import.
  const importDiff = useMemo(
    () =>
      pendingImport
        ? computeConfigDiff(
            editingConfig,
            pendingImport.config as import("../types/config").SPConfig,
          )
        : [],
    [pendingImport, editingConfig],
  );
  const importDiffGrouped = useMemo(() => {
    const map: Record<string, typeof importDiff> = {};
    for (const entry of importDiff) {
      (map[entry.sectionLabel] ??= []).push(entry);
    }
    return map;
  }, [importDiff]);

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
    <div className="min-h-[calc(100vh-57px)] flex flex-col lg:flex-row">
      {/* Sidebar nav — desktop only */}
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
              {!editingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                  onClick={handleImportClick}
                  title="Import config from JSON file"
                >
                  <span className="hidden md:inline">Import</span>
                </Button>
              )}
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
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Download className="w-3.5 h-3.5" />}
                onClick={() => setSunnyLinkExportOpen(true)}
                title="Export as SunnyLink device JSON (importable via SunnyLink app)"
              >
                <span className="hidden md:inline">SunnyLink</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                loading={saveMutation.isPending}
                disabled={!isDirty && !!editingId}
                onClick={() => setSaveConfirmOpen(true)}
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

        {/* Mobile section scroll nav — replaces hidden sidebar */}
        <div className="lg:hidden overflow-x-auto scrollbar-hide border-b border-zinc-800 bg-zinc-950/90 backdrop-blur sticky top-[calc(57px+53px)] z-10">
          <div className="flex gap-0.5 px-4 py-2">
            {SECTIONS.map(({ id: sid, label, icon: Icon }) => (
              <button
                key={sid}
                onClick={() => scrollToSection(sid)}
                className={clsx(
                  "flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                  activeSection === sid
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Icon className="w-3 h-3 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

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

          <div id="vehicle" className="scroll-mt-48 lg:scroll-mt-32">
            <VehicleSection />
          </div>
          <div id="toggles" className="scroll-mt-48 lg:scroll-mt-32">
            <DrivingPersonalitySection />
          </div>
          <div id="steering" className="scroll-mt-48 lg:scroll-mt-32">
            <LateralControlSection />
          </div>
          <div id="cruise" className="scroll-mt-48 lg:scroll-mt-32">
            <LongitudinalSection />
          </div>
          <div id="maps" className="scroll-mt-48 lg:scroll-mt-32">
            <NavigationSection />
          </div>
          <div id="visuals" className="scroll-mt-48 lg:scroll-mt-32">
            <InterfaceSection />
          </div>
          <div id="device" className="scroll-mt-48 lg:scroll-mt-32">
            <CommaAISection />
          </div>
          <div id="developer" className="scroll-mt-48 lg:scroll-mt-32">
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
          existingShareToken={existingConfig?.shareToken ?? undefined}
          existingTags={editingTags}
          existingCategory={editingCategory}
          onTagsCategoryUpdate={(tags, category) => {
            syncTagsCategory(tags, category);
          }}
        />
      )}

      {/* SunnyLink export review modal */}
      {sunnyLinkExportOpen && (
        <SunnyLinkExportModal
          config={editingConfig}
          name={editingName}
          onClose={() => setSunnyLinkExportOpen(false)}
        />
      )}

      {/* Import overwrite confirmation modal */}
      <Modal
        open={!!pendingImport}
        onClose={() => setPendingImport(null)}
        title="Replace current config?"
        width="lg"
      >
        {pendingImport && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              You are about to replace{" "}
              <span className="font-medium text-zinc-100">{editingName}</span>{" "}
              with the imported config{" "}
              <span className="font-medium text-zinc-100">
                {pendingImport.name}
              </span>
              . Your current config will be discarded unless you have already
              saved it.
            </p>

            {/* Inline diff */}
            <div className="space-y-1">
              <div className="flex items-center gap-4 text-xs text-zinc-500 border-b border-zinc-800 pb-3">
                <span className="font-medium text-zinc-400">
                  {importDiff.length} change
                  {importDiff.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="text-zinc-500">{editingName}</span>
                  <ArrowRight className="w-3 h-3 text-zinc-700" />
                  <span className="text-zinc-300">{pendingImport.name}</span>
                </span>
              </div>

              {importDiff.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">
                  No parameter differences between the two configs.
                </p>
              )}

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 pt-2">
                {Object.entries(importDiffGrouped).map(
                  ([sectionLabel, entries]) => (
                    <div key={sectionLabel}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                        {sectionLabel}
                      </p>
                      <div className="rounded-lg border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                        {entries.map((entry) => (
                          <div
                            key={entry.field}
                            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-3 py-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                          >
                            <span className="text-xs text-zinc-400 truncate">
                              {entry.label}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-mono px-1.5 py-0.5 rounded",
                                "bg-red-500/10 text-red-400 border border-red-500/20",
                                "line-through decoration-red-400/50",
                              )}
                            >
                              {entry.oldValue}
                            </span>
                            <span
                              className={clsx(
                                "text-xs font-mono px-1.5 py-0.5 rounded",
                                "bg-green-500/10 text-green-400 border border-green-500/20",
                              )}
                            >
                              {entry.newValue}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPendingImport(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => {
                  doImport(pendingImport);
                  setPendingImport(null);
                }}
              >
                Yes, import
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Save confirmation modal */}
      <Modal
        open={saveConfirmOpen}
        onClose={() => {
          setSaveConfirmOpen(false);
          setSaveConfirmDiffOpen(false);
        }}
        title="Confirm save"
        width="md"
      >
        <div className="space-y-4">
          <div className="space-y-1 text-sm text-zinc-300">
            <p>
              <span className="text-zinc-500">Config:</span>{" "}
              <span className="font-medium">{editingName}</span>
            </p>
            {!editingId && (
              <p className="text-xs text-zinc-500">
                This will create a new config.
              </p>
            )}
            {editingId && existingConfig && (
              <p className="text-xs text-zinc-500">
                This will overwrite version{" "}
                <span className="font-mono text-zinc-400">
                  v{existingConfig.version}
                </span>{" "}
                and save a new snapshot.
              </p>
            )}
          </div>

          {/* Show diff button if editing an existing config */}
          {editingId && existingConfig && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSaveConfirmDiffOpen(true)}
              className="w-full justify-center border border-zinc-800"
            >
              View what will change
            </Button>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSaveConfirmOpen(false);
                setSaveConfirmDiffOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              loading={saveMutation.isPending}
              onClick={() => {
                setSaveConfirmOpen(false);
                setSaveConfirmDiffOpen(false);
                saveMutation.mutate();
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Save diff preview — what will change vs. the server copy */}
      {editingId && existingConfig && (
        <ConfigDiffModal
          open={saveConfirmDiffOpen}
          onClose={() => setSaveConfirmDiffOpen(false)}
          original={existingConfig.config}
          modified={editingConfig}
          originalName={`Saved (v${existingConfig.version})`}
          modifiedName="Your changes"
        />
      )}

      {/* Version history modal */}
      {editingId && (
        <ConfigHistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          configId={editingId}
          currentConfig={editingConfig}
          currentName={editingName}
          onRestore={(snapshotConfig, snapshotName) => {
            loadConfig(
              editingId,
              snapshotName,
              existingConfig?.description ?? "",
              snapshotConfig,
              existingConfig?.tags ?? [],
              existingConfig?.category ?? "",
            );
          }}
        />
      )}

      {/* Unsaved-changes navigation guard */}
      <Modal
        open={blocker.state === "blocked"}
        onClose={() => blocker.reset?.()}
        title="Unsaved changes"
      >
        <div className="space-y-4">
          <p className="text-sm text-zinc-300 leading-relaxed">
            You have unsaved changes. If you leave now they will be lost.
          </p>
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => blocker.reset?.()}
            >
              Stay & keep editing
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                markClean();
                blocker.proceed?.();
              }}
            >
              Discard & leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
