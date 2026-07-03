"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  /** Payout per die face 1-6. Defaults to the original prestudy2 payout table. */
  payouts?: number[];
  /** Show the "X% honest" badge in the legend. Default true (legacy behavior). */
  showHonestyRate?: boolean;
}

// Payoff order mapping: die value -> Y position (0-5 from bottom to top)
const dieToY = (die: number): number => {
  if (die === 6) return 0;
  return die;
};

const DEFAULT_PAYOUTS = [0.4, 0.8, 1.2, 1.6, 2.0, 0.0]; // indexed by die face 1-6

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function buildPayoffLabels(payouts: number[]): Record<number, { die: number; label: string }> {
  const dieOrder = [6, 1, 2, 3, 4, 5]; // bottom ($0) to top (highest payout)
  return Object.fromEntries(
    dieOrder.map((die, y) => [y, { die, label: `${die} (${formatUsd(payouts[die - 1])})` }])
  );
}

export function DecisionScatter({
  runs,
  roll,
  humanReport,
  humanHonest,
  payouts = DEFAULT_PAYOUTS,
  showHonestyRate = true,
}: DecisionScatterProps) {
  // Guard against empty/invalid data
  if (!runs || runs.length === 0) {
    return (
      <div className="text-center text-xs py-4" style={{ color: TUHH_COLORS.gray }}>
        No run data available
      </div>
    );
  }

  const payoffLabels = buildPayoffLabels(payouts);

  // Plot width tracks the actual container (the "Behavioral Alignment"
  // tile) so the gridlines/roll line never overflow it — e.g. at higher
  // browser zoom levels, where a fixed pixel width used to stick out past
  // the tile's edge.
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(160);

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

  const height = 150;
  // Extra top/bottom margin so the human point's outer ring (r=11 + stroke)
  // doesn't get clipped by the SVG bounds on the top/bottom rows.
  const marginTop = 14;
  const marginBottom = 14;
  // Shifted right a bit from the axis labels for breathing room.
  const marginLeft = 8;
  // Gap between the gridlines/roll line and the right edge of the tile.
  const marginRight = 8;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;

  // Y scale: 0-5 maps to plotHeight-0 (inverted for SVG)
  const yScale = (yVal: number) => marginTop + plotHeight - (yVal / 5) * plotHeight;

  // Prepare data points
  const rollY = dieToY(roll);
  const humanY = dieToY(humanReport);

  // Fixed x-layout: human sits to the left of a tightly-packed agent-run
  // cluster (not spread across the row), and the whole [human ... last
  // agent] block is centered within the plot width — regardless of run
  // count or which row each point falls on.
  const dotSpacing = 9; // tight, near-touching for radius-5 agent dots
  const humanAgentGap = 18;
  const agentClusterWidth = runs.length > 1 ? (runs.length - 1) * dotSpacing : 0;
  const totalContentWidth = humanAgentGap + agentClusterWidth;
  const plotCenterX = marginLeft + plotWidth / 2;
  const humanX = plotCenterX - totalContentWidth / 2;
  const agentStartX = humanX + humanAgentGap;

  const agentPoints = useMemo(() => runs.map((r, i) => ({
    x: agentStartX + i * dotSpacing,
    y: yScale(dieToY(r.decision)),
    honest: r.decision === roll,
    decision: r.decision,
    run: i,
  })), [runs, roll, agentStartX, marginTop, plotHeight]);

  // Stats
  const honestCount = runs.filter((r) => r.decision === roll).length;
  const honestRate = Math.round((honestCount / runs.length) * 100);

  return (
    <div>
      {/* Chart area with Y-axis labels */}
      <div className="flex items-start gap-2">
        {/* Y-axis labels — absolutely positioned at the exact same yScale
            coordinate as their gridline, instead of relying on flexbox to
            approximate the spacing (which drifted out of sync with the
            lines). */}
        <div className="relative flex-shrink-0" style={{ width: "56px", height }}>
          {[5, 4, 3, 2, 1, 0].map((yVal) => (
            <div
              key={yVal}
              className="absolute right-0 leading-none text-right pr-1"
              style={{ top: yScale(yVal), transform: "translateY(-50%)", fontSize: "12px", color: TUHH_COLORS.gray, width: "100%" }}
            >
              {payoffLabels[yVal].label}
            </div>
          ))}
        </div>

        {/* SVG Plot — width="100%" so the element itself is CSS-guaranteed to
            never exceed the container (immune to zoom/rounding drift). The
            ResizeObserver-measured `width` sets the viewBox's internal
            coordinate system; preserveAspectRatio="meet" (not "none") keeps
            X/Y scaled uniformly so dots stay perfectly round even if that
            measurement briefly lags the real width during a zoom change —
            worst case a hairline gap on the right for a frame, never a
            stretched/oval dot. */}
        <div ref={containerRef} className="flex-1 min-w-0">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMinYMid meet">
            {/* Horizontal grid lines - more visible */}
            {[0, 1, 2, 3, 4, 5].map((yVal) => (
              <line
                key={yVal}
                x1={marginLeft}
                y1={yScale(yVal)}
                x2={width - marginRight}
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
              x2={width - marginRight}
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

            {/* Human report — same honest/dishonest fill as the small agent
                dots, plus a white inner border and a colored outer ring so it
                still stands out as "the" reference point. */}
            <circle
              cx={humanX}
              cy={yScale(humanY)}
              r={11}
              fill="none"
              stroke={humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest}
              strokeWidth={1.5}
            />
            <circle
              cx={humanX}
              cy={yScale(humanY)}
              r={9}
              fill={humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest}
              stroke={TUHH_COLORS.white}
              strokeWidth={2.5}
            />
          </svg>
        </div>
      </div>

      {/* Legend below plot - centered */}
      <div className="mt-1 pt-1 flex flex-wrap items-center justify-center gap-4 text-xs" style={{ borderTop: `1px solid ${TUHH_COLORS.light}`, color: TUHH_COLORS.dark }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 border-t-2 border-dashed" style={{ borderColor: TUHH_COLORS.dark }}></div>
          <span>Roll</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 rounded-full"
            style={{
              backgroundColor: humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest,
              border: `2px solid ${TUHH_COLORS.white}`,
              boxShadow: `0 0 0 1.5px ${humanHonest ? CHART_COLORS.honest : CHART_COLORS.dishonest}`,
            }}
          ></div>
          <span>Human</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.dishonest, opacity: 0.85 }}></div>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS.honest, opacity: 0.85 }}></div>
          </div>
          <span>Agent</span>
        </div>
        {showHonestyRate && (
          <div className="flex items-center gap-1.5 pl-2" style={{ borderLeft: `1px solid ${TUHH_COLORS.light}` }}>
            <span className="font-semibold" style={{
              color: honestRate >= 90 ? CHART_COLORS.honest :
                     honestRate <= 50 ? CHART_COLORS.dishonest :
                     TUHH_COLORS.orange
            }}>
              {honestRate}% honest
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default DecisionScatter;
