"""
Builds the "Honesty Pilot" agent set data from the raw study data.

Reads from prepare/ (local-only, gitignored raw data — see prepare/README.txt
and prepare/experiment_id_map.txt). Writes to public/data/honesty-pilot/ so the
frontend can fetch() files at runtime instead of bundling them (results.csv
alone is ~7.8MB — far too large to statically import like the other sets).

Run from the repo root: python scripts/build_pilot_v1.py
"""

import json
import pathlib

import numpy as np
import pandas as pd

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
PREPARE_DIR = REPO_ROOT / "prepare"
OUTPUT_DIR = REPO_ROOT / "public" / "data" / "honesty-pilot"

# Step 1 (all 14, GPT-5.4 mini) + Step 2 (all 11, GPT-5.4 mini).
# See prepare/experiment_id_map.txt for the module/style recipe behind each ID.
RESULT_EXPERIMENT_IDS = [str(i) for i in range(10001, 10015)] + [
    str(i) for i in range(11001, 11012)
]

# HEXACO-24 items that are reverse-keyed on the 1-5 scale (6 - x).
# Source: prepare/analysis.md, confirmed against prepare/human_results_codebook.xlsx.
HX_REVERSE_ITEMS = [
    "hx03", "hx04", "hx07", "hx08", "hx09", "hx11",
    "hx12", "hx17", "hx18", "hx20", "hx22", "hx24",
]

HX_FACET_ITEMS = {
    "hx_hh": ["hx06", "hx12", "hx18", "hx24"],
    "hx_em": ["hx05", "hx11", "hx17", "hx23"],
    "hx_ex": ["hx04", "hx10", "hx16", "hx22"],
    "hx_ag": ["hx03", "hx09", "hx15", "hx21"],
    "hx_co": ["hx02", "hx08", "hx14", "hx20"],
    "hx_op": ["hx01", "hx07", "hx13", "hx19"],
}

# Demographics text labels, built from prepare/human_results_codebook.xlsx
# (NOT prepare/mappings/dem_text.json, whose value-code order does not match
# this codebook for ethnicity/politics/occupation/religion/industry).
GENDER = {1: "man", 2: "woman", 3: "person"}
ETHNICITY = {1: "white", 2: "black", 3: "hispanic", 4: "asian"}
EDUCATION = {
    1: "less than a high school diploma", 2: "a high school diploma", 3: "some college education",
    4: "an undergraduate degree", 5: "a graduate degree", 6: "a doctoral degree",
}
INCOME = {
    1: "less than $25,000 per year", 2: "between $25,000 and $49,000 per year",
    3: "between $50,000 and $74,000 per year", 4: "between $75,000 and $99,000 per year",
    5: "between $100,000 and $149,000 per year", 6: "between $150,000 and $199,000 per year",
    7: "more than $200,000 per year",
}
OCCUPATION_LABEL = {
    1: "full-time", 2: "part-time", 3: "self-employed", 4: "unemployed",
    5: "retired", 6: "student", 7: "homemaker or caregiver",
}
INDUSTRY = {
    1: "technology", 2: "healthcare", 3: "retail", 4: "finance", 5: "education",
    6: "manufacturing", 7: "arts and entertainment", 8: "hospitality", 9: "government",
}
POLITICS = {1: "democrat", 2: "republican", 3: "independent"}
RELIGION = {1: "catholic", 2: "protestant", 3: "jewish", 4: "muslim", 5: "buddhist", 6: "hindu", 7: "not religious"}


def _lc_first(text: str) -> str:
    text = text.strip()
    return text[:1].lower() + text[1:] if text else text


def _end_sentence(text: str) -> str:
    text = text.strip()
    return text if text[-1:] in ".!?" else text + "."


def resolve_demographics_text(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["dem_gender"] = df["dem_gender"].map(GENDER)
    df["dem_ethnicity"] = df["dem_ethnicity"].map(ETHNICITY).where(df["dem_ethnicity"] != 5, "other")
    df["dem_education"] = df["dem_education"].map(EDUCATION)
    df["dem_income"] = df["dem_income"].map(INCOME)
    df["dem_politics"] = df["dem_politics"].map(POLITICS).where(df["dem_politics"] != 4, "other")
    df["dem_religion"] = df["dem_religion"].map(RELIGION).where(df["dem_religion"] != 8, "other")

    df["dem_occupation"] = df.apply(
        lambda r: (r["dem_occupation_other"] if pd.notna(r["dem_occupation_other"]) else "other")
        if r["dem_occupation"] == 8 else OCCUPATION_LABEL.get(r["dem_occupation"]),
        axis=1,
    )
    df["dem_industry"] = df.apply(
        lambda r: (_lc_first(r["dem_industry_other"]) if pd.notna(r["dem_industry_other"]) else "other")
        if r["dem_industry"] == 10 else INDUSTRY.get(r["dem_industry"]),
        axis=1,
    )
    return df


def render_demographics_paragraph(raw_row: pd.Series) -> str:
    """Builds the flowing dem_text paragraph from the *raw coded* demographics
    fields (not resolve_demographics_text's output), since it needs branching
    (e.g. occupation status) that a flat value->text map can't express."""
    parts = []
    gender = GENDER.get(raw_row["dem_gender"], "person")
    if raw_row["dem_ethnicity"] == 5:
        parts.append(f"You are a {int(raw_row['dem_age'])}-year-old {gender} of another ethnicity.")
    elif pd.notna(raw_row["dem_ethnicity"]):
        parts.append(f"You are a {int(raw_row['dem_age'])}-year-old {ETHNICITY[raw_row['dem_ethnicity']]} {gender}.")
    else:
        parts.append(f"You are a {int(raw_row['dem_age'])}-year-old {gender}.")

    parts.append(f"You have {EDUCATION[raw_row['dem_education']]}.")

    occ = raw_row["dem_occupation"]
    if occ in (1, 2, 3):
        occ_clause = {1: "full-time", 2: "part-time", 3: "as a self-employed professional"}[occ]
        if raw_row["dem_industry"] == 10:
            industry = _lc_first(raw_row["dem_industry_other"]) if pd.notna(raw_row["dem_industry_other"]) else "another"
        else:
            industry = INDUSTRY[raw_row["dem_industry"]]
        parts.append(f"You work {occ_clause} in the {industry} sector.")
    elif occ == 4:
        parts.append("You are currently unemployed.")
    elif occ == 5:
        parts.append("You are retired.")
    elif occ == 6:
        parts.append("You are a student.")
    elif occ == 7:
        parts.append("You are a homemaker or caregiver.")
    elif occ == 8:
        occ_other = raw_row["dem_occupation_other"] if pd.notna(raw_row["dem_occupation_other"]) else "other"
        parts.append(f"Regarding your employment situation: {_end_sentence(occ_other)}")

    if raw_row["dem_politics"] == 4:
        parts.append("You do not align with a specific political party.")
    elif pd.notna(raw_row["dem_politics"]):
        parts.append(f"You lean {POLITICS[raw_row['dem_politics']]} politically.")

    if raw_row["dem_religion"] == 8:
        parts.append("You identify with a religion not listed here.")
    elif pd.notna(raw_row["dem_religion"]):
        parts.append(f"You identify as {RELIGION[raw_row['dem_religion']]}.")

    if pd.notna(raw_row["dem_income"]):
        parts.append(f"Your household income is {INCOME[raw_row['dem_income']]}.")

    return " ".join(parts)


def build_agents(human: pd.DataFrame, manifest: pd.DataFrame) -> pd.DataFrame:
    df = human.copy()

    # Reverse-key the HEXACO items, then average each facet's 4 items.
    df[HX_REVERSE_ITEMS] = 6 - df[HX_REVERSE_ITEMS]
    for facet, items in HX_FACET_ITEMS.items():
        df[facet] = df[items].mean(axis=1, skipna=True)

    df["psm_neg_rec"] = df[["psm_negrec1", "psm_negrec2", "psm_negrec3"]].mean(
        axis=1, skipna=True
    )
    df["psm_pos_rec"] = df["psm_posrec"]

    df["cs_deontology"] = df[
        ["cs_deon1", "cs_deon2", "cs_deon3", "cs_deon4", "cs_deon5"]
    ].mean(axis=1, skipna=True)
    df["cs_utilitarianism"] = df[
        ["cs_util1", "cs_util2", "cs_util3", "cs_util4", "cs_util5"]
    ].mean(axis=1, skipna=True)

    agents_raw = manifest[["agent_id", "main_id"]].merge(df, on="main_id", how="left")

    agents_raw["dem_text"] = agents_raw.apply(render_demographics_paragraph, axis=1)
    agents_raw["human_honest"] = agents_raw["human_report"] == agents_raw["human_roll"]
    agents = resolve_demographics_text(agents_raw)

    columns = [
        "agent_id",
        "dem_age", "dem_gender", "dem_ethnicity", "dem_education", "dem_income",
        "dem_occupation", "dem_industry", "dem_politics", "dem_religion", "dem_text",
        "hx_hh", "hx_em", "hx_ex", "hx_ag", "hx_co", "hx_op",
        "psm_risk", "psm_patience", "psm_altruism", "psm_pos_rec", "psm_neg_rec", "psm_trust",
        "cs_deontology", "cs_utilitarianism",
        "human_roll", "human_report", "human_reason", "human_honest",
    ]
    return agents[columns]


def build_stats_results(results: pd.DataFrame, agents: pd.DataFrame) -> pd.DataFrame:
    """Agent x experiment level: collapses the ~5 runs per (agent, experiment)
    into one summary row, so the frontend never has to aggregate the full
    116k-row results table itself."""
    merged = results.merge(agents[["agent_id", "human_roll"]], on="agent_id", how="left")
    merged["is_honest"] = merged["agent_report"] == merged["human_roll"]

    grouped = merged.groupby(["agent_id", "experiment_id"], as_index=False).agg(
        n_runs=("agent_report", "count"),
        n_honest=("is_honest", "sum"),
    )
    grouped["honesty_rate"] = grouped["n_honest"] / grouped["n_runs"]
    return grouped[["agent_id", "experiment_id", "n_runs", "n_honest", "honesty_rate"]]


def compute_kappa_weighted(human_lied: pd.Series, agent_p_lied: pd.Series) -> dict | None:
    """Weighted Cohen's kappa where each agent contributes fractional counts
    (agent_p_lied = proportion of that agent's runs where it "lied") instead
    of a single binary judgment. Ported 1:1 from prepare/analysis.md's
    compute_kappa_weighted (R), including the large-sample SE formula, so our
    numbers match the paper's own methodology.
    """
    ok = human_lied.notna() & agent_p_lied.notna()
    hl = human_lied[ok].to_numpy(dtype=float)
    ap = agent_p_lied[ok].to_numpy(dtype=float)
    n = len(hl)
    if n == 0:
        return None

    # mat[human_status, agent_status], 0=honest, 1=lied.
    mat = np.array([
        [(1 - ap)[hl == 0].sum(), ap[hl == 0].sum()],
        [(1 - ap)[hl == 1].sum(), ap[hl == 1].sum()],
    ])

    po = np.trace(mat) / n
    row_sums = mat.sum(axis=1)
    col_sums = mat.sum(axis=0)
    pe = float(np.sum((row_sums / n) * (col_sums / n)))
    kappa = (po - pe) / (1 - pe)

    p = mat / n
    prow = row_sums / n
    pcol = col_sums / n
    a_ = sum(p[i, i] * ((1 - pe) - (prow[i] + pcol[i]) * (1 - po)) ** 2 for i in range(2))
    b_sum = sum(
        p[i, j] * (prow[i] + pcol[j]) ** 2
        for i in range(2) for j in range(2) if i != j
    )
    c_ = (po * pe - 2 * pe + po) ** 2
    se = float(np.sqrt(max(0.0, (a_ + (1 - po) ** 2 * b_sum - c_) / (n * (1 - pe) ** 4))))

    return {"n": n, "kappa": kappa, "se": se, "significant": se > 0 and abs(kappa / se) > 1.96}


def build_stats_experiments(stats_results: pd.DataFrame, results: pd.DataFrame, agents: pd.DataFrame) -> pd.DataFrame:
    """Experiment level: report-value distribution (1-6) across all runs, the
    honesty-rate distribution (0/20/40/60/80/100%) split by whether the
    agent's underlying human was honest or not, and a weighted Cohen's kappa
    (human honesty vs. agent honesty rate) per condition."""
    rows = []
    honesty_buckets = [0, 20, 40, 60, 80, 100]
    human_lied = (~agents.set_index("agent_id")["human_honest"]).astype(int)

    human_lookup = agents.set_index("agent_id")[["human_roll", "human_honest"]]

    for exp_id, exp_results in results.groupby("experiment_id"):
        row = {"experiment_id": exp_id}

        report_counts = exp_results["agent_report"].value_counts(normalize=True) * 100
        for face in range(1, 7):
            row[f"report_pct_{face}"] = round(report_counts.get(face, 0.0), 2)

        # Overall run-level lie rate for this condition (compare to stats_meta.json's human_lie_rate).
        run_level = exp_results.merge(human_lookup, on="agent_id", how="left")
        run_level["agent_honest_run"] = run_level["agent_report"] == run_level["human_roll"]
        row["agent_lie_rate"] = round(1 - run_level["agent_honest_run"].mean(), 3)

        exp_stats = stats_results[stats_results["experiment_id"] == exp_id].merge(
            agents[["agent_id", "human_honest"]], on="agent_id", how="left"
        )
        exp_stats["honesty_bucket"] = (exp_stats["honesty_rate"] * 5).round() * 20

        for human_group, label in [(True, "honest_humans"), (False, "dishonest_humans")]:
            subset = exp_stats[exp_stats["human_honest"] == human_group]
            bucket_pct = subset["honesty_bucket"].value_counts(normalize=True) * 100
            for b in honesty_buckets:
                row[f"honesty_dist_{label}_{b}"] = round(bucket_pct.get(b, 0.0), 2)

        p_lied = exp_stats.set_index("agent_id")["honesty_rate"].reindex(human_lied.index).apply(
            lambda r: 1 - r if pd.notna(r) else np.nan
        )
        kap = compute_kappa_weighted(human_lied, p_lied)
        row["kappa"] = round(kap["kappa"], 3) if kap else None
        row["kappa_n"] = kap["n"] if kap else None
        row["kappa_se"] = round(kap["se"], 3) if kap else None
        row["kappa_significant"] = kap["significant"] if kap else False

        rows.append(row)

    return pd.DataFrame(rows)


EXPERIMENT_META = {
    "10001": {"modules": [], "label": "Baseline"},
    "10002": {"modules": ["D"], "label": "Demographics"},
    "10003": {"modules": ["PT"], "style": "score", "label": "Personality (Score)"},
    "10004": {"modules": ["PT"], "style": "pct", "label": "Personality (Percentile)"},
    "10005": {"modules": ["PT"], "style": "adj", "label": "Personality (Adjective)"},
    "10006": {"modules": ["PT"], "style": "dsc", "label": "Personality (Descriptive)"},
    "10007": {"modules": ["EP"], "style": "score", "label": "Economic Preferences (Score)"},
    "10008": {"modules": ["EP"], "style": "pct", "label": "Economic Preferences (Percentile)"},
    "10009": {"modules": ["EP"], "style": "adj", "label": "Economic Preferences (Adjective)"},
    "10010": {"modules": ["EP"], "style": "dsc", "label": "Economic Preferences (Descriptive)"},
    "10011": {"modules": ["MO"], "style": "score", "label": "Moral Orientation (Score)"},
    "10012": {"modules": ["MO"], "style": "pct", "label": "Moral Orientation (Percentile)"},
    "10013": {"modules": ["MO"], "style": "adj", "label": "Moral Orientation (Adjective)"},
    "10014": {"modules": ["MO"], "style": "dsc", "label": "Moral Orientation (Descriptive)"},
    # Combination conditions (Step 2) don't have a single uniform style —
    # each module was rendered with its own fixed style in the actual study:
    # PT=Adjective, EP=Descriptive, MO=Percentile. That per-module mapping
    # lives in the frontend (COMBINATION_STYLES in HonestyPilotSetClient.tsx),
    # not here, since a single "style" key can't represent it.
    #
    # PAPER_SCREENSHOT_TEMP: labels below are spelled out in full (instead of
    # the D/PT/EP/MO abbreviations) purely so paper figures/screenshots read
    # clearly to someone unfamiliar with the module codes. This is meant to
    # be REVERTED after the paper screenshots are taken — see README
    # "Rebuild Log" for the full list of files touched and the original
    # abbreviated labels to restore. Grep the repo for PAPER_SCREENSHOT_TEMP
    # to find every spot that needs switching back.
    "11001": {"modules": ["D", "PT"], "label": "Demographics + Personality Traits"},
    "11002": {"modules": ["D", "EP"], "label": "Demographics + Economic Preferences"},
    "11003": {"modules": ["D", "MO"], "label": "Demographics + Moral Orientation"},
    "11004": {"modules": ["PT", "EP"], "label": "Personality Traits + Economic Preferences"},
    "11005": {"modules": ["PT", "MO"], "label": "Personality Traits + Moral Orientation"},
    "11006": {"modules": ["EP", "MO"], "label": "Economic Preferences + Moral Orientation"},
    "11007": {"modules": ["D", "PT", "EP"], "label": "Demographics + Personality Traits + Economic Preferences"},
    "11008": {"modules": ["D", "PT", "MO"], "label": "Demographics + Personality Traits + Moral Orientation"},
    "11009": {"modules": ["D", "EP", "MO"], "label": "Demographics + Economic Preferences + Moral Orientation"},
    "11010": {"modules": ["PT", "EP", "MO"], "label": "Personality Traits + Economic Preferences + Moral Orientation"},
    "11011": {"modules": ["D", "PT", "EP", "MO"], "label": "Demographics + Personality Traits + Economic Preferences + Moral Orientation (Full)"},
    # PAPER_SCREENSHOT_TEMP end — original abbreviated labels (D + PT, D + EP,
    # D + MO, PT + EP, PT + MO, EP + MO, D + PT + EP, D + PT + MO, D + EP + MO,
    # PT + EP + MO, D + PT + EP + MO (Full)) live in git history / the README
    # note for this change if you need to restore them exactly.
}


def build_stats_meta(agents: pd.DataFrame) -> dict:
    roll_dist = (agents["human_roll"].value_counts(normalize=True) * 100).round(2)
    report_dist = (agents["human_report"].value_counts(normalize=True) * 100).round(2)
    return {
        "experiments": EXPERIMENT_META,
        "human_roll_distribution_pct": {str(i): roll_dist.get(i, 0.0) for i in range(1, 7)},
        "human_report_distribution_pct": {str(i): report_dist.get(i, 0.0) for i in range(1, 7)},
        # Constant across every experiment (a property of the humans, not the
        # agent condition) — kept here rather than repeated on every stats_experiments row.
        "human_lie_rate": round(1 - agents["human_honest"].mean(), 3),
    }


def build_results(agent_results: pd.DataFrame) -> pd.DataFrame:
    subset = agent_results[agent_results["experiment_id"].isin(RESULT_EXPERIMENT_IDS)]
    return subset[["experiment_id", "agent_id", "run_id", "agent_report", "agent_reason"]]


def build_reasoning_codes(reasoning_codes: pd.DataFrame, manifest: pd.DataFrame) -> pd.DataFrame:
    code_columns = [
        c for c in reasoning_codes.columns
        if c not in ("experiment_id", "main_id", "agent_id", "run_id")
    ]

    human = reasoning_codes[reasoning_codes["experiment_id"] == "h001"].copy()
    human["main_id"] = human["main_id"].astype(int)
    human = human.drop(columns=["agent_id"]).merge(
        manifest[["agent_id", "main_id"]], on="main_id", how="left"
    )
    human["subject_type"] = "human"
    human["run_id"] = pd.NA

    agent = reasoning_codes[reasoning_codes["experiment_id"] == "10010"].copy()
    agent["agent_id"] = agent["agent_id"].astype(int)
    agent = agent.drop(columns=["main_id"])
    agent = agent.merge(manifest[["agent_id", "main_id"]], on="agent_id", how="left")
    agent["subject_type"] = "agent"

    combined = pd.concat([human, agent], ignore_index=True)
    columns = ["subject_type", "agent_id", "main_id", "experiment_id", "run_id", *code_columns]
    return combined[columns]


AGENTS_CODEBOOK = {
    "agent_id": "Synthetic participant identifier (matches results.csv / reasoning_codes.csv)",
    "dem_age": "Age in years (integer, 18-99)",
    "dem_gender": "man / woman / person (Other) / blank (Prefer not to disclose)",
    "dem_ethnicity": "White / Black / Hispanic / Asian / other / blank (Prefer not to disclose)",
    "dem_education": "less than a high school diploma / a high school diploma / some college education / an undergraduate degree / a graduate degree / a doctoral degree",
    "dem_income": "less than $25,000 per year ... more than $200,000 per year (7 bands) / blank (Prefer not to disclose)",
    "dem_occupation": "full-time / part-time / self-employed / unemployed / retired / student / homemaker or caregiver / free-text when the participant selected \"other\"",
    "dem_industry": "technology / healthcare / retail / finance / education / manufacturing / arts and entertainment / hospitality / government / free-text when the participant selected \"other\"",
    "dem_politics": "Democrat / Republican / Independent / other / blank (Prefer not to disclose)",
    "dem_religion": "Catholic / Protestant / Jewish / Muslim / Buddhist / Hindu / not religious / other / blank (Prefer not to disclose)",
    "dem_text": "Full demographics paragraph assembled from the fields above, ready to drop into the demographics__text prompt module (see prepare/prompt_templates.py, not published)",
    "hx_hh": "HEXACO Honesty-Humility, facet mean (1-5), reverse-keyed items already corrected",
    "hx_em": "HEXACO Emotionality, facet mean (1-5), reverse-keyed items already corrected",
    "hx_ex": "HEXACO Extraversion, facet mean (1-5), reverse-keyed items already corrected",
    "hx_ag": "HEXACO Agreeableness, facet mean (1-5), reverse-keyed items already corrected",
    "hx_co": "HEXACO Conscientiousness, facet mean (1-5), reverse-keyed items already corrected",
    "hx_op": "HEXACO Openness to Experience, facet mean (1-5), reverse-keyed items already corrected",
    "psm_risk": "Preference Survey Module: risk tolerance (0-10)",
    "psm_patience": "Preference Survey Module: patience (0-10)",
    "psm_altruism": "Preference Survey Module: altruism (0-10)",
    "psm_pos_rec": "Preference Survey Module: positive reciprocity (0-10)",
    "psm_neg_rec": "Preference Survey Module: negative reciprocity, mean of 3 items (0-10)",
    "psm_trust": "Preference Survey Module: trust (0-10)",
    "cs_deontology": "Consequentialist Scale: deontology, mean of 5 items (1-5)",
    "cs_utilitarianism": "Consequentialist Scale: utilitarianism, mean of 5 items (1-5)",
    "human_roll": "True die roll shown to this participant (1-6)",
    "human_report": "Participant's self-reported die value (1-6)",
    "human_reason": "Participant's open-ended stated reason for their report",
    "human_honest": "True if human_report == human_roll. Fixed per agent, independent of experiment_id.",
}

RESULTS_CODEBOOK = {
    "experiment_id": "Numeric experiment identifier — see stats_meta.json for the module/style recipe per ID",
    "agent_id": "Matches agents.csv agent_id",
    "run_id": "Repetition number within the experiment (1-based)",
    "agent_report": "Agent's reported die value (1-6)",
    "agent_reason": "Agent's free-text reasoning for its report",
}

STATS_RESULTS_CODEBOOK = {
    "agent_id": "Matches agents.csv agent_id",
    "experiment_id": "Matches results.csv experiment_id — see stats_meta.json for the module/style recipe",
    "n_runs": "Number of non-null runs for this agent x experiment (usually 5; occasionally 4 due to a missing run)",
    "n_honest": "Number of runs where agent_report == agents.csv human_roll for this agent",
    "honesty_rate": "n_honest / n_runs (0-1)",
}

STATS_EXPERIMENTS_CODEBOOK = {
    "experiment_id": "Matches results.csv / stats_results.csv experiment_id",
    "report_pct_1..6": "Percentage of all agent_report values in this experiment equal to 1..6 (Fischbacher-plot distribution)",
    "honesty_dist_honest_humans_0/20/40/60/80/100": "Among agents whose linked human was honest (human_honest=True), percentage of agents whose own honesty_rate (from stats_results.csv) rounds to that bucket",
    "honesty_dist_dishonest_humans_0/20/40/60/80/100": "Same, for agents whose linked human was NOT honest",
    "kappa": "Weighted Cohen's kappa (human honesty vs. agent honesty rate) for this condition, ported from prepare/analysis.md's compute_kappa_weighted",
    "kappa_n": "Number of agents included in the kappa computation",
    "kappa_se": "Large-sample standard error of kappa",
    "kappa_significant": "True if |kappa/kappa_se| > 1.96 (~p<0.05, two-tailed)",
    "agent_lie_rate": "Fraction of ALL runs in this condition where agent_report != human_roll (compare to stats_meta.json's constant human_lie_rate)",
}

REASONING_CODES_META = {
    "subject_type": "'human' or 'agent'",
    "agent_id": "Matches agents.csv agent_id",
    "main_id": "Original human study participant identifier (traceability)",
    "experiment_id": "'h001' for human rows (LLM-coded), '10010' for agent rows — see stats_meta.json",
    "run_id": "Blank for human rows; repetition number (1-based) for agent rows",
}


def split_by_experiment(df: pd.DataFrame, out_dir: pathlib.Path) -> None:
    """Writes one CSV per experiment_id into out_dir, so the frontend only
    ever fetches the slice for the currently selected condition instead of
    the full multi-megabyte table."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for exp_id, group in df.groupby("experiment_id"):
        group.to_csv(out_dir / f"{exp_id}.csv", index=False)


def write_codebook(path: pathlib.Path, title: str, descriptions: dict, extra_columns: list | None = None) -> None:
    lines = [title, ""]
    for col, desc in descriptions.items():
        lines.append(f"{col}: {desc}")
    if extra_columns:
        lines.append("")
        lines.append("One-hot reasoning codes (1 = applies, 0 = does not; full definitions in prompt_templates.py, reasoning_evaluation__codebook):")
        for col in extra_columns:
            lines.append(f"- {col}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    human = pd.read_csv(PREPARE_DIR / "human_results.csv")
    manifest = pd.read_csv(PREPARE_DIR / "manifest.csv")
    agent_results = pd.read_csv(PREPARE_DIR / "agent_results.csv", dtype={"experiment_id": str})
    reasoning_codes = pd.read_csv(PREPARE_DIR / "reasoning_codes.csv", dtype={"experiment_id": str})

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    agents = build_agents(human, manifest)
    agents.to_csv(OUTPUT_DIR / "agents.csv", index=False)
    write_codebook(OUTPUT_DIR / "agents_codebook.txt", "agents.csv — column codebook", AGENTS_CODEBOOK)
    print(f"agents.csv: {len(agents)} rows")

    results = build_results(agent_results)
    split_by_experiment(results, OUTPUT_DIR / "results")
    write_codebook(
        OUTPUT_DIR / "results_codebook.txt",
        "results/{experiment_id}.csv — column codebook (one file per experiment_id, same columns in each)",
        RESULTS_CODEBOOK,
    )
    print(f"results/: {len(results)} rows across {results['experiment_id'].nunique()} files")

    codes = build_reasoning_codes(reasoning_codes, manifest)
    codes.to_csv(OUTPUT_DIR / "reasoning_codes.csv", index=False)
    code_columns = [c for c in codes.columns if c not in REASONING_CODES_META]
    write_codebook(
        OUTPUT_DIR / "reasoning_codes_codebook.txt",
        "reasoning_codes.csv — column codebook",
        REASONING_CODES_META,
        extra_columns=code_columns,
    )
    print(f"reasoning_codes.csv: {len(codes)} rows")

    stats_results = build_stats_results(results, agents)
    split_by_experiment(stats_results, OUTPUT_DIR / "stats_results")
    write_codebook(
        OUTPUT_DIR / "stats_results_codebook.txt",
        "stats_results/{experiment_id}.csv — column codebook (one file per experiment_id, same columns in each)",
        STATS_RESULTS_CODEBOOK,
    )
    print(f"stats_results/: {len(stats_results)} rows across {stats_results['experiment_id'].nunique()} files")

    stats_experiments = build_stats_experiments(stats_results, results, agents)
    stats_experiments.to_csv(OUTPUT_DIR / "stats_experiments.csv", index=False)
    write_codebook(OUTPUT_DIR / "stats_experiments_codebook.txt", "stats_experiments.csv — column codebook", STATS_EXPERIMENTS_CODEBOOK)
    print(f"stats_experiments.csv: {len(stats_experiments)} rows")

    meta = build_stats_meta(agents)
    (OUTPUT_DIR / "stats_meta.json").write_text(json.dumps(meta, indent=2), encoding="utf-8")
    print(f"stats_meta.json: {len(meta['experiments'])} experiments")


if __name__ == "__main__":
    main()
