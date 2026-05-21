import Link from "next/link";

const COLORS = {
  turquoise: "#00C1D4",
  greenblue: "#265D71",
  light: "#E5E5E5",
};

export default function Emas2026PresentationPage() {
  const basePath = process.env.NODE_ENV === "production" ? "/validagent" : "";
  const pdfPath = `${basePath}/EMAS2026_ValidAgent.pdf`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <Link href="/sets" className="text-sm font-medium text-gray-600 transition-colors">
                Agent Sets
              </Link>
              <Link href="/projects" className="text-sm font-medium text-gray-600 transition-colors">
                Projects
              </Link>
              <Link
                href="/resources"
                className="text-sm font-medium pb-1"
                style={{ color: COLORS.turquoise, borderBottom: `2px solid ${COLORS.turquoise}` }}
              >
                Resources
              </Link>
            </div>
          </nav>

          <div className="py-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              EMAS 2026 Lightning Talk
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Lightning talk slide for introducing the ValidAgent repository and simulation demo at EMAS 2026.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div
          className="bg-white rounded-xl shadow-sm border overflow-hidden"
          style={{ borderColor: COLORS.light }}
        >
          <iframe
            src={pdfPath}
            title="EMAS 2026 Lightning Talk"
            className="w-full h-[85vh] bg-white"
          />
        </div>
      </main>
    </div>
  );
}
