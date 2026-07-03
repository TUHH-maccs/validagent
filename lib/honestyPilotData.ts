import Papa from "papaparse";
import type {
  ExperimentMetaEntry,
  HonestyPilotAgent,
  HonestyPilotMeta,
  HonestyPilotResult,
  HonestyPilotStatsExperiment,
  HonestyPilotStatsResult,
  ReasoningCodeRow,
  TraitMapping,
} from "@/types/honestyPilot";

const BASE = "/data/honesty-pilot";

// These CSV/JSON files change frequently while we're actively iterating on
// the data pipeline. `cache: "no-store"` alone wasn't reliably bypassing
// stale responses (browser disk cache, intermediate proxies, etc.), so bust
// the URL itself with a per-page-load token — a different URL can't be
// served from any cache regardless of headers.
const CACHE_BUST = Date.now();
function withCacheBust(path: string): string {
  return `${path}${path.includes("?") ? "&" : "?"}v=${CACHE_BUST}`;
}

async function fetchCsv<T extends Record<string, unknown>>(path: string): Promise<T[]> {
  const response = await fetch(withCacheBust(path), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  const text = await response.text();
  const { data } = Papa.parse<T>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return data;
}

const toBool = (value: unknown): boolean => value === true || value === "True";
const toStr = (value: unknown): string | null =>
  value === "" || value === null || value === undefined ? null : String(value);

export async function fetchAgents(): Promise<HonestyPilotAgent[]> {
  const rows = await fetchCsv<Record<string, unknown>>(`${BASE}/agents.csv`);
  return rows.map((r) => ({
    agentId: Number(r.agent_id),
    demAge: Number(r.dem_age),
    demGender: toStr(r.dem_gender),
    demEthnicity: toStr(r.dem_ethnicity),
    demEducation: String(r.dem_education),
    demIncome: toStr(r.dem_income),
    demOccupation: String(r.dem_occupation),
    demIndustry: String(r.dem_industry),
    demPolitics: toStr(r.dem_politics),
    demReligion: toStr(r.dem_religion),
    demText: String(r.dem_text),
    hxHh: Number(r.hx_hh),
    hxEm: Number(r.hx_em),
    hxEx: Number(r.hx_ex),
    hxAg: Number(r.hx_ag),
    hxCo: Number(r.hx_co),
    hxOp: Number(r.hx_op),
    psmRisk: Number(r.psm_risk),
    psmPatience: Number(r.psm_patience),
    psmAltruism: Number(r.psm_altruism),
    psmPosRec: Number(r.psm_pos_rec),
    psmNegRec: Number(r.psm_neg_rec),
    psmTrust: Number(r.psm_trust),
    csDeontology: Number(r.cs_deontology),
    csUtilitarianism: Number(r.cs_utilitarianism),
    humanRoll: Number(r.human_roll),
    humanReport: Number(r.human_report),
    humanReason: String(r.human_reason ?? ""),
    humanHonest: toBool(r.human_honest),
  }));
}

export async function fetchResultsForExperiment(experimentId: string): Promise<HonestyPilotResult[]> {
  const rows = await fetchCsv<Record<string, unknown>>(`${BASE}/results/${experimentId}.csv`);
  return rows.map((r) => ({
    experimentId: String(r.experiment_id),
    agentId: Number(r.agent_id),
    runId: Number(r.run_id),
    agentReport: Number(r.agent_report),
    agentReason: String(r.agent_reason ?? ""),
  }));
}

export async function fetchStatsResultsForExperiment(experimentId: string): Promise<HonestyPilotStatsResult[]> {
  const rows = await fetchCsv<Record<string, unknown>>(`${BASE}/stats_results/${experimentId}.csv`);
  return rows.map((r) => ({
    agentId: Number(r.agent_id),
    experimentId: String(r.experiment_id),
    nRuns: Number(r.n_runs),
    nHonest: Number(r.n_honest),
    honestyRate: Number(r.honesty_rate),
  }));
}

export async function fetchStatsExperiments(): Promise<HonestyPilotStatsExperiment[]> {
  const rows = await fetchCsv<Record<string, unknown>>(`${BASE}/stats_experiments.csv`);
  const buckets = ["0", "20", "40", "60", "80", "100"];
  return rows.map((r) => ({
    experimentId: String(r.experiment_id),
    reportPct: [1, 2, 3, 4, 5, 6].map((face) => Number(r[`report_pct_${face}`])),
    honestyDistHonestHumans: Object.fromEntries(
      buckets.map((b) => [b, Number(r[`honesty_dist_honest_humans_${b}`])])
    ),
    honestyDistDishonestHumans: Object.fromEntries(
      buckets.map((b) => [b, Number(r[`honesty_dist_dishonest_humans_${b}`])])
    ),
    kappa: r.kappa === "" || r.kappa === null ? null : Number(r.kappa),
    kappaN: r.kappa_n === "" || r.kappa_n === null ? null : Number(r.kappa_n),
    kappaSe: r.kappa_se === "" || r.kappa_se === null ? null : Number(r.kappa_se),
    kappaSignificant: toBool(r.kappa_significant),
    agentLieRate: Number(r.agent_lie_rate ?? 0),
  }));
}

export async function fetchStatsMeta(): Promise<HonestyPilotMeta> {
  const response = await fetch(withCacheBust(`${BASE}/stats_meta.json`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load stats_meta.json (${response.status})`);
  }
  const raw = (await response.json()) as {
    experiments: Record<string, ExperimentMetaEntry>;
    human_roll_distribution_pct: Record<string, number>;
    human_report_distribution_pct: Record<string, number>;
    human_lie_rate: number;
  };
  return {
    experiments: raw.experiments,
    humanRollDistributionPct: raw.human_roll_distribution_pct,
    humanReportDistributionPct: raw.human_report_distribution_pct,
    humanLieRate: raw.human_lie_rate,
  };
}

export async function fetchReasoningCodes(): Promise<ReasoningCodeRow[]> {
  const rows = await fetchCsv<Record<string, unknown>>(`${BASE}/reasoning_codes.csv`);
  const meta = new Set(["subject_type", "agent_id", "main_id", "experiment_id", "run_id"]);
  return rows.map((r) => {
    const codes: Record<string, 0 | 1> = {};
    for (const key of Object.keys(r)) {
      if (!meta.has(key)) {
        codes[key] = Number(r[key]) === 1 ? 1 : 0;
      }
    }
    return {
      subjectType: r.subject_type === "human" ? "human" : "agent",
      agentId: Number(r.agent_id),
      mainId: Number(r.main_id),
      experimentId: String(r.experiment_id),
      runId: r.run_id === "" || r.run_id === null || r.run_id === undefined ? null : Number(r.run_id),
      codes,
    };
  });
}

export async function fetchTraitMapping(name: "hx" | "psm" | "cs"): Promise<TraitMapping> {
  const response = await fetch(withCacheBust(`${BASE}/mappings/${name}.json`), { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${name}.json (${response.status})`);
  }
  return (await response.json()) as TraitMapping;
}
