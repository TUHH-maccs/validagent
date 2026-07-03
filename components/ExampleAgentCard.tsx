"use client";

import { useState } from "react";
import { TUHH_COLORS, CHART_COLORS } from "@/lib/colors";
import type { ExampleAgent, ExamplesMeta } from "@/types/examples";

interface ExampleAgentCardProps {
  agent: ExampleAgent;
  meta: ExamplesMeta;
}

const ORIGIN_COLORS: Record<string, { bg: string; text: string }> = {
  synthetic: { bg: `${TUHH_COLORS.turquoise}20`, text: TUHH_COLORS.turquoise },
  human: { bg: `${TUHH_COLORS.greenblue}20`, text: TUHH_COLORS.greenblue },
  curated: { bg: `${CHART_COLORS.honest}20`, text: CHART_COLORS.honest },
};

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

export function ExampleAgentCard({ agent, meta }: ExampleAgentCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getTagColor = (tagId: string) => meta.tags.find((t) => t.id === tagId)?.color ?? TUHH_COLORS.gray;

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{ border: `1px solid ${TUHH_COLORS.light}`, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3">
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
                  backgroundColor: ORIGIN_COLORS[agent.origin]?.bg ?? TUHH_COLORS.light,
                  color: ORIGIN_COLORS[agent.origin]?.text ?? TUHH_COLORS.gray,
                }}
              >
                {agent.origin}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{agent.name}</h3>
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
              {meta.tags.find((t) => t.id === tagId)?.name ?? tagId}
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
              <span key={index} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
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
          <span className={`text-xs transition-transform ${showDetails ? "rotate-90" : ""}`}>▸</span>
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

export default ExampleAgentCard;
