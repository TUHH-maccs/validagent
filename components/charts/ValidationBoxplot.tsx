"use client";

import { useMemo, useState } from "react";
import { CHART_COLORS, TUHH_COLORS } from "@/lib/colors";

export interface AgentValidationPoint {
  id: string;
  name: string;
  humanHonest: boolean;
  agentHonestRate: number;
  hexacoHH: number;
}

interface ValidationBoxplotProps {
  agents: AgentValidationPoint[];
  experimentId?: string;
  title?: string;
}

// Calculate boxplot statistics
function calcBoxplotStats(values: number[]) {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, mean: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const lowerHalf = sorted.slice(0, Math.floor(n / 2));
  const upperHalf = sorted.slice(Math.ceil(n / 2));

  const q1 = lowerHalf.length > 0
    ? lowerHalf[Math.floor(lowerHalf.length / 2)]
    : sorted[0];
  const q3 = upperHalf.length > 0
    ? upperHalf[Math.floor(upperHalf.length / 2)]
    : sorted[n - 1];

  return {
    min: sorted[0],
    max: sorted[n - 1],
    q1,
    median,
    q3,
    mean: values.reduce((a, b) => a + b, 0) / n,
  };
}

// Deterministic jitter based on index
function seededJitter(index: number, spread: number): number {
  const seed = ((index * 7919 + 104729) % 1000) / 1000;
  return (seed - 0.5) * spread;
}

export function ValidationBoxplot({ agents, experimentId, title }: ValidationBoxplotProps) {
  // Separate by human honesty status
  const dishonestHumans = useMemo(() =>
    agents.filter((a) => !a.humanHonest), [agents]);
  const honestHumans = useMemo(() =>
    agents.filter((a) => a.humanHonest), [agents]);

  // Calculate stats
  const dishonestStats = useMemo(() =>
    calcBoxplotStats(dishonestHumans.map(a => a.agentHonestRate)), [dishonestHumans]);
  const honestStats = useMemo(() =>
    calcBoxplotStats(honestHumans.map(a => a.agentHonestRate)), [honestHumans]);

  // Chart dimensions
  const width = 400;
  const height = 280;
  const marginTop = 20;
  const marginBottom = 50;
  const marginLeft = 50;
  const marginRight = 20;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // Scales
  const yScale = (val: number) => marginTop + plotHeight * (1 - val);
  const boxWidth = 60;
  const dishonestX = marginLeft + plotWidth * 0.25;
  const honestX = marginLeft + plotWidth * 0.75;

  // Tooltip state
  const [hoveredAgent, setHoveredAgent] = useState<AgentValidationPoint | null>(null);

  // Draw boxplot for a group
  const renderBoxplot = (
    stats: ReturnType<typeof calcBoxplotStats>,
    centerX: number,
    color: string,
    agents: AgentValidationPoint[],
    groupName: string
  ) => {
    const { min, q1, median, q3, max } = stats;
    const halfWidth = boxWidth / 2;

    return (
      <g key={groupName}>
        {/* Whisker line (min to max) */}
        <line
          x1={centerX}
          y1={yScale(min)}
          x2={centerX}
          y2={yScale(max)}
          stroke={color}
          strokeWidth={1.5}
        />

        {/* Min whisker cap */}
        <line
          x1={centerX - halfWidth / 2}
          y1={yScale(min)}
          x2={centerX + halfWidth / 2}
          y2={yScale(min)}
          stroke={color}
          strokeWidth={1.5}
        />

        {/* Max whisker cap */}
        <line
          x1={centerX - halfWidth / 2}
          y1={yScale(max)}
          x2={centerX + halfWidth / 2}
          y2={yScale(max)}
          stroke={color}
          strokeWidth={1.5}
        />

        {/* Box (Q1 to Q3) */}
        <rect
          x={centerX - halfWidth}
          y={yScale(q3)}
          width={boxWidth}
          height={yScale(q1) - yScale(q3)}
          fill={color}
          fillOpacity={0.2}
          stroke={color}
          strokeWidth={1.5}
        />

        {/* Median line */}
        <line
          x1={centerX - halfWidth}
          y1={yScale(median)}
          x2={centerX + halfWidth}
          y2={yScale(median)}
          stroke={color}
          strokeWidth={2.5}
        />

        {/* Scatter points */}
        {agents.map((agent, i) => (
          <circle
            key={agent.id}
            cx={centerX + seededJitter(i, boxWidth * 0.8)}
            cy={yScale(agent.agentHonestRate)}
            r={5}
            fill={color}
            fillOpacity={0.7}
            stroke={TUHH_COLORS.white}
            strokeWidth={1}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoveredAgent(agent)}
            onMouseLeave={() => setHoveredAgent(null)}
          />
        ))}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" style={{ borderColor: TUHH_COLORS.light, borderWidth: 1 }}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: TUHH_COLORS.dark }}>
          {title || "Agent Honesty by Human Status"}
        </h3>
        {experimentId && (
          <p className="text-sm" style={{ color: TUHH_COLORS.gray }}>Experiment {experimentId}</p>
        )}
        <p className="text-xs mt-1" style={{ color: TUHH_COLORS.gray }}>
          Do agents replicate human honesty behavior? Each dot = 1 agent
        </p>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((val) => (
            <g key={val}>
              <line
                x1={marginLeft}
                y1={yScale(val)}
                x2={width - marginRight}
                y2={yScale(val)}
                stroke={TUHH_COLORS.light}
                strokeDasharray={val === 0.5 ? "5 3" : "0"}
              />
              <text
                x={marginLeft - 8}
                y={yScale(val)}
                textAnchor="end"
                dominantBaseline="middle"
                fill={TUHH_COLORS.gray}
                fontSize={12}
              >
                {(val * 100).toFixed(0)}%
              </text>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={15}
            y={marginTop + plotHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(-90, 15, ${marginTop + plotHeight / 2})`}
            fill={TUHH_COLORS.dark}
            fontSize={12}
            fontWeight={500}
          >
            Agent Honest Rate
          </text>

          {/* X-axis */}
          <line
            x1={marginLeft}
            y1={height - marginBottom}
            x2={width - marginRight}
            y2={height - marginBottom}
            stroke={TUHH_COLORS.light}
          />

          {/* X-axis labels */}
          <text
            x={dishonestX}
            y={height - marginBottom + 20}
            textAnchor="middle"
            fill={TUHH_COLORS.dark}
            fontSize={13}
            fontWeight={500}
          >
            Human Dishonest
          </text>
          <text
            x={dishonestX}
            y={height - marginBottom + 34}
            textAnchor="middle"
            fill={TUHH_COLORS.gray}
            fontSize={11}
          >
            (n={dishonestHumans.length})
          </text>

          <text
            x={honestX}
            y={height - marginBottom + 20}
            textAnchor="middle"
            fill={TUHH_COLORS.dark}
            fontSize={13}
            fontWeight={500}
          >
            Human Honest
          </text>
          <text
            x={honestX}
            y={height - marginBottom + 34}
            textAnchor="middle"
            fill={TUHH_COLORS.gray}
            fontSize={11}
          >
            (n={honestHumans.length})
          </text>

          {/* X-axis title */}
          <text
            x={marginLeft + plotWidth / 2}
            y={height - 5}
            textAnchor="middle"
            fill={TUHH_COLORS.gray}
            fontSize={11}
          >
            Human Honesty Status
          </text>

          {/* Boxplots - using TUHH colors */}
          {renderBoxplot(dishonestStats, dishonestX, CHART_COLORS.dishonest, dishonestHumans, "dishonest")}
          {renderBoxplot(honestStats, honestX, CHART_COLORS.honest, honestHumans, "honest")}
        </svg>

        {/* Tooltip */}
        {hoveredAgent && (
          <div
            className="absolute rounded-lg p-2 shadow-lg text-xs pointer-events-none z-10"
            style={{
              left: hoveredAgent.humanHonest ? honestX + 40 : dishonestX + 40,
              top: yScale(hoveredAgent.agentHonestRate) - 20,
              backgroundColor: TUHH_COLORS.white,
              border: `1px solid ${TUHH_COLORS.light}`,
              color: TUHH_COLORS.dark,
            }}
          >
            <p className="font-semibold">{hoveredAgent.name}</p>
            <p>Agent Honest Rate: {(hoveredAgent.agentHonestRate * 100).toFixed(0)}%</p>
            <p>HEXACO H-H: {hoveredAgent.hexacoHH.toFixed(2)}</p>
            <p>Human was: {hoveredAgent.humanHonest ? "Honest" : "Dishonest"}</p>
          </div>
        )}
      </div>

      {/* Stats summary */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-lg p-3" style={{ backgroundColor: `${CHART_COLORS.dishonest}15` }}>
          <h4 className="font-semibold mb-1" style={{ color: CHART_COLORS.dishonest }}>
            Human Dishonest (n={dishonestHumans.length})
          </h4>
          <p style={{ color: TUHH_COLORS.dark }}>
            Agent Median: <span className="font-mono">{(dishonestStats.median * 100).toFixed(0)}%</span>
          </p>
          <p style={{ color: TUHH_COLORS.dark }}>
            IQR: <span className="font-mono">{(dishonestStats.q1 * 100).toFixed(0)}% - {(dishonestStats.q3 * 100).toFixed(0)}%</span>
          </p>
        </div>
        <div className="rounded-lg p-3" style={{ backgroundColor: `${CHART_COLORS.honest}15` }}>
          <h4 className="font-semibold mb-1" style={{ color: CHART_COLORS.honest }}>
            Human Honest (n={honestHumans.length})
          </h4>
          <p style={{ color: TUHH_COLORS.dark }}>
            Agent Median: <span className="font-mono">{(honestStats.median * 100).toFixed(0)}%</span>
          </p>
          <p style={{ color: TUHH_COLORS.dark }}>
            IQR: <span className="font-mono">{(honestStats.q1 * 100).toFixed(0)}% - {(honestStats.q3 * 100).toFixed(0)}%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ValidationBoxplot;
