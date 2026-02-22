"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { StructuredAgentCard } from "@/components/StructuredAgentCard";
import { FischbacherPlot, ValidationBoxplot, DecisionScatter } from "@/components/charts";
import type { RunData } from "@/components/charts";
import type { AgentSet, StructuredAgent, SimpleAgent, DieRollAgent, DieRollAgentSet, Tag, ExperimentValidation, HumanReference } from "@/types";
import { TUHH_COLORS, CHART_COLORS } from "@/lib/colors";
import { isStructuredAgent, isDieRollAgent, isDieRollAgentSet } from "@/types";
import type { DistributionData, AgentValidationPoint } from "@/components/charts";

// Validation badge styles using TUHH colors
const validationColors: Record<string, { bg: string; text: string; border: string }> = {
  validated: { bg: `${TUHH_COLORS.green}20`, text: TUHH_COLORS.green, border: TUHH_COLORS.green },
  pilot: { bg: `${TUHH_COLORS.orange}20`, text: TUHH_COLORS.orange, border: TUHH_COLORS.orange },
  placeholder: { bg: TUHH_COLORS.light, text: TUHH_COLORS.gray, border: TUHH_COLORS.gray },
};

const validationLabels: Record<string, string> = {
  validated: "Validated",
  pilot: "In Validation",
  placeholder: "Placeholder",
};

// Reason category labels
const REASON_LABELS: Record<string, string> = {
  money: "Money",
  consistency: "Consistency",
  rules: "Rules",
  fairness: "Fairness",
  intuition: "Intuition",
};

// Reasoning Alignment Component
function ReasoningAlignment({
  humanReasons,
  validation,
}: {
  humanReasons: HumanReference["reasons"];
  validation: ExperimentValidation | undefined;
}) {
  if (!validation) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 text-center text-gray-400 text-xs">
        No validation data
      </div>
    );
  }

  // Get rate for each reason category from validation
  const getRate = (category: string): number | null => {
    switch (category) {
      case "money": return validation.reasonMoneyRate;
      case "consistency": return validation.reasonConsistencyRate;
      case "rules": return validation.reasonRulesRate;
      case "fairness": return validation.reasonFairnessRate;
      case "intuition": return validation.reasonIntuitionRate;
      default: return null;
    }
  };

  // Separate categories by whether human mentioned them
  const humanMentioned: string[] = [];
  const humanNotMentioned: string[] = [];

  Object.entries(humanReasons).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value > 0) {
      humanMentioned.push(key);
    } else {
      humanNotMentioned.push(key);
    }
  });

  const formatRate = (rate: number | null): string => {
    if (rate === null) return "N/A";
    const pct = Math.round(rate * 100);
    const runs = Math.round(rate * 10);
    return `${pct}% (${runs}/10)`;
  };

  const alignmentScore = validation.reasoningAlignmentScore;
  const hasHumanReasons = humanMentioned.length > 0;

  return (
    <div className="rounded-lg p-3" style={{ backgroundColor: TUHH_COLORS.offwhite }}>
      <h4 className="text-xs font-semibold mb-2" style={{ color: TUHH_COLORS.dark }}>Reasoning Alignment</h4>

      {/* Human mentioned section */}
      <div className="mb-2">
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: TUHH_COLORS.gray }}>
          Human mentioned → Agent hit rate
        </div>
        {humanMentioned.length > 0 ? (
          <div className="space-y-0.5">
            {humanMentioned.map((cat) => {
              const rate = getRate(cat);
              const isHit = rate !== null && rate > 0;
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: CHART_COLORS.honest }}>✓</span>
                    <span style={{ color: TUHH_COLORS.dark }}>{REASON_LABELS[cat]}</span>
                  </div>
                  <span className="font-mono" style={{ color: isHit ? CHART_COLORS.honest : CHART_COLORS.dishonest }}>
                    {formatRate(rate)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs italic" style={{ color: TUHH_COLORS.gray }}>(none)</div>
        )}
      </div>

      {/* Human did NOT mention section */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-wide mb-1" style={{ color: TUHH_COLORS.gray }}>
          Human did NOT mention → False positive
        </div>
        <div className="space-y-0.5">
          {humanNotMentioned.map((cat) => {
            const rate = getRate(cat);
            const isFalsePositive = rate !== null && rate > 0;
            return (
              <div key={cat} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: TUHH_COLORS.gray }}>○</span>
                  <span style={{ color: TUHH_COLORS.gray }}>{REASON_LABELS[cat]}</span>
                </div>
                <span className="font-mono" style={{ color: isFalsePositive ? TUHH_COLORS.orange : TUHH_COLORS.gray }}>
                  {formatRate(rate)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alignment Score */}
      <div className="pt-2" style={{ borderTop: `1px solid ${TUHH_COLORS.light}` }}>
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: TUHH_COLORS.gray }}>Alignment Score:</span>
          {hasHumanReasons && alignmentScore !== null ? (
            <span className="text-sm font-bold" style={{
              color: alignmentScore >= 0.3 ? CHART_COLORS.honest :
                     alignmentScore <= -0.3 ? CHART_COLORS.dishonest :
                     TUHH_COLORS.orange
            }}>
              {alignmentScore >= 0 ? "+" : ""}{alignmentScore.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs italic" style={{ color: TUHH_COLORS.gray }}>N/A</span>
          )}
        </div>
        <div className="text-[9px] text-right" style={{ color: TUHH_COLORS.gray }}>
          {hasHumanReasons ? "(worst: -1 | best: +1)" : "(no human reasons)"}
        </div>
      </div>
    </div>
  );
}

// Simple Agent Card for Examples set
function SimpleAgentCard({
  agent,
  tags,
  isSelected,
  onSelect,
}: {
  agent: SimpleAgent;
  tags: Tag[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.color || "#14b8a6";
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const originColors: Record<string, { bg: string; text: string }> = {
    synthetic: { bg: `${TUHH_COLORS.turquoise}20`, text: TUHH_COLORS.turquoise },
    human: { bg: `${TUHH_COLORS.greenblue}20`, text: TUHH_COLORS.greenblue },
    curated: { bg: `${CHART_COLORS.honest}20`, text: CHART_COLORS.honest },
  };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        border: `1px solid ${TUHH_COLORS.light}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(agent.id)}
                className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
              />
            )}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: TUHH_COLORS.turquoise }}
            >
              <span>{getInitials(agent.name)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">{agent.id}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: originColors[agent.origin]?.bg || TUHH_COLORS.light,
                    color: originColors[agent.origin]?.text || TUHH_COLORS.gray,
                  }}
                >
                  {agent.origin}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-1">{agent.name}</h3>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {agent.tags.map((tagId) => (
            <span
              key={tagId}
              className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: getTagColor(tagId) }}
            >
              {tags.find((t) => t.id === tagId)?.name || tagId}
            </span>
          ))}
        </div>

        {/* Task */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Task</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{agent.task}</p>
        </div>

        {/* Persona */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Persona</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{agent.persona}</p>
        </div>

        {/* Traits */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Traits</h4>
          <div className="flex flex-wrap gap-1.5">
            {agent.traits.map((trait, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      <div className="px-5 pb-4 border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center gap-2 py-3 text-left text-sm font-medium text-gray-700 hover:text-tuhh-cyan transition-colors"
        >
          <span className={`text-xs transition-transform ${showDetails ? "rotate-90" : ""}`}>
            ▸
          </span>
          Prompt Template & Details
        </button>
        {showDetails && (
          <div className="space-y-4 pb-2">
            <div>
              <h5 className="text-xs font-semibold text-gray-500 mb-1">Prompt Template</h5>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto font-mono">
                {agent.promptTemplate}
              </pre>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-500 mb-1">Example Output</h5>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto font-mono">
                {agent.exampleOutput}
              </pre>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-gray-500 mb-1">How to Reproduce</h5>
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-gray-50 p-3 rounded-lg overflow-x-auto font-mono">
                {agent.howToReproduce}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// DieRoll Agent Card for PreStudy2 set
function DieRollAgentCard({
  agent,
  tags,
  isSelected,
  onSelect,
  selectedExperiment = "001",
  activeModules = ["demographics", "hexaco", "freetext"],
}: {
  agent: DieRollAgent;
  tags: Tag[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  selectedExperiment?: string;
  activeModules?: string[];
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Get real run data from validation
  const runData = useMemo((): RunData[] => {
    const validation = agent.validation[selectedExperiment];
    if (!validation || !validation.runs) return [];

    const roll = agent.humanReference.roll;

    // Map the runs array to RunData objects
    return validation.runs.map((decision, index) => ({
      run: index,
      decision,
      honest: decision === roll,
    }));
  }, [agent, selectedExperiment]);

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.color || "#14b8a6";
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const hexacoLabels: Record<string, string> = {
    honestyHumility: "H-H",
    emotionality: "Emo",
    extraversion: "Ext",
    agreeableness: "Agr",
    conscientiousness: "Con",
    openness: "Opn",
  };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        border: `1px solid ${TUHH_COLORS.light}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {onSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onSelect(agent.id)}
                className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
              />
            )}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
              style={{ backgroundColor: TUHH_COLORS.greenblue }}
            >
              <span>{getInitials(agent.name)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono text-gray-400">{agent.id}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: agent.humanReference.honest ? `${CHART_COLORS.honest}20` : `${CHART_COLORS.dishonest}20`,
                    color: agent.humanReference.honest ? CHART_COLORS.honest : CHART_COLORS.dishonest,
                  }}
                >
                  {agent.humanReference.honest ? "Honest" : "Dishonest"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-1">{agent.name}</h3>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {agent.tags.map((tagId) => (
            <span
              key={tagId}
              className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
              style={{ backgroundColor: getTagColor(tagId) }}
            >
              {tags.find((t) => t.id === tagId)?.name || tagId}
            </span>
          ))}
        </div>

        {/* Demographics Summary */}
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">{agent.demographics.age}yo {agent.demographics.sex}</span>
          <span className="mx-1">·</span>
          <span>{agent.demographics.ethnicity}</span>
          <span className="mx-1">·</span>
          <span>{agent.demographics.education}</span>
        </div>

        {/* HEXACO Scores */}
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(agent.hexaco).map(([key, value]) => (
            <div key={key} className="flex items-center gap-1 text-xs">
              <span className="font-medium text-gray-500">{hexacoLabels[key]}:</span>
              <span
                className="font-semibold"
                style={{
                  color: value >= 4 ? CHART_COLORS.honest : value <= 2 ? CHART_COLORS.dishonest : TUHH_COLORS.dark,
                }}
              >
                {value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        {/* Human Reference */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Human Reference</h4>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Roll:</span>
              <span className="ml-1 font-semibold text-gray-900">{agent.humanReference.roll}</span>
            </div>
            <div>
              <span className="text-gray-500">Reported:</span>
              <span className="ml-1 font-semibold text-gray-900">{agent.humanReference.report}</span>
            </div>
            <div
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: agent.humanReference.honest ? `${CHART_COLORS.honest}20` : `${CHART_COLORS.dishonest}20`,
                color: agent.humanReference.honest ? CHART_COLORS.honest : CHART_COLORS.dishonest,
              }}
            >
              {agent.humanReference.honest ? "Truthful" : "Lied"}
            </div>
          </div>
        </div>

        {/* Behavior Alignment + Reasoning Alignment Grid */}
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Behavior Alignment (Decision Scatter) */}
          <div className="rounded-lg p-3" style={{ backgroundColor: TUHH_COLORS.offwhite }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: TUHH_COLORS.dark }}>Behavior Alignment</h4>
            {runData.length > 0 ? (
              <DecisionScatter
                runs={runData}
                roll={agent.humanReference.roll}
                humanReport={agent.humanReference.report}
                humanHonest={agent.humanReference.honest}
                agentName={agent.name}
              />
            ) : (
              <div className="text-center text-xs py-4" style={{ color: TUHH_COLORS.gray }}>
                No run data available
              </div>
            )}
          </div>

          {/* Reasoning Alignment */}
          <ReasoningAlignment
            humanReasons={agent.humanReference.reasons}
            validation={agent.validation[selectedExperiment]}
          />
        </div>
      </div>

      {/* Expandable Details */}
      <div className="px-5 pb-4 border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex w-full items-center gap-2 py-3 text-left text-sm font-medium text-gray-700 hover:text-tuhh-cyan transition-colors"
        >
          <span className={`text-xs transition-transform ${showDetails ? "rotate-90" : ""}`}>
            ▸
          </span>
          Prompt Modules
        </button>
        {showDetails && (
          <div className="space-y-4 pb-2">
            {activeModules.length === 0 ? (
              <div className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-lg">
                No persona modules active for this experiment (Baseline condition)
              </div>
            ) : (
              <>
                {activeModules.includes("demographics") && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 mb-1">Demographics</h5>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {agent.promptModules.demographics}
                    </p>
                  </div>
                )}
                {activeModules.includes("hexaco") && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 mb-1">HEXACO Personality</h5>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {agent.promptModules.hexaco}
                    </p>
                  </div>
                )}
                {activeModules.includes("freetext") && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 mb-1">Self-Description</h5>
                    <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                      {agent.promptModules.freetext}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SetDetailClientProps {
  agentSet: AgentSet;
}

export function SetDetailClient({ agentSet }: SetDetailClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  // Default to "003" (HEXACO Only) for prestudy2, "001" for other sets
  const [selectedExperiment, setSelectedExperiment] = useState(
    agentSet.setId === "prestudy2" ? "003" : "001"
  );

  // Determine set type
  const isDieRollSet = agentSet.agents.length > 0 && isDieRollAgent(agentSet.agents[0]);
  const isStructuredSet = !isDieRollSet && agentSet.agents.length > 0 && isStructuredAgent(agentSet.agents[0]);

  // Get chart data for DieRoll sets
  const chartData = useMemo(() => {
    if (!isDieRollSet || !isDieRollAgentSet(agentSet)) return null;

    const dieRollSet = agentSet as DieRollAgentSet;
    const metrics = dieRollSet.populationMetrics[selectedExperiment];

    if (!metrics) return null;

    // Distribution data for FischbacherPlot
    const distributionData: DistributionData = {
      rollPct: metrics.rollPct,
      humanPct: metrics.humanPct,
      agentPct: metrics.agentPct,
    };

    // Validation points for ValidationBoxplot
    const validationPoints: AgentValidationPoint[] = dieRollSet.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      humanHonest: agent.humanReference.honest,
      agentHonestRate: agent.validation[selectedExperiment]?.honestRate ?? 0,
      hexacoHH: agent.hexaco.honestyHumility,
    }));

    return {
      distributionData,
      validationPoints,
      experimentName: dieRollSet.experiments[selectedExperiment]?.name ?? selectedExperiment,
    };
  }, [agentSet, isDieRollSet, selectedExperiment]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agentSet.agents.filter((agent) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          agent.name.toLowerCase().includes(query) ||
          agent.id.toLowerCase().includes(query) ||
          agent.tags.some((tag) => tag.toLowerCase().includes(query));

        // Additional search for simple agents
        if (!matchesSearch && !isStructuredAgent(agent)) {
          const simpleAgent = agent as SimpleAgent;
          if (
            simpleAgent.task?.toLowerCase().includes(query) ||
            simpleAgent.persona?.toLowerCase().includes(query) ||
            simpleAgent.traits?.some((trait) => trait.toLowerCase().includes(query))
          ) {
            return true;
          }
        }

        // Additional search for structured agents
        if (!matchesSearch && isStructuredAgent(agent)) {
          const structuredAgent = agent as StructuredAgent;
          if (
            structuredAgent.characterTraits?.some((trait) => trait.toLowerCase().includes(query)) ||
            structuredAgent.narrativeIdentity?.toLowerCase().includes(query) ||
            structuredAgent.demographics?.occupation?.toLowerCase().includes(query)
          ) {
            return true;
          }
        }

        // Additional search for DieRoll agents
        if (!matchesSearch && isDieRollAgent(agent)) {
          const dieRollAgent = agent as DieRollAgent;
          if (
            dieRollAgent.freetext?.toLowerCase().includes(query) ||
            dieRollAgent.demographics?.occupation?.toLowerCase().includes(query) ||
            dieRollAgent.demographics?.industry?.toLowerCase().includes(query)
          ) {
            return true;
          }
        }

        if (!matchesSearch) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasMatchingTag = agent.tags.some((tag) => selectedTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  }, [agentSet.agents, searchQuery, selectedTags]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgents((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  // Generate default persona for structured agents (all traits active)
  const generateDefaultPersona = (agent: StructuredAgent): string => {
    const parts: string[] = [];

    if (agentSet.promptWrapper.demographics) {
      let text = agentSet.promptWrapper.demographics;
      text = text.replace("{{name}}", agent.name);
      text = text.replace("{{age}}", String(agent.demographics.age));
      text = text.replace("{{gender}}", agent.demographics.gender);
      text = text.replace("{{occupation}}", agent.demographics.occupation);
      parts.push(text);
    }

    if (agentSet.promptWrapper.characterTraits) {
      let text = agentSet.promptWrapper.characterTraits;
      text = text.replace("{{traits}}", agent.characterTraits.join(", "));
      parts.push(text);
    }

    if (agentSet.promptWrapper.narrativeIdentity) {
      let text = agentSet.promptWrapper.narrativeIdentity;
      text = text.replace("{{narrative}}", agent.narrativeIdentity);
      parts.push(text);
    }

    return parts.join(" ");
  };

  const handleExport = () => {
    // Get active modules for the selected experiment (for DieRoll sets)
    const activeModules = isDieRollSet && isDieRollAgentSet(agentSet)
      ? (agentSet as DieRollAgentSet).experiments[selectedExperiment]?.activeModules || []
      : [];

    const selectedAgentData = agentSet.agents
      .filter((agent) => selectedAgents.has(agent.id))
      .map((agent) => {
        if (isStructuredAgent(agent)) {
          return {
            ...agent,
            generatedPersona: generateDefaultPersona(agent as StructuredAgent),
            activeTraits: agentSet.traitCategories,
          };
        }

        // For DieRoll agents, only include active prompt modules
        if (isDieRollAgent(agent)) {
          const dieRollAgent = agent as DieRollAgent;
          const filteredPromptModules: Record<string, string> = {};

          if (activeModules.includes("demographics")) {
            filteredPromptModules.demographics = dieRollAgent.promptModules.demographics;
          }
          if (activeModules.includes("hexaco")) {
            filteredPromptModules.hexaco = dieRollAgent.promptModules.hexaco;
          }
          if (activeModules.includes("freetext")) {
            filteredPromptModules.freetext = dieRollAgent.promptModules.freetext;
          }

          // Build combined persona string
          const personaParts: string[] = [];
          if (filteredPromptModules.demographics) personaParts.push(filteredPromptModules.demographics);
          if (filteredPromptModules.hexaco) personaParts.push(filteredPromptModules.hexaco);
          if (filteredPromptModules.freetext) personaParts.push(filteredPromptModules.freetext);

          return {
            id: dieRollAgent.id,
            agentId: dieRollAgent.agentId,
            name: dieRollAgent.name,
            experiment: selectedExperiment,
            activeModules,
            promptModules: filteredPromptModules,
            combinedPersona: personaParts.join(" ") || "(No persona - baseline condition)",
            humanReference: dieRollAgent.humanReference,
            validation: dieRollAgent.validation[selectedExperiment],
          };
        }

        return agent;
      });

    const experimentName = isDieRollSet && isDieRollAgentSet(agentSet)
      ? (agentSet as DieRollAgentSet).experiments[selectedExperiment]?.name || selectedExperiment
      : null;

    const exportData = {
      exportedAt: new Date().toISOString(),
      setId: agentSet.setId,
      setName: agentSet.name,
      experiment: experimentName ? { id: selectedExperiment, name: experimentName, activeModules } : null,
      agentCount: selectedAgentData.length,
      agents: selectedAgentData,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${agentSet.setId}-exp${selectedExperiment}-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Navigation */}
          <nav className="flex items-center gap-8 py-4 border-b border-gray-100">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">ValidAgent</span>
              <span className="text-sm font-medium text-gray-500">Repository</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${TUHH_COLORS.turquoise}20`, color: TUHH_COLORS.turquoise }}
              >
                v1
              </span>
            </Link>
            <div className="flex gap-6">
              <Link
                href="/sets"
                className="text-sm font-medium text-tuhh-cyan border-b-2 border-tuhh-cyan pb-1"
              >
                Agent Sets
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/resources"
                className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors"
              >
                Resources
              </Link>
            </div>
          </nav>

          {/* Breadcrumb */}
          <div className="py-3 text-sm">
            <Link href="/sets" className="text-gray-500 hover:text-tuhh-cyan">
              Agent Sets
            </Link>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-gray-900 font-medium">{agentSet.name}</span>
          </div>

          {/* Set Header */}
          <div className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{agentSet.name}</h1>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full border font-medium"
                    style={{
                      backgroundColor: validationColors[agentSet.validationStrength]?.bg,
                      color: validationColors[agentSet.validationStrength]?.text,
                      borderColor: validationColors[agentSet.validationStrength]?.border,
                    }}
                  >
                    {validationLabels[agentSet.validationStrength]}
                  </span>
                </div>
                <p className="text-gray-600 max-w-2xl">{agentSet.description}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                  <span><strong>Domain:</strong> {agentSet.domain}</span>
                  <span><strong>Paradigm:</strong> {agentSet.experimentalParadigm}</span>
                  <span><strong>Agents:</strong> {agentSet.agents.length}</span>
                </div>
              </div>

              {/* Aggregate Validation */}
              <div className="bg-gray-50 rounded-lg p-4 min-w-[200px]">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Aggregate Validation
                </h3>
                <div className="text-sm">
                  {agentSet.aggregateValidation.correlation !== null ? (
                    <p className="font-medium text-gray-900">
                      Best Correlation: r = {agentSet.aggregateValidation.correlation.toFixed(2)}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">Not yet validated</p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">{agentSet.aggregateValidation.note}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Visualizations for DieRoll Sets */}
      {isDieRollSet && chartData && isDieRollAgentSet(agentSet) && (
        <div className="bg-slate-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* Experiment Selector */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-gray-700">Experiment:</span>
              <div className="flex flex-wrap gap-2">
                {Object.entries((agentSet as DieRollAgentSet).experiments).map(([expId, exp]) => (
                  <button
                    key={expId}
                    onClick={() => setSelectedExperiment(expId)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                    style={
                      selectedExperiment === expId
                        ? { backgroundColor: TUHH_COLORS.greenblue, color: TUHH_COLORS.white, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                        : { backgroundColor: TUHH_COLORS.white, color: TUHH_COLORS.gray, border: `1px solid ${TUHH_COLORS.light}` }
                    }
                  >
                    {exp.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FischbacherPlot
                data={chartData.distributionData}
                experimentId={selectedExperiment}
                title="Roll vs Human & Agent Reports"
              />
              <ValidationBoxplot
                agents={chartData.validationPoints}
                experimentId={selectedExperiment}
                title="Agent Honesty by Human Status"
              />
            </div>

            {/* Experiment Info */}
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200 text-sm">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-medium text-gray-700">
                  {(agentSet as DieRollAgentSet).experiments[selectedExperiment]?.name}:
                </span>
                <span className="text-gray-500">
                  {(agentSet as DieRollAgentSet).experiments[selectedExperiment]?.description}
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  Correlation: <strong>{(agentSet as DieRollAgentSet).populationMetrics[selectedExperiment]?.correlation.toFixed(3)}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ borderColor: TUHH_COLORS.light }}
              />
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={selectedAgents.size === 0}
              className="px-5 py-2.5 text-sm font-medium rounded-lg disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              style={{
                backgroundColor: selectedAgents.size === 0 ? TUHH_COLORS.light : TUHH_COLORS.greenblue,
                color: selectedAgents.size === 0 ? TUHH_COLORS.gray : TUHH_COLORS.white,
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export{selectedAgents.size > 0 ? ` (${selectedAgents.size})` : ""}
            </button>
          </div>

          {/* Tag Filters */}
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-medium uppercase tracking-wide self-center mr-2" style={{ color: TUHH_COLORS.gray }}>
              Filter by tag:
            </span>
            {agentSet.tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-full transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: tag.color, color: TUHH_COLORS.white, boxShadow: "0 1px 2px rgba(0,0,0,0.1)" }
                      : { backgroundColor: TUHH_COLORS.offwhite, color: TUHH_COLORS.gray, border: `1px solid ${TUHH_COLORS.light}` }
                  }
                >
                  {tag.name}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1.5 text-xs font-medium underline"
                style={{ color: TUHH_COLORS.gray }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm" style={{ color: TUHH_COLORS.gray }}>
            Showing {filteredAgents.length} of {agentSet.agents.length} agents
            {selectedAgents.size > 0 && (
              <span className="ml-2 font-medium" style={{ color: TUHH_COLORS.turquoise }}>
                ({selectedAgents.size} selected)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No agents found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedTags([]);
              }}
              className="mt-4 text-sm font-medium"
              style={{ color: TUHH_COLORS.turquoise }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredAgents.map((agent) =>
              isDieRollSet ? (
                <DieRollAgentCard
                  key={agent.id}
                  agent={agent as DieRollAgent}
                  tags={agentSet.tags}
                  isSelected={selectedAgents.has(agent.id)}
                  onSelect={handleAgentSelect}
                  selectedExperiment={selectedExperiment}
                  activeModules={(agentSet as DieRollAgentSet).experiments[selectedExperiment]?.activeModules || []}
                />
              ) : isStructuredSet ? (
                <StructuredAgentCard
                  key={agent.id}
                  agent={agent as StructuredAgent}
                  tags={agentSet.tags}
                  promptWrapper={agentSet.promptWrapper}
                  traitCategories={agentSet.traitCategories}
                  isSelected={selectedAgents.has(agent.id)}
                  onSelect={handleAgentSelect}
                />
              ) : (
                <SimpleAgentCard
                  key={agent.id}
                  agent={agent as SimpleAgent}
                  tags={agentSet.tags}
                  isSelected={selectedAgents.has(agent.id)}
                  onSelect={handleAgentSelect}
                />
              )
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              {agentSet.name} - {agentSet.agents.length} agents
            </p>
            <Link href="/sets" className="text-tuhh-cyan hover:text-tuhh-petrol font-medium">
              Back to Agent Sets
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
