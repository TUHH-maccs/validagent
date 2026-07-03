"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CHART_COLORS, TUHH_COLORS } from "@/lib/colors";
import {
  fetchAgents,
  fetchReasoningCodes,
  fetchResultsForExperiment,
  fetchStatsExperiments,
  fetchStatsMeta,
  fetchStatsResultsForExperiment,
  fetchTraitMapping,
} from "@/lib/honestyPilotData";
import { FischbacherPlot } from "@/components/charts/FischbacherPlot";
import { ValidationBoxplot, type AgentValidationPoint } from "@/components/charts/ValidationBoxplot";
import { HonestyPilotAgentCard, agentPctColor } from "@/components/HonestyPilotAgentCard";
import type {
  HonestyPilotAgent,
  HonestyPilotMeta,
  HonestyPilotResult,
  HonestyPilotStatsExperiment,
  HonestyPilotStatsResult,
  PilotModule,
  ReasoningCodeRow,
  TraitStyle,
} from "@/types/honestyPilot";
import type { TraitMappings } from "@/lib/renderPrompt";

const MODULES: { key: PilotModule; label: string }[] = [
  { key: "D", label: "Demographics" },
  { key: "PT", label: "Personality Traits" },
  { key: "EP", label: "Economic Preferences" },
  { key: "MO", label: "Moral Orientation" },
];

const STYLES: { key: TraitStyle; label: string }[] = [
  { key: "score", label: "Score" },
  { key: "pct", label: "Percentile" },
  { key: "adj", label: "Adjective" },
  { key: "dsc", label: "Descriptive" },
];

const PAGE_SIZE = 20;
const AGENT_PCT_BUCKETS = [0, 20, 40, 60, 80, 100];
const REASONING_EXPERIMENT_ID = "10010";

// Export format options. Only "agent-ids" is actually implemented; the
// framework options are listed (disabled) as a preview of planned exports.
const EXPORT_FORMATS: { key: string; label: string; disabled?: boolean }[] = [
  { key: "agent-ids", label: "Agent IDs" },
  { key: "genagents", label: "GenAgents", disabled: true },
  { key: "concordia", label: "Concordia", disabled: true },
  { key: "sotopia", label: "Sotopia", disabled: true },
  { key: "edsl", label: "EDSL", disabled: true },
  { key: "oasis", label: "OASIS", disabled: true },
];

// Fixed rendering order regardless of the order modules were toggled on.
const MODULE_ORDER: PilotModule[] = ["D", "PT", "EP", "MO"];

// Combination-mode conditions (11001-11011) don't have a user-selectable
// style like single-module mode does — each module was run with its own
// fixed style in the actual study: PT=Adjective, EP=Descriptive,
// MO=Percentile (not uniformly "Descriptive" as originally assumed).
const COMBINATION_STYLES: Partial<Record<PilotModule, TraitStyle>> = {
  PT: "adj",
  EP: "dsc",
  MO: "pct",
};

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1 rounded-full font-medium border transition-colors"
      style={{
        backgroundColor: active ? color : TUHH_COLORS.white,
        borderColor: active ? color : TUHH_COLORS.light,
        color: active ? TUHH_COLORS.white : TUHH_COLORS.gray,
      }}
    >
      {children}
    </button>
  );
}
// Payout per die face 1-6 (analysis.md PAYOUT_MAP) — differs from the legacy
// prestudy2 payout table, so this is passed explicitly rather than relying
// on FischbacherPlot's default.
const HONESTY_PILOT_PAYOUTS = [0.25, 0.5, 1.0, 2.0, 4.0, 0.0];

function resolveExperimentId(
  meta: HonestyPilotMeta,
  activeModules: Set<PilotModule>,
  style: TraitStyle
): string | null {
  for (const [id, entry] of Object.entries(meta.experiments)) {
    const entryModules = new Set(entry.modules);
    if (entryModules.size !== activeModules.size) continue;
    let same = true;
    for (const m of activeModules) {
      if (!entryModules.has(m)) {
        same = false;
        break;
      }
    }
    if (!same) continue;
    if (entry.style && entry.style !== style) continue;
    return id;
  }
  return null;
}

export function HonestyPilotSetClient() {
  // Static/shared data, fetched once.
  const [agents, setAgents] = useState<HonestyPilotAgent[] | null>(null);
  const [meta, setMeta] = useState<HonestyPilotMeta | null>(null);
  const [statsExperiments, setStatsExperiments] = useState<HonestyPilotStatsExperiment[] | null>(null);
  const [mappings, setMappings] = useState<TraitMappings | null>(null);
  const [reasoningCodes, setReasoningCodes] = useState<ReasoningCodeRow[] | null>(null);

  // Config selection.
  // Defaults to the best-aligned condition (10010: Economic Preferences, Descriptive).
  const [mode, setMode] = useState<"single" | "combination">("single");
  const [activeModules, setActiveModules] = useState<Set<PilotModule>>(new Set(["EP"]));
  const [style, setStyle] = useState<TraitStyle>("dsc");

  // Per-experiment data, refetched when the resolved experiment changes.
  const [results, setResults] = useState<HonestyPilotResult[] | null>(null);
  const [statsResults, setStatsResults] = useState<HonestyPilotStatsResult[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Agent list: search, tag filters, and "Show More" pagination.
  const [searchQuery, setSearchQuery] = useState("");
  const [humanFilter, setHumanFilter] = useState<Set<"honest" | "dishonest">>(new Set());
  const [agentPctFilter, setAgentPctFilter] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Export selection. Persists across filter/config changes on purpose — it's
  // an explicit picks list, not scoped to the current view. Export behavior
  // itself (what "selected" vs. "filtered, none selected" produces) is
  // defined later; this just tracks which agent IDs are checked.
  const [selectedForExport, setSelectedForExport] = useState<Set<number>>(new Set());
  // Only "Agent IDs" is actually implemented today; the framework options are
  // shown (disabled) so it's visible what's planned, without pretending
  // format-specific export already exists.
  const [exportFramework, setExportFramework] = useState("agent-ids");

  useEffect(() => {
    Promise.all([
      fetchAgents(),
      fetchStatsMeta(),
      fetchStatsExperiments(),
      fetchTraitMapping("hx"),
      fetchTraitMapping("psm"),
      fetchTraitMapping("cs"),
    ])
      .then(([a, m, se, hx, psm, cs]) => {
        setAgents(a);
        setMeta(m);
        setStatsExperiments(se);
        setMappings({ hx, psm, cs });
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  const experimentId = useMemo(
    () => (meta ? resolveExperimentId(meta, activeModules, style) : null),
    [meta, activeModules, style]
  );

  useEffect(() => {
    if (!experimentId) return;
    // Deliberately don't clear results/statsResults before the new data
    // arrives — keeps the boxplot/agent cards showing the previous
    // condition's data in place instead of unmounting, then updates the
    // points once the fetch resolves (matching how the Fischbacher plot
    // already behaves, since it only reads already-loaded data).
    let cancelled = false;
    Promise.all([fetchResultsForExperiment(experimentId), fetchStatsResultsForExperiment(experimentId)])
      .then(([r, sr]) => {
        if (cancelled) return;
        setResults(r);
        setStatsResults(sr);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [experimentId]);

  useEffect(() => {
    if (experimentId !== REASONING_EXPERIMENT_ID || reasoningCodes) return;
    fetchReasoningCodes()
      .then(setReasoningCodes)
      .catch((err: Error) => setLoadError(err.message));
  }, [experimentId, reasoningCodes]);

  function toggleModule(mod: PilotModule) {
    setActiveModules((prev) => {
      if (mode === "single") {
        return prev.has(mod) ? new Set() : new Set([mod]);
      }
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }

  function switchMode(next: "single" | "combination") {
    setMode(next);
    setActiveModules(new Set());
  }

  const experimentLabel = experimentId && meta ? meta.experiments[experimentId].label : "—";
  const singleStyleModule = mode === "single" && [...activeModules].find((m) => m !== "D");
  const orderedActiveModules = MODULE_ORDER.filter((m) => activeModules.has(m));
  const moduleStyles: Partial<Record<PilotModule, TraitStyle>> =
    mode === "single"
      ? singleStyleModule ? { [singleStyleModule]: style } : {}
      : COMBINATION_STYLES;

  const currentExpStats = useMemo(
    () => statsExperiments?.find((e) => e.experimentId === experimentId) ?? null,
    [statsExperiments, experimentId]
  );
  const bestExperiment = useMemo(() => {
    if (!statsExperiments || !meta) return null;
    const best = statsExperiments.reduce((a, b) => ((b.kappa ?? -Infinity) > (a.kappa ?? -Infinity) ? b : a));
    return best.kappa === null ? null : { ...best, label: meta.experiments[best.experimentId]?.label };
  }, [statsExperiments, meta]);

  const distributionData = useMemo(() => {
    if (!meta || !statsExperiments || !experimentId) return null;
    const expRow = statsExperiments.find((e) => e.experimentId === experimentId);
    if (!expRow) return null;
    const rollPct = [1, 2, 3, 4, 5, 6].map((f) => meta.humanRollDistributionPct[String(f)] ?? 0);
    const humanPct = [1, 2, 3, 4, 5, 6].map((f) => meta.humanReportDistributionPct[String(f)] ?? 0);
    return { rollPct, humanPct, agentPct: expRow.reportPct };
  }, [meta, statsExperiments, experimentId]);

  const srByAgent = useMemo(
    () => new Map((statsResults ?? []).map((sr) => [sr.agentId, sr])),
    [statsResults]
  );

  const validationPoints: AgentValidationPoint[] | null = useMemo(() => {
    if (!agents || !statsResults) return null;
    return agents
      .map((a) => {
        const sr = srByAgent.get(a.agentId);
        if (!sr) return null;
        return {
          id: String(a.agentId),
          name: `Agent #${a.agentId}`,
          humanHonest: a.humanHonest,
          agentHonestRate: sr.honestyRate,
          hexacoHH: a.hxHh,
        };
      })
      .filter((p): p is AgentValidationPoint => p !== null);
  }, [agents, statsResults, srByAgent]);

  // Search accepts comma-separated agent IDs only (e.g. "12, 45, 301").
  const searchIds = useMemo(() => {
    const ids = searchQuery
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .map((s) => Number(s))
      .filter((n) => Number.isInteger(n));
    return ids.length > 0 ? new Set(ids) : null;
  }, [searchQuery]);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter((a) => {
      if (searchIds && !searchIds.has(a.agentId)) return false;
      if (humanFilter.size > 0 && !humanFilter.has(a.humanHonest ? "honest" : "dishonest")) return false;
      if (agentPctFilter.size > 0) {
        const rate = srByAgent.get(a.agentId)?.honestyRate ?? null;
        if (rate === null || !agentPctFilter.has(Math.round(rate * 100))) return false;
      }
      return true;
    });
  }, [agents, srByAgent, searchIds, humanFilter, agentPctFilter]);

  // Reset pagination whenever the config or any filter narrows/changes the list.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [experimentId, searchIds, humanFilter, agentPctFilter]);

  const visibleAgents = useMemo(
    () => filteredAgents.slice(0, visibleCount),
    [filteredAgents, visibleCount]
  );

  function toggleHumanFilter(status: "honest" | "dishonest") {
    setHumanFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function toggleAgentPctFilter(pct: number) {
    setAgentPctFilter((prev) => {
      const next = new Set(prev);
      if (next.has(pct)) next.delete(pct);
      else next.add(pct);
      return next;
    });
  }

  function toggleExportSelected(agentId: number) {
    setSelectedForExport((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }

  // Scope: if any agents are checked, export exactly those (regardless of
  // active filters — the checkboxes are a filter-independent pick list);
  // otherwise export whatever's currently filtered (all agents when no
  // filter is active).
  const exportAgents = selectedForExport.size > 0
    ? (agents ?? []).filter((a) => selectedForExport.has(a.agentId))
    : filteredAgents;

  // Placeholder export: just the agent IDs as JSON. Real export
  // format/content still TBD.
  function handleExport() {
    const ids = exportAgents.map((a) => a.agentId);
    const blob = new Blob([JSON.stringify(ids, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "honesty-pilot-agent-ids.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (loadError) {
    return <div className="max-w-[1344px] mx-auto px-4 py-12 text-red-600">Failed to load data: {loadError}</div>;
  }

  if (!agents || !meta || !statsExperiments || !mappings) {
    return <div className="max-w-[1344px] mx-auto px-4 py-12 text-gray-500">Loading Honesty Pilot data…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-8 py-4 border-b border-gray-100">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">ValidAgent</span>
              <span className="text-sm font-medium text-gray-500">Repository</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/sets" className="text-sm font-medium text-tuhh-cyan border-b-2 border-tuhh-cyan pb-1">
                Agent Sets
              </Link>
              <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors">
                Projects
              </Link>
              <Link href="/resources" className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors">
                Resources
              </Link>
            </div>
          </nav>

          <div className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-10">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Honesty Pilot</h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  {agents.length} agents, each modeling a real participant from the Die Roll Honesty Paradigm
                  (Fischbacher &amp; Föllmi-Heusi, 2013), across {Object.keys(meta.experiments).length} prompt
                  configurations.
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span><strong>Domain:</strong> behavioral economics</span>
                  <span><strong>Agents:</strong> {agents.length}</span>
                </div>
              </div>

              {/* Alignment score */}
              <div className="bg-gray-50 rounded-lg p-4 w-[380px] flex-shrink-0 ml-auto">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Alignment
                </h3>
                <div className="text-sm">
                  <p className="text-gray-700">
                    Humans: <strong>{(meta.humanLieRate * 100).toFixed(1)}%</strong> dishonest · Agents:{" "}
                    <strong>{currentExpStats ? (currentExpStats.agentLieRate * 100).toFixed(1) : "—"}%</strong>
                  </p>
                  {currentExpStats?.kappa !== null && currentExpStats?.kappa !== undefined ? (
                    <p className="font-medium text-gray-900 mt-1">
                      Cohen&apos;s κ = {currentExpStats.kappa.toFixed(3)}
                      {currentExpStats.kappaSignificant ? "*" : ""}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic mt-1">Alignment not available</p>
                  )}
                  {bestExperiment && (
                    <p className="text-gray-500 text-xs mt-1">
                      Best: {bestExperiment.label} (κ={bestExperiment.kappa?.toFixed(3)})
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Config selector + charts, wrapped together so the config banner's
          sticky range is bounded to this section's height. Once the wrapper
          scrolls fully past (i.e. the charts are done), the sticky banner
          has nowhere left to stick and gets pushed away with it — right as
          the filter banner below arrives at the top and takes over. */}
      <div className="relative">
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => switchMode("single")}
                className="text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{
                  backgroundColor: mode === "single" ? `${TUHH_COLORS.turquoise}20` : "transparent",
                  color: mode === "single" ? TUHH_COLORS.turquoise : TUHH_COLORS.gray,
                }}
              >
                Single module
              </button>
              <button
                onClick={() => switchMode("combination")}
                className="text-sm px-3 py-1.5 rounded-lg font-medium"
                style={{
                  backgroundColor: mode === "combination" ? `${TUHH_COLORS.turquoise}20` : "transparent",
                  color: mode === "combination" ? TUHH_COLORS.turquoise : TUHH_COLORS.gray,
                }}
              >
                Combination
              </button>
              <span className="ml-auto text-xs text-gray-400 font-mono">{experimentLabel}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MODULES.map(({ key, label }) => {
                const active = activeModules.has(key);
                const showStyle = mode === "single" && key !== "D" && singleStyleModule === key;
                return (
                  <div
                    key={key}
                    className="rounded-lg overflow-hidden transition-colors"
                    style={{
                      backgroundColor: active ? TUHH_COLORS.greenblue : TUHH_COLORS.white,
                      border: `1px solid ${active ? TUHH_COLORS.greenblue : TUHH_COLORS.light}`,
                    }}
                  >
                    <button
                      onClick={() => toggleModule(key)}
                      className="w-full text-left px-3 py-2 text-sm font-medium"
                      style={{ color: active ? TUHH_COLORS.white : TUHH_COLORS.gray }}
                    >
                      {label}
                    </button>
                    {showStyle && (
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value as TraitStyle)}
                        className="w-full text-xs px-2 py-1.5 border-t bg-transparent"
                        style={{ borderColor: "rgba(255,255,255,0.3)", color: TUHH_COLORS.white }}
                      >
                        {STYLES.map((s) => (
                          <option key={s.key} value={s.key} style={{ color: TUHH_COLORS.white, backgroundColor: TUHH_COLORS.greenblue }}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Aggregate charts */}
        <div className="bg-slate-100 border-b border-gray-200">
          <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {distributionData && (
                <FischbacherPlot data={distributionData} experimentId={experimentLabel} payouts={HONESTY_PILOT_PAYOUTS} />
              )}
              {validationPoints && (
                <ValidationBoxplot agents={validationPoints} experimentId={experimentLabel} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter row — sticky banner, takes over from the config banner above
          once scrolled into place, then stays pinned through the agent list. */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start justify-between gap-4">
            {/* Left column: search box + toggle filters stack tightly
                together here, independent of the export column's height. */}
            <div className="flex-1">
              <div className="relative max-w-md">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by agent ID(s), comma-separated…"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  style={{ borderColor: TUHH_COLORS.light }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-0.5">Human</span>
                  <FilterChip active={humanFilter.has("honest")} onClick={() => toggleHumanFilter("honest")} color={CHART_COLORS.honest}>
                    Honest
                  </FilterChip>
                  <FilterChip active={humanFilter.has("dishonest")} onClick={() => toggleHumanFilter("dishonest")} color={CHART_COLORS.dishonest}>
                    Dishonest
                  </FilterChip>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-0.5">Agent</span>
                  {AGENT_PCT_BUCKETS.map((pct) => (
                    <FilterChip
                      key={pct}
                      active={agentPctFilter.has(pct)}
                      onClick={() => toggleAgentPctFilter(pct)}
                      color={agentPctColor(pct / 100)}
                    >
                      {pct}%
                    </FilterChip>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="flex items-center justify-end gap-2">
                <select
                  value={exportFramework}
                  onChange={(e) => setExportFramework(e.target.value)}
                  className="text-xs px-2 py-2 border rounded-lg"
                  style={{ borderColor: TUHH_COLORS.light, color: TUHH_COLORS.dark }}
                >
                  {EXPORT_FORMATS.map((f) => (
                    <option key={f.key} value={f.key} disabled={f.disabled}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleExport}
                  className="text-sm font-medium px-4 py-2 rounded-lg"
                  style={{ backgroundColor: TUHH_COLORS.greenblue, color: TUHH_COLORS.white }}
                >
                  Export
                </button>
              </div>
              {selectedForExport.size > 0 && (
                <p className="text-xs mt-1 font-medium" style={{ color: TUHH_COLORS.greenblue }}>
                  {selectedForExport.size} selected for export
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
                Exports selected/filtered agents in the chosen format.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Agent list */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Agents</h2>
          <p className="text-sm text-gray-500 mb-4">
            Showing {visibleAgents.length} of {filteredAgents.length}
            {filteredAgents.length !== agents.length ? ` matching agents (${agents.length} total).` : " agents."}
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visibleAgents.map((agent) => {
              const agentRuns = results?.filter((r) => r.agentId === agent.agentId) ?? [];
              const sr = srByAgent.get(agent.agentId);
              const reasoning =
                experimentId === REASONING_EXPERIMENT_ID && reasoningCodes
                  ? {
                      human: reasoningCodes.find(
                        (c) => c.subjectType === "human" && c.agentId === agent.agentId
                      )!,
                      agentRuns: reasoningCodes.filter(
                        (c) => c.subjectType === "agent" && c.agentId === agent.agentId
                      ),
                    }
                  : null;

              return (
                <HonestyPilotAgentCard
                  key={agent.agentId}
                  agent={agent}
                  activeModules={orderedActiveModules}
                  styles={moduleStyles}
                  mappings={mappings}
                  experimentId={experimentId ?? ""}
                  experimentLabel={experimentLabel}
                  runs={agentRuns}
                  honestyRate={sr?.honestyRate ?? null}
                  reasoning={reasoning}
                  payouts={HONESTY_PILOT_PAYOUTS}
                  selectedForExport={selectedForExport.has(agent.agentId)}
                  onToggleExportSelected={() => toggleExportSelected(agent.agentId)}
                />
              );
            })}
          </div>
          {visibleCount < filteredAgents.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="text-sm font-medium px-4 py-2 rounded-lg border"
                style={{ borderColor: TUHH_COLORS.light, color: TUHH_COLORS.greenblue }}
              >
                Show More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HonestyPilotSetClient;
