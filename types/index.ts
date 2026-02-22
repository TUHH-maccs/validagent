// Common TypeScript types for the application

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
}

export interface NavItem {
  title: string;
  href: string;
  disabled?: boolean;
}

// ============================================
// Agent Set Types
// ============================================

export type ValidationStrength = "validated" | "pilot" | "placeholder";
export type ExperimentalParadigm = "demonstration" | "survey" | "behavioral" | "mixed";

export interface AggregateValidation {
  correlation: number | null;
  note: string;
}

export interface AgentValidation {
  correlation: number | null;
  runs: number;
  note: string;
}

// Trait category identifiers
export type TraitCategory = "demographics" | "characterTraits" | "narrativeIdentity" | "persona" | string;

// Prompt wrapper maps trait categories to template strings
export type PromptWrapper = Record<TraitCategory, string>;

// ============================================
// Agent Types
// ============================================

// Demographics for structured agents
export interface Demographics {
  age: number;
  gender: string;
  occupation: string;
  [key: string]: string | number; // Allow additional demographic fields
}

// Structured agent (for sets like TheOffice with detailed trait categories)
export interface StructuredAgent {
  id: string;
  name: string;
  demographics: Demographics;
  characterTraits: string[];
  narrativeIdentity: string;
  validation: AgentValidation;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Simple agent (for sets like Examples with just a persona string)
export interface SimpleAgent {
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
  validation: AgentValidation;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Die-Roll Honesty Agent Types (PreStudy2)
// ============================================

export interface DieRollDemographics {
  age: number;
  sex: string;
  ethnicity: string;
  education: string;
  income: string;
  politics: string;
  religion: string;
  occupation: string;
  industry: string;
}

export interface HexacoScores {
  honestyHumility: number;
  emotionality: number;
  extraversion: number;
  agreeableness: number;
  conscientiousness: number;
  openness: number;
}

export interface HumanReference {
  roll: number;
  report: number;
  honest: boolean;
  reasons: {
    money: number | null;
    consistency: number | null;
    rules: number | null;
    fairness: number | null;
    intuition: number | null;
  };
}

export interface ExperimentValidation {
  honestRate: number;
  decisionMean: number;
  decisionSd: number;
  absDeviationMean: number;
  runs: number[];  // Array of 10 agent_decision values (one per run)
  // Reasoning rates (proportion of 10 runs where agent gave this reason)
  reasonMoneyRate: number | null;
  reasonConsistencyRate: number | null;
  reasonRulesRate: number | null;
  reasonFairnessRate: number | null;
  reasonIntuitionRate: number | null;
  // Aggregate reasoning scores
  reasonCaptureRate: number | null;      // How often agent hits human reasons
  reasonFalsePositiveRate: number | null; // How often agent gives reasons human didn't
  reasoningAlignmentScore: number | null; // captureRate - falsePositiveRate (-1 to +1)
}

export interface DieRollAgent {
  id: string;
  agentId: number;
  name: string;
  demographics: DieRollDemographics;
  hexaco: HexacoScores;
  freetext: string;
  promptModules: {
    demographics: string;
    hexaco: string;
    freetext: string;
  };
  humanReference: HumanReference;
  validation: Record<string, ExperimentValidation>;
  tags: string[];
}

export interface ExperimentConfig {
  name: string;
  description: string;
  activeModules: string[];
}

export interface PopulationMetrics {
  meanAgentHonestRate: number;
  meanHumanHonestRate: number;
  correlation: number;
  rollPct: number[];    // [pct_1, pct_2, pct_3, pct_4, pct_5, pct_6]
  humanPct: number[];
  agentPct: number[];
}

// Union type for any agent
export type Agent = StructuredAgent | SimpleAgent | DieRollAgent;

// Type guard to check if agent is structured
export function isStructuredAgent(agent: Agent): agent is StructuredAgent {
  return 'demographics' in agent && 'narrativeIdentity' in agent && 'characterTraits' in agent;
}

// Type guard to check if agent is simple
export function isSimpleAgent(agent: Agent): agent is SimpleAgent {
  return 'persona' in agent && 'promptTemplate' in agent;
}

// Type guard to check if agent is DieRoll
export function isDieRollAgent(agent: Agent): agent is DieRollAgent {
  return 'hexaco' in agent && 'humanReference' in agent && 'promptModules' in agent;
}

// ============================================
// Agent Set Interface
// ============================================

export interface AgentSetBase {
  setId: string;
  name: string;
  description: string;
  domain: string;
  experimentalParadigm: ExperimentalParadigm;
  validationStrength: ValidationStrength;
  aggregateValidation: AggregateValidation;
  traitCategories: TraitCategory[];
  promptWrapper: PromptWrapper;
  tags: Tag[];
}

export interface StructuredAgentSet extends AgentSetBase {
  agents: StructuredAgent[];
}

export interface SimpleAgentSet extends AgentSetBase {
  agents: SimpleAgent[];
}

export interface DieRollAgentSet extends AgentSetBase {
  agents: DieRollAgent[];
  experiments: Record<string, ExperimentConfig>;
  populationMetrics: Record<string, PopulationMetrics>;
}

export type AgentSet = StructuredAgentSet | SimpleAgentSet | DieRollAgentSet;

// Type guard to check if set has structured agents
export function isStructuredAgentSet(set: AgentSet): set is StructuredAgentSet {
  return set.agents.length > 0 && isStructuredAgent(set.agents[0]);
}

// Type guard to check if set is DieRoll
export function isDieRollAgentSet(set: AgentSet): set is DieRollAgentSet {
  return 'experiments' in set && 'populationMetrics' in set && set.agents.length > 0 && isDieRollAgent(set.agents[0]);
}

// ============================================
// Legacy/Shared Types
// ============================================

export type AgentOrigin = "synthetic" | "human" | "curated";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

// Metadata for the repository (used in overview pages)
export interface RepositoryMetadata {
  totalAgents: number;
  totalSets: number;
  lastUpdated: string;
}
