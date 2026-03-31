import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchConfigs } from "../api";
import { ConfigCard } from "../components/config/ConfigCard";
import { Button } from "../components/ui/Button";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 animate-pulse space-y-3">
      <div className="h-3 bg-zinc-800 rounded w-1/3" />
      <div className="h-5 bg-zinc-800 rounded w-2/3" />
      <div className="h-3 bg-zinc-800 rounded w-full" />
      <div className="h-3 bg-zinc-800 rounded w-5/6" />
      <div className="flex gap-2 pt-2">
        <div className="h-5 bg-zinc-800 rounded w-16" />
        <div className="h-5 bg-zinc-800 rounded w-20" />
      </div>
    </div>
  );
}

export default function MyConfigsPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["configs"],
    queryFn: fetchConfigs,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">My Configurations</h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            {data
              ? `${data.length} config${data.length !== 1 ? "s" : ""}`
              : "Loading…"}
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate("/configure")}
        >
          New Config
        </Button>
      </div>

      {/* Error */}
      {isError && (
        <div className="text-center py-12 text-red-400 text-sm">
          Failed to load configurations. Please try again.
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && data?.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <FolderOpen className="w-6 h-6 text-zinc-600" />
          </div>
          <h2 className="text-base font-semibold text-zinc-300 mb-1">
            No configurations yet
          </h2>
          <p className="text-sm text-zinc-600 mb-6 max-w-xs">
            Create your first SunnyPilot configuration to get started.
          </p>
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => navigate("/configure")}
          >
            Create Configuration
          </Button>
        </div>
      )}

      {/* Config grid */}
      {!isLoading && !isError && data && data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((config) => (
            <ConfigCard key={config.id} config={config} />
          ))}
        </div>
      )}
    </div>
  );
}
