"""
recommender.py — AI Recommendation Engine + Simple Query Engine
Content-based filtering using cosine similarity (AI path)
Criteria-based filter matching (simple query path — used for comparison)
"""

import numpy as np
import pandas as pd
import joblib
from sklearn.metrics.pairwise import cosine_similarity
from pathlib import Path
from typing import List, Dict, Any, Optional

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "outputs" / "models"
DATA_DIR = BASE_DIR / "outputs" / "data"

FEATURE_COLS = [
    "rent",
    "bedrooms",
    "bathrooms",
    "size",
    "avg_distance_to_nearest_station",
    "nearest_station_count",
]

print("[Recommender] Loading dataset...")
_df = pd.read_csv(DATA_DIR / "cleaned_dataset.csv")

# Fill missing values with medians before scaling
_df_features = _df[FEATURE_COLS].copy()
_col_medians: Dict[str, float] = {}
for col in FEATURE_COLS:
    median_val = _df_features[col].median()
    _col_medians[col] = float(median_val)
    _df_features[col] = _df_features[col].fillna(median_val)

print("[Recommender] Loading scaler...")
_scaler = joblib.load(MODELS_DIR / "scaler.pkl")

print("[Recommender] Scaling feature matrix...")
_X_scaled = _scaler.transform(_df_features.values)

# Load pre-computed similarity matrix for property-to-property lookups
print("[Recommender] Loading similarity matrix...")
_sim_path = MODELS_DIR / "similarity_matrix.npy"
if _sim_path.exists():
    _sim_matrix = np.load(_sim_path)
else:
    print("[Recommender] similarity_matrix.npy not found, computing matrix at startup...")
    _sim_matrix = cosine_similarity(_X_scaled, _X_scaled)
print("[Recommender] All resources loaded successfully.")


# ─────────────────────────────────────────────────────────────────────────────
# SHARED UTILITIES
# ─────────────────────────────────────────────────────────────────────────────

def _clean(prop: dict) -> dict:
    """Replace NaN floats with None for JSON serialisation."""
    return {k: (None if (isinstance(v, float) and np.isnan(v)) else v)
            for k, v in prop.items()}


def _build_explanation(prop: dict, budget: float, bedrooms: int,
                       bathrooms: int, max_distance: float) -> List[str]:
    """Return human-readable reasons why this property matches the user vector."""
    reasons = []
    rent = prop.get("rent", 0) or 0
    if rent > 0 and abs(rent - budget) / max(budget, 1) <= 0.20:
        reasons.append("Similar rent range")
    if prop.get("bedrooms") is not None and int(prop["bedrooms"]) == bedrooms:
        reasons.append("Same bedroom count")
    if prop.get("bathrooms") is not None and int(prop["bathrooms"]) == bathrooms:
        reasons.append("Same bathroom count")
    dist = prop.get("avg_distance_to_nearest_station")
    if dist is not None and float(dist) <= max_distance + 0.3:
        reasons.append("Close to transport links")
    if not reasons:
        reasons.append("Best available feature match")
    return reasons


def _row_to_dict(idx: int, row: pd.Series, extra: dict = None) -> dict:
    prop = _clean(row.to_dict())
    prop["id"] = str(idx)
    if extra:
        prop.update(extra)
    return prop


def is_dataset_property_id(property_id: str) -> bool:
    return str(property_id).isdigit()


def parse_dataset_property_id(property_id: str) -> Optional[int]:
    if not is_dataset_property_id(property_id):
        return None
    idx = int(property_id)
    if idx < 0 or idx >= len(_df):
        return None
    return idx


# ─────────────────────────────────────────────────────────────────────────────
# AI RECOMMENDATION ENGINE  (cosine similarity)
# ─────────────────────────────────────────────────────────────────────────────

def recommend(budget: float, bedrooms: int, bathrooms: int,
              max_distance: float, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Return top-N property recommendations using cosine similarity.
    User preferences are encoded as a 6-dimensional feature vector and
    normalised with the pre-fitted MinMaxScaler before computing similarity.
    """
    user_vec = np.array([[
        budget, bedrooms, bathrooms,
        _col_medians["size"],          # no user input → dataset median
        max_distance,
        _col_medians["nearest_station_count"],  # near-constant in dataset
    ]], dtype=float)
    user_scaled = _scaler.transform(user_vec)
    sims = cosine_similarity(user_scaled, _X_scaled)[0]
    top_idx = sims.argsort()[::-1][:top_n]

    results = []
    for idx in top_idx:
        prop = _clean(_df.iloc[idx].to_dict())
        results.append({
            "id": str(idx),
            "address": prop.get("address", "Unknown"),
            "subdistrict_code": prop.get("subdistrict_code"),
            "rent": float(prop.get("rent", 0) or 0),
            "property_type": prop.get("property_type"),
            "bedrooms": prop.get("bedrooms"),
            "bathrooms": prop.get("bathrooms"),
            "size": prop.get("size"),
            "avg_distance_to_nearest_station": prop.get("avg_distance_to_nearest_station"),
            "furnish_type": prop.get("furnish_type"),
            "similarity_score": round(float(sims[idx]) * 100, 1),
            "explanation": _build_explanation(prop, budget, bedrooms, bathrooms, max_distance),
        })
    return results


# ─────────────────────────────────────────────────────────────────────────────
# SIMPLE QUERY ENGINE  (criteria-based filter, no AI)
# ─────────────────────────────────────────────────────────────────────────────

def simple_query_recommend(budget: float, bedrooms: int, bathrooms: int,
                           max_distance: float, top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Non-AI baseline: filter properties by hard criteria, sort by rent proximity.
    Used for comparison with the AI cosine-similarity approach.

    Criteria:
      • rent ≤ budget × 1.15  (up to 15% over budget)
      • bedrooms == requested (exact match)
      • bathrooms == requested (exact match)
      • distance ≤ max_distance + 0.5 km
    Sort: closest rent to budget (ascending absolute difference), then distance.
    """
    df = _df.copy()

    # Strict baseline: exact bedrooms/bathrooms + modest budget and distance flexibility.
    strict_mask = (
        (df["rent"] <= budget * 1.15) &
        (df["bedrooms"] == float(bedrooms)) &
        (df["bathrooms"] == float(bathrooms)) &
        (df["avg_distance_to_nearest_station"] <= max_distance + 0.5)
    )
    strict = df[strict_mask].copy()
    strict["_rent_diff"] = (strict["rent"] - budget).abs()
    strict = strict.sort_values(["_rent_diff", "avg_distance_to_nearest_station"])

    strict_idx = list(strict.head(top_n).index)
    selected_idx = list(strict_idx)

    # If strict results are sparse, top up with near-matches to keep comparison useful.
    if len(selected_idx) < top_n:
        relaxed_mask = (
            (df["rent"] <= budget * 1.30) &
            (df["bedrooms"].between(float(max(1, bedrooms - 1)), float(bedrooms + 1))) &
            (df["bathrooms"].between(float(max(1, bathrooms - 1)), float(bathrooms + 1))) &
            (df["avg_distance_to_nearest_station"] <= max_distance + 1.0)
        )
        relaxed = df[relaxed_mask & ~df.index.isin(selected_idx)].copy()
        relaxed["_rank_score"] = (
            (relaxed["rent"] - budget).abs() +
            (relaxed["avg_distance_to_nearest_station"] - max_distance).abs() * 250 +
            (relaxed["bedrooms"] - float(bedrooms)).abs() * 300 +
            (relaxed["bathrooms"] - float(bathrooms)).abs() * 300
        )
        relaxed = relaxed.sort_values(["_rank_score", "avg_distance_to_nearest_station"])
        needed = top_n - len(selected_idx)
        selected_idx.extend(list(relaxed.head(needed).index))

    selected = df.loc[selected_idx]
    strict_idx_set = set(strict_idx)

    results = []
    for idx, row in selected.iterrows():
        prop = _clean(row.to_dict())
        # Build criterion match labels
        matched = []
        is_strict = idx in strict_idx_set
        if prop.get("rent", 0) <= budget:
            matched.append("Within budget")
        else:
            matched.append("Slightly over budget (≤15%)")
        if prop.get("bedrooms") is not None and int(prop["bedrooms"]) == bedrooms:
            matched.append("Exact bedroom match")
        elif prop.get("bedrooms") is not None and abs(int(prop["bedrooms"]) - bedrooms) <= 1:
            matched.append("Near bedroom match (±1)")
        if prop.get("bathrooms") is not None and int(prop["bathrooms"]) == bathrooms:
            matched.append("Exact bathroom match")
        elif prop.get("bathrooms") is not None and abs(int(prop["bathrooms"]) - bathrooms) <= 1:
            matched.append("Near bathroom match (±1)")
        dist = prop.get("avg_distance_to_nearest_station")
        if dist is not None and float(dist) <= max_distance:
            matched.append("Within station distance")
        elif dist is not None and float(dist) <= max_distance + 1.0:
            matched.append("Near station distance")
        if not is_strict:
            matched.append("Relaxed fallback candidate")

        results.append({
            "id": str(idx),
            "address": prop.get("address", "Unknown"),
            "rent": float(prop.get("rent", 0) or 0),
            "property_type": prop.get("property_type"),
            "bedrooms": prop.get("bedrooms"),
            "bathrooms": prop.get("bathrooms"),
            "avg_distance_to_nearest_station": prop.get("avg_distance_to_nearest_station"),
            "matched_criteria": matched,
            # Dummy similarity score for display (not from AI)
            "similarity_score": 0.0,
        })

    return results


# ─────────────────────────────────────────────────────────────────────────────
# PROPERTY DETAIL + SIMILAR PROPERTIES
# ─────────────────────────────────────────────────────────────────────────────

def get_similar_properties(property_id: str, top_n: int = 5) -> List[Dict[str, Any]]:
    idx = parse_dataset_property_id(property_id)
    if idx is None:
        return []
    sims = _sim_matrix[idx]
    top_idx = sims.argsort()[::-1][1: top_n + 1]

    results = []
    for idx in top_idx:
        prop = _clean(_df.iloc[idx].to_dict())
        results.append({
            "id": str(idx),
            "address": prop.get("address", "Unknown"),
            "subdistrict_code": prop.get("subdistrict_code"),
            "rent": float(prop.get("rent", 0) or 0),
            "property_type": prop.get("property_type"),
            "bedrooms": prop.get("bedrooms"),
            "bathrooms": prop.get("bathrooms"),
            "size": prop.get("size"),
            "avg_distance_to_nearest_station": prop.get("avg_distance_to_nearest_station"),
            "furnish_type": prop.get("furnish_type"),
            "similarity_score": round(float(sims[idx]) * 100, 1),
        })
    return results


def get_property_by_id(property_id: str) -> Optional[Dict[str, Any]]:
    idx = parse_dataset_property_id(property_id)
    if idx is None:
        return None
    prop = _df.iloc[idx].to_dict()
    return _clean(prop)


def get_all_properties(
    skip: int = 0,
    limit: int = 20,
    max_rent: Optional[float] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    property_type: Optional[str] = None,
    max_distance: Optional[float] = None,
) -> tuple[List[Dict[str, Any]], int]:
    filtered = _df.copy()

    if max_rent is not None:
        filtered = filtered[filtered["rent"] <= max_rent]
    if bedrooms is not None:
        filtered = filtered[filtered["bedrooms"] == float(bedrooms)]
    if bathrooms is not None:
        filtered = filtered[filtered["bathrooms"] == float(bathrooms)]
    if property_type:
        filtered = filtered[filtered["property_type"].str.lower() == property_type.lower()]
    if max_distance is not None:
        filtered = filtered[filtered["avg_distance_to_nearest_station"] <= max_distance]

    total = len(filtered)
    page = filtered.iloc[skip: skip + limit]

    results = []
    for idx, row in page.iterrows():
        prop = _clean(row.to_dict())
        prop["id"] = str(idx)
        results.append(prop)
    return results, total


def get_property_types() -> List[str]:
    return sorted(_df["property_type"].dropna().unique().tolist())
