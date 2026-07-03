import { fillTemplate, PROMPT_TEMPLATES } from "./promptTemplates";
import { resolveTraitText } from "./traitMapping";
import type { HonestyPilotAgent, PilotModule, TraitMapping, TraitStyle } from "@/types/honestyPilot";

export interface TraitMappings {
  hx: TraitMapping;
  psm: TraitMapping;
  cs: TraitMapping;
}

function formatScore(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function resolveOrScore(
  style: TraitStyle,
  value: number,
  mapping: TraitMapping,
  dimensionKey: string
): string {
  return style === "score" ? formatScore(value) : resolveTraitText(mapping, dimensionKey, style, value);
}

function renderPersonality(agent: HonestyPilotAgent, style: TraitStyle, hx: TraitMapping): string {
  const values: Record<string, string> = {
    [`hx_${style}_hh`]: resolveOrScore(style, agent.hxHh, hx, "hx_hh"),
    [`hx_${style}_em`]: resolveOrScore(style, agent.hxEm, hx, "hx_em"),
    [`hx_${style}_ex`]: resolveOrScore(style, agent.hxEx, hx, "hx_ex"),
    [`hx_${style}_ag`]: resolveOrScore(style, agent.hxAg, hx, "hx_ag"),
    [`hx_${style}_co`]: resolveOrScore(style, agent.hxCo, hx, "hx_co"),
    [`hx_${style}_op`]: resolveOrScore(style, agent.hxOp, hx, "hx_op"),
  };
  return fillTemplate(PROMPT_TEMPLATES[`personality__${style}`], values);
}

function renderEcon(agent: HonestyPilotAgent, style: TraitStyle, psm: TraitMapping): string {
  const values: Record<string, string> = {
    [`psm_${style}_risk`]: resolveOrScore(style, agent.psmRisk, psm, "psm_risk"),
    [`psm_${style}_patience`]: resolveOrScore(style, agent.psmPatience, psm, "psm_patience"),
    [`psm_${style}_altruism`]: resolveOrScore(style, agent.psmAltruism, psm, "psm_altruism"),
    [`psm_${style}_pos_rec`]: resolveOrScore(style, agent.psmPosRec, psm, "psm_pos_rec"),
    [`psm_${style}_neg_rec`]: resolveOrScore(style, agent.psmNegRec, psm, "psm_neg_rec"),
    [`psm_${style}_trust`]: resolveOrScore(style, agent.psmTrust, psm, "psm_trust"),
  };
  return fillTemplate(PROMPT_TEMPLATES[`econ__${style}`], values);
}

function renderEthics(agent: HonestyPilotAgent, style: TraitStyle, cs: TraitMapping): string {
  const values: Record<string, string> = {
    [`cs_${style}_deontology`]: resolveOrScore(style, agent.csDeontology, cs, "cs_deontology"),
    [`cs_${style}_utilitarianism`]: resolveOrScore(style, agent.csUtilitarianism, cs, "cs_utilitarianism"),
  };
  return fillTemplate(PROMPT_TEMPLATES[`ethics__${style}`], values);
}

// Style is required for every module except D (demographics is pre-rendered).
export function renderModulePrompt(
  module: PilotModule,
  agent: HonestyPilotAgent,
  style: TraitStyle | undefined,
  mappings: TraitMappings
): string {
  if (module === "D") return agent.demText;
  if (!style) throw new Error(`renderModulePrompt: style is required for module "${module}"`);
  if (module === "PT") return renderPersonality(agent, style, mappings.hx);
  if (module === "EP") return renderEcon(agent, style, mappings.psm);
  return renderEthics(agent, style, mappings.cs);
}

// Fixed rendering order regardless of the order modules were toggled on in
// the UI — the prompt must always read D, then PT, then EP, then MO.
const MODULE_ORDER: PilotModule[] = ["D", "PT", "EP", "MO"];

export type ModuleStyles = Partial<Record<PilotModule, TraitStyle>>;

export function renderFullPrompt(
  activeModules: PilotModule[],
  agent: HonestyPilotAgent,
  styles: ModuleStyles,
  mappings: TraitMappings
): string {
  const ordered = MODULE_ORDER.filter((m) => activeModules.includes(m));
  if (ordered.length === 0) {
    return "(No persona modules active — baseline condition.)";
  }
  return ordered.map((m) => renderModulePrompt(m, agent, styles[m], mappings)).join("\n\n");
}
