"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchExampleAgents, fetchExamplesMeta } from "@/lib/examplesData";
import { ExampleAgentCard } from "@/components/ExampleAgentCard";
import type { ExampleAgent, ExamplesMeta } from "@/types/examples";

export function ExamplesSetClient() {
  const [agents, setAgents] = useState<ExampleAgent[] | null>(null);
  const [meta, setMeta] = useState<ExamplesMeta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchExampleAgents(), fetchExamplesMeta()])
      .then(([a, m]) => {
        setAgents(a);
        setMeta(m);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  if (loadError) {
    return <div className="max-w-[1344px] mx-auto px-4 py-12 text-red-600">Failed to load data: {loadError}</div>;
  }

  if (!agents || !meta) {
    return <div className="max-w-[1344px] mx-auto px-4 py-12 text-gray-500">Loading Example Agents data…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-8 py-4 border-b border-gray-100">
            <Link href="/" className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-gray-900">ValidAgent</span>
              <span className="text-sm font-medium text-gray-500">Repository</span>
            </Link>
            <div className="flex gap-6">
              <Link href="/sets" className="text-sm font-medium text-tuhh-cyan border-b-2 border-tuhh-cyan pb-1">
                Agent Sets
              </Link>
              <Link href="/projects" className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors">
                Projects
              </Link>
              <Link href="/resources" className="text-sm font-medium text-gray-600 hover:text-tuhh-cyan transition-colors">
                Resources
              </Link>
            </div>
          </nav>

          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">{meta.name}</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">{meta.description}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
              <span><strong>Domain:</strong> {meta.domain}</span>
              <span><strong>Agents:</strong> {agents.length}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1344px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <ExampleAgentCard key={agent.id} agent={agent} meta={meta} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExamplesSetClient;
