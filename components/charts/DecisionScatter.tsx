"use client";

import { useMemo } from "react";
import { CHART_COLORS, TUHH_COLORS } from "@/lib/colors";

export interface RunData {
  run: number;
  decision: number;
  honest: boolean;
}

interface DecisionScatterProps {
  runs: RunData[];
  roll: number;
  humanReport: number;
  humanHonest: boolean;
  agentName?: string;
}

// Payoff order mapping: die value -> Y position (0-5 from bottom to top)
// 6 = $0 (bottom), 1 = $0.40, 2 = $0.80, 3 = $1.20, 4 = $1.60, 5 = $2 (top)
const dieToY = (die: number): number => {
  if (die === 6) return 0;
  return die;
};

const PAYOFF_LABELS: Record<number, { die: number; label: string }> = {
  0: { die: 6, label: "6 ($0)" },
  1: { die: 1, label: "1 ($0.40)" },
  2: { die: 2, label: "2 ($0.80)" },
  3: { die: 3, label: "3 ($1.20)" },
  4: { die: 4, label: "4 ($1.60)" },
  5: { die: 5, label: "5 ($2)" },
};

// Deterministic pseudo-random based on index (for consistent jitter)
const seededJitter = (index: number, plotWidth: number): number => {
  const seed = (index * 7919 + 104729) % 1000;
  return 15 + (seed / 1000) * (plotWidth - 30);
};

export function DecisionScatter({
  runs,
  roll,
  humanReport,
  humanHonest,
}: DecisionScatterProps) {
  // Guard against empty/invalid data
  if (!runs || runs.length === 0) {
    return (
      <div className="text-center text-xs py-4" style={{ color: TUHH_COLORS.gray }}>
        No run data available
      </div>
    );
  }

  // Chart dimensions - wider now that legend is below
  const width = 160;
  const height = 150;
  const marginTop = 10;
  const marginBottom = 10;
  const marginLeft = 5;
  const plotWidth = width - marginLeft;
  const plotHeight = height - marginTop - marginBottom;

  // Y scale: 0-5 maps to plotHeight-0 (inverted for SVG)
  const yScale = (yVal: number) => marginTop + plotHeight - (yVal / 5) * plotHeight;

  // Prepare data points
  const rollY = dieToY(roll);
  const humanY = dieToY(humanReport);

  // Agent decision points with deterministic jitter
  const agentPoints = useMemo(() => runs.map((r, i) => ({
    x: marginLeft + seededJitter(i, plotWidth),
    y: yScale(dieToY(r.decision)),
    honest: r.decision === roll,
    decision: r.decision,
    run: i,
  })), [runs, roll, plotWidth]);

  // Stats
  const honestCount = runs.filter((r) => r.decision === roll).length;
  const honestRate = Math.round((honestCount / runs.length) * 100);

  return (
    <div>
      {/* Chart area with Y-axis labels */}
      <div className="flex items-start gap-1">
        {/* Y-axis labels - larger text */}
        <div
          className="flex flex-col justify-between font-mono flex-shrink-0"
          style={{ height: height, paddingTop: marginTop, paddingBottom: marginBottom, fontSize: "10px", color: TUHH_COLORS.gray }}
        >
          {[5, 4, 3, 2, 1, 0].map((yVal) => (
            <div key={yVal} className="leading-none text-right pr-1" style={{ minWidth: "52px" }}>
              {PAYOFF_LABELS[yVal].label}
            </div>
          ))}
        </div>

        {/* SVG Plot */}
        <svg width={width} height={height} className="flex-shrink-0">
          {/* Horizontal grid lines - more visible */}
          {[0, 1, 2, 3, 4, 5].map((yVal) => (
            <line
              key={yVal}
              x1={marginLeft}
              y1={yScale(yVal)}
              x2={width}
              y2={yScale(yVal)}
              stroke={TUHH_COLORS.gray}
              strokeWidth={0.5}
              strokeOpacity={0.3}
            />
          ))}

          {/* Roll reference line (dashed) - more prominent */}
          <line
            x1={marginLeft}
            y1={yScale(rollY)}
            x2={width}
            y2={yScale(rollY)}
            stroke={TUHH_COLORS.dark}
            strokeWidth={2.5}
            strokeDasharray="6 4"
          />

          {/* Agent decision dots */}
          {agentPoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={5}
              fill={pt.honest ? CHART_COLORS.honest : CHART_COLORS.dishonest}
              fillOpacity={0.85}
            />
          ))}

          {/* Human report (large circle with border) */}
          <circle
            cx={marginLeft + plotWidth / 2}
            cy={yScale(humanY)}
            r={9}
            fill={humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest}
            stroke={TUHH_COLORS.white}
            strokeWidth={2.5}
          />
        </svg>
      </div>

      {/* Legend below plot - centered */}
      <div className="mt-3 pt-2 flex flex-wrap items-center justify-center gap-4 text-xs" style={{ borderTop: `1px solid ${TUHH_COLORS.light}`, color: TUHH_COLORS.dark }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 border-t-2 border-dashed" style={{ borderColor: TUHH_COLORS.dark }}></div>
          <span>Roll</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{
              backgroundColor: CHART_COLORS.human,
              border: `2px solid ${TUHH_COLORS.white}`,
              boxShadow: `0 0 0 1px ${CHART_COLORS.human}`,
            }}
          ></div>
          <span>Human</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.agent }}></div>
          <span>Agent</span>
        </div>
        <div className="flex items-center gap-1.5 pl-2" style={{ borderLeft: `1px solid ${TUHH_COLORS.light}` }}>
          <span className="font-semibold" style={{
            color: honestRate >= 90 ? CHART_COLORS.honest :
                   honestRate <= 50 ? CHART_COLORS.dishonest :
                   TUHH_COLORS.orange
          }}>
            {honestRate}% honest
          </span>
        </div>
      </div>
    </div>
  );
}

export default DecisionScatter;
