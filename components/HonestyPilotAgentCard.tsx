"use client";

import { useState, type ReactNode } from "react";
import { CHART_COLORS, TUHH_COLORS } from "@/lib/colors";
import { renderFullPrompt, type ModuleStyles, type TraitMappings } from "@/lib/renderPrompt";
import { DecisionScatter, type RunData } from "@/components/charts/DecisionScatter";
import type {
  HonestyPilotAgent,
  HonestyPilotResult,
  PilotModule,
  ReasoningCodeRow,
} from "@/types/honestyPilot";

interface HonestyPilotAgentCardProps {
  agent: HonestyPilotAgent;
  activeModules: PilotModule[];
  styles: ModuleStyles;
  mappings: TraitMappings;
  experimentId: string;
  experimentLabel: string;
  runs: HonestyPilotResult[]; // this agent's rows for the selected experiment (usually 5)
  honestyRate: number | null;
  reasoning: { human: ReasoningCodeRow; agentRuns: ReasoningCodeRow[] } | null;
  payouts?: number[];
  selectedForExport: boolean;
  onToggleExportSelected: () => void;
}

function traitColor(value: number): string {
  if (value >= 4) return CHART_COLORS.honest;
  if (value <= 2) return CHART_COLORS.dishonest;
  return TUHH_COLORS.dark;
}

function TraitBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold" style={{ color: traitColor(value) }}>
        {value.toFixed(2)}
      </span>
    </div>
  );
}

// Shared with the tag filter row in HonestyPilotSetClient so the "Agent: X%
// Honest" tag and its filter chip use the same color for the same value.
export function agentPctColor(rate: number): string {
  if (rate >= 0.8) return CHART_COLORS.honest;
  if (rate <= 0.2) return CHART_COLORS.dishonest;
  return TUHH_COLORS.gray;
}

function Tag({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${color}20`, color }}>
      {children}
    </span>
  );
}

function ExportCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={checked}
      aria-label={checked ? "Deselect for export" : "Select for export"}
      className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors"
      style={{
        backgroundColor: checked ? TUHH_COLORS.greenblue : TUHH_COLORS.white,
        borderColor: checked ? TUHH_COLORS.greenblue : TUHH_COLORS.light,
      }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke={TUHH_COLORS.white} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

export function HonestyPilotAgentCard({
  agent,
  activeModules,
  styles,
  mappings,
  experimentId,
  experimentLabel,
  runs,
  honestyRate,
  reasoning,
  payouts,
  selectedForExport,
  onToggleExportSelected,
}: HonestyPilotAgentCardProps) {
  const [showResults, setShowResults] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const runData: RunData[] = runs.map((r) => ({
    run: r.runId,
    decision: r.agentReport,
    honest: r.agentReport === agent.humanRoll,
  }));

  const prompt = renderFullPrompt(activeModules, agent, styles, mappings);
  const codeKeys = reasoning ? Object.keys(reasoning.human.codes) : [];
  const totalRuns = reasoning?.agentRuns.length ?? 0;
  const agentHitCount = (code: string) =>
    reasoning ? reasoning.agentRuns.filter((r) => r.codes[code] === 1).length : 0;
  const humanMentionedCodes = reasoning ? codeKeys.filter((c) => reasoning.human.codes[c] === 1) : [];
  const humanNotMentionedCodes = reasoning
    ? codeKeys.filter((c) => reasoning.human.codes[c] !== 1 && agentHitCount(c) > 0)
    : [];

  return (
    <div
      className="bg-white rounded-xl overflow-hidden"
      style={{ border: `1px solid ${TUHH_COLORS.light}`, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${TUHH_COLORS.light}` }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900">Agent #{agent.agentId}</h3>
            {honestyRate !== null && (
              <Tag color={agentPctColor(honestyRate)}>Agent: {Math.round(honestyRate * 100)}% Honest</Tag>
            )}
            <Tag color={agent.humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest}>
              Human: {agent.humanHonest ? "Honest" : "Dishonest"}
            </Tag>
          </div>
          <ExportCheckbox checked={selectedForExport} onToggle={onToggleExportSelected} />
        </div>

        {/* Base demographics, only shown when D is active */}
        {activeModules.includes("D") && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
            <span>{agent.demAge} yrs</span>
            {agent.demGender && <span>{agent.demGender}</span>}
            {agent.demEthnicity && <span>{agent.demEthnicity}</span>}
            <span>{agent.demEducation}</span>
          </div>
        )}

        {/* HEXACO, only shown when PT is active */}
        {activeModules.includes("PT") && (
          <div className="flex flex-wrap gap-3 mt-2">
            <TraitBadge label="Honesty-Humility" value={agent.hxHh} />
            <TraitBadge label="Emotionality" value={agent.hxEm} />
            <TraitBadge label="Extraversion" value={agent.hxEx} />
            <TraitBadge label="Agreeableness" value={agent.hxAg} />
            <TraitBadge label="Conscientiousness" value={agent.hxCo} />
            <TraitBadge label="Openness" value={agent.hxOp} />
          </div>
        )}

        {/* Dynamic: economic preferences, only shown when EP is active */}
        {activeModules.includes("EP") && (
          <div className="flex flex-wrap gap-3 mt-2">
            <TraitBadge label="Risk Tolerance" value={agent.psmRisk} />
            <TraitBadge label="Patience" value={agent.psmPatience} />
            <TraitBadge label="Altruism" value={agent.psmAltruism} />
            <TraitBadge label="Positive Reciprocity" value={agent.psmPosRec} />
            <TraitBadge label="Negative Reciprocity" value={agent.psmNegRec} />
            <TraitBadge label="Trust" value={agent.psmTrust} />
          </div>
        )}

        {/* Dynamic: moral orientation, only shown when MO is active */}
        {activeModules.includes("MO") && (
          <div className="flex flex-wrap gap-3 mt-2">
            <TraitBadge label="Deontology" value={agent.csDeontology} />
            <TraitBadge label="Utilitarianism" value={agent.csUtilitarianism} />
          </div>
        )}

        {/* Human reference */}
        <div className="mt-3 p-2 rounded-lg bg-gray-50 text-xs text-gray-600 flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Human</span>
          <span>Rolled: <strong className="text-gray-800">{agent.humanRoll}</strong></span>
          <span>Reported: <strong className="text-gray-800">{agent.humanReport}</strong></span>
          <span style={{ color: agent.humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest }}>
            {agent.humanHonest ? "Honest" : "Dishonest"}
          </span>
        </div>
      </div>

      {/* Results (accordion, default open) */}
      <div className="border-t" style={{ borderColor: TUHH_COLORS.light }}>
        <button
          onClick={() => setShowResults(!showResults)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors"
          style={{ color: TUHH_COLORS.dark }}
        >
          <span className={`text-xs transition-transform ${showResults ? "rotate-90" : ""}`}>▸</span>
          Experiment Results
        </button>
        {showResults && (
          <div className="px-4 pb-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg p-3" style={{ backgroundColor: TUHH_COLORS.offwhite }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: TUHH_COLORS.dark }}>
                Behavioral Alignment
              </h4>
              {runData.length > 0 ? (
                <DecisionScatter
                  runs={runData}
                  roll={agent.humanRoll}
                  humanReport={agent.humanReport}
                  humanHonest={agent.humanHonest}
                  agentName={`Agent #${agent.agentId}`}
                  payouts={payouts}
                  showHonestyRate={false}
                />
              ) : (
                <p className="text-xs text-gray-400 italic">No runs available for this condition.</p>
              )}
            </div>

            <div className="rounded-lg p-3" style={{ backgroundColor: TUHH_COLORS.offwhite }}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: TUHH_COLORS.dark }}>
                Reasoning Alignment
              </h4>
              {!reasoning ? (
                <p className="text-xs text-gray-400 italic">
                  Reasoning comparison is only available for the &quot;{"Economic Preferences (Descriptive)"}&quot; condition.
                </p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: TUHH_COLORS.gray }}>
                      Human mentioned → Agent hit rate
                    </div>
                    {humanMentionedCodes.length > 0 ? (
                      <div className="space-y-0.5">
                        {humanMentionedCodes.map((code) => {
                          const hits = agentHitCount(code);
                          return (
                            <div key={code} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span style={{ color: TUHH_COLORS.dark }}>○</span>
                                <span className="text-gray-700">{code.replace(/_/g, " ")}</span>
                              </div>
                              <span style={{ color: hits > 0 ? CHART_COLORS.honest : CHART_COLORS.dishonest }}>
                                {hits}/{totalRuns}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs italic" style={{ color: TUHH_COLORS.gray }}>(none)</div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: TUHH_COLORS.gray }}>
                      Human did NOT mention → False positive
                    </div>
                    {humanNotMentionedCodes.length > 0 ? (
                      <div className="space-y-0.5">
                        {humanNotMentionedCodes.map((code) => {
                          const hits = agentHitCount(code);
                          return (
                            <div key={code} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                <span style={{ color: TUHH_COLORS.dark }}>○</span>
                                <span className="text-gray-500">{code.replace(/_/g, " ")}</span>
                              </div>
                              <span style={{ color: TUHH_COLORS.orange }}>{hits}/{totalRuns}</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs italic" style={{ color: TUHH_COLORS.gray }}>(none)</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Prompt (accordion, default closed) */}
      <div className="border-t bg-gray-50" style={{ borderColor: TUHH_COLORS.light }}>
        <button
          onClick={() => setShowPrompt(!showPrompt)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors"
          style={{ color: TUHH_COLORS.dark }}
        >
          <span className={`text-xs transition-transform ${showPrompt ? "rotate-90" : ""}`}>▸</span>
          Prompt ({experimentLabel})
        </button>
        {showPrompt && (
          <div className="px-4 pb-3">
            <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto font-mono border border-gray-200">
              {prompt}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default HonestyPilotAgentCard;
