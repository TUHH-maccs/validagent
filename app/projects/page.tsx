import Link from "next/link";

// TUHH color values for inline styles
const COLORS = {
  green: "#00AD70",
  turquoise: "#00C1D4",
  greenblue: "#265D71",
  orange: "#FF7E15",
};

const projects = [
  {
    title: "Agent Simulation Demo",
    description:
      "A minimal example showing how exported agent profiles from the repository can be loaded and run in a simulation environment.",
    tags: ["Simulation", "Die-Roll", "Research Demo"],
    href: "/projects/simulation",
    available: true,
  },
];

export default function ProjectsPage() {
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
                className="text-sm font-medium text-gray-600 transition-colors"
              >
                Agent Sets
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium pb-1"
                style={{ color: COLORS.turquoise, borderBottom: `2px solid ${COLORS.turquoise}` }}
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
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Projects
            </h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Example studies and applications using these agents.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((project, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Project Image Placeholder */}
              <div
                className="h-40 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${COLORS.turquoise}15, #f1f5f9)` }}
              >
                <svg
                  className="w-16 h-16"
                  style={{ color: `${COLORS.turquoise}40` }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                  {!project.available && (
                    <span
                      className="px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap"
                      style={{ backgroundColor: `${COLORS.orange}20`, color: COLORS.orange }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  {project.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {project.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2.5 py-1 text-xs font-medium rounded-full text-white"
                      style={{ backgroundColor: COLORS.greenblue }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {project.available && project.href ? (
                  <Link
                    href={project.href}
                    className="mt-5 w-full inline-flex items-center justify-center py-2.5 text-sm font-medium text-white rounded-lg"
                    style={{ backgroundColor: COLORS.greenblue }}
                  >
                    View Demo →
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-5 w-full py-2.5 text-sm font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed"
                  >
                    View Project
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
            style={{ backgroundColor: `${COLORS.turquoise}15`, color: COLORS.greenblue }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Have a project idea?{" "}
            <a href="mailto:MACCS@tuhh.de" className="underline font-medium">
              Contact us
            </a>{" "}
            to collaborate!
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-gray-500 text-center">
            ValidAgent Repository
          </p>
        </div>
      </footer>
    </div>
  );
}
