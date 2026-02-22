"use client";

import { useState } from "react";
import Image from "next/image";
import type { StructuredAgent, Tag, PromptWrapper, TraitCategory } from "@/types";
import { TUHH_COLORS } from "@/lib/colors";

interface StructuredAgentCardProps {
  agent: StructuredAgent;
  tags: Tag[];
  promptWrapper: PromptWrapper;
  traitCategories: TraitCategory[];
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function StructuredAgentCard({
  agent,
  tags,
  promptWrapper,
  traitCategories,
  isSelected,
  onSelect,
}: StructuredAgentCardProps) {
  const [activeTraits, setActiveTraits] = useState<Set<TraitCategory>>(
    new Set(traitCategories)
  );
  const [showGeneratedPersona, setShowGeneratedPersona] = useState(false);

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    return tag?.color || "#14b8a6";
  };

  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  const [avatarError, setAvatarError] = useState(false);
  const avatarPath = `/avatars/${agent.id}.png`;

  // Generate persona based on active traits and prompt wrapper
  const generatePersona = (): string => {
    const parts: string[] = [];

    if (activeTraits.has("demographics") && promptWrapper.demographics) {
      let demographicsText = promptWrapper.demographics;
      demographicsText = demographicsText.replace("{{name}}", agent.name);
      demographicsText = demographicsText.replace("{{age}}", String(agent.demographics.age));
      demographicsText = demographicsText.replace("{{gender}}", agent.demographics.gender);
      demographicsText = demographicsText.replace("{{occupation}}", agent.demographics.occupation);
      parts.push(demographicsText);
    }

    if (activeTraits.has("characterTraits") && promptWrapper.characterTraits) {
      let traitsText = promptWrapper.characterTraits;
      traitsText = traitsText.replace("{{traits}}", agent.characterTraits.join(", "));
      parts.push(traitsText);
    }

    if (activeTraits.has("narrativeIdentity") && promptWrapper.narrativeIdentity) {
      let narrativeText = promptWrapper.narrativeIdentity;
      narrativeText = narrativeText.replace("{{narrative}}", agent.narrativeIdentity);
      parts.push(narrativeText);
    }

    return parts.join(" ");
  };

  const handleTraitToggle = (trait: TraitCategory) => {
    setActiveTraits((prev) => {
      const next = new Set(prev);
      if (next.has(trait)) {
        next.delete(trait);
      } else {
        next.add(trait);
      }
      return next;
    });
  };

  const generatedPersona = generatePersona();

  return (
    <div
      className="bg-white rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
      style={{
        border: `1px solid ${TUHH_COLORS.light}`,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      {/* Header */}
      <div className="p-4 pb-3" style={{ borderBottom: `1px solid ${TUHH_COLORS.light}` }}>
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(agent.id)}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          )}
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: TUHH_COLORS.orange }}
          >
            {!avatarError ? (
              <Image
                src={avatarPath}
                alt={agent.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <span>{getInitials(agent.name)}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">{agent.name}</h3>
              <span className="text-xs font-mono text-gray-400">{agent.id}</span>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-1">
              {agent.tags.map((tagId) => (
                <span
                  key={tagId}
                  className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: getTagColor(tagId) }}
                >
                  {tags.find((t) => t.id === tagId)?.name || tagId}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trait Sections - Toggle left, Content right */}
      <div className="divide-y divide-gray-100">
        {/* Demographics */}
        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeTraits.has("demographics")}
              onChange={() => handleTraitToggle("demographics")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeTraits.has("demographics") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Demographics</h4>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-gray-700">
              <span>{agent.demographics.age} y/o</span>
              <span>{agent.demographics.gender}</span>
              <span>{agent.demographics.occupation}</span>
            </div>
          </div>
        </div>

        {/* Character Traits */}
        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeTraits.has("characterTraits")}
              onChange={() => handleTraitToggle("characterTraits")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeTraits.has("characterTraits") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Character Traits</h4>
            <div className="flex flex-wrap gap-1">
              {agent.characterTraits.map((trait, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 text-xs rounded"
                  style={{
                    backgroundColor: activeTraits.has("characterTraits") ? `${TUHH_COLORS.orange}20` : TUHH_COLORS.light,
                    color: activeTraits.has("characterTraits") ? TUHH_COLORS.orange : TUHH_COLORS.gray,
                  }}
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Narrative Identity */}
        <div className="flex">
          <div className="w-12 flex-shrink-0 flex items-start justify-center pt-3 pb-3 bg-gray-50 border-r border-gray-100">
            <input
              type="checkbox"
              checked={activeTraits.has("narrativeIdentity")}
              onChange={() => handleTraitToggle("narrativeIdentity")}
              className="w-4 h-4 rounded border-gray-300 text-tuhh-turquoise focus:ring-tuhh-turquoise"
            />
          </div>
          <div className={`flex-1 p-3 ${!activeTraits.has("narrativeIdentity") ? "opacity-40" : ""}`}>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Narrative Identity</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {agent.narrativeIdentity}
            </p>
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
          <span className={`text-xs transition-transform ${showGeneratedPersona ? "rotate-90" : ""}`}>
            ▸
          </span>
          Generated Prompt ({activeTraits.size}/{traitCategories.length} active)
        </button>
        {showGeneratedPersona && (
          <div className="px-4 pb-3">
            {generatedPersona ? (
              <pre className="whitespace-pre-wrap text-xs text-gray-600 bg-white p-3 rounded-lg overflow-x-auto font-mono border border-gray-200">
                {generatedPersona}
              </pre>
            ) : (
              <p className="text-xs text-gray-400 italic p-3">
                No traits selected. Enable at least one trait category to generate a prompt.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
