import Papa from "papaparse";
import type { AgentOrigin, ExampleAgent, ExamplesMeta } from "@/types/examples";

const BASE = "/data/examples";

// Same cache-busting approach as lib/honestyPilotData.ts and
// lib/workplacePersonasData.ts — a different URL per page load can't be
// served from any cache regardless of headers.
const CACHE_BUST = Date.now();
function withCacheBust(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}v=${CACHE_BUST}`;
}

export async function fetchExampleAgents(): Promise<ExampleAgent[]> {
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
    task: String(r.task),
    persona: String(r.persona),
    origin: String(r.origin) as AgentOrigin,
    traits: String(r.traits).split("|"),
    tags: String(r.tags).split("|"),
    promptTemplate: String(r.promptTemplate),
    exampleOutput: String(r.exampleOutput),
    howToReproduce: String(r.howToReproduce),
    createdAt: String(r.createdAt),
    updatedAt: String(r.updatedAt),
  }));
}

export async function fetchExamplesMeta(): Promise<ExamplesMeta> {
  const response = await fetch(withCacheBust(`${BASE}/meta.json`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load meta.json (${response.status})`);
  }
  return (await response.json()) as ExamplesMeta;
}
