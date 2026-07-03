"use client";

import { useState } from "react";
import { TUHH_COLORS } from "@/lib/colors";
import type { PersonaCategory, WorkplacePersonaAgent, WorkplacePersonaMeta } from "@/types/workplacePersonas";

interface WorkplacePersonaCardProps {
  agent: WorkplacePersonaAgent;
  meta: WorkplacePersonaMeta;
}

const CATEGORIES: PersonaCategory[] = ["demographics", "characterTraits", "narrativeIdentity"];

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

export function WorkplacePersonaCard({ agent, meta }: WorkplacePersonaCardProps) {
  const [activeCategories, setActiveCategories] = useState<Set<PersonaCategory>>(new Set(CATEGORIES));
  const [showGeneratedPersona, setShowGeneratedPersona] = useState(false);

  const getTagColor = (tagId: string) => meta.tags.find((t) => t.id === tagId)?.color ?? TUHH_COLORS.gray;

  function toggleCategory(category: PersonaCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  const generatedPersona = (() => {
    const parts: string[] = [];
    if (activeCategories.has("demographics")) {
      parts.push(
        meta.promptWrapper.demographics
          .replace("{{name}}", agent.name)
          .replace("{{age}}", String(agent.age))
          .replace("{{gender}}", agent.gender)
          .replace("{{occupation}}", agent.occupation)
      );
    }
    if (activeCategories.has("characterTraits")) {
      parts.push(meta.promptWrapper.characterTraits.replace("{{traits}}", agent.traits.join(", ")));
    }
    if (activeCategories.has("narrativeIdentity")) {
      parts.push(meta.promptWrapper.narrativeIdentity.replace("{{narrative}}", agent.narrative));
    }
    return parts.join(" ");
  })();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{ border: `1px solid ${TUHH_COLORS.light}`, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      {/* Header */}
      <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${TUHH_COLORS.light}` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
            style={{ backgroundColor: TUHH_COLORS.orange }}
          >
            {getInitials(agent.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{agent.name}</h3>
              <span className="text-xs font-mono text-gray-400">{agent.id}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: getTagColor(tagId) }}
                >
                  {meta.tags.find((t) => t.id === tagId)?.name ?? tagId}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trait Sections - Toggle left, Content right */}
      <div className="divide-y divide-gray-100">
        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeCategories.has("demographics")}
              onChange={() => toggleCategory("demographics")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeCategories.has("demographics") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Demographics</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-700">
              <span>{agent.age} y/o</span>
              <span>{agent.gender}</span>
              <span>{agent.occupation}</span>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeCategories.has("characterTraits")}
              onChange={() => toggleCategory("characterTraits")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeCategories.has("characterTraits") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Character Traits</h4>
            <div className="flex flex-wrap gap-1">
              {agent.traits.map((trait, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded"
                  style={{
                    backgroundColor: activeCategories.has("characterTraits") ? `${TUHH_COLORS.orange}20` : TUHH_COLORS.light,
                    color: activeCategories.has("characterTraits") ? TUHH_COLORS.orange : TUHH_COLORS.gray,
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeCategories.has("narrativeIdentity")}
              onChange={() => toggleCategory("narrativeIdentity")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeCategories.has("narrativeIdentity") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Narrative Identity</h4>
            <p className="text-sm text-gray-600 leading-relaxed">{agent.narrative}</p>
          </div>
        </div>
      </div>

      {/* Generated Persona Section */}
      <div className="border-t border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowGeneratedPersona(!showGeneratedPersona)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors"
          style={{ color: TUHH_COLORS.dark }}
        >
          <span className={`text-xs transition-transform ${showGeneratedPersona ? "rotate-90" : ""}`}>▸</span>
          Generated Prompt ({activeCategories.size}/{CATEGORIES.length} active)
        </button>
        {showGeneratedPersona && (
          <div className="px-4 pb-3">
            {generatedPersona ? (
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto font-mono border border-gray-200">
                {generatedPersona}
              </pre>
            ) : (
              <p className="text-xs text-gray-400 italic p-3">
                No traits selected. Enable at least one category to generate a prompt.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WorkplacePersonaCard;
