// Types for the "Workplace Personas" agent set, backed by CSV/JSON files under
// public/data/workplace-personas/. Kept fully independent of the legacy
// AgentSet union in types/index.ts on purpose — this set (along with
// Honesty Pilot) is meant to outlive the old shared infra once Examples is
// migrated too and the legacy union gets torn down.

export type PersonaCategory = "demographics" | "characterTraits" | "narrativeIdentity";

export interface WorkplacePersonaAgent {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  traits: string[];
  narrative: string;
  tags: string[];
}

export interface WorkplacePersonaTag {
  id: string;
  name: string;
  color: string;
}

export interface WorkplacePersonaMeta {
  setId: string;
  name: string;
  description: string;
  domain: string;
  experimentalParadigm: string;
  validationStrength: "validated" | "pilot" | "placeholder";
  promptWrapper: Record<PersonaCategory, string>;
  tags: WorkplacePersonaTag[];
}
