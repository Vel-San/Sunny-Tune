/**
 * Shared color utilities for category badges and tag chips.
 */

// ─── Category colors ──────────────────────────────────────────────────────────

export function categoryColor(category: string | undefined | null): string {
  switch (category) {
    case "daily-driver":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "comfort":
      return "bg-teal-500/15 text-teal-400 border-teal-500/30";
    case "performance":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "economy":
      return "bg-lime-500/15 text-lime-400 border-lime-500/30";
    case "highway":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "city":
      return "bg-violet-500/15 text-violet-400 border-violet-500/30";
    case "experimental":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "developer":
      return "bg-zinc-600/20 text-zinc-400 border-zinc-600/40";
    case "community-pick":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    default:
      return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
  }
}

// ─── Tag colors ───────────────────────────────────────────────────────────────

const TAG_PALETTES = [
  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "bg-teal-500/10 text-teal-400 border-teal-500/20",
  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  "bg-lime-500/10 text-lime-400 border-lime-500/20",
];

/** Returns a deterministic pastel color class string for a given tag string. */
export function tagColor(tag: string): string {
  let hash = 0;
  for (const ch of tag) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TAG_PALETTES[hash % TAG_PALETTES.length];
}

// ─── Vehicle make display labels ─────────────────────────────────────────────

/** Maps internal CarMake values to their display labels. */
export const MAKE_LABELS: Record<string, string> = {
  acura: "Acura",
  audi: "Audi",
  chevrolet: "Chevrolet",
  chrysler: "Chrysler",
  comma: "comma (body)",
  cupra: "CUPRA",
  dodge: "Dodge",
  ford: "Ford",
  genesis: "Genesis",
  gmc: "GMC",
  honda: "Honda",
  hyundai: "Hyundai",
  jeep: "Jeep",
  kia: "Kia",
  lexus: "Lexus",
  lincoln: "Lincoln",
  man: "MAN",
  mazda: "Mazda",
  nissan: "Nissan",
  ram: "Ram",
  rivian: "Rivian",
  seat: "SEAT",
  subaru: "Subaru",
  skoda: "\u0160koda",
  tesla: "Tesla",
  toyota: "Toyota",
  volkswagen: "Volkswagen",
  // Legacy — not selectable in editor but kept so existing configs display correctly
  other: "Other",
};
