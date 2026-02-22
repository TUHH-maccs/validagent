"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
}

// Payoff order: 6=$0, 1=$0.40, 2=$0.80, 3=$1.20, 4=$1.60, 5=$2.00
const PAYOFF_ORDER = [6, 1, 2, 3, 4, 5];
const PAYOFF_LABELS = ["$0.00", "$0.40", "$0.80", "$1.20", "$1.60", "$2.00"];
const FAIR_PERCENTAGE = 100 / 6; // ~16.67%

export function FischbacherPlot({ data, title, experimentId }: FischbacherPlotProps) {
  // Transform data to payoff order
  const chartData = PAYOFF_ORDER.map((dieValue, index) => {
    const arrayIndex = dieValue - 1; // Convert 1-6 to 0-5
    return {
      payoff: PAYOFF_LABELS[index],
      dieValue: dieValue,
      roll: data.rollPct[arrayIndex],
      human: data.humanPct[arrayIndex],
      agent: data.agentPct[arrayIndex],
    };
  });

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
          X-axis ordered by payoff ($0 to $2). Dashed line = fair die (16.7%)
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={TUHH_COLORS.light} />
          <XAxis
            dataKey="payoff"
            tick={{ fontSize: 12, fill: TUHH_COLORS.dark }}
            tickLine={false}
            axisLine={{ stroke: TUHH_COLORS.light }}
          />
          <YAxis
            domain={[0, 60]}
            tick={{ fontSize: 12, fill: TUHH_COLORS.dark }}
            tickLine={false}
            axisLine={{ stroke: TUHH_COLORS.light }}
            label={{
              value: "Percentage (%)",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 12, fill: TUHH_COLORS.gray },
            }}
          />
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
            labelFormatter={(label) => `Payoff: ${label}`}
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
