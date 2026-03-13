# Recommendation Model Documentation

## Algorithm Choice: Content-Based Filtering

**Why content-based filtering over collaborative filtering?**

| Comparison Point | Content-Based | Collaborative |
|-----------------|---------------|---------------|
| Data Required | Property features only | User interaction history |
| Cold Start | Works immediately | Requires existing ratings |
| Explainability | High (feature-level) | Low (black-box) |
| Dataset Fit | ✅ Ideal for our dataset | ❌ No rating data available |

Our London rental dataset contains **no user interaction history** (no ratings, no clicks, no prior tenant preferences). Content-based filtering is therefore the methodologically justified choice.

## Cosine Similarity

The similarity between two property feature vectors is computed as:

```
similarity(A, B) = (A · B) / (||A|| × ||B||)
```

Where:
- `A` is the normalised user preference vector
- `B` is the normalised property feature vector
- Result is in [0, 1] where 1 = identical preference profile

Cosine similarity measures the **angle** between two vectors in 6-dimensional feature space, making it insensitive to the magnitude of the vectors — only their direction (relative feature proportions) matters.

## Pre-Computed Similarity Matrix

For property-to-property similarity (used on the Property Detail page to show "Similar Properties"), a 3,406 × 3,406 similarity matrix is pre-computed:

```python
X_scaled = scaler.transform(feature_matrix)  # shape: (3406, 6)
sim_matrix = cosine_similarity(X_scaled)      # shape: (3406, 3406)
np.save('outputs/models/similarity_matrix.npy', sim_matrix)
```

Pre-computing avoids O(n²) computation at request time. The matrix is ~93MB and loaded into memory at startup.

## 80/20 Train-Test Split

The dataset is split before model evaluation:
- **Training set (80%):** 2,725 records — used for fitting MinMaxScaler
- **Test set (20%):** 681 records — used ONLY for metric computation (Precision@5, Recall@5)

This prevents data leakage — the scaler parameters are computed only from training data.

```python
from sklearn.model_selection import train_test_split
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
scaler = MinMaxScaler()
scaler.fit(train_df[FEATURE_COLS])
```

## Recommendation Flow

```
1. User submits preferences (budget, bedrooms, bathrooms, max_distance)
   ↓
2. Build user preference vector (6D) → fill size/station_count with medians
   ↓
3. Scale user vector using fitted MinMaxScaler
   ↓
4. Compute cosine similarity between user vector and all 3,406 property vectors
   ↓
5. Sort by similarity score (descending)
   ↓
6. Return top-5 results with similarity scores (0-100%) and explanations
```
