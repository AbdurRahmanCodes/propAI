"""
database.py — MongoDB Atlas connection via Motor (async)
Falls back to in-memory mode if MONGODB_URI is not set or Atlas is unreachable.
"""

import os
import asyncio
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

try:
    from bson import ObjectId
except Exception:  # pragma: no cover
    ObjectId = None

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("DB_NAME", "propai")

_client = None
_db = None
_mongo_available = False

# ── In-memory fallback (identical API surface) ──────────────────────────────
_mem_users: dict = {}
_mem_favourites: dict = {}
_mem_listings: list = []
_mem_usability: list = []
_mem_recommendation_events: list = []
_mem_comparison_events: list = []


def _norm_doc(doc: dict) -> dict:
    """Make a MongoDB doc JSON-safe (convert ObjectId → str)."""
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def connect_db():
    """Call once at FastAPI startup."""
    global _client, _db, _mongo_available
    if not MONGODB_URI:
        print("[DB] No MONGODB_URI found — running with in-memory fallback.")
        return
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Force connection check
        await _client.admin.command("ping")
        _db = _client[DB_NAME]
        _mongo_available = True
        # Indexes
        await _db.users.create_index("username", unique=True)
        await _db.listings.create_index("created_at")
        print(f"[DB] Connected to MongoDB Atlas — database: {DB_NAME}")
    except Exception as e:
        print(f"[DB] MongoDB unavailable ({e}) — running with in-memory fallback.")
        _mongo_available = False


async def disconnect_db():
    global _client
    if _client:
        _client.close()


# ── USERS ────────────────────────────────────────────────────────────────────

async def get_user(username: str) -> Optional[dict]:
    if _mongo_available:
        doc = await _db.users.find_one({"username": username})
        return _norm_doc(doc) if doc else None
    return _mem_users.get(username)


async def create_user(user: dict) -> bool:
    """Returns False if username already exists."""
    if _mongo_available:
        try:
            await _db.users.insert_one(user)
            return True
        except Exception:
            return False
    if user["username"] in _mem_users:
        return False
    _mem_users[user["username"]] = user
    return True


async def user_exists(username: str) -> bool:
    if _mongo_available:
        return await _db.users.count_documents({"username": username}) > 0
    return username in _mem_users


# ── FAVOURITES ────────────────────────────────────────────────────────────────

async def get_favourites(username: str) -> list[str]:
    if _mongo_available:
        doc = await _db.favourites.find_one({"username": username})
        return [str(pid) for pid in (doc["property_ids"] if doc else [])]
    return _mem_favourites.get(username, [])


async def add_favourite(username: str, property_id: str) -> list[str]:
    property_id = str(property_id)
    if _mongo_available:
        await _db.favourites.update_one(
            {"username": username},
            {"$addToSet": {"property_ids": property_id}},
            upsert=True
        )
        return await get_favourites(username)
    favs = _mem_favourites.setdefault(username, [])
    if property_id not in favs:
        favs.append(property_id)
    return favs


async def remove_favourite(username: str, property_id: str) -> list[str]:
    property_id = str(property_id)
    if _mongo_available:
        await _db.favourites.update_one(
            {"username": username},
            {"$pull": {"property_ids": property_id}}
        )
        return await get_favourites(username)
    favs = _mem_favourites.get(username, [])
    if property_id in favs:
        favs.remove(property_id)
    return favs


# ── LANDLORD LISTINGS ─────────────────────────────────────────────────────────

async def create_listing(listing: dict) -> dict:
    listing["created_at"] = datetime.utcnow().isoformat()
    listing["source"] = "landlord"
    if _mongo_available:
        result = await _db.listings.insert_one(listing)
        listing["_id"] = str(result.inserted_id)
    else:
        listing["_id"] = str(len(_mem_listings))
        _mem_listings.append(listing)
    return listing


async def get_landlord_listings(skip: int = 0, limit: int = 20) -> tuple[list, int]:
    if _mongo_available:
        total = await _db.listings.count_documents({})
        cursor = _db.listings.find({}).skip(skip).limit(limit).sort("created_at", -1)
        docs = [_norm_doc(d) async for d in cursor]
        return docs, total
    paged = _mem_listings[skip: skip + limit]
    return paged, len(_mem_listings)


async def get_listing_by_id(listing_id: str) -> Optional[dict]:
    if _mongo_available:
        query = {"_id": listing_id}
        if ObjectId is not None:
            try:
                query = {"_id": ObjectId(str(listing_id))}
            except Exception:
                query = {"_id": listing_id}
        doc = await _db.listings.find_one(query)
        return _norm_doc(doc) if doc else None
    for listing in _mem_listings:
        if str(listing.get("_id")) == str(listing_id):
            return listing
    return None


def get_storage_mode() -> str:
    return "mongodb" if _mongo_available else "in-memory"


# ── USABILITY LOGS ────────────────────────────────────────────────────────────

async def log_usability(entry: dict) -> None:
    entry["timestamp"] = datetime.utcnow().isoformat()
    if _mongo_available:
        await _db.usability_logs.insert_one(entry)
    else:
        _mem_usability.append(entry)


async def get_usability_summary() -> dict:
    if _mongo_available:
        total = await _db.usability_logs.count_documents({})
        completed = await _db.usability_logs.count_documents({"completed": True})
    else:
        total = len(_mem_usability)
        completed = sum(1 for u in _mem_usability if u.get("completed"))
    return {
        "total_sessions": total,
        "completed_sessions": completed,
        "completion_rate": round(completed / total * 100, 1) if total else 0,
    }


# ── RECOMMENDATION / COMPARISON ANALYTICS ───────────────────────────────────

async def log_recommendation_event(entry: dict) -> None:
    payload = dict(entry)
    payload["timestamp"] = datetime.utcnow().isoformat()
    if _mongo_available:
        await _db.recommendation_events.insert_one(payload)
    else:
        _mem_recommendation_events.append(payload)


async def log_comparison_event(entry: dict) -> None:
    payload = dict(entry)
    payload["timestamp"] = datetime.utcnow().isoformat()
    if _mongo_available:
        await _db.comparison_events.insert_one(payload)
    else:
        _mem_comparison_events.append(payload)


async def get_journey_summary() -> dict:
    if _mongo_available:
        rec_total = await _db.recommendation_events.count_documents({})
        comp_total = await _db.comparison_events.count_documents({})
        last_recommend = await _db.recommendation_events.find_one(sort=[("timestamp", -1)])
        last_compare = await _db.comparison_events.find_one(sort=[("timestamp", -1)])
    else:
        rec_total = len(_mem_recommendation_events)
        comp_total = len(_mem_comparison_events)
        last_recommend = _mem_recommendation_events[-1] if _mem_recommendation_events else None
        last_compare = _mem_comparison_events[-1] if _mem_comparison_events else None

    return {
        "recommendation_requests": rec_total,
        "comparison_requests": comp_total,
        "last_recommendation": {
            "username": (last_recommend or {}).get("username"),
            "results_count": (last_recommend or {}).get("results_count"),
            "timestamp": (last_recommend or {}).get("timestamp"),
        } if last_recommend else None,
        "last_comparison": {
            "username": (last_compare or {}).get("username"),
            "ai_count": (last_compare or {}).get("ai_count"),
            "query_count": (last_compare or {}).get("query_count"),
            "overlap_count": (last_compare or {}).get("overlap_count"),
            "timestamp": (last_compare or {}).get("timestamp"),
        } if last_compare else None,
    }


async def get_user_journey_summary(username: str) -> dict:
    if _mongo_available:
        rec_filter = {"username": username}
        comp_filter = {"username": username}

        rec_total = await _db.recommendation_events.count_documents(rec_filter)
        comp_total = await _db.comparison_events.count_documents(comp_filter)
        last_recommend = await _db.recommendation_events.find_one(rec_filter, sort=[("timestamp", -1)])
        last_compare = await _db.comparison_events.find_one(comp_filter, sort=[("timestamp", -1)])
    else:
        rec_events = [e for e in _mem_recommendation_events if e.get("username") == username]
        comp_events = [e for e in _mem_comparison_events if e.get("username") == username]
        rec_total = len(rec_events)
        comp_total = len(comp_events)
        last_recommend = rec_events[-1] if rec_events else None
        last_compare = comp_events[-1] if comp_events else None

    return {
        "username": username,
        "recommendation_requests": rec_total,
        "comparison_requests": comp_total,
        "last_recommendation": {
            "results_count": (last_recommend or {}).get("results_count"),
            "timestamp": (last_recommend or {}).get("timestamp"),
        } if last_recommend else None,
        "last_comparison": {
            "ai_count": (last_compare or {}).get("ai_count"),
            "query_count": (last_compare or {}).get("query_count"),
            "overlap_count": (last_compare or {}).get("overlap_count"),
            "timestamp": (last_compare or {}).get("timestamp"),
        } if last_compare else None,
    }
