"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

// Every set on this page is fetched at runtime from its own public/data/
// folder rather than bundled as static JSON — see components/*SetClient.tsx
// for each set's detail page. This listing just needs a lightweight summary.
interface AgentSetSummary {
  setId: string;
  name: string;
  description: string;
  domain: string;
  validationStrength: "validated" | "pilot" | "placeholder";
  tags: { id: string; name: string; color: string }[];
  agentCount: number;
}

const honestyPilotSummary: AgentSetSummary = {
  setId: "honesty-pilot",
  name: "Honesty Pilot",
  description:
    "931 agents modeling real Die Roll Paradigm participants, configurable across demographics, personality, economic preferences, and moral orientation.",
  domain: "behavioral economics",
  validationStrength: "validated",
  tags: [
    { id: "honesty", name: "Honesty", color: "#00AD70" },
    { id: "us-representative", name: "US-Representative Sample", color: "#00C1D4" },
    { id: "individual-level", name: "Individual-Level Data", color: "#265D71" },
  ],
  agentCount: 931,
};

const workplacePersonasSummary: AgentSetSummary = {
  setId: "workplace-personas",
  name: "Workplace",
  description: "20 generic workplace archetypes demonstrating personality modeling and character simulation.",
  domain: "workplace behavior",
  validationStrength: "placeholder",
  tags: [
    { id: "workplace", name: "Workplace", color: "#FF7E15" },
    { id: "comedy", name: "Comedy", color: "#00C1D4" },
  ],
  agentCount: 20,
};

const examplesSummary: AgentSetSummary = {
  setId: "examples",
  name: "Examples",
  description: "Demo agents for research concepts",
  domain: "various",
  validationStrength: "placeholder",
  tags: [
    { id: "honesty", name: "Honesty", color: "#00AD70" },
    { id: "ethics", name: "Ethics", color: "#FF4F4F" },
    { id: "sustainability", name: "Sustainability", color: "#265D71" },
  ],
  agentCount: 20,
};

const agentSets: AgentSetSummary[] = [
  honestyPilotSummary,
  workplacePersonasSummary,
  examplesSummary,
];

// TUHH color values for inline styles
const COLORS = {
  green: "#00AD70",
  red: "#FF4F4F",
  turquoise: "#00C1D4",
  greenblue: "#265D71",
  orange: "#FF7E15",
  gray: "#666666",
  light: "#E5E5E5",
};

const validationStyles: Record<string, { bg: string; text: string; border: string }> = {
  validated: { bg: `${COLORS.green}20`, text: COLORS.green, border: COLORS.green },
  pilot: { bg: `${COLORS.orange}20`, text: COLORS.orange, border: COLORS.orange },
  placeholder: { bg: COLORS.light, text: COLORS.gray, border: COLORS.gray },
};

const validationLabels: Record<string, string> = {
  validated: "Validated",
  pilot: "In Validation",
  placeholder: "Placeholder",
};

// The two filterable tags surfaced in the sleek search/filter row — a
// research-quality signal (sampling + individual-level granularity) rather
// than a topic tag like the ones already shown on each card.
const SPECIAL_FILTER_TAGS = [
  { id: "us-representative", name: "US-Representative Sample", color: COLORS.turquoise },
  { id: "individual-level", name: "Individual-Level Data", color: COLORS.greenblue },
];

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean;
  onClick: () => void;
  color: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="text-xs px-2.5 py-1.5 rounded-full font-medium border transition-colors whitespace-nowrap"
      style={{
        backgroundColor: active ? color : "#fff",
        borderColor: active ? color : COLORS.light,
        color: active ? "#fff" : COLORS.gray,
      }}
    >
      {children}
    </button>
  );
}

export default function SetsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSpecialTags, setActiveSpecialTags] = useState<Set<string>>(new Set());

  function toggleSpecialTag(tagId: string) {
    setActiveSpecialTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  const query = searchQuery.trim().toLowerCase();
  const filteredSets = agentSets.filter((set) => {
    if (query && !set.name.toLowerCase().includes(query) && !set.description.toLowerCase().includes(query)) {
      return false;
    }
    for (const tagId of activeSpecialTags) {
      if (!set.tags.some((t) => t.id === tagId)) return false;
    }
    return true;
  });

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
                style={{ backgroundColor: `${COLORS.turquoise}20`, color: COLORS.turquoise }}
              >
                v1
              </span>
            </Link>
            <div className="flex gap-6">
              <Link
                href="/sets"
                className="text-sm font-medium pb-1"
                style={{ color: COLORS.turquoise, borderBottom: `2px solid ${COLORS.turquoise}` }}
              >
                Agent Sets
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium text-gray-600 transition-colors"
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

          {/* Page Header */}
          <div className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  Agent Sets
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Browse curated collections of behavioral agents organized by domain and research context.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="px-3 py-1.5 font-semibold rounded-lg"
                  style={{ backgroundColor: `${COLORS.turquoise}15`, color: COLORS.greenblue }}
                >
                  {agentSets.length} set{agentSets.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-400">
                  · {agentSets.reduce((sum, set) => sum + set.agentCount, 0)} agents total
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter row — single search-bar height, tags to the right */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agent sets…"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.light }}
            />
          </div>
          <div className="flex items-center gap-2">
            {SPECIAL_FILTER_TAGS.map((tag) => (
              <FilterChip key={tag.id} active={activeSpecialTags.has(tag.id)} onClick={() => toggleSpecialTag(tag.id)} color={tag.color}>
                {tag.name}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {filteredSets.map((set) => (
            <Link
              key={set.setId}
              href={`/sets/${set.setId}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
              style={{ ["--hover-border" as string]: COLORS.turquoise }}
            >
              <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Left: Name & Domain */}
                <div className="lg:w-36 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-tuhh-turquoise transition-colors">
                    {set.name}
                  </h2>
                  <p className="text-sm text-gray-500">{set.domain}</p>
                </div>

                {/* Middle: Description */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {set.description}
                  </p>
                  {/* Tags Preview */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {set.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag.id}
                        className="px-2 py-0.5 text-xs font-medium rounded-full text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {set.tags.length > 4 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                        +{set.tags.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Stats & Badge — fixed width so the "agents" label
                    lines up across cards regardless of digit count or
                    validation-label length — each piece gets its own fixed
                    width instead of the whole block, so the gap stays
                    content-sized rather than an arbitrary leftover space. */}
                <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                  <div className="flex items-baseline gap-1 text-sm text-gray-500">
                    <strong className="text-gray-700 text-right tabular-nums inline-block" style={{ minWidth: "1.75rem" }}>
                      {set.agentCount}
                    </strong>
                    <span>agents</span>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full border font-medium text-center inline-block"
                    style={{
                      backgroundColor: validationStyles[set.validationStrength]?.bg,
                      color: validationStyles[set.validationStrength]?.text,
                      borderColor: validationStyles[set.validationStrength]?.border,
                      width: "5.5rem",
                    }}
                  >
                    {validationLabels[set.validationStrength]}
                  </span>
                  <svg
                    className="w-5 h-5 text-gray-400 group-hover:text-tuhh-turquoise group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
          {filteredSets.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-12">No agent sets match your search/filters.</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              ValidAgent Repository
            </p>
            <div className="flex gap-4">
              <span>{agentSets.length} agent sets</span>
              <span>{agentSets.reduce((sum, set) => sum + set.agentCount, 0)} total agents</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
