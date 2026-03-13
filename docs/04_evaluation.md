# Evaluation Metrics Documentation

## Precision@5

**Definition:** Among the top-5 recommended properties, what fraction are genuinely relevant to the user?

```
Precision@5 = (# relevant properties in top-5) / 5
```

**Result: 0.622** (62.2% of top-5 recommendations are relevant)

**How relevance is defined:**  
A property is considered "relevant" to a query if it satisfies:
- `rent ≤ budget × 1.15` (within 15% of budget)
- `bedrooms == query_bedrooms` (exact match)
- `bathrooms == query_bathrooms` (exact match)

**Evaluation procedure:**
- Applied to the 20% test set (681 properties)
- For each test property, treated its features as a "user query"
- Retrieved the top-5 AI recommendations
- Counted how many of those 5 were in the set of criteria-matching properties

---

## Recall@5

**Definition:** Among all relevant properties in the dataset, what fraction appear in the top-5 results?

```
Recall@5 = (# relevant properties in top-5) / (total relevant properties)
```

**Result: 0.497** (49.7% of all relevant properties are surfaced in top-5)

**Interpretation:** The model captures about half of all relevant matches in the first page of results. This is expected and reasonable — with 3,406 properties, returning only 5 means a theoretical maximum recall of ~15 in the best case for very specific queries.

---

## Diversity Score

**Definition:** Measures intra-list variety — how different are the 5 recommended properties from each other?

Computed as average pairwise dissimilarity:

```
Diversity = 1 - (avg pairwise cosine similarity among top-5 results)
```

**Result: 2.31** (scaled to 0–5 range)

Higher diversity means more varied recommendations (different property types, rent ranges, locations).

---

## Exposure Fairness (Gini Index)

**Definition:** Measures how evenly properties appear across all recommendation requests.

```
Gini = (Σ (2i - n - 1) × exposure_i) / (n × Σ exposure_i)
```
Where properties are sorted by exposure frequency.

- **0** = perfectly equal exposure (every property recommended equally)
- **1** = completely unequal (one property gets all recommendations)

**Interpretation:**  
A high Gini index indicates that some properties are systematically over-recommended while others are never surfaced — a fairness concern for landlords and diversity of choice for tenants.

---

## Never-Recommended Percentage

Percentage of the dataset that never appears in any top-5 result across evaluation queries.

```
never_recommended_pct = (# properties with 0 exposure) / total_properties × 100
```

Properties that are never recommended may be structurally disadvantaged by their feature values (e.g., very high rent or very remote location).

---

## Basic Performance Evaluation

In addition to recommendation-quality metrics, the prototype includes lightweight API response-time telemetry to support the project requirement for basic performance testing.

### Measurement Approach

- Every backend request is timed using server-side middleware.
- The response time is stored in a rolling in-memory window and returned in the `X-Response-Time-Ms` response header.
- Aggregate metrics are exposed through `GET /dashboard/performance` and displayed on the Admin Dashboard.

### Reported Metrics

- Total tracked requests in the current server session
- Average response time in milliseconds
- Minimum and maximum response time in milliseconds
- Per-route average and maximum response time

### Interpretation

This is intentionally a prototype-level performance evaluation rather than full load testing. It is suitable for demonstrating whether the main API routes respond within acceptable bounds during supervised testing and dissertation evaluation. Because the telemetry window is reset when the server restarts and does not simulate concurrent high-volume traffic, results should be interpreted as indicative rather than production-grade benchmarks.

---

## Direct-to-Landlord Interaction Support

To better align the platform with the direct landlord-to-tenant objective, landlord-created listings expose a lightweight contact channel.

- Landlords can optionally store contact email and phone number when creating a listing.
- Tenants can open a contact modal on landlord-owned listing detail pages.
- Dataset-origin listings do not expose direct landlord contact, because the source dataset does not contain verified owner details.

This keeps the recommendation model unchanged while improving the platform’s alignment with the project scope.
