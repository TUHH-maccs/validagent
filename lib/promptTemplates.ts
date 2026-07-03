// Ported from prepare/prompt_templates.py (not shipped — internal data-prep
// reference). Only the personality/econ/ethics templates are needed here:
// demographics is already fully rendered into agents.csv's dem_text column.

export const PROMPT_TEMPLATES: Record<string, string> = {
  personality__score:
    "On the HEXACO personality scale (1 = very low, 5 = very high):\n" +
    "Honesty-Humility: {hx_score_hh}\n" +
    "Emotionality: {hx_score_em}\n" +
    "Extraversion: {hx_score_ex}\n" +
    "Agreeableness: {hx_score_ag}\n" +
    "Conscientiousness: {hx_score_co}\n" +
    "Openness to Experience: {hx_score_op}",

  personality__pct:
    "Compared to the general population, your personality ranks as follows " +
    "(10th percentile = very low, 90th percentile = very high):\n" +
    "Honesty-Humility: {hx_pct_hh}th percentile\n" +
    "Emotionality: {hx_pct_em}th percentile\n" +
    "Extraversion: {hx_pct_ex}th percentile\n" +
    "Agreeableness: {hx_pct_ag}th percentile\n" +
    "Conscientiousness: {hx_pct_co}th percentile\n" +
    "Openness to Experience: {hx_pct_op}th percentile",

  personality__adj:
    "Your personality can be described as follows:\n" +
    "- {hx_adj_hh}\n" +
    "- {hx_adj_em}\n" +
    "- {hx_adj_ex}\n" +
    "- {hx_adj_ag}\n" +
    "- {hx_adj_co}\n" +
    "- {hx_adj_op}",

  personality__dsc:
    "Regarding your personality:\n" +
    "- You {hx_dsc_hh}\n" +
    "- You {hx_dsc_em}\n" +
    "- You {hx_dsc_ex}\n" +
    "- You {hx_dsc_ag}\n" +
    "- You {hx_dsc_co}\n" +
    "- You {hx_dsc_op}",

  econ__score:
    "On the following economic preference scales (0 = very low, 10 = very high):\n" +
    "Risk Tolerance: {psm_score_risk}\n" +
    "Patience: {psm_score_patience}\n" +
    "Altruism: {psm_score_altruism}\n" +
    "Positive Reciprocity: {psm_score_pos_rec}\n" +
    "Negative Reciprocity: {psm_score_neg_rec}\n" +
    "Trust: {psm_score_trust}",

  econ__pct:
    "Compared to the general population, your economic preferences rank as follows " +
    "(10th percentile = very low, 90th percentile = very high):\n" +
    "Risk Tolerance: {psm_pct_risk}th percentile\n" +
    "Patience: {psm_pct_patience}th percentile\n" +
    "Altruism: {psm_pct_altruism}th percentile\n" +
    "Positive Reciprocity: {psm_pct_pos_rec}th percentile\n" +
    "Negative Reciprocity: {psm_pct_neg_rec}th percentile\n" +
    "Trust: {psm_pct_trust}th percentile",

  econ__adj:
    "Your economic preferences can be described as follows:\n" +
    "- {psm_adj_risk}\n" +
    "- {psm_adj_patience}\n" +
    "- {psm_adj_altruism}\n" +
    "- {psm_adj_pos_rec}\n" +
    "- {psm_adj_neg_rec}\n" +
    "- {psm_adj_trust}",

  econ__dsc:
    "Regarding your economic preferences:\n" +
    "- You {psm_dsc_risk}\n" +
    "- You {psm_dsc_patience}\n" +
    "- You {psm_dsc_altruism}\n" +
    "- You {psm_dsc_pos_rec}\n" +
    "- You {psm_dsc_neg_rec}\n" +
    "- You {psm_dsc_trust}",

  ethics__score:
    "Regarding your ethical orientation (1 = very low, 5 = very high):\n" +
    "Deontological thinking: {cs_score_deontology}\n" +
    "Utilitarian thinking: {cs_score_utilitarianism}",

  ethics__pct:
    "Compared to the general population, your ethical orientation ranks as follows " +
    "(10th percentile = very low, 90th percentile = very high):\n" +
    "Deontological thinking: {cs_pct_deontology}th percentile\n" +
    "Utilitarian thinking: {cs_pct_utilitarianism}th percentile",

  ethics__adj:
    "Your ethical orientation can be described as follows:\n" +
    "- {cs_adj_deontology}\n" +
    "- {cs_adj_utilitarianism}",

  ethics__dsc:
    "Regarding your ethical orientation:\n" +
    "- You {cs_dsc_deontology}\n" +
    "- You {cs_dsc_utilitarianism}",
};

export function fillTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => values[key] ?? "[N/A]");
}
