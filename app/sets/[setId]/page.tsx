import { notFound } from "next/navigation";
import { SetDetailClient } from "@/components/SetDetailClient";
import type { AgentSet } from "@/types";

// Import all set data
import examplesData from "@/data/sets/examples.json";
import theofficeData from "@/data/sets/theoffice.json";
import prestudy2Data from "@/data/sets/prestudy2.json";

const setsMap: Record<string, AgentSet> = {
  examples: examplesData as AgentSet,
  theoffice: theofficeData as AgentSet,
  prestudy2: prestudy2Data as AgentSet,
};

// Generate static params for build time - required for static export
export function generateStaticParams() {
  return Object.keys(setsMap).map((setId) => ({
    setId,
  }));
}

interface SetDetailPageProps {
  params: Promise<{
    setId: string;
  }>;
}

export default async function SetDetailPage({ params }: SetDetailPageProps) {
  const { setId } = await params;
  const agentSet = setsMap[setId];

  if (!agentSet) {
    notFound();
  }

  return <SetDetailClient agentSet={agentSet} />;
}
