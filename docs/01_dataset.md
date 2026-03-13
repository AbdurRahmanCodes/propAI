# Dataset Documentation

## Source
London Rental Properties Dataset — Kaggle  
Uploaded to Google Colab V2 as `london_rentals.csv`

## Shape
- **Raw rows:** 3,478  
- **After cleaning:** 3,406 (dropped rows with missing critical data)  
- **Columns:** 13

## Column Reference

| Column | Type | Description |
|--------|------|-------------|
| `address` | string | Full UK property address |
| `subdistrict_code` | string | UK postcode district (e.g. SW1V) |
| `rent` | int | Monthly rent in GBP |
| `deposit` | int | Deposit amount in GBP (0 if not specified) |
| `let_type` | string | Long term / Short term |
| `furnish_type` | string | Furnished / Unfurnished / Part furnished |
| `coucil_tax` | string | Council tax status (Ask agent / Included) |
| `property_type` | string | 27 distinct types (Apartment, House, Flat, etc.) |
| `bedrooms` | float | Number of bedrooms (1.0–7.0) |
| `bathrooms` | float | Number of bathrooms (1.0–20.0) |
| `size` | string | Property size in sq ft (mostly "Ask agent" — converted to NaN) |
| `avg_distance_to_nearest_station` | float | Average km to nearest tube/rail station |
| `nearest_station_count` | int | Count of stations within 1km (almost always 2 or 3) |

## Missing Values (Before Cleaning)
- `subdistrict_code`: 1,610 missing (46%)
- `bedrooms`: 637 missing (18%)
- `bathrooms`: 429 missing (12%)
- `size`: ~97% "Ask agent" → treated as missing
- `let_type`: 243 missing (7%)

## Preprocessing Steps
1. Standardised column names to snake_case (lowercase, underscores)
2. Extracted numeric size from strings like "335 sq ft" → float (remaining "Ask agent" → NaN)
3. Filled `bedrooms`, `bathrooms`, `size` missing values with **column medians**
4. Filled `avg_distance_to_nearest_station` missing with **median** (0.4 km)
5. Removed rows where `rent` ≤ 0 or `rent` > 78,000 (extreme outliers)
6. Saved cleaned output to `outputs/data/cleaned_dataset.csv`

## Feature Observations
- `nearest_station_count` has very low variance (98% of records = 3) — used as a feature but has low discriminative power
- `size` is available for only ~3% of records — filled with median as a latent feature
- `rent` ranges from £50 to £78,000 with median £2,275/month
