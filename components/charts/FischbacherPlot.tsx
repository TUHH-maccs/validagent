"use client";

import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CHART_COLORS, TUHH_COLORS } from "@/lib/colors";

export interface DistributionData {
  rollPct: number[];   // [pct_1, pct_2, pct_3, pct_4, pct_5, pct_6]
  humanPct: number[];
  agentPct: number[];
}

interface FischbacherPlotProps {
  data: DistributionData;
  title?: string;
  experimentId?: string;
  /** Payout per die face 1-6. Defaults to the original prestudy2 payout table. */
  payouts?: number[];
}

// Die faces sorted by ascending payout (both the original and the honesty-pilot
// payout tables happen to share this ordering: 6 pays least, 5 pays most).
const PAYOFF_ORDER = [6, 1, 2, 3, 4, 5];
const DEFAULT_PAYOUTS = [0.4, 0.8, 1.2, 1.6, 2.0, 0.0]; // indexed by die face 1-6
const FAIR_PERCENTAGE = 100 / 6; // ~16.67%

// Chart geometry, in the same pixel units as ValidationBoxplot.tsx's
// hand-drawn SVG (title x, tick text x, and plot-start x match exactly) so
// the two charts line up. Recharts' own axis/label positioning (both the
// built-in YAxis and its <Customized> escape hatch) kept landing in
// different places than declared, so the y-axis here is drawn as a
// completely separate, absolutely-positioned SVG overlay on top of the
// chart — same technique as the boxplot, no recharts involvement at all.
const CHART_HEIGHT = 300;
const MARGIN_TOP = 20;
const MARGIN_RIGHT = 30;
const MARGIN_BOTTOM = 15;
const X_AXIS_HEIGHT = 40;
const AXIS_TITLE_X = 12;
const AXIS_TICK_X = 52;
const PLOT_START_X = 64;

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

// Two-line x-axis tick: die face on top, payout below.
function PayoffTick(props: { x?: number; y?: number; payload?: { value: string } }) {
  const { x = 0, y = 0, payload } = props;
  const [dieValue, payoffLabel] = (payload?.value ?? "").split("|");
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={12} fill={TUHH_COLORS.dark} fontWeight={600}>
        {dieValue}
      </text>
      <text x={0} y={0} dy={26} textAnchor="middle" fontSize={11} fill={TUHH_COLORS.gray}>
        {payoffLabel}
      </text>
    </g>
  );
}

// Y-axis overlay: gridlines, tick labels, and rotated title, all drawn at
// exact pixel coordinates independent of recharts. Gridlines run from
// PLOT_START_X (same start as the "Fair" reference line) to the right edge —
// i.e. only inside the plot area, not behind the percentage labels.
function YAxisOverlay({ width, yMax }: { width: number; yMax: number }) {
  const plotBottom = CHART_HEIGHT - MARGIN_BOTTOM - X_AXIS_HEIGHT;
  const plotHeight = plotBottom - MARGIN_TOP;
  const yScale = (v: number) => MARGIN_TOP + plotHeight * (1 - v / yMax);
  const ticks = [0, 1, 2, 3, 4, 5].map((i) => Math.round((yMax * i) / 5));

  return (
    <>
      {/* Gridlines only, behind the bars (negative z-index, scoped to the
          isolated stacking context on the container so it can't slip behind
          the card's own white background). */}
      <svg
        width={width}
        height={CHART_HEIGHT}
        className="absolute top-0 left-0 pointer-events-none overflow-visible -z-10"
      >
        {ticks.map((v) => (
          <line
            key={v}
            x1={PLOT_START_X}
            x2={width - MARGIN_RIGHT}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke={TUHH_COLORS.light}
          />
        ))}
      </svg>

      {/* Tick labels + title, in front of the bars like normal axis text. */}
      <svg
        width={width}
        height={CHART_HEIGHT}
        className="absolute top-0 left-0 pointer-events-none overflow-visible"
      >
        {ticks.map((v) => (
          <text key={v} x={AXIS_TICK_X} y={yScale(v)} dy={4} textAnchor="end" fontSize={12} fill={TUHH_COLORS.gray}>
            {v}%
          </text>
        ))}
        <text
          x={AXIS_TITLE_X}
          y={MARGIN_TOP + plotHeight / 2}
          textAnchor="middle"
          fontSize={12}
          fill={TUHH_COLORS.dark}
          transform={`rotate(-90, ${AXIS_TITLE_X}, ${MARGIN_TOP + plotHeight / 2})`}
        >
          Relative Frequency
        </text>
      </svg>
    </>
  );
}

export function FischbacherPlot({ data, title, experimentId, payouts = DEFAULT_PAYOUTS }: FischbacherPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(w);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chartData = PAYOFF_ORDER.map((dieValue) => {
    const arrayIndex = dieValue - 1; // Convert 1-6 to 0-5
    return {
      payoff: `${dieValue}|${formatUsd(payouts[arrayIndex])}`,
      dieValue,
      roll: data.rollPct[arrayIndex],
      human: data.humanPct[arrayIndex],
      agent: data.agentPct[arrayIndex],
    };
  });

  const maxValue = Math.max(...chartData.flatMap((d) => [d.roll, d.human, d.agent]), FAIR_PERCENTAGE);
  const yMax = Math.ceil((maxValue * 1.2) / 5) * 5;

  const sortedPayouts = [...payouts].sort((a, b) => a - b);
  const payoutRange = `${formatUsd(sortedPayouts[0])} to ${formatUsd(sortedPayouts[sortedPayouts.length - 1])}`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6" style={{ border: `1px solid ${TUHH_COLORS.light}` }}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold" style={{ color: TUHH_COLORS.dark }}>
          {title || "Roll vs Human & Agent Reports"}
        </h3>
        {experimentId && (
          <p className="text-sm" style={{ color: TUHH_COLORS.gray }}>Experiment {experimentId}</p>
        )}
        <p className="text-xs mt-1" style={{ color: TUHH_COLORS.gray }}>
          X-axis ordered by payoff ({payoutRange}). Dashed line = fair die (16.7%)
        </p>
      </div>

      <div ref={containerRef} className="relative isolate">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart
            data={chartData}
            margin={{ top: MARGIN_TOP, right: MARGIN_RIGHT, left: PLOT_START_X, bottom: MARGIN_BOTTOM }}
          >
            <XAxis
              dataKey="payoff"
              height={X_AXIS_HEIGHT}
              tick={<PayoffTick />}
              tickLine={false}
              axisLine={{ stroke: TUHH_COLORS.light }}
            />
            <YAxis domain={[0, yMax]} hide />
            <Tooltip
              contentStyle={{
                backgroundColor: TUHH_COLORS.white,
                border: `1px solid ${TUHH_COLORS.light}`,
                borderRadius: "8px",
                fontSize: "12px",
                color: TUHH_COLORS.dark,
              }}
              formatter={(value, name) => [
                `${(value as number).toFixed(1)}%`,
                name === "roll" ? "Actual Roll" : name === "human" ? "Human Report" : "Agent Report",
              ]}
              labelFormatter={(label) => `Die Roll: ${String(label).split("|")[0]} (${FAIR_PERCENTAGE.toFixed(1)}%)`}
            />
            <ReferenceLine
              y={FAIR_PERCENTAGE}
              stroke={TUHH_COLORS.gray}
              strokeDasharray="5 5"
              label={{
                value: "Fair",
                position: "right",
                fill: TUHH_COLORS.gray,
                fontSize: 10,
              }}
            />
            {/* Roll = neutral gray, Human = petrol, Agent = orange */}
            <Bar dataKey="roll" fill={CHART_COLORS.neutral} name="roll" radius={[2, 2, 0, 0]} />
            <Bar dataKey="human" fill={CHART_COLORS.human} name="human" radius={[2, 2, 0, 0]} />
            <Bar dataKey="agent" fill={CHART_COLORS.agent} name="agent" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <YAxisOverlay width={width} yMax={yMax} />
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-6 text-sm" style={{ color: TUHH_COLORS.dark }}>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: CHART_COLORS.neutral }}></div>
          <span>Actual die rolls</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: CHART_COLORS.human }}></div>
          <span>Human reported</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded" style={{ backgroundColor: CHART_COLORS.agent }}></div>
          <span>Agent reported</span>
        </div>
      </div>
    </div>
  );
}

export default FischbacherPlot;
