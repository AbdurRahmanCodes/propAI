from pydantic import BaseModel, Field
from typing import Optional, List


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = Field(default="tenant", pattern="^(tenant|landlord)$")


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "tenant"


# ─── Recommendations ─────────────────────────────────────────────────────────

class RecommendRequest(BaseModel):
    budget: float = Field(..., gt=0, description="Max monthly rent budget in £")
    bedrooms: int = Field(..., ge=1, le=10)
    bathrooms: int = Field(..., ge=1, le=10)
    max_distance: float = Field(..., gt=0, description="Max avg distance to nearest station (km)")


class RecommendationResult(BaseModel):
    id: str
    address: str
    subdistrict_code: Optional[str] = None
    rent: float
    property_type: Optional[str] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    size: Optional[float] = None
    avg_distance_to_nearest_station: Optional[float] = None
    furnish_type: Optional[str] = None
    similarity_score: float
    explanation: List[str] = []


# ─── Compare ─────────────────────────────────────────────────────────────────

class QueryResult(BaseModel):
    id: str
    address: str
    rent: float
    property_type: Optional[str] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    avg_distance_to_nearest_station: Optional[float] = None
    matched_criteria: List[str] = []


class CompareResponse(BaseModel):
    preferences: dict
    ai_results: List[RecommendationResult]
    query_results: List[QueryResult]
    summary: dict


# ─── Properties ──────────────────────────────────────────────────────────────

class PropertyOut(BaseModel):
    id: str
    address: str
    subdistrict_code: Optional[str] = None
    rent: float
    deposit: Optional[float] = None
    let_type: Optional[str] = None
    furnish_type: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[float] = None
    bathrooms: Optional[float] = None
    size: Optional[float] = None
    avg_distance_to_nearest_station: Optional[float] = None
    nearest_station_count: Optional[float] = None
    source: Optional[str] = "dataset"  # "dataset" | "landlord"


class ListingCreate(BaseModel):
    address: str
    rent: float = Field(..., gt=0)
    deposit: Optional[float] = None
    bedrooms: int = Field(..., ge=1, le=10)
    bathrooms: int = Field(..., ge=1, le=10)
    property_type: Optional[str] = None
    furnish_type: Optional[str] = None
    let_type: Optional[str] = "Long term"
    avg_distance_to_nearest_station: Optional[float] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_properties: int
    average_rent: float
    max_rent: float
    min_rent: float
    precision_at_5: float
    recall_at_5: float
    avg_diversity: float
    gini_exposure: float
    never_recommended_pct: float


# ─── Favourites ──────────────────────────────────────────────────────────────

class FavoriteRequest(BaseModel):
    property_id: str


# ─── Usability ───────────────────────────────────────────────────────────────

class UsabilityLog(BaseModel):
    session_id: str
    tasks_completed: int
    tasks_total: int = 5
    completed: bool
    sus_score: Optional[float] = None  # System Usability Scale 0-100
    time_seconds: Optional[int] = None
    feedback: Optional[str] = None
