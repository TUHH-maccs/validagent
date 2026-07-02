"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const COLORS = {
  green: "#00AD70",
  turquoise: "#00C1D4",
  greenblue: "#265D71",
  orange: "#FF7E15",
  light: "#E5E5E5",
  muted: "#666666",
  idle: "#8b949e",
  greenStep: "#00AD70",
  redStep: "#FF4F4F",
  greyStep: "#8b949e",
};

type DemoAgent = {
  id: string;
  label: string;
  baselinePrompt?: string;
};

type ScenarioStep = {
  step: number;
  agentId: string;
  prompt: string;
  bubble: string;
  payout: string;
  color: "green" | "red" | "grey";
  role?: string;
};

type Scenario = {
  id: string;
  title: string;
  description?: string;
  steps: ScenarioStep[];
};

type SimulationData = {
  agents: DemoAgent[];
  scenarios: Scenario[];
};

const AGENT_LAYOUT = [
  { agentId: "agent26", side: "left" },
  { agentId: "agent42", side: "right" },
  { agentId: "agent51", side: "left" },
  { agentId: "agent43", side: "right" },
] as const;

function splitPromptSections(prompt: string) {
  const keys = ["SYSTEM", "PERSONA", "TASK"] as const;

  return keys.map((key, index) => {
    const start = prompt.indexOf(key);
    if (start === -1) {
      return { title: key, content: "" };
    }

    const contentStart = start + key.length;
    const nextStarts = keys
      .slice(index + 1)
      .map((nextKey) => prompt.indexOf(nextKey, contentStart))
      .filter((value) => value !== -1);

    const end = nextStarts.length > 0 ? Math.min(...nextStarts) : prompt.length;

    return {
      title: key,
      content: prompt.slice(contentStart, end).trim().replace(/^[:\s-]+/, ""),
    };
  });
}

function getStepColor(color: ScenarioStep["color"]) {
  switch (color) {
    case "green":
      return COLORS.greenStep;
    case "red":
      return COLORS.redStep;
    default:
      return COLORS.greyStep;
  }
}

export default function SimulationPage() {
  const [data, setData] = useState<SimulationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("agent26");
  const [payoutVisible, setPayoutVisible] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadSimulation() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/validagent_demo_simulation.json");

        if (!response.ok) {
          throw new Error(`Failed to load simulation data (${response.status})`);
        }

        const json = (await response.json()) as SimulationData;
        if (!cancelled) {
          setData(json);
          setScenarioIndex(0);
          setCurrentStep(0);
          setSelectedAgentId(json.scenarios[0]?.steps[0]?.agentId ?? "agent26");
          setPayoutVisible(new Set());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load simulation data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSimulation();

    return () => {
      cancelled = true;
    };
  }, []);

  const scenarios = data?.scenarios ?? [];
  const activeScenario = scenarios[scenarioIndex] ?? null;
  const activeSteps = useMemo(() => {
    return [...(activeScenario?.steps ?? [])].sort((a, b) => a.step - b.step);
  }, [activeScenario]);
  const usesPairedPayouts = useMemo(() => {
    return activeSteps.some((step) => step.role === "sender");
  }, [activeSteps]);

  const steppedByAgentId = useMemo(() => {
    return new Map(activeSteps.slice(0, currentStep).map((step) => [step.agentId, step]));
  }, [activeSteps, currentStep]);

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of data?.agents ?? []) {
      map.set(agent.id, agent.label);
    }
    return map;
  }, [data]);

  const baselinePromptByAgentId = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of data?.agents ?? []) {
      map.set(agent.id, agent.baselinePrompt ?? "");
    }
    return map;
  }, [data]);

  const inspectorPrompt = useMemo(() => {
    if (!activeSteps.length) return null;

    const stepped = steppedByAgentId.get(selectedAgentId);
    if (stepped) return stepped.prompt;

    return baselinePromptByAgentId.get(selectedAgentId) ?? "";
  }, [activeSteps.length, baselinePromptByAgentId, selectedAgentId, steppedByAgentId]);

  const canRunStep = currentStep < activeSteps.length;

  const handleRunStep = () => {
    if (!canRunStep) return;

    const nextStep = activeSteps[currentStep];
    setPayoutVisible((prev) => {
      const next = new Set(prev);

      if (!usesPairedPayouts) {
        next.add(nextStep.agentId);
      } else {
        const nextCurrentStep = currentStep + 1;

        if (nextCurrentStep === 2) {
          const firstStep = activeSteps[0];
          const secondStep = activeSteps[1];
          if (firstStep) next.add(firstStep.agentId);
          if (secondStep) next.add(secondStep.agentId);
        }

        if (nextCurrentStep === 4) {
          const thirdStep = activeSteps[2];
          const fourthStep = activeSteps[3];
          if (thirdStep) next.add(thirdStep.agentId);
          if (fourthStep) next.add(fourthStep.agentId);
        }
      }

      return next;
    });
    setCurrentStep((value) => value + 1);
    setSelectedAgentId(nextStep.agentId);
  };

  const handleScenarioChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextIndex = Number(event.target.value);
    const nextScenario = scenarios[nextIndex];
    setScenarioIndex(nextIndex);
    setCurrentStep(0);
    setSelectedAgentId(nextScenario?.steps[0]?.agentId ?? "agent26");
    setPayoutVisible(new Set());
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-8 py-4 border-b border-gray-100">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">ValidAgent</span>
              <span className="text-sm font-medium text-gray-500">Repository</span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: `${COLORS.turquoise}20`, color: COLORS.turquoise }}
              >
                v1
              </span>
            </Link>
            <div className="flex gap-6">
              <Link
                href="/sets"
                className="text-sm font-medium text-gray-600 transition-colors"
              >
                Agent Sets
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium pb-1"
                style={{ color: COLORS.turquoise, borderBottom: `2px solid ${COLORS.turquoise}` }}
              >
                Projects
              </Link>
              <Link
                href="/resources"
                className="text-sm font-medium text-gray-600 transition-colors"
              >
                Resources
              </Link>
            </div>
          </nav>

          <div className="py-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Agent Simulation Demo
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Exported agent profiles loaded and prompted in a minimal simulation environment
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-3">
                <label htmlFor="scenario-select" className="text-sm font-medium text-gray-700">
                  Scenario
                </label>
                <select
                  id="scenario-select"
                  value={scenarioIndex}
                  onChange={handleScenarioChange}
                  disabled={loading || !!error || scenarios.length === 0}
                  className="min-w-64 rounded-lg border px-3 py-2 text-sm bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  style={{ borderColor: COLORS.light }}
                >
                  {scenarios.map((scenario, index) => (
                    <option key={scenario.id} value={index}>
                      {scenario.title}
                    </option>
                  ))}
                </select>
              </div>
              {activeScenario?.description && (
                <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                  {activeScenario.description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunStep}
              disabled={!canRunStep || loading || !!error}
              className="px-4 py-2.5 text-sm font-medium rounded-lg disabled:cursor-not-allowed"
              style={{
                backgroundColor: canRunStep && !loading && !error ? COLORS.greenblue : "#f3f4f6",
                color: canRunStep && !loading && !error ? "#ffffff" : "#9ca3af",
              }}
            >
              {canRunStep ? `Run Step ${"\u2192"}` : "Simulation Complete"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative px-5 pt-5 pb-4 lg:px-6 lg:pt-6 lg:pb-4 border-b lg:border-b-0 lg:border-r border-gray-100 min-h-[330px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-sm text-gray-500">
                  Loading simulation data...
                </div>
              ) : error ? (
                <div className="h-full flex items-center justify-center text-sm text-red-500">
                  {error}
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                >
                  {AGENT_LAYOUT.map(({ agentId, side }) => {
                    const stepped = steppedByAgentId.get(agentId);
                    const accentColor = stepped ? getStepColor(stepped.color) : COLORS.idle;
                    const label = agentNameById.get(agentId) ?? agentId;
                    const isSelected = selectedAgentId === agentId;
                    const visiblePayout = payoutVisible.has(agentId) ? stepped?.payout : null;

                    return (
                      <button
                        key={agentId}
                        type="button"
                        onClick={() => setSelectedAgentId(agentId)}
                        className={`w-full min-h-[100px] text-left ${side === "right" ? "self-end" : "self-start"}`}
                      >
                        <div
                          className={`flex items-start gap-4 min-h-[100px] ${side === "right" ? "flex-row-reverse text-right justify-start" : ""}`}
                        >
                          <div
                            className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-center px-2 shrink-0"
                            style={{
                              backgroundColor: stepped ? accentColor : "#f3f4f6",
                              borderColor: accentColor,
                              color: stepped ? "#ffffff" : COLORS.idle,
                              boxShadow: isSelected ? `0 0 0 4px ${accentColor}20` : "none",
                            }}
                          >
                            <span className="text-sm font-semibold leading-tight">{label}</span>
                          </div>

                          <div className="max-w-[23rem] flex-1 min-h-[100px]">
                            {stepped ? (
                              <div>
                                <div
                                  className="rounded-lg border p-3 text-sm leading-relaxed bg-white text-left whitespace-pre-line"
                                  style={{ borderColor: accentColor }}
                                >
                                  {stepped.bubble}
                                </div>
                                {visiblePayout && (
                                  <div
                                    className={`mt-2 font-bold text-base text-gray-700 ${side === "right" ? "text-left" : "text-right"}`}
                                  >
                                    {visiblePayout}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="h-full rounded-lg border border-transparent" aria-hidden="true" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <aside className="p-5 lg:p-6 bg-slate-50/50">
              <h2 className="text-sm uppercase tracking-wide text-gray-700">Prompt Inspector</h2>
              <div className="mt-3 mb-4 h-px w-full bg-gray-200" />

              <div className="rounded-lg border border-gray-200 bg-white p-4 h-[430px] overflow-y-auto font-mono text-xs leading-snug text-gray-800">
                {loading ? (
                  <p className="text-gray-500">Loading prompt...</p>
                ) : error ? (
                  <p className="text-red-500">Prompt data unavailable.</p>
                ) : inspectorPrompt ? (
                  splitPromptSections(inspectorPrompt).map((section) => (
                    <div key={section.title} className="mb-6 last:mb-0">
                      <div className="mb-2 text-gray-500">{section.title}</div>
                      <pre
                        className={`whitespace-pre-wrap break-words ${section.title === "PERSONA" ? "font-semibold" : ""}`}
                      >
                        {section.content || "---"}
                      </pre>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No prompt selected.</p>
                )}
              </div>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
