"use client";

import { useRef } from "react";
import Link from "next/link";

const COLORS = {
  turquoise: "#00C1D4",
  greenblue: "#265D71",
  light: "#E5E5E5",
};

export default function Emas2026PresentationPage() {
  const frameContainerRef = useRef<HTMLDivElement | null>(null);
  const basePath = process.env.NODE_ENV === "production" ? "/validagent" : "";
  const pdfPath = `${basePath}/emas-2026-validagent.pdf`;

  const handleFullscreen = async () => {
    const element = frameContainerRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await element.requestFullscreen();
  };

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
              EMAS 2026 Presentation
            </h1>
            <p className="mt-2 text-gray-600 max-w-3xl">
              Presentation deck for introducing the ValidAgent repository and simulation demo.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[96rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-4 mb-4">
          <p className="text-sm text-gray-600">
            Embedded preview below. If you prefer, you can open the PDF directly in a new browser tab.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleFullscreen}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: COLORS.turquoise }}
            >
              Toggle fullscreen
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 3H5a2 2 0 00-2 2v3m16-5h-3a2 2 0 00-2 2v3m5 8v3a2 2 0 01-2 2h-3m-8-5v3a2 2 0 01-2 2H5a2 2 0 01-2-2v-3"
                />
              </svg>
            </button>
            <a
              href={pdfPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg"
              style={{ backgroundColor: COLORS.greenblue }}
            >
              Open PDF in new tab
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 3h7m0 0v7m0-7L10 14"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5h6M5 5v14h14v-6"
                />
              </svg>
            </a>
          </div>
        </div>

        <div
          ref={frameContainerRef}
          className="pdf-frame-container bg-white rounded-xl shadow-sm border overflow-hidden"
          style={{ borderColor: COLORS.light }}
        >
          <iframe
            src={pdfPath}
            title="EMAS 2026 Presentation"
            className="pdf-frame w-full h-[85vh] bg-white"
          />
        </div>
      </main>

      <style jsx global>{`
        .pdf-frame-container:fullscreen {
          width: 100vw;
          height: 100vh;
          margin: 0;
          border-radius: 0;
          border: none;
          background: white;
        }

        .pdf-frame-container:fullscreen .pdf-frame {
          width: 100vw;
          height: 100vh;
        }
      `}</style>
    </div>
  );
}
