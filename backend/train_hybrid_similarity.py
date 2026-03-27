"""
train_hybrid_similarity.py

Offline reproducible training pipeline for the hybrid recommender used in this project.

Why embeddings are used:
- Structured numeric features capture budget/space/access constraints well,
  but they miss semantic similarity (e.g., similar property type/location context).

Why hybrid similarity is used:
- Structured similarity preserves explainable user-preference matching.
- Embedding similarity adds semantic understanding from textual property context.
- Weighted fusion combines both signals for improved recommendation quality.

Run from backend/:
    python train_hybrid_similarity.py
"""

from pathlib import Path
from typing import List, Dict, Tuple, Any, Optional
from time import perf_counter

import numpy as np
import pandas as pd

try:
    from sentence_transformers import SentenceTransformer  # type: ignore[import-not-found]
except Exception as ex:  # pragma: no cover - runtime dependency check
    SentenceTransformer = None
    _IMPORT_ERROR = ex
else:
    _IMPORT_ERROR = None

BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "outputs" / "data"
MODELS_DIR = BASE_DIR / "outputs" / "models"
METRICS_DIR = BASE_DIR / "outputs" / "metrics"

DATA_PATH = DATA_DIR / "cleaned_dataset.csv"
EMBEDDINGS_PATH = MODELS_DIR / "embeddings.npy"
SIMILARITY_PATH = MODELS_DIR / "similarity_matrix.npy"
SCALER_PATH = MODELS_DIR / "scaler.pkl"

FEATURE_COLS = [
    "rent",
    "bedrooms",
    "bathrooms",
    "size",
    "avg_distance_to_nearest_station",
    "nearest_station_count",
]

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
HYBRID_CONFIGS = [
    (0.9, 0.1),
    (0.85, 0.15),
    (0.8, 0.2),
    (0.7, 0.3),
]

# Feature-level weighting for structured similarity (thesis tuning phase).
# High: rent/bedrooms, medium: bathrooms/size, lower: distance/station count.
FEATURE_WEIGHTS = {
    "rent": 1.8,
    "bedrooms": 1.7,
    "bathrooms": 1.3,
    "size": 1.2,
    "avg_distance_to_nearest_station": 0.9,
    "nearest_station_count": 0.8,
}
TOP_K = 5
EVAL_SAMPLE_SIZE = 250


def _ensure_dirs() -> None:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    METRICS_DIR.mkdir(parents=True, exist_ok=True)


def _cosine_similarity_np(a: np.ndarray, b: Optional[np.ndarray] = None) -> np.ndarray:
    """Fast cosine similarity using NumPy only (avoids heavy scipy/sklearn import)."""
    if b is None:
        b = a
    a = a.astype(np.float32, copy=False)
    b = b.astype(np.float32, copy=False)
    a_norm = np.linalg.norm(a, axis=1, keepdims=True)
    b_norm = np.linalg.norm(b, axis=1, keepdims=True)
    a_norm[a_norm == 0] = 1.0
    b_norm[b_norm == 0] = 1.0
    return (a @ b.T) / (a_norm @ b_norm.T)


def _load_and_prepare_df() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Missing dataset file: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    for col in FEATURE_COLS:
        if col not in df.columns:
            raise ValueError(f"Dataset is missing required column: {col}")

    # Fill structured feature NaNs with medians for stable cosine similarity.
    for col in FEATURE_COLS:
        df[col] = df[col].fillna(df[col].median())

    return df


def _build_property_text(df: pd.DataFrame) -> pd.Series:
    # Semantic text combines type + coarse location + furnishing context.
    # This is lightweight and directly aligned with explainable thesis narrative.
    return (
        df["property_type"].fillna("unknown_type").astype(str)
        + " "
        + df["subdistrict_code"].fillna("unknown_location").astype(str)
        + " "
        + df["furnish_type"].fillna("unknown_furnish").astype(str)
    )


def _structured_similarity(df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
    x = df[FEATURE_COLS].astype(float).values

    # Min-max normalization with NumPy to keep runtime stable.
    mins = x.min(axis=0)
    maxs = x.max(axis=0)
    denom = np.where((maxs - mins) == 0, 1.0, (maxs - mins))
    x_scaled = (x - mins) / denom

    # Apply feature-level weighting in scaled space before cosine similarity.
    # This preserves architecture while tuning contribution strength per feature.
    weight_vec = np.array([FEATURE_WEIGHTS[col] for col in FEATURE_COLS], dtype=np.float32)
    x_weighted = x_scaled * weight_vec

    sim = _cosine_similarity_np(x_weighted).astype(np.float32)
    return sim, x_scaled


def _embedding_similarity(text_series: pd.Series) -> Tuple[np.ndarray, np.ndarray]:
    if SentenceTransformer is None:
        raise RuntimeError(
            "sentence-transformers is not installed. Install dependencies from backend/requirements.txt"
        ) from _IMPORT_ERROR

    model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embeddings = model.encode(
        text_series.tolist(),
        convert_to_numpy=True,
        show_progress_bar=True,
        normalize_embeddings=True,
    ).astype(np.float32)

    np.save(EMBEDDINGS_PATH, embeddings)
    print("Embeddings generated")

    emb_sim = _cosine_similarity_np(embeddings).astype(np.float32)
    return emb_sim, embeddings


def _query_rank_indices(df: pd.DataFrame, idx: int, k: int = TOP_K) -> List[int]:
    row = df.iloc[idx]
    budget = float(row["rent"])
    bedrooms = float(row["bedrooms"])
    bathrooms = float(row["bathrooms"])
    max_distance = float(row["avg_distance_to_nearest_station"])

    strict = df[
        (df["rent"] <= budget * 1.15)
        & (df["bedrooms"] == bedrooms)
        & (df["bathrooms"] == bathrooms)
        & (df["avg_distance_to_nearest_station"] <= max_distance + 0.5)
    ].copy()

    strict = strict[strict.index != idx]
    strict["_rank"] = (strict["rent"] - budget).abs()
    strict = strict.sort_values(["_rank", "avg_distance_to_nearest_station"])

    picks = list(strict.head(k).index)

    if len(picks) < k:
        relaxed = df[
            (df["rent"] <= budget * 1.30)
            & (df["bedrooms"].between(max(1.0, bedrooms - 1.0), bedrooms + 1.0))
            & (df["bathrooms"].between(max(1.0, bathrooms - 1.0), bathrooms + 1.0))
            & (df["avg_distance_to_nearest_station"] <= max_distance + 1.0)
            & (~df.index.isin(picks + [idx]))
        ].copy()

        relaxed["_rank"] = (
            (relaxed["rent"] - budget).abs()
            + (relaxed["avg_distance_to_nearest_station"] - max_distance).abs() * 250
            + (relaxed["bedrooms"] - bedrooms).abs() * 300
            + (relaxed["bathrooms"] - bathrooms).abs() * 300
        )
        relaxed = relaxed.sort_values(["_rank", "avg_distance_to_nearest_station"])
        picks.extend(list(relaxed.head(k - len(picks)).index))

    return picks[:k]


def _relevant_set(df: pd.DataFrame, idx: int) -> set:
    row = df.iloc[idx]
    budget = float(row["rent"])
    bedrooms = float(row["bedrooms"])
    bathrooms = float(row["bathrooms"])
    max_distance = float(row["avg_distance_to_nearest_station"])

    relevant = df[
        (df["rent"] <= budget * 1.15)
        & (df["bedrooms"] == bedrooms)
        & (df["bathrooms"] == bathrooms)
        & (df["avg_distance_to_nearest_station"] <= max_distance + 0.5)
    ]
    idxs = set(relevant.index.tolist())
    if idx in idxs:
        idxs.remove(idx)
    return idxs


def _topk_from_similarity(sim_matrix: np.ndarray, idx: int, k: int = TOP_K) -> List[int]:
    sims = sim_matrix[idx].copy()
    sims[idx] = -1.0
    return sims.argsort()[::-1][:k].tolist()


def _mean_diversity(sim_matrix: np.ndarray, recs: List[int]) -> float:
    if len(recs) < 2:
        return 0.0

    vals = []
    for i in range(len(recs)):
        for j in range(i + 1, len(recs)):
            vals.append(1.0 - float(sim_matrix[recs[i], recs[j]]))
    return float(np.mean(vals)) if vals else 0.0


def _gini(values: np.ndarray) -> float:
    arr = values.astype(float)
    if arr.size == 0 or np.all(arr == 0):
        return 0.0
    arr = np.sort(arr)
    n = arr.size
    cum = np.sum((2 * np.arange(1, n + 1) - n - 1) * arr)
    return float(cum / (n * np.sum(arr)))


def _f1_at_k(precision: float, recall: float) -> float:
    return (2.0 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0


def _ndcg_at_k(recs: List[int], relevant: set, k: int = TOP_K) -> float:
    if not recs:
        return 0.0

    dcg = 0.0
    for rank, item in enumerate(recs[:k], start=1):
        rel = 1.0 if item in relevant else 0.0
        dcg += rel / np.log2(rank + 1)

    ideal_hits = min(len(relevant), k)
    if ideal_hits == 0:
        return 0.0
    idcg = sum(1.0 / np.log2(rank + 1) for rank in range(1, ideal_hits + 1))
    return float(dcg / idcg) if idcg > 0 else 0.0


def _evaluate(
    df: pd.DataFrame,
    structured_sim: np.ndarray,
    tuned_sims: Dict[str, np.ndarray],
    eval_indices: List[int],
) -> Tuple[pd.DataFrame, Dict[str, pd.DataFrame]]:
    rows: List[Dict[str, Any]] = []
    details: Dict[str, pd.DataFrame] = {}

    models = {
        "baseline_filtering": None,
        "content_based_old": structured_sim,
    }
    models.update(tuned_sims)

    for model_name, sim in models.items():
        precisions = []
        recalls = []
        f1s = []
        ndcgs = []
        diversities = []
        exposure = np.zeros(len(df), dtype=np.int32)
        latencies_ms = []

        for idx in eval_indices:
            t0 = perf_counter()
            relevant = _relevant_set(df, idx)
            if model_name == "baseline_filtering":
                recs = _query_rank_indices(df, idx, TOP_K)
                # diversity computed in structured feature space for comparability.
                diversity_val = _mean_diversity(structured_sim, recs)
            else:
                recs = _topk_from_similarity(sim, idx, TOP_K)
                diversity_val = _mean_diversity(structured_sim, recs)
            latency_ms = (perf_counter() - t0) * 1000.0
            latencies_ms.append(float(latency_ms))

            hit = sum(1 for r in recs if r in relevant)
            precision = hit / TOP_K
            recall = hit / max(len(relevant), 1)
            f1 = _f1_at_k(precision, recall)
            ndcg = _ndcg_at_k(recs, relevant, TOP_K)

            precisions.append(precision)
            recalls.append(recall)
            f1s.append(f1)
            ndcgs.append(ndcg)
            diversities.append(diversity_val)

            for r in recs:
                exposure[r] += 1

        coverage = float(np.mean(exposure > 0) * 100)

        rows.append(
            {
                "model": model_name,
                "precision@5": round(float(np.mean(precisions)), 4),
                "recall@5": round(float(np.mean(recalls)), 4),
                "f1@5": round(float(np.mean(f1s)), 4),
                "ndcg@5": round(float(np.mean(ndcgs)), 4),
                "avg_diversity": round(float(np.mean(diversities)), 4),
                "coverage_pct": round(coverage, 2),
                "gini_exposure": round(_gini(exposure), 4),
                "never_recommended_pct": round(float(np.mean(exposure == 0) * 100), 2),
                "avg_latency_ms": round(float(np.mean(latencies_ms)), 3),
            }
        )

        details[model_name] = pd.DataFrame(
            {
                "precision@5": precisions,
                "recall@5": recalls,
                "f1@5": f1s,
                "ndcg@5": ndcgs,
                "latency_ms": latencies_ms,
            }
        )

        if model_name == "hybrid_0.85_0.15":
            pd.DataFrame({"property_id": np.arange(len(df)), "exposure_count": exposure}).to_csv(
                METRICS_DIR / "exposure_analysis.csv", index=False
            )
            pd.DataFrame({"diversity_score": diversities}).to_csv(
                METRICS_DIR / "diversity_scores.csv", index=False
            )

    return pd.DataFrame(rows), details


def main() -> None:
    _ensure_dirs()
    print("Loading and preparing cleaned dataset...")
    df = _load_and_prepare_df()

    text_series = _build_property_text(df)

    structured_sim, _ = _structured_similarity(df)
    emb_sim, _ = _embedding_similarity(text_series)

    tuned_sims: Dict[str, np.ndarray] = {}
    selected_hybrid = None
    for struct_w, embed_w in HYBRID_CONFIGS:
        sim = (struct_w * structured_sim + embed_w * emb_sim).astype(np.float32)
        np.fill_diagonal(sim, 1.0)
        key = f"hybrid_{struct_w:.2f}_{embed_w:.2f}".replace(".00", "")
        tuned_sims[key] = sim
        if abs(struct_w - 0.85) < 1e-9 and abs(embed_w - 0.15) < 1e-9:
            selected_hybrid = sim

    if selected_hybrid is None:
        selected_hybrid = tuned_sims[sorted(tuned_sims.keys())[0]]

    np.save(SIMILARITY_PATH, selected_hybrid)
    print("Hybrid similarity computed")

    # Fixed split for reproducible evaluation comparisons in thesis appendix.
    all_idx = np.arange(len(df))
    rng = np.random.default_rng(42)
    shuffled = rng.permutation(all_idx)
    eval_idx = shuffled[: min(EVAL_SAMPLE_SIZE, len(shuffled))]

    comparison, details = _evaluate(df, structured_sim, tuned_sims, eval_idx.tolist())
    comparison.to_csv(METRICS_DIR / "model_comparison.csv", index=False)

    # Required thesis metric files.
    recall_df = comparison[["model", "recall@5"]].rename(columns={"recall@5": "value"})
    recall_df.to_csv(METRICS_DIR / "recall_at_k.csv", index=False)

    f1_df = comparison[["model", "f1@5"]].rename(columns={"f1@5": "value"})
    f1_df.to_csv(METRICS_DIR / "f1_at_k.csv", index=False)

    ndcg_df = comparison[["model", "ndcg@5"]].rename(columns={"ndcg@5": "value"})
    ndcg_df.to_csv(METRICS_DIR / "ndcg_at_k.csv", index=False)

    coverage_df = comparison[["model", "coverage_pct"]].rename(columns={"coverage_pct": "value"})
    coverage_df.to_csv(METRICS_DIR / "coverage.csv", index=False)

    latency_rows = []
    for model_name, ddf in details.items():
        latency_rows.append(
            {
                "model": model_name,
                "avg_latency_ms": round(float(ddf["latency_ms"].mean()), 3),
                "p95_latency_ms": round(float(ddf["latency_ms"].quantile(0.95)), 3),
                "max_latency_ms": round(float(ddf["latency_ms"].max()), 3),
            }
        )
    pd.DataFrame(latency_rows).to_csv(METRICS_DIR / "latency_metrics.csv", index=False)

    # Keep existing dashboard contract by publishing hybrid metrics under current names.
    hybrid_row = comparison[comparison["model"] == "hybrid_0.85_0.15"].iloc[0]
    pd.DataFrame(
        [
            {"metric": "precision@5", "value": float(hybrid_row["precision@5"])},
            {"metric": "recall@5", "value": float(hybrid_row["recall@5"])},
        ]
    ).to_csv(METRICS_DIR / "model_metrics.csv", index=False)

    print("Model saved successfully")
    print(f"Saved embeddings to: {EMBEDDINGS_PATH}")
    print(f"Saved hybrid similarity to: {SIMILARITY_PATH}")
    print(f"Saved comparison metrics to: {METRICS_DIR / 'model_comparison.csv'}")


if __name__ == "__main__":
    main()
