import Papa from "papaparse";
import type { WorkplacePersonaAgent, WorkplacePersonaMeta } from "@/types/workplacePersonas";

const BASE = "/data/workplace-personas";

// Same cache-busting approach as lib/honestyPilotData.ts — a different URL
// per page load can't be served from any cache regardless of headers.
const CACHE_BUST = Date.now();
function withCacheBust(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}v=${CACHE_BUST}`;
}

export async function fetchWorkplacePersonaAgents(): Promise<WorkplacePersonaAgent[]> {
  const response = await fetch(withCacheBust(`${BASE}/agents.csv`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load agents.csv (${response.status})`);
  }
  const text = await response.text();
  const { data } = Papa.parse<Record<string, unknown>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return data.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    age: Number(r.age),
    gender: String(r.gender),
    occupation: String(r.occupation),
    traits: [r.trait_1, r.trait_2, r.trait_3, r.trait_4, r.trait_5].map(String),
    narrative: String(r.narrative),
    tags: String(r.tags).split("|"),
  }));
}

export async function fetchWorkplacePersonaMeta(): Promise<WorkplacePersonaMeta> {
  const response = await fetch(withCacheBust(`${BASE}/meta.json`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load meta.json (${response.status})`);
  }
  return (await response.json()) as WorkplacePersonaMeta;
}
