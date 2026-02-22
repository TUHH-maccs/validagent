import Link from "next/link";
import examplesData from "@/data/sets/examples.json";
import theofficeData from "@/data/sets/theoffice.json";
import prestudy2Data from "@/data/sets/prestudy2.json";
import type { AgentSet } from "@/types";

const agentSets: AgentSet[] = [
  prestudy2Data as AgentSet,
  theofficeData as AgentSet,
  examplesData as AgentSet,
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

export default function SetsPage() {
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
                  · {agentSets.reduce((sum, set) => sum + set.agents.length, 0)} agents total
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-4">
          {agentSets.map((set) => (
            <Link
              key={set.setId}
              href={`/sets/${set.setId}`}
              className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
              style={{ ["--hover-border" as string]: COLORS.turquoise }}
            >
              <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Left: Name & Domain */}
                <div className="lg:w-48 flex-shrink-0">
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

                {/* Right: Stats & Badge */}
                <div className="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span><strong className="text-gray-700">{set.agents.length}</strong> agents</span>
                    <span className="hidden sm:inline">{set.experimentalParadigm}</span>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full border font-medium"
                    style={{
                      backgroundColor: validationStyles[set.validationStrength]?.bg,
                      color: validationStyles[set.validationStrength]?.text,
                      borderColor: validationStyles[set.validationStrength]?.border,
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
              <span>{agentSets.reduce((sum, set) => sum + set.agents.length, 0)} total agents</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
