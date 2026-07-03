import type { TraitMapping, TraitStyle } from "@/types/honestyPilot";

// Looks up the "lo-hi" bucket a raw value falls into for a given
// dimension + style (adj/dsc/pct — score never uses this, it's a raw passthrough).
export function resolveTraitText(
  mapping: TraitMapping,
  dimensionKey: string,
  style: TraitStyle,
  value: number
): string {
  const buckets = mapping[dimensionKey]?.[style];
  if (!buckets) return "[N/A]";

  for (const [range, label] of Object.entries(buckets)) {
    const [lo, hi] = range.split("-").map(Number);
    if (value >= lo && value <= hi) return label;
  }
  return "[N/A]";
}
