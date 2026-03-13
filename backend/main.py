"""
FastAPI Main Application
AI-Powered Property Recommendation Platform — Backend API

Endpoints:
    Auth:        POST /register  POST /login  GET /me
    Properties:  GET /properties  GET /properties/{id}  GET /properties/{id}/contact
                             POST /properties (landlord)
  AI:          POST /recommend
    Compare:     POST /compare
  Favourites:  GET /favorites  POST /favorites  DELETE /favorites/{id}
  Dashboard:   GET /dashboard/stats  GET /dashboard/figures/{file}
                             GET /dashboard/exposure  GET /dashboard/dataset-summary
                             GET /dashboard/performance
  Usability:   POST /usability/log  GET /usability/summary
  Health:      GET /health
"""

from fastapi import FastAPI, Depends, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path as FilePath
from collections import deque
import pandas as pd
from typing import Optional
from datetime import timedelta
from time import perf_counter
import os
from dotenv import load_dotenv

load_dotenv()

from models import (
    RegisterRequest, LoginRequest, TokenResponse,
    RecommendRequest, DashboardStats, FavoriteRequest,
    ListingCreate, UsabilityLog,
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, get_current_role, require_auth, require_landlord,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
import database as db
import recommender

BASE_DIR = FilePath(__file__).parent.parent
FIGURES_DIR = BASE_DIR / "outputs" / "figures"
DATA_DIR = BASE_DIR / "outputs" / "data"
METRICS_DIR = BASE_DIR / "outputs" / "metrics"
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
CORS_ORIGINS = [
    origin.strip() for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173",
    ).split(",") if origin.strip()
]
PERFORMANCE_WINDOW_SIZE = int(os.getenv("PERFORMANCE_WINDOW_SIZE", "500"))
_request_timings = deque(maxlen=PERFORMANCE_WINDOW_SIZE)


def _serialise_landlord_listing(listing: dict) -> dict:
    record = dict(listing)
    record["id"] = f"landlord_{record.get('_id', '')}"
    record["source"] = "landlord"
    return record


async def _get_property_record(property_id: str) -> tuple[Optional[dict], list[dict]]:
    if recommender.is_dataset_property_id(property_id):
        prop = recommender.get_property_by_id(property_id)
        similar = recommender.get_similar_properties(property_id, top_n=5) if prop else []
        if prop:
            prop["id"] = str(property_id)
            prop["source"] = "dataset"
        return prop, similar

    prefix = "landlord_"
    if property_id.startswith(prefix):
        listing = await db.get_listing_by_id(property_id[len(prefix):])
        if listing:
            return _serialise_landlord_listing(listing), []

    return None, []


# ─────────────────────────────────────────────
# LIFESPAN (startup / shutdown)
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect_db()
    yield
    await db.disconnect_db()


app = FastAPI(
    title="AI Property Recommendation API",
    description="Content-based AI recommendation system for London rental properties.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def track_request_timing(request, call_next):
    started = perf_counter()
    response = await call_next(request)
    duration_ms = round((perf_counter() - started) * 1000, 2)
    _request_timings.append({
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "duration_ms": duration_ms,
    })
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    return response


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

@app.post("/register", response_model=TokenResponse, tags=["Auth"])
async def register(data: RegisterRequest):
    if await db.user_exists(data.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    user_doc = {
        "username": data.username,
        "email": data.email,
        "hashed_password": hash_password(data.password),
        "role": data.role,
    }
    success = await db.create_user(user_doc)
    if not success:
        raise HTTPException(status_code=400, detail="Registration failed")
    token = create_access_token(
        {"sub": data.username, "role": data.role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "role": data.role}


@app.post("/login", response_model=TokenResponse, tags=["Auth"])
async def login(data: LoginRequest):
    user = await db.get_user(data.username)
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    role = user.get("role", "tenant")
    token = create_access_token(
        {"sub": data.username, "role": role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": token, "token_type": "bearer", "role": role}


@app.get("/me", tags=["Auth"])
async def get_me(username: str = Depends(require_auth), role: Optional[str] = Depends(get_current_role)):
    user = await db.get_user(username) or {}
    return {
        "username": username,
        "email": user.get("email", ""),
        "role": user.get("role", "tenant"),
        "favorites": await db.get_favourites(username),
    }


# ─────────────────────────────────────────────
# PROPERTIES
# ─────────────────────────────────────────────

@app.get("/properties", tags=["Properties"])
async def list_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    max_rent: Optional[float] = Query(None),
    bedrooms: Optional[int] = Query(None, ge=1),
    bathrooms: Optional[int] = Query(None, ge=1),
    property_type: Optional[str] = Query(None),
    max_distance: Optional[float] = Query(None, gt=0),
):
    """Return paginated, optionally filtered property listings (dataset + landlord listings)."""
    _, dataset_total = recommender.get_all_properties(
        skip=0, limit=limit,
        max_rent=max_rent, bedrooms=bedrooms, bathrooms=bathrooms,
        property_type=property_type, max_distance=max_distance,
    )
    # Compute combined pagination over landlord listings first, then dataset listings.
    _, landlord_total = await db.get_landlord_listings(skip=0, limit=1)

    landlord_skip = min(skip, landlord_total)
    landlord_take = max(0, min(limit, landlord_total - landlord_skip))
    landlord_records = []
    if landlord_take > 0:
        landlord_records, _ = await db.get_landlord_listings(skip=landlord_skip, limit=landlord_take)

    remaining = limit - landlord_take
    dataset_skip = max(0, skip - landlord_total)
    dataset_records = []
    if remaining > 0:
        dataset_records, _ = recommender.get_all_properties(
            skip=dataset_skip,
            limit=remaining,
            max_rent=max_rent,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            property_type=property_type,
            max_distance=max_distance,
        )

    combined = [_serialise_landlord_listing(lp) for lp in landlord_records] + dataset_records
    return {
        "total": landlord_total + dataset_total,
        "skip": skip,
        "limit": limit,
        "data": combined,
    }


@app.get("/properties/types", tags=["Properties"])
def get_types():
    return {"types": recommender.get_property_types()}


@app.get("/properties/{property_id}", tags=["Properties"])
async def get_property(property_id: str):
    prop, similar = await _get_property_record(property_id)
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return {"property": prop, "similar_properties": similar}


@app.post("/properties", tags=["Properties"], status_code=201)
async def create_property(data: ListingCreate, username: str = Depends(require_landlord)):
    """Landlord-only: create a new property listing (stored in MongoDB)."""
    listing = data.dict()
    listing["landlord"] = username
    owner = await db.get_user(username) or {}
    if not listing.get("contact_email"):
        listing["contact_email"] = owner.get("email")
    doc = await db.create_listing(listing)
    return {"message": "Listing created successfully", "listing": doc}


@app.get("/properties/{property_id}/contact", tags=["Properties"])
async def get_property_contact(property_id: str, username: Optional[str] = Depends(get_current_user)):
    prop, _ = await _get_property_record(property_id)
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")

    if prop.get("source") != "landlord":
        return {
            "available": False,
            "message": "Direct landlord contact is available only for landlord-created listings.",
        }

    landlord_username = prop.get("landlord")
    owner = await db.get_user(landlord_username) if landlord_username else None
    contact_email = prop.get("contact_email") or (owner or {}).get("email")
    contact_phone = prop.get("contact_phone")

    return {
        "available": bool(contact_email or contact_phone),
        "contact": {
            "name": landlord_username,
            "email": contact_email,
            "phone": contact_phone,
        },
        "message": (
            "Use these details to arrange a viewing or ask about the property."
            if (contact_email or contact_phone)
            else "The landlord has not added direct contact details yet."
        ),
        "viewer": username,
    }


# ─────────────────────────────────────────────
# AI RECOMMENDATIONS
# ─────────────────────────────────────────────

@app.post("/recommend", tags=["AI Recommendations"])
async def get_recommendations(data: RecommendRequest, username: Optional[str] = Depends(get_current_user)):
    """
    Generate top-5 AI property recommendations using cosine similarity.
    Each result includes a similarity score and explainability breakdown.
    """
    results = recommender.recommend(
        budget=data.budget,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        max_distance=data.max_distance,
        top_n=5,
    )
    await db.log_recommendation_event({
        "username": username,
        "preferences": data.dict(),
        "results_count": len(results),
        "top_result_id": (results[0]["id"] if results else None),
    })
    return {
        "preferences": data.dict(),
        "recommendations": results,
        "model_info": {
            "algorithm": "Content-Based Filtering",
            "similarity_metric": "Cosine Similarity",
            "features_used": [
                "rent", "bedrooms", "bathrooms",
                "size", "avg_distance_to_nearest_station", "nearest_station_count"
            ],
            "scaler": "MinMaxScaler",
            "precision_at_5": 0.622,
            "recall_at_5": 0.497,
        },
    }


# ─────────────────────────────────────────────
# AI VS SIMPLE QUERY COMPARISON
# ─────────────────────────────────────────────

@app.post("/compare", tags=["Compare"])
async def compare_recommendations(data: RecommendRequest, username: Optional[str] = Depends(get_current_user)):
    """
    Returns BOTH AI cosine-similarity recommendations AND simple criteria-based
    query results for the same user preferences — for side-by-side comparison.
    """
    ai_results = recommender.recommend(
        budget=data.budget, bedrooms=data.bedrooms,
        bathrooms=data.bathrooms, max_distance=data.max_distance, top_n=5,
    )
    query_results = recommender.simple_query_recommend(
        budget=data.budget, bedrooms=data.bedrooms,
        bathrooms=data.bathrooms, max_distance=data.max_distance, top_n=5,
    )

    # Compute overlap — how many properties appear in both result sets
    ai_ids = {r["id"] for r in ai_results}
    q_ids = {r["id"] for r in query_results}
    overlap = len(ai_ids & q_ids)
    overlap_rate = round((overlap / max(len(ai_ids), 1)) * 100, 1)

    # Average rent comparison
    ai_avg_rent = round(sum(r["rent"] for r in ai_results) / len(ai_results), 0) if ai_results else 0
    q_avg_rent = round(sum(r["rent"] for r in query_results) / len(query_results), 0) if query_results else 0

    response = {
        "preferences": data.dict(),
        "ai_results": ai_results,
        "query_results": query_results,
        "summary": {
            "ai_count": len(ai_results),
            "query_count": len(query_results),
            "overlap_count": overlap,
            "overlap_rate_pct": overlap_rate,
            "unique_to_ai": len(ai_ids - q_ids),
            "unique_to_query": len(q_ids - ai_ids),
            "ai_avg_rent": ai_avg_rent,
            "query_avg_rent": q_avg_rent,
            "query_mode": "strict_then_relaxed",
            "note": "AI ranks best overall similarity while query prioritises exact criteria and then near-matches.",
        },
    }
    await db.log_comparison_event({
        "username": username,
        "preferences": data.dict(),
        "ai_count": response["summary"]["ai_count"],
        "query_count": response["summary"]["query_count"],
        "overlap_count": response["summary"]["overlap_count"],
    })
    return response


@app.get("/journey/summary", tags=["Admin"])
async def journey_summary():
    """Usage summary for recommendation/comparison flows."""
    return await db.get_journey_summary()


@app.get("/journey/me", tags=["Auth"])
async def my_journey_summary(username: str = Depends(require_auth)):
    """Usage summary for the authenticated user's discovery journey."""
    return await db.get_user_journey_summary(username)


# ─────────────────────────────────────────────
# FAVOURITES
# ─────────────────────────────────────────────

@app.get("/favorites", tags=["Favorites"])
async def get_favorites(username: str = Depends(require_auth)):
    ids = await db.get_favourites(username)
    properties = []
    for pid in ids:
        p, _ = await _get_property_record(pid)
        if p:
            properties.append(p)
    return {"favorites": properties}


@app.post("/favorites", tags=["Favorites"])
async def add_favorite(data: FavoriteRequest, username: str = Depends(require_auth)):
    prop, _ = await _get_property_record(data.property_id)
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    favs = await db.add_favourite(username, data.property_id)
    return {"message": "Added to favorites", "favorites": favs}


@app.delete("/favorites/{property_id}", tags=["Favorites"])
async def remove_favorite(property_id: str, username: str = Depends(require_auth)):
    favs = await db.remove_favourite(username, property_id)
    return {"message": "Removed from favorites", "favorites": favs}


# ─────────────────────────────────────────────
# USABILITY EVALUATION
# ─────────────────────────────────────────────

@app.post("/usability/log", tags=["Usability"])
async def log_usability(data: UsabilityLog):
    """Log a usability evaluation session result."""
    await db.log_usability(data.dict())
    return {"message": "Usability session logged"}


@app.get("/usability/summary", tags=["Usability"])
async def usability_summary():
    """Return aggregate usability evaluation data for the admin dashboard."""
    summary = await db.get_usability_summary()
    return summary


# ─────────────────────────────────────────────
# ADMIN / DASHBOARD
# ─────────────────────────────────────────────

@app.get("/dashboard/stats", response_model=DashboardStats, tags=["Admin"])
def dashboard_stats():
    """Return model metrics and dataset statistics."""
    stats_df = pd.read_csv(DATA_DIR / "dashboard_stats.csv")
    metrics_df = pd.read_csv(METRICS_DIR / "model_metrics.csv")

    row = stats_df.iloc[0]

    def get_metric(name: str, default: float = 0.0) -> float:
        matches = metrics_df[metrics_df["metric"] == name]["value"]
        return float(matches.values[0]) if len(matches) > 0 else default

    # Gini coefficient of exposure distribution
    gini_val = 0.0
    never_pct = 0.0
    try:
        exposure_df = pd.read_csv(METRICS_DIR / "exposure_analysis.csv")
        if "exposure_count" in exposure_df.columns:
            counts = exposure_df["exposure_count"].values
        elif "count" in exposure_df.columns:
            counts = exposure_df["count"].values
        else:
            counts = exposure_df.iloc[:, -1].values
        counts = counts.astype(float)
        n = len(counts)
        if n > 0:
            sorted_c = sorted(counts)
            cumulative = sum((2 * i - n - 1) * v for i, v in enumerate(sorted_c, 1))
            gini_val = round(cumulative / (n * sum(sorted_c)), 4) if sum(sorted_c) > 0 else 0.0
            never_pct = round(sum(1 for c in counts if c == 0) / n * 100, 2)
    except Exception:
        pass

    return DashboardStats(
        total_properties=int(row["total_properties"]),
        average_rent=round(float(row["average_rent"]), 2),
        max_rent=float(row["max_rent"]),
        min_rent=float(row["min_rent"]),
        precision_at_5=get_metric("precision@5", 0.622),
        recall_at_5=get_metric("recall@5", 0.497),
        avg_diversity=float(row.get("avg_diversity", 2.31)),
        gini_exposure=gini_val,
        never_recommended_pct=never_pct,
    )


@app.get("/dashboard/figures/{filename}", tags=["Admin"])
def get_figure(filename: str):
    allowed = {
        "rent_distribution.png", "bedroom_distribution.png",
        "property_type_distribution.png", "exposure_distribution.png",
    }
    if filename not in allowed:
        raise HTTPException(status_code=404, detail="Figure not found")
    file_path = FIGURES_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Figure file missing")
    return FileResponse(str(file_path), media_type="image/png")


@app.get("/dashboard/exposure", tags=["Admin"])
def get_exposure_analysis():
    df = pd.read_csv(METRICS_DIR / "exposure_analysis.csv")
    return {"data": df.head(50).to_dict(orient="records")}


@app.get("/dashboard/dataset-summary", tags=["Admin"])
def get_dataset_summary():
    df = pd.read_csv(DATA_DIR / "dataset_summary.csv")
    return {"data": df.to_dict(orient="records")}


@app.get("/dashboard/performance", tags=["Admin"])
def get_performance_summary():
    timings = list(_request_timings)
    if not timings:
        return {
            "window_size": PERFORMANCE_WINDOW_SIZE,
            "request_count": 0,
            "avg_response_ms": 0.0,
            "min_response_ms": 0.0,
            "max_response_ms": 0.0,
            "routes": [],
        }

    durations = [entry["duration_ms"] for entry in timings]
    route_stats = {}
    for entry in timings:
        key = f'{entry["method"]} {entry["path"]}'
        route_stats.setdefault(key, []).append(entry["duration_ms"])

    routes = [
        {
            "route": route,
            "count": len(values),
            "avg_response_ms": round(sum(values) / len(values), 2),
            "max_response_ms": round(max(values), 2),
        }
        for route, values in sorted(route_stats.items())
    ]

    return {
        "window_size": PERFORMANCE_WINDOW_SIZE,
        "request_count": len(timings),
        "avg_response_ms": round(sum(durations) / len(durations), 2),
        "min_response_ms": round(min(durations), 2),
        "max_response_ms": round(max(durations), 2),
        "routes": routes,
    }


# ─────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "ok",
        "service": "AI Property Recommendation API v2.0",
        "mongodb": db._mongo_available,
        "storage_mode": db.get_storage_mode(),
    }


if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    @app.get("/", include_in_schema=False)
    async def serve_spa_root():
        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_spa(path: str):
        if path.startswith(("docs", "redoc", "openapi.json")):
            raise HTTPException(status_code=404, detail="Not found")
        file_path = FRONTEND_DIST_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST_DIR / "index.html"))
