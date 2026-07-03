// Types for the "Examples" agent set, backed by CSV/JSON files under
// public/data/examples/. Kept independent of the legacy AgentSet union in
// types/index.ts — see types/workplacePersonas.ts for the same reasoning.

export type AgentOrigin = "synthetic" | "human" | "curated";

export interface ExampleAgent {
  id: string;
  name: string;
  task: string;
  persona: string;
  origin: AgentOrigin;
  traits: string[];
  tags: string[];
  promptTemplate: string;
  exampleOutput: string;
  howToReproduce: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExampleTag {
  id: string;
  name: string;
  color: string;
}

export interface ExamplesMeta {
  setId: string;
  name: string;
  description: string;
  domain: string;
  experimentalParadigm: string;
  validationStrength: "validated" | "pilot" | "placeholder";
  tags: ExampleTag[];
}
