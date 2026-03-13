# Feature Engineering Documentation

## Selected Features

Six numerical features were selected for the recommendation model:

| Feature | Rationale | Weight Influence |
|---------|-----------|-----------------|
| `rent` | Primary criterion for tenant decision-making | High (largest value range) |
| `bedrooms` | Core filtering criterion for space requirements | High |
| `bathrooms` | Secondary space requirement | Medium |
| `size` | Property size in sq ft (latent — mostly median-filled) | Low (poor data coverage) |
| `avg_distance_to_nearest_station` | Transport accessibility — strongly influences London rental value | Medium-High |
| `nearest_station_count` | Station density (near-constant in dataset — 98% = 3) | Minimal |

## Feature Selection Rationale

- **Why not include `subdistrict_code`?** Categorical postcode codes would require one-hot encoding, adding 211+ dimensions. This would cause the curse of dimensionality and dominate cosine similarity results. Location is already captured partially through `avg_distance_to_nearest_station`.
- **Why not include `furnish_type` or `property_type`?** Also categorical. Adding them as one-hot features would require a matching user preference field. For simplicity and research scope, we prioritise continuously valued features.
- **Why 6 features?** This strikes a balance between expressiveness and model parsimony, aligning with the research scope of demonstrating content-based filtering.

## Normalisation

**MinMaxScaler** was applied to all 6 features:

```
x_scaled = (x - x_min) / (x_max - x_min)
```

This maps each feature to [0, 1], ensuring that:
- High-value features like `rent` (up to £78,000) don't dominate cosine similarity
- Low-value features like `bathrooms` (1–20) contribute equally in the vector space

The fitted scaler is saved to `outputs/models/scaler.pkl` and loaded by the backend at startup.

## User Vector Construction

When a tenant submits preferences (budget, bedrooms, bathrooms, max_distance), a 6-dimensional user preference vector is constructed:

```python
user_vec = [budget, bedrooms, bathrooms,
            size_median,              # no user input → dataset median
            max_distance,
            station_count_median]     # no user input → dataset median
```

The vector is scaled using the same pre-fitted MinMaxScaler before computing cosine similarity against all property vectors.

## Design Decision: Median Defaults

`size` and `nearest_station_count` are defaulted to dataset medians because:
1. Users typically cannot estimate property size in sq ft before viewing
2. `nearest_station_count` has near-zero variance in the dataset (adds minimal discriminative power)
3. This simplifies the user form while preserving model consistency
