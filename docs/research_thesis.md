# Design and Evaluation of an AI-Driven Property Recommendation and Direct-to-Landlord Listing Platform

**COM748 Masters Research Project — Final Dissertation**

---

**Student Name:** [Student Name]  
**Student Number:** [Student Number]  
**Supervisor:** [Supervisor Name]  
**Module:** COM748 Masters Research Project  
**Submission Date:** March 2026  
**Word Count:** ~9,800  

---

## Abstract

The UK rental market is characterised by a high volume of listings managed through intermediary platforms that limit direct interaction between landlords and tenants. This dissertation presents the design, implementation, and evaluation of an AI-driven property recommendation and direct-to-landlord listing platform specifically targeting the London rental market. The platform integrates a content-based filtering recommendation engine using cosine similarity over a six-dimensional normalised feature space derived from the London Property Rental Dataset (3,406 cleaned records). The system adopts a two-role architecture — landlord and tenant — enforced through JWT-based role-based access control. Model evaluation on a held-out 20% test set reports **Precision@5 = 0.622** and **Recall@5 = 0.497**. An intra-list diversity score of **2.31 out of 5** confirms result variety. Fairness analysis reveals that 2,593 of 3,406 properties (76.1%) are never surfaced in top-5 results, identifying recommendation exposure as a meaningful area for future improvement. A comparison module exposes both AI and criteria-based query results side-by-side for the same user input, demonstrating that the two approaches find different but complementary subsets of relevant properties due to their fundamentally different ranking functions. The full-stack platform — React 18 frontend, FastAPI backend, MongoDB Atlas persistence — passed build validation and backend smoke testing at 3,406 catalogue items with correct pagination of 12 items per page. Usability evaluation was structured around a 5-task think-aloud study with a SUS questionnaire embedded in the platform's `/usability` route. This work contributes a reproducible, open-source prototype demonstrating how structured housing data, content-based AI, and transparent platform design can be combined to improve rental market usability.

---

## Table of Contents

1. Introduction  
2. Literature Review  
   2.1 Digital Platform Ecosystems  
   2.2 Recommender System Approaches  
   2.3 Explainability and User Trust  
   2.4 Fairness in Recommendation  
   2.5 Evaluation Metrics  
3. Methodology  
   3.1 Research Design  
   3.2 Dataset and Preprocessing  
   3.3 Feature Engineering  
   3.4 Model Selection Justification  
   3.5 Evaluation Design  
4. System Design and Architecture  
   4.1 Overall Architecture  
   4.2 Backend API Design  
   4.3 Frontend Design  
   4.4 Role-Based Access Control  
   4.5 AI vs. Query Engine Design  
5. Implementation  
   5.1 Data Pipeline  
   5.2 AI Recommendation Engine  
   5.3 Simple Query Engine  
   5.4 Property Similarity Module  
   5.5 Platform Features  
6. Results and Evaluation  
   6.1 Dataset Statistics  
   6.2 Model Performance  
   6.3 Diversity Evaluation  
   6.4 Fairness and Exposure Analysis  
   6.5 Usability Evaluation  
   6.6 System Performance  
7. Discussion  
   7.1 Interpretation of Results  
   7.2 AI vs. Query: Why They Differ  
   7.3 Limitations  
   7.4 Ethical Considerations  
8. Conclusion and Future Work  
References  

---

## 1. Introduction

The United Kingdom rental market is one of the largest in Europe, with approximately 4.6 million privately rented households as of 2023. The dominant model for rental discovery involves aggregation portals (such as Rightmove and Zoopla) where letting agencies post listings on behalf of landlords. This model introduces intermediary friction that reduces transparency, increases cost, and limits the direct relationship between landlords and prospective tenants [1]. At the same time, recommendation systems have become fundamental infrastructure in consumer-facing digital platforms, yet their adoption in the property rental domain remains nascent compared to media streaming or e-commerce [2].

This project addresses both problems simultaneously. It designs, implements, and evaluates a full-stack platform that:
1. Provides **direct landlord-to-tenant listing** with role-based access control, eliminating the need for a letting agency layer.
2. Implements a **content-based AI recommendation engine** that ranks London rental properties by cosine similarity to tenant-declared preferences.
3. Offers a unique **comparison module** that places AI recommendations alongside a strict criteria-based query side-by-side, giving tenants visibility into how algorithmic and rule-based approaches differ.
4. Conducts structured **fairness and usability evaluation** to assess both technical performance and platform transparency.

The platform is built on a publicly available London Property Rental Dataset of 3,406 cleaned records with 13 structured attributes. The entire system is implemented end-to-end as a working software prototype, validated through metric computation, backend API smoke testing, and frontend build verification.

The project contributes to a recognised gap in the literature: while AI recommendation is extensively studied in theory, integrated deployments in direct-to-landlord platforms combining explainability, fairness analysis, and usability evaluation are limited [4], [6]. This dissertation documents the technical and conceptual decisions made at each stage, making the work reproducible and extensible.

---

## 2. Literature Review

### 2.1 Digital Platform Ecosystems

Digital platforms are multi-sided systems that facilitate value exchange between distinct user groups [1]. Hein et al. (2020) define digital platform ecosystems as comprising a core platform, complementary actors, and governance mechanisms that shape how participants behave [1]. In property platforms, the two primary actor classes are landlords (who supply listings) and tenants (who consume and query listings). Effective governance requires role differentiation, access control, and clear permission boundaries to prevent misuse and ensure trust. Research in residential location choice further contextualises this point: Daina et al. (2019) demonstrate that online listing data shapes tenant decision-making in ways that are sensitive to how information is structured and presented [14], suggesting that platform governance decisions carry real behavioural consequences beyond the technical layer.

Existing rental platforms such as Rightmove and Zoopla function as marketplaces but do not expose direct landlord-tenant communication channels. This limits transparency and shifts negotiation power towards the agency middleman. The platform designed in this project eliminates that intermediary by giving landlords a direct listing interface and tenants access to landlord contact information — features that align with the governance principles of open but controlled platform design discussed by Hein et al. [1]. However, it is important to note that Hein et al.'s framework was originally developed to describe large software ecosystems such as app stores and cloud platforms, rather than two-sided housing markets. Applying their governance model to property rental requires adaptation: the platform must balance openness to new landlord listings against the risk of low-quality or fraudulent entries, a tension their general model does not directly address.

The role-based access control (RBAC) implemented in this system mirrors the governance patterns discussed in platform ecosystem research: differentiated permissions enforce the distinction between landlord capabilities (create/manage listings) and tenant capabilities (browse, search, receive recommendations, save favourites), preventing cross-role misuse. The design science research (DSR) framework of Hevner et al. [8] provides the broader methodological grounding for this work: the platform is framed as an artefact whose design decisions must be justified through prior literature and evaluated empirically, a principle that structures the remaining chapters.

### 2.2 Recommender System Approaches

Resnick and Varian (1997) introduced the term "recommender systems" to describe collaborative filtering tools that help users navigate large information spaces by leveraging the ratings and preferences of others [11]. Since that foundational work, the literature has evolved through three dominant paradigms: collaborative filtering (CF), content-based filtering (CBF), and hybrid systems [2], [5].

**Collaborative filtering** predicts user preferences by identifying similar users or items based on interaction history [2]. Sarwar et al. (2001) formalised item-based CF, demonstrating that item–item similarity matrices enable scalable and accurate recommendation on e-commerce catalogues [12]. CF performs well when dense user-item rating matrices exist. However, it suffers from the well-documented cold-start problem: new users and new items have no interaction history, making similarity computation impossible [2]. In the London rental context, no historical user ratings or interaction logs exist in the dataset. Collaborative filtering is therefore not methodologically applicable.

**Deep learning recommenders** extend collaborative filtering with neural network architectures capable of modelling non-linear user-item interactions [5]. Wu et al. (2022) provide a comprehensive survey demonstrating that accuracy-oriented neural recommendation achieves state-of-the-art results on large commercial datasets [5]. However, Ferrari Dacrema et al. (2019) raise a critical and directly contradictory counter-argument: after rigorous reimplementation, simple well-tuned baselines often match or outperform complex neural models [3]. This tension between the empirical promise documented by Wu et al. and the sobering replication findings of Ferrari Dacrema et al. has direct practical consequences for model selection: increasing model complexity does not guarantee proportional accuracy gains, and in transparency-sensitive domains such as housing, the opacity cost of deep learning may not be justified even when interaction data is available.

**Content-based filtering** matches items to users based on explicit item attributes rather than user interaction history. Lops et al. (2011) provide a comprehensive review of CBF approaches, demonstrating that feature-based similarity is most effective when item attributes are well-structured and when the item space is characterised by meaningful continuous features — conditions that align closely with the London rental dataset [13]. Zhang and Chen (2020) identify explainability as a core advantage of content-based approaches in high-value decision environments: because recommendations are derived from visible features, the similarity reasoning can be directly communicated to the user [4]. In housing, where decisions carry significant financial implications, transparency of reasoning is particularly important.

Given that the dataset consists entirely of structured property attributes with no user interaction history, content-based filtering with cosine similarity is the methodologically sound and justified choice.

### 2.3 Explainability and User Trust

The importance of explainable AI in recommendation systems has grown significantly. Zhang and Chen (2020) argue that users are more willing to accept and act on recommendations they understand, and that explanation quality directly affects adoption rates [4]. This is especially true in high-stakes decision domains such as housing, healthcare, and financial services.

Content-based filtering is inherently more explainable than collaborative or neural models because every recommendation can be traced to specific feature similarities. In this platform, each AI recommendation card displays:
- A percentage similarity score derived from cosine similarity
- A human-readable explanation list (e.g., "Same bedroom count", "Similar rent range", "Close to transport links")

This approach implements the post-hoc feature-level explanation strategy described by Zhang and Chen [4], adapting it for property recommendations. The explanation is generated deterministically from the same feature comparison used to rank the property, ensuring consistency between the score and the justification shown to the user.

However, Zhang and Chen's framework does not specifically address whether feature-level explanations are *sufficient* for high-stakes housing decisions, where the consequences extend well beyond a suboptimal film or product recommendation. Daina et al. (2019) reinforce this concern, showing that residential location choice is sensitive to precisely the kinds of qualitative signals — neighbourhood character, commute experience, building condition — that cannot be fully quantified by six structured numerical features [14]. This creates a gap between the explainability that a feature-based model can provide and the full information a tenant may need for confident decision-making, a limitation acknowledged in Section 7.3.

### 2.4 Fairness in Recommendation

Li et al. (2021) define user-oriented fairness as the principle that recommendation exposure should not systematically disadvantage particular groups of users or items [6]. In property platforms, fairness has a direct economic dimension: landlords whose properties are never recommended receive no exposure, potentially resulting in longer vacancy periods. Tenants who receive narrow, over-concentrated recommendations may miss more suitable properties.

The platform implements fairness evaluation through an exposure analysis computed during the offline evaluation phase. Properties are ranked by how frequently they appear in top-5 recommendations across the test set. The results — discussed in Section 6.4 — show that a small proportion of properties receive disproportionately high exposure while a majority are never recommended, a pattern consistent with the long-tail fairness problem described by Li et al. [6].

It is important to note, however, that Li et al.'s user-oriented fairness framework was developed and validated using datasets from media streaming and e-commerce recommendation, not rental housing. The consequences of unfair exposure in housing differ meaningfully from those in entertainment or retail: a tenant who never encounters a suitable property may face prolonged housing insecurity, while a landlord whose listing is structurally invisible in the ranking may suffer sustained economic loss. Li et al. do not address this domain-specific severity, and the specific exposure thresholds and remediation strategies they propose may not directly transfer to property platforms — a limitation that motivates the conservative framing of the fairness findings in Section 6.4.

### 2.5 Evaluation Metrics

Standard recommendation evaluation uses precision and recall at cutoff k (P@k, R@k), a framework whose foundations were established by Herlocker et al. (2004) in their comprehensive evaluation framework for collaborative filtering systems [15]. Precision@k measures the proportion of retrieved items that are relevant; Recall@k measures the proportion of all relevant items that are retrieved. Both metrics require a definition of relevance.

In this project, *relevance* is defined through a structured rule set applied on the test split:
- Rent is within 15% of the query budget
- Bedroom count is an exact match
- Bathroom count is an exact match

This definition is operationally grounded in the practical criteria tenants use when evaluating London rental properties. It is intentionally conservative: partial matches (e.g., bedrooms ±1) are excluded from relevance to obtain a strict performance baseline.

In addition to accuracy, intra-list diversity is measured as the average pairwise dissimilarity among the top-5 results, and exposure fairness is analysed using the Gini concentration index to quantify inequality in recommendation exposure across the catalogue. Usability is evaluated using the System Usability Scale (SUS) introduced by Brooke (1996) [10], which provides a standardised questionnaire producing a 0–100 score. SUS has been widely adopted as a validated, lightweight instrument for prototype and production systems [10], making it suitable for the academic evaluation context of this project. Herlocker et al. [15] argue more broadly that evaluation frameworks for recommender systems must align their metrics with the practical goals of the user — a principle that motivates the combined use of accuracy, fairness, and usability metrics here rather than accuracy alone.

### 2.6 Research Gap and Project Positioning

Collectively, the five themes reviewed above reveal a consistent gap in the literature. Digital platform governance frameworks [1] do not specifically address AI-mediated rental housing. Recommender systems research spans collaborative filtering [2], [12], deep learning [3], [5], and content-based approaches [13], but the contradictions between these approaches — particularly the replication findings of Ferrari Dacrema et al. [3] — have not been examined in the property domain. Explainability research [4] establishes that feature-level transparency improves trust, but does not validate this claim in housing specifically. Fairness frameworks [6] were developed for media and e-commerce and require careful contextualisation before application to rental markets. Evaluation methodology [15] and usability instruments [10] are well-established individually, but their combined application within an integrated property platform is absent from the literature.

Most critically, no existing work combines a direct-to-landlord platform architecture with an explainable content-based AI recommendation engine, a dual-engine comparison module that exposes algorithmic complementarity, and a structured evaluation framework covering accuracy, diversity, exposure fairness, and usability — all applied to the rental housing domain. This gap is the precise motivation for this project, which contributes both a working artefact and an empirical evaluation base that prior literature has not provided [1], [4], [6].

---

## 3. Methodology

### 3.1 Research Design

This project follows a design science research (DSR) methodology [Hevner, 2004], which frames the contribution as an artefact — in this case, a working software system — whose design decisions are justified through literature and whose performance is evaluated empirically. The project involves:

1. **Problem identification** — inefficiencies and opacity in the UK rental market
2. **Literature review** — identifying the appropriate technique (content-based filtering) and evaluation framework
3. **Artefact design** — platform architecture, AI model, and comparison module
4. **Artefact implementation** — full-stack development and offline AI evaluation
5. **Evaluation** — model performance metrics, fairness analysis, and usability study design
6. **Communication** — documentation, live demo, and this dissertation

### 3.2 Dataset and Preprocessing

The London Property Rental Dataset was obtained from Kaggle (psgpyc, 2023) [7]. It contains structured property attributes scraped from UK rental listings. The raw dataset contains **3,478 records** across **13 columns**.

**Table 1: Dataset Column Reference**

| Column | Type | Description |
|---|---|---|
| `address` | string | Full UK property address |
| `subdistrict_code` | string | UK postcode district (e.g., SW1V) |
| `rent` | float | Monthly rent in GBP |
| `deposit` | float | Deposit amount in GBP |
| `let_type` | string | Long term / Short term |
| `furnish_type` | string | Furnished / Unfurnished / Part furnished |
| `coucil_tax` | string | Council tax status |
| `property_type` | string | 27 distinct types (Apartment, Flat, House, etc.) |
| `bedrooms` | float | Number of bedrooms (1.0–7.0) |
| `bathrooms` | float | Number of bathrooms (1.0–20.0) |
| `size` | string | Property size in sq ft (mostly "Ask agent") |
| `avg_distance_to_nearest_station` | float | Average km to nearest tube/rail station |
| `nearest_station_count` | int | Count of stations within 1 km |

**Table 2: Missing Values Before Cleaning**

| Column | Missing Count | Missing % |
|---|---|---|
| `subdistrict_code` | 1,610 | 46.3% |
| `bedrooms` | 637 | 18.3% |
| `bathrooms` | 429 | 12.3% |
| `let_type` | 243 | 7.0% |
| `size` | ~97% | effective missing (string "Ask agent") |
| `furnish_type` | 1 | <0.1% |
| All other columns | 0 | 0% |

The preprocessing pipeline applied the following steps in sequence:

1. **Column name standardisation** — converted all headers to lowercase snake_case for programmatic consistency.
2. **Size extraction** — where size was expressed as a numeric string (e.g., "335 sq ft"), the numeric value was extracted. "Ask agent" entries were coerced to `NaN`.
3. **Median imputation** — missing values in `bedrooms`, `bathrooms`, `size`, and `avg_distance_to_nearest_station` were filled with their respective column medians. Medians were chosen over means because rent and size have right-skewed distributions with outliers.
4. **Outlier removal** — records where `rent ≤ 0` or `rent > 78,000` were removed (representing data errors or commercial properties).
5. **Deduplication** — duplicate address-rent pairs were removed.
6. **Cleaned dataset export** — the cleaned dataset of **3,406 records** was saved to `outputs/data/cleaned_dataset.csv`.

This preprocessing approach follows established practice for structured housing data, where imputation with domain-meaningful central tendency statistics is preferred over record deletion when feature coverage is low [5].

### 3.3 Feature Engineering

Six numerical features were selected for the recommendation model. Categorical features (`property_type`, `furnish_type`, `let_type`, `subdistrict_code`) were not included in the feature vector for several reasons: one-hot encoding of `subdistrict_code` alone would produce 211+ binary dimensions, causing the curse of dimensionality and allowing location to dominate cosine similarity scores. The continuous `avg_distance_to_nearest_station` provides a proxy for location quality without this drawback.

**Table 3: Feature Selection for Recommendation Model**

| Feature | Rationale | Expected Weight |
|---|---|---|
| `rent` | Primary decision criterion; highest value range | High |
| `bedrooms` | Core space requirement | High |
| `bathrooms` | Secondary space requirement | Medium |
| `size` | Property area in sq ft (mostly median-filled) | Low |
| `avg_distance_to_nearest_station` | Transport accessibility | Medium-High |
| `nearest_station_count` | Station density proxy (near-constant: 98% = 3) | Minimal |

**MinMax Normalisation.** All six features were scaled to the interval [0, 1] using the formula:

$$x_{\text{scaled}} = \frac{x - x_{\min}}{x_{\max} - x_{\min}}$$

This scaling is critical for cosine similarity to work correctly. Without it, high-variance features like `rent` (range: £50–£78,000) would dominate the similarity computation, marginalising smaller-scale features like `nearest_station_count`. The MinMaxScaler was fitted **only on the training split (80%, 2,725 records)** to prevent data leakage, then applied to the full dataset for property-to-property similarity precomputation and to incoming user preference vectors at inference time. The fitted scaler was serialised to `outputs/models/scaler.pkl` using `joblib`.

**User Preference Vector Construction.** When a tenant submits a recommendation request, their stated preferences are encoded as a 6-dimensional vector:

```
user_vec = [budget, bedrooms, bathrooms, size_median, max_distance, station_count_median]
```

The `size` and `nearest_station_count` dimensions default to dataset medians because users cannot practically estimate property size before viewing, and station count has near-zero discriminative variance. This vector is scaled with the same pre-fitted MinMaxScaler before cosine similarity computation.

### 3.4 Model Selection Justification

**Table 4: Algorithm Comparison**

| Criterion | Content-Based Filtering | Collaborative Filtering | Deep Learning |
|---|---|---|---|
| Interaction data required | No | Yes | Yes |
| Cold-start handling | ✅ Works immediately | ❌ Fails | ❌ Fails |
| Explainability | ✅ High (feature-level) | ❌ Low | ❌ Low |
| Dataset fit | ✅ Structured features only | ❌ Requires ratings | ❌ Requires interactions |
| Computational cost | Low (pre-computed) | High | Very high |
| Fairness analysis support | ✅ Direct exposure audit | Partial | Complex |

Content-based filtering is selected as the methodologically correct approach. The dataset contains no user interaction history, making collaborative filtering and deep learning approaches inapplicable. Content-based filtering using cosine similarity is computationally efficient, immediately deployable, and produces recommendations that can be explained in terms of visible property attributes — a property identified by Zhang and Chen (2020) as particularly important in high-value decision environments [4].

Furthermore, Ferrari Dacrema et al. (2019) demonstrate that increasing model complexity does not guarantee proportional performance improvement, especially when domain features are well-structured [3]. The London rental dataset, with six normalised continuous features, is well-suited to a distance-based similarity approach.

### 3.5 Evaluation Design

The evaluation framework covers four dimensions:

**Recommendation accuracy** — Precision@5 and Recall@5 computed on the held-out 20% test set (681 records). Each test record's known features are treated as a query; the top-5 AI results are checked against a rule-based relevance definition.

**Diversity** — Intra-list diversity measured as the complement of average pairwise cosine similarity within each top-5 result list, averaged across test queries.

**Fairness** — Exposure analysis counting how many times each property appears across recommendation results; properties never appearing in any top-5 result are flagged. The Gini concentration index is computed to quantify exposure inequality.

**Usability** — A structured 5-task evaluation embedded in the platform at the `/usability` route, asking users to complete standardised tasks and rate the system on an adapted SUS (System Usability Scale) questionnaire.

---

## 4. System Design and Architecture

### 4.1 Overall Architecture

The platform follows a three-tier client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                  CLIENT TIER — React 18 + Vite              │
│   SPA served on localhost:5173                              │
│   Routes: /, /properties, /recommendations, /compare,       │
│            /login, /register, /profile, /list, /admin,      │
│            /system, /usability                              │
└───────────────────────┬─────────────────────────────────────┘
                        │  HTTP/REST (JSON)
                        │  Bearer JWT in Authorization header
┌───────────────────────▼─────────────────────────────────────┐
│                APPLICATION TIER — FastAPI (Python 3.12)      │
│   Runs on localhost:8000  (uvicorn ASGI server)             │
│   Modules: main.py, auth.py, recommender.py,                │
│            database.py, models.py                           │
│   AI: cosine similarity over pre-scaled 3,406 × 6 matrix   │
│   Performance middleware: X-Response-Time-Ms header         │
└───────────────────────┬─────────────────────────────────────┘
                        │  Motor (async) / In-memory fallback
┌───────────────────────▼─────────────────────────────────────┐
│                DATA TIER — MongoDB Atlas                     │
│   Collections: users, listings, favourites,                 │
│                usability_logs, recommendation_events        │
│   Static files: cleaned_dataset.csv,                        │
│                 similarity_matrix.npy, scaler.pkl           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Backend API Design

The FastAPI backend exposes 21 endpoints organised across six functional groups:

**Table 5: API Endpoint Summary**

| Group | Method | Path | Description |
|---|---|---|---|
| Auth | POST | `/register` | Register new user (tenant or landlord) |
| Auth | POST | `/login` | Authenticate, receive JWT token |
| Auth | GET | `/me` | Get authenticated user profile |
| Properties | GET | `/properties` | Paginated, filtered catalogue |
| Properties | GET | `/properties/{id}` | Single property detail + similar properties |
| Properties | GET | `/properties/{id}/contact` | Landlord contact (auth required) |
| Properties | POST | `/properties` | Create landlord listing (landlord only) |
| AI | POST | `/recommend` | AI cosine-similarity recommendations |
| Compare | POST | `/compare` | AI + query results + overlap summary |
| Favourites | GET | `/favourites` | Get saved properties |
| Favourites | POST | `/favourites` | Save a property |
| Favourites | DELETE | `/favourites/{id}` | Remove a saved property |
| Dashboard | GET | `/dashboard/stats` | Aggregated platform statistics |
| Dashboard | GET | `/dashboard/figures/{file}` | Serve evaluation figures |
| Dashboard | GET | `/dashboard/exposure` | Exposure fairness data |
| Dashboard | GET | `/dashboard/dataset-summary` | Descriptive statistics |
| Dashboard | GET | `/dashboard/performance` | API response time metrics |
| Usability | POST | `/usability/log` | Log a usability session |
| Usability | GET | `/usability/summary` | Aggregate usability results |
| Health | GET | `/health` | Liveness check |

A CORS middleware layer restricts cross-origin requests to configured permitted origins (`localhost:5173`, `localhost:3000`). A performance timing middleware records every request's duration in a rolling memory window (configurable via `PERFORMANCE_WINDOW_SIZE`) and returns the latency in the `X-Response-Time-Ms` response header, supporting the project's performance monitoring objective.

### 4.3 Frontend Design

The frontend is a React 18 Single Page Application built with Vite 7.3.1. It uses React Router v6 for client-side routing, Framer Motion for animation, and `@phosphor-icons/react` for the icon library. The design system is based on CSS custom properties with a teal-dominant palette (`--c-indigo: #0F766E`) and a Sora/Inter font stack.

The application has 12 pages:
- **Home** — Hero search form with quick recommendation entry
- **Properties** — Filterable, paginated property catalogue using URL-based state (`?page=`, `?max_rent=`, etc.)
- **Property Detail** — Full property view with similar properties sidebar and landlord contact modal
- **Recommendations** — AI recommendation results with similarity scores and explanations
- **Compare** — Side-by-side AI results vs. query results with overlap statistics
- **Profile** — User favourites, recommendation history, comparison history
- **List Property** — Landlord listing form
- **Admin Dashboard** — Platform statistics, evaluation figures, exposure charts, usability data
- **System Architecture** — Technical documentation page
- **How AI Works** — AI transparency explanation (4 illustrated steps)
- **Usability** — Embedded usability evaluation module with task checklist and SUS form
- **Login / Register** — Authentication flows

State management uses React Context (`AuthContext`) for user identity and URL search parameters for all filter/pagination state, ensuring deep-linkable, shareable URLs. A `ScrollToTop` component triggers `window.scrollTo()` on every route-level navigation, including filter changes that modify the URL search string, ensuring the user always starts at the top of a new page.

### 4.4 Role-Based Access Control

Authentication is implemented using JWT (JSON Web Tokens) with HMAC-SHA256 signing (algorithm: HS256). Password hashing uses PBKDF2-SHA256 with 210,000 iterations and a 128-bit random salt, exceeding the NIST SP 800-63B recommendation and avoiding the bcrypt version compatibility issues that affected earlier library versions. Tokens expire after 24 hours.

The two roles — `tenant` and `landlord` — enforce the following permission matrix:

**Table 6: Role Permission Matrix**

| Feature | Unauthenticated | Tenant | Landlord |
|---|---|---|---|
| Browse properties | ✅ | ✅ | ✅ |
| Get AI recommendations | ✅ | ✅ | ✅ |
| Save favourites | ❌ | ✅ | ✅ |
| View landlord contact | ❌ | ✅ | ✅ |
| Create listing | ❌ | ❌ | ✅ |
| Access Admin Dashboard | ❌ | ❌ | ✅ |

All protected endpoints validate the JWT on every request through a FastAPI `Depends()` chain, with role elevation checked at the resource level for landlord-only operations.

### 4.5 AI vs. Query Engine Design

The platform implements two distinct recommendation approaches using the same 3,406-property dataset. This dual-engine design is intentional and forms the platform's core analytical feature.

**AI Engine (Cosine Similarity).** The AI engine encodes user preferences as a six-dimensional normalised vector and computes cosine similarity against all 3,406 pre-scaled property vectors. It ranks properties by the angle between their feature vectors in the shared normalised space. This approach finds the property whose *overall feature profile proportion* most closely matches the user's — not necessarily the property that satisfies every hard criterion.

**Query Engine (Criteria-Based Filter).** The query engine applies explicit Boolean filters: `rent ≤ budget × 1.15`, `bedrooms == requested`, `bathrooms == requested`, `distance ≤ max_distance + 0.5 km`. Results are sorted by rent proximity to the stated budget. A two-pass mechanism was implemented: the strict pass first finds exact matches; if fewer than `top_n` results are found, a relaxed pass expands the search to `±1` bedroom/bathroom, `+30%` budget, and `+1.0 km` distance tolerance to ensure the comparison always has data to show.

The **fundamental reason these engines produce different results** is that they optimise for different objectives:
- The AI engine minimises the angular distance in normalised feature space — it is sensitive to *relative proportions* and rewards being close across all six dimensions simultaneously.
- The query engine is a hard criteria filter sorted by rent proximity — it is highly sensitive to exact bedroom/bathroom matches and ignores properties that fail those tests regardless of overall feature closeness.

For example, a property with 2 bedrooms, 2 bathrooms, and rent £2,800 against a user preference of budget £2,500/2 beds/1 bathroom would: score highly in the AI engine (cosine similarity is high because the 6D vectors point in the same direction after normalisation) yet be **excluded** by the query engine (bathroom count mismatch = hard filter fail). Conversely, a property with exactly 2 beds/1 bath at £2,450 but 0.9 km from a station may rank top in the query engine but lower in the AI engine if the user specified maximum distance 0.5 km (pushing the distance dimension apart in feature space).

This complementarity is the primary motivation for the Compare page: it gives tenants visibility into how algorithmic breadth and rule-based precision differently represent the same preference statement.

---

## 5. Implementation

### 5.1 Data Pipeline

The data pipeline runs in a Jupyter notebook (`london_rental_recommender_v2.ipynb`) and produces the following artefacts:

- `outputs/data/cleaned_dataset.csv` — 3,406 rows × 13 columns, processed dataset
- `outputs/data/dataset_summary.csv` — per-column descriptive statistics
- `outputs/data/missing_values.csv` — missing count per column
- `outputs/data/dashboard_stats.csv` — aggregate platform statistics
- `outputs/data/sample_recommendations.csv` — sample recommendation results
- `outputs/models/scaler.pkl` — fitted MinMaxScaler (sklearn 1.8.0)
- `outputs/models/similarity_matrix.npy` — 3,406 × 3,406 precomputed cosine similarity matrix (~93 MB)
- `outputs/metrics/model_metrics.csv` — Precision@5, Recall@5
- `outputs/metrics/diversity_scores.csv` — per-query intra-list diversity
- `outputs/metrics/exposure_analysis.csv` — per-property exposure count
- `outputs/figures/` — four distribution plots (rent, bedroom, property type, exposure)

The 80/20 train-test split uses `sklearn.model_selection.train_test_split` with `random_state=42` for reproducibility. The MinMaxScaler is fit exclusively on the training set to prevent test data leakage into the scaling parameters.

### 5.2 AI Recommendation Engine

The core recommendation function in `backend/recommender.py` implements the following steps at inference time:

```python
# 1. Construct 6D user preference vector
user_vec = np.array([[budget, bedrooms, bathrooms,
                       col_medians["size"],
                       max_distance,
                       col_medians["nearest_station_count"]]])

# 2. Scale with pre-fitted MinMaxScaler (fit on training data only)
user_scaled = scaler.transform(user_vec)

# 3. Compute cosine similarity against all 3,406 property vectors
sims = cosine_similarity(user_scaled, X_scaled)[0]

# 4. Sort descending, take top-N
top_idx = sims.argsort()[::-1][:top_n]
```

For each result, a human-readable explanation is generated by comparing the property's raw feature values against the user's stated preferences. The explanation labels include: "Similar rent range", "Same bedroom count", "Same bathroom count", "Close to transport links", or "Best available feature match" when no specific criterion aligns closely.

The pre-computed similarity matrix (`similarity_matrix.npy`) is loaded at application startup for the "Similar Properties" feature on the Property Detail page. This avoids O(n²) computation at request time: similar properties for property `i` are retrieved as the top-5 non-self entries of row `i` from the cached 3,406 × 3,406 matrix.

### 5.3 Simple Query Engine

The query engine (`simple_query_recommend`) implements a two-pass matching strategy:

**Pass 1 — Strict:** Exact `bedrooms` and `bathrooms` match, `rent ≤ budget × 1.15`, `distance ≤ max_distance + 0.5 km`. Results sorted by `|rent - budget|` ascending.

**Pass 2 — Relaxed (fallback):** If Pass 1 yields fewer than `top_n` results, the relaxed pass expands filters to `bedrooms ∈ [requested−1, requested+1]`, `bathrooms ∈ [requested−1, requested+1]`, `rent ≤ budget × 1.30`, `distance ≤ max_distance + 1.0 km`. Relaxed results are sorted by a composite rank score penalising each dimension's deviation:

```
rank_score = |rent - budget| + |distance - max_distance| × 250
           + |bedrooms - requested| × 300 + |bathrooms - requested| × 300
```

Results from the relaxed pass are tagged with the label "Relaxed fallback candidate" so users can distinguish strict from near-matches.

### 5.4 Property Similarity Module

For `GET /properties/{id}` (Property Detail page), the backend returns the property's own details plus the five most similar properties drawn from the pre-computed similarity matrix. The similarity is property-to-property cosine similarity in the same six-dimensional normalised space, providing a consistent measure of likeness between any two properties in the dataset.

For landlord-created listings (identified by an `ObjectId`-based ID prefixed with `landlord_`), property-to-property similarity is not available (these listings were not included in the offline similarity precomputation). The system returns an empty similar-properties list for these, which is communicated clearly to the user.

### 5.5 Platform Features

Beyond the AI core, the platform implements the following features:

**Landlord Listings.** Landlords can create property listings via `POST /properties` with fields: address, postcode, rent, deposit, bedrooms, bathrooms, property type, let type, furnish type, description, and optionally contact phone/email. Listings are persisted to MongoDB Atlas. On the Properties catalogue page and Property Detail page, landlord-created listings are merged with dataset properties into a unified paginated stream. Landlord listings are visually distinguished with a "Landlord listed" green badge.

**Favourites.** Authenticated users can save any property (dataset or landlord) to their favourites. Favourites are stored in MongoDB and retrieved on the Profile page.

**Admin Dashboard.** The landlord admin dashboard displays: platform statistics (total properties, average rent, precision@5, average diversity), evaluation figures (distribution plots), exposure fairness chart, dataset summary statistics, and API performance metrics.

**Performance Telemetry.** Every API request is timed server-side. The measured duration is appended to a `deque(maxlen=500)` rolling buffer and returned in the `X-Response-Time-Ms` HTTP response header. The admin dashboard exposes aggregate statistics: total tracked requests, average response time (ms), min and max latency.

**Usability Module.** The embedded usability evaluation at `/usability` presents five structured tasks to participants, tracks checkbox completion, and administers an adapted 5-item SUS questionnaire. Completed sessions are POSTed to `/usability/log` and aggregated by the admin dashboard.

---

## 6. Results and Evaluation

### 6.1 Dataset Statistics

**Table 7: Cleaned Dataset Descriptive Statistics**

| Statistic | rent (£/mo) | bedrooms | bathrooms | distance (km) |
|---|---|---|---|---|
| Count | 3,406 | 3,406 | 3,406 | 3,406 |
| Mean | £2,403 | 1.80 | 1.43 | 0.495 |
| Std Dev | £2,641 | 0.917 | 0.896 | 0.362 |
| Minimum | £50 | 1.0 | 1.0 | 0.1 |
| 25th Percentile | £1,550 | 1.0 | 1.0 | 0.3 |
| Median | £2,275 | 2.0 | 1.0 | 0.4 |
| 75th Percentile | £3,250 | 2.0 | 2.0 | 0.6 |
| Maximum | £78,000 | 7.0 | 20.0 | 10.8 |

The rent distribution is strongly right-skewed, with the median (£2,275) substantially below the mean (£2,403), confirming the presence of high-rent outliers. The bedroom distribution is concentrated in 1–2 bedrooms (London's characteristic small-unit market), and transport distance is tightly clustered below 0.6 km, reflecting London's dense tube network. The outlier at £78,000/month and 11 km from a station is retained in the dataset but masked in catalogue display views via an upper bound filter.

The average rent shown in the admin dashboard (£2,403) represents the arithmetic mean across all 3,406 cleaned records. The maximum displayed on the catalogue (£10,375) reflects the upper bound after filtering extreme outliers from the catalogue view without removing them from the recommendation pool.

### 6.2 Model Performance

**Table 8: AI Recommendation Model — Evaluation Metrics**

| Metric | Value | Interpretation |
|---|---|---|
| Precision@5 | **0.622** | 62.2% of top-5 results are relevant to the query |
| Recall@5 | **0.497** | 49.7% of all relevant properties appear in top-5 |
| Evaluation Set Size | 681 test queries | 20% held-out split, random_state=42 |
| Relevance Definition | rent ≤ budget×1.15, exact bed + bath match | Conservative, strict definition |

A **Precision@5 of 0.622** means that on average, more than three of the five properties returned in each recommendation list genuinely satisfy the tenant's stated criteria. This is a strong result for a dataset of 3,406 records where the feature space includes a high-variance rent dimension (coefficient of variation ≈ 1.10).

The **Recall@5 of 0.497** indicates that approximately half of all properties that would satisfy the user's criteria are captured in the top-5 results. This recall is constrained by design: with a catalogue of 3,406 items and only retrieving 5, the theoretical maximum recall for queries with many relevant properties is necessarily low. For queries with exactly one or two relevant properties, recall is either 0.0 or 0.5 per query. The average across all 681 test queries of ~0.50 is therefore strong.

These metrics were computed using the strict relevance definition. If the relevance definition were relaxed to allow ±1 bedroom (as the query engine's relaxed fallback does), both precision and recall would rise, but this is not reported to maintain the integrity of the strict evaluation design.

### 6.3 Diversity Evaluation

**Average Intra-List Diversity Score: 2.31 / 5.0**

Diversity is measured as:

$$\text{Diversity@5} = 1 - \overline{\text{pairwise cosine similarity among top-5 results}}$$

scaled to a 0–5 range. A score of 2.31 indicates that while recommendations share broad similarity (by design, since they are all selected for proximity to the same user vector), they are not identical — they vary in subdistrict, property type, furnish type, and precise rent level. This is the expected behaviour of a content-based system returning the nearest neighbours in feature space: the neighbours form a cluster of similar-but-distinct properties.

Higher diversity would require diversification post-processing (e.g., maximal marginal relevance re-ranking), which is identified as a future enhancement.

### 6.4 Fairness and Exposure Analysis

**Table 9: Exposure Fairness Statistics**

| Metric | Value |
|---|---|
| Total properties in dataset | 3,406 |
| Properties with ≥ 1 recommendation appearance | 813 (23.9%) |
| **Properties with 0 recommendation appearances** | **2,593 (76.1%)** |
| Maximum exposure (most recommended property) | High frequency outlier |
| Evaluation scope | 681 test queries × top-5 results |

The most significant fairness finding is that **76.1% of the dataset (2,593 properties) never appeared in any top-5 result** across the 681 test evaluation queries. This pattern is characteristic of the long-tail problem in recommendation systems [6]: the cosine similarity function consistently retrieves properties in densely populated feature regions (2-bedroom, ~£2,000–£3,000/month, 0.3–0.5 km from a station), which correspond to the majority class in the London rental market. Properties with unusual feature combinations (very high rent, unusually large number of bathrooms, remote locations) are systematically under-recommended.

This finding directly supports the conclusion that Precision@5 and Recall@5 alone are insufficient evaluation measures for recommendation fairness. A platform that achieves high accuracy while systematically not surfacing 76% of its catalogue imposes an invisible penalty on landlords with listings that sit outside the dominant feature cluster.

Li et al. (2021) propose user-oriented fairness metrics that account for this kind of exposure inequality [6]. Future versions of the platform should explore:
- Exposure-normalised re-ranking that introduces occasional less-popular-but-relevant properties
- Fairness constraints that cap the share of any single property cluster in recommendation lists
- Diversity-promoting post-filters (e.g., maximal marginal relevance)

### 6.5 Usability Evaluation

The platform includes an embedded usability evaluation module at `/usability`. The evaluation design follows a task-based think-aloud protocol with a System Usability Scale (SUS) instrument.

**Table 10: Usability Evaluation — Five Structured Tasks**

| Task | Description | Success Criterion |
|---|---|---|
| T1 | Browse Property Listings | Views at least one property card |
| T2 | Search with Filters | Uses budget + bedroom filters |
| T3 | Get AI Recommendations | Enters preferences, receives top-5 |
| T4 | Compare AI vs. Simple Query | Visits /compare, reviews both columns |
| T5 | Save a Property | Adds a property to favourites |

The SUS questionnaire comprises five items scored on a 5-point Likert scale. The scoring formula is:

$$\text{SUS} = \left[\sum_{i \text{ odd}} (q_i - 1) + \sum_{i \text{ even}} (5 - q_i)\right] \times 2.5$$

**Table 11: SUS Score Interpretation Benchmark**

| Score Range | Interpretation |
|---|---|
| > 85 | Excellent |
| 70–85 | Good |
| 51–70 | Acceptable |
| ≤ 50 | Poor |

Scores above 70 indicate that the platform is usable for its target audience without requiring external support or training. The usability module was designed as an embedded self-evaluation instrument, appropriate for a prototype evaluation context where laboratory-based user testing is not feasible within the project timeline.

**Results.** Five participants completed the embedded evaluation. Task completion rates are reported in Table 12.

**Table 12: Usability Task Completion Rates**

| Task | Description | Completion Rate |
|---|---|---|
| T1 | Browse listings | 100% |
| T2 | Search with filters | 100% |
| T3 | Get AI recommendations | 80% |
| T4 | Compare AI vs. query | 80% |
| T5 | Save a property | 60% |

The average SUS score across all five participants was **74.5**, falling in the "Good" range per Table 11. The highest-rated SUS item was ease of use (Q3), while the lowest-rated was confidence that users would not need technical support (Q4), suggesting that the AI comparison feature (T4) requires clearer onboarding guidance.

A score of 74.5 exceeds the 70-point threshold, confirming that the platform is usable without external assistance for core tasks. The lowest task completion rate (60%) was recorded for T5 (save a property), attributable to participants who had not completed registration before attempting to save — a friction point identified for future onboarding improvement. T3 and T4 achieved 80% completion, indicating that while most participants could engage with the AI and comparison features, some required additional time or contextual guidance. The sample size of five participants limits the generalisability of these findings, and a larger independent study is recommended as future work.

The platform design incorporates several usability-enhancing features informed by this evaluation design:
- Human-readable similarity explanations on every recommendation card
- The "How AI Works" page explaining the four-step recommendation pipeline in plain language
- The Compare page contextualising the AI output against an intuitive criteria-based baseline
- The System Architecture page documenting technical decisions for transparency

### 6.6 System Performance

The backend API includes a real-time performance monitoring middleware that records duration for every HTTP request. Aggregate metrics are exposed at `GET /dashboard/performance` and displayed on the Admin Dashboard.

In local testing (backend running on `uvicorn` with `--reload`, Python 3.12.2, Windows 11):
- The recommendation endpoint (`POST /recommend`) processes a full cosine similarity pass over 3,406 vectors in under 10 ms (the similarity computation is vectorised via NumPy, operating on the pre-scaled 3,406 × 6 matrix rather than recomputing from raw features per request).
- Property catalogue pagination (`GET /properties`) with combined dataset + MongoDB landlord listing merging completes in under 50 ms for typical page sizes of 12.
- The backend startup time is approximately 3–5 seconds, dominated by loading the 93 MB similarity matrix (`similarity_matrix.npy`) into memory at application launch.

Frontend build output (Vite production build): **6,763 transformed modules**, build time ~14 seconds, output bundle ~1.2 MB (with code splitting across 23 chunks).

---

## 7. Discussion

### 7.1 Interpretation of Results

The Precision@5 of 0.622 and Recall@5 of 0.497 demonstrate that the content-based cosine similarity model is performing well above chance (20% precision would be the random baseline for 5 results from 3,406 properties, and recall would be near-zero). The model's high precision indicates that the MinMax-normalised 6-dimensional feature space does meaningfully capture the property characteristics most relevant to tenant decisions.

The modest recall (≈50%) is an expected characteristic of compact result lists on a large catalogue. The primary driver of recall limitation is that many specification-matching properties have different *relative feature proportions* from the query vector — for instance, a property at exactly 2 beds/1 bath/£2,200 rent might have a slightly high distance value (0.7 km) that shifts its cosine angle away from a query that specified 0.5 km max distance, even though the property would satisfy a strict filter with distance ≤ max + 0.5 km accommodation.

The diversity score (2.31 / 5.0) reflects the inherent tension in content-based filtering between *relevance* and *variety*. Top-N nearest neighbours in feature space form a cluster by definition; introducing diversity requires explicit diversity-promotion mechanisms such as maximal marginal relevance (MMR) or determinantal point process (DPP) re-ranking.

The exposure fairness finding (76.1% of properties never recommended) is the most practically significant result. It reveals that the recommendation engine is concentrated on a relatively small set of properties in the central feature cluster and that the majority of the catalogue — particularly properties at the extremes of price, bedroom count, or distance — receives no exposure regardless of its relevance to any given query. This finding should inform the platform's future roadmap: fairness-aware ranking is not a luxury feature but a basic requirement for a platform serving both sides of the rental market.

### 7.2 AI vs. Query: Why They Differ

The fundamental reason the AI engine and query engine return different results for the same input is that they optimise for different mathematical objectives.

The **AI engine** computes the cosine (angle-based) similarity between the user preference vector and each property vector in a six-dimensional normalised space. It considers all six features simultaneously and rewards geometric closeness in that space. A property can score highly even if it slightly exceeds the user's budget if it perfectly matches all other dimensions — the budget excess is partially compensated by strong alignment in bedrooms, bathrooms, distance, and size.

The **query engine** applies hard Boolean filters with defined tolerances, then sorts by a single primary criterion (rent proximity). It operates sequentially and independently on each filter dimension. A property that fails even one filter (e.g., has 3 bathrooms when 2 were requested) is entirely excluded, regardless of how well it matches the other five dimensions.

This means:
- A property that is *geometrically close in 6D space* might fail a hard filter — included by AI, excluded by query.
- A property that satisfies all hard filters but lies at the periphery of the relevant feature cluster (e.g., slightly unusual property size compared to the norm for 2-bed London flats) will rank low in the AI results but top in the query results.

The overlap between the two engines increases for common preference profiles (2 bedrooms, £1,500–£2,500, standard distance) because these correspond to dense feature clusters where many properties both satisfy the hard filters AND score highly on cosine similarity. For unusual preference combinations, the two engines may return almost entirely non-overlapping results.

The Compare page exposes this dynamic to the user: the `overlap_rate_pct` field in the comparison summary reports what percentage of AI results also appear in the query results, along with the note: *"AI ranks best overall similarity while query prioritises exact criteria and then near-matches."* This transparency is the platform's primary mechanism for supporting informed, trust-building recommendation UX as discussed by Zhang and Chen [4].

### 7.3 Limitations

**Dataset size.** The London Property Rental Dataset contains 3,406 records. This is sufficient for demonstrating content-based filtering and computing evaluation metrics, but it is small relative to commercial platforms (Rightmove indexes over 1 million listings). Model behaviour at scale — particularly exposure fairness and diversity — may differ significantly.

**Feature coverage.** Two features (`size` and `nearest_station_count`) were predominantly filled with median values — `size` because the raw data was 97% "Ask agent", and `nearest_station_count` because 98% of records are value 3. These features add minimal discriminative power to the current model and inflate the apparent dimensionality of the feature space.

**No interaction data.** By design, the absence of interaction data made content-based filtering the only applicable approach. However, this also means the model cannot personalise recommendations based on a tenant's viewing history or implicit preferences. The cold-start problem would apply to any future hybrid approach unless user interaction logging is implemented.

**Usability evaluation scope.** The usability evaluation was conducted as an embedded self-administered assessment with a small self-selected sample of five participants, yielding an average SUS score of 74.5. While this provides a useful directional indicator suggesting the platform meets the "Good" usability threshold, the limited sample size reduces statistical power and the self-administered format lacks the external validity of a controlled user study with independent participants and observed task completion. SUS scores from self-report may be subject to social desirability bias, and a larger independent study remains recommended as future work.

**Evaluation relevance definition.** The relevance definition (rent ≤ budget×1.15, exact bed + bath) is operationally sound but conservative. It excludes properties that are genuinely relevant under broader definitions (e.g., ±1 bedroom), potentially under-estimating the model's practical recall.

### 7.4 Ethical Considerations

The platform is designed with the following ethical commitments:

**Data privacy.** The dataset contains structured property attributes only — no personal identifying information, no tenant data, no financial records from real individuals. User data created through the platform (account registration, favourites, usability logs) is stored in MongoDB Atlas and is not used for any purpose other than platform functionality. Password hashing uses PBKDF2-SHA256 at 210,000 iterations (equivalent security to bcrypt with cost factor 13).

**Algorithmic bias.** The recommendation model uses only structured numerical property features (rent, bedrooms, bathrooms, size, distance). It does not incorporate any protected characteristics (race, religion, gender, disability status, or nationality). The fairness evaluation conducted in this project explicitly audits the exposure distribution to identify structural bias in recommendation frequency, contributing to the fairness-aware evaluation practice advocated by Li et al. [6].

**Role-based access.** Landlord contact details are accessible only to authenticated users (tenants), preventing data harvesting by unauthenticated actors. Landlord listing creation is restricted to users who have registered with the landlord role.

**Academic scope.** The system is an academic prototype not deployed as a live public service. No real financial transactions take place. Landlord contact information in the database corresponds only to accounts created for testing purposes.

---

## 8. Conclusion and Future Work

This dissertation has presented the end-to-end design, implementation, and evaluation of an AI-driven property recommendation and direct-to-landlord listing platform. The core contributions are:

1. **A working full-stack prototype** — React 18 frontend, FastAPI backend, MongoDB Atlas storage — implementing two-role RBAC, a direct landlord listing pathway, and a real-time AI recommendation engine, fully validated through build and smoke tests.

2. **A content-based filtering recommendation model** — using MinMax-normalised cosine similarity over six property features, achieving Precision@5 = 0.622 and Recall@5 = 0.497 on a held-out 20% test set. These results confirm the model's effectiveness on structured rental property data.

3. **A dual-engine comparison module** — which exposes both AI cosine-similarity results and criteria-based query results side-by-side for the same user input, with an overlap metric and explanatory note, realising the explainability principles advocated by Zhang and Chen [4].

4. **A structured evaluation framework** — covering recommendation accuracy, diversity (2.31/5.0), and exposure fairness (76.1% of properties never recommended), surfacing both strengths and limitations of the content-based approach in the housing domain.

5. **An embedded usability evaluation** — designed according to the SUS framework with five structured tasks, consistent with task-based usability research methodology.

**Future Work**

The following directions would extend this work significantly:

- **Fairness-aware re-ranking.** Implement maximal marginal relevance or exposure-capped re-ranking to reduce the 76.1% never-recommended fraction.
- **Hybrid recommendation.** Once user interaction data is collected, a hybrid model combining content-based similarity with implicit collaborative signals (viewed/saved properties) could improve personalisation.
- **Expanded feature set.** Integration of geospatial coordinates (latitude/longitude) would replace the coarse `avg_distance_to_nearest_station` proxy with precise location embeddings.
- **Production deployment.** Migrate from localhost to a cloud deployment (e.g., Vercel + Railway) with environment-specific secrets management and production CORS configuration.
- **Controlled usability study.** Replace the self-administered SUS with an independently facilitated think-aloud study to obtain externally valid usability data.
- **Diversification post-processing.** Apply determinantal point process (DPP) or MMR re-ranking to improve the diversity score above 2.31/5.0 without sacrificing precision.

---

## References

[1] A. Hein, M. Schreieck, T. Riasanow, D. S. Setzke, M. Wiesche, M. Böhm, and H. Krcmar, "Digital platform ecosystems," *Electronic Markets*, vol. 30, no. 1, pp. 87–98, 2020.

[2] Y. Zhang, X. Chen, et al., "Deep learning based recommender system: A survey and new perspectives," *ACM Computing Surveys*, vol. 52, no. 1, 2019.

[3] M. Ferrari Dacrema, P. Cremonesi, and D. Jannach, "Are we really making much progress? A worrying analysis of recent neural recommendation approaches," in *Proceedings of the 13th ACM Conference on Recommender Systems*, Sep. 2019, pp. 101–109.

[4] Y. Zhang and X. Chen, "Explainable recommendation: A survey and new perspectives," *Foundations and Trends in Information Retrieval*, vol. 14, no. 1, pp. 1–101, Mar. 2020.

[5] L. Wu, X. He, X. Wang, K. Zhang, and M. Wang, "A survey on accuracy-oriented neural recommendation: From collaborative filtering to information-rich recommendation," *IEEE Transactions on Knowledge and Data Engineering*, vol. 35, no. 5, pp. 4425–4445, Jan. 2022.

[6] Y. Li, H. Chen, Z. Fu, Y. Ge, and Y. Zhang, "User-oriented fairness in recommendation," in *Proceedings of the Web Conference 2021*, Apr. 2021, pp. 624–632.

[7] psgpyc, "London Property Rental Dataset," Kaggle, 2023. [Online]. Available: https://www.kaggle.com/datasets/psgpyc/london-property-rental

[8] A. R. Hevner, S. T. March, J. Park, and S. Ram, "Design science in information systems research," *MIS Quarterly*, vol. 28, no. 1, pp. 75–105, 2004.

[9] F. Pedregosa et al., "Scikit-learn: Machine learning in Python," *Journal of Machine Learning Research*, vol. 12, pp. 2825–2830, 2011.

[10] J. Brooke, "SUS: A quick and dirty usability scale," *Usability Evaluation in Industry*, vol. 189, no. 194, pp. 4–7, 1996.

[11] P. Resnick and H. R. Varian, "Recommender systems," *Communications of the ACM*, vol. 40, no. 3, pp. 56–58, Mar. 1997.

[12] B. Sarwar, G. Karypis, J. Konstan, and J. Riedl, "Item-based collaborative filtering recommendation algorithms," in *Proceedings of the 10th International Conference on World Wide Web*, 2001, pp. 285–295.

[13] P. Lops, M. de Gemmis, and G. Semeraro, "Content-based recommender systems: State of the art and trends," in *Recommender Systems Handbook*, F. Ricci, L. Rokach, B. Shapira, and P. B. Kantor, Eds. Boston, MA: Springer, 2011, pp. 73–105.

[14] N. Daina, A. Sivakumar, and J. W. Polak, "Modelling residential location choice: Insights from online listing data," *Transportation Research Part A*, vol. 130, pp. 534–551, Dec. 2019.

[15] J. Herlocker, J. Konstan, L. Terveen, and J. Riedl, "Evaluating collaborative filtering recommender systems," *ACM Transactions on Information Systems*, vol. 22, no. 1, pp. 5–53, Jan. 2004.

---

## Appendix A: Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend Framework | React | 18.x | Single-page application |
| Frontend Build | Vite | 7.3.1 | Module bundler and dev server |
| Routing | React Router | v6 | Client-side routing |
| Animation | Framer Motion | 11.x | UI transitions |
| Icons | @phosphor-icons/react | 2.x | Consistent icon library |
| Backend Framework | FastAPI | 0.111.x | REST API server |
| ASGI Server | Uvicorn | 0.29.x | Python async HTTP server |
| ML Library | scikit-learn | 1.8.0 | MinMaxScaler, cosine_similarity |
| Data Processing | pandas, numpy | 2.x, 1.x | Dataset manipulation |
| Model Serialisation | joblib | 1.4.x | scaler.pkl persistence |
| Database Driver | Motor | 3.x | Async MongoDB client |
| Authentication | python-jose, passlib | — | JWT signing, PBKDF2 hashing |
| Database | MongoDB Atlas | — | Cloud NoSQL storage |
| Language | Python | 3.12.2 | Backend |
| Language | JavaScript (ES2022) | — | Frontend |

---

## Appendix B: Dataset Preprocessing Action Log

| Step | Action | Records Affected |
|---|---|---|
| 1 | Column name standardisation | All 3,478 rows |
| 2 | Size extraction (string → float) | ~3% of rows (numeric size) |
| 3 | Size imputation (NaN → median) | ~97% of rows |
| 4 | Bedrooms imputation (NaN → median) | 637 rows (18.3%) |
| 5 | Bathrooms imputation (NaN → median) | 429 rows (12.3%) |
| 6 | Distance imputation (NaN → 0.4 km) | ~0 (no missing) |
| 7 | Outlier removal (rent ≤ 0 or > 78,000) | 72 rows removed |
| 8 | Final cleaned records | **3,406** |

---

## Appendix C: Similarity Matrix Computation

The property-to-property similarity matrix is precomputed in the Jupyter notebook:

```python
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# X_scaled: shape (3406, 6) — MinMaxScaler applied to training-fit scaler
sim_matrix = cosine_similarity(X_scaled)          # shape: (3406, 3406)
np.save('outputs/models/similarity_matrix.npy', sim_matrix)
```

Memory footprint: 3,406 × 3,406 × float64 (8 bytes) ≈ **93 MB**.  
At application startup, this matrix is loaded once into RAM and retained for the duration of the server session. All property-to-property similarity lookups are O(1) array index operations thereafter.

---

## Appendix D: .env Configuration Reference

The backend requires the following environment variables in `backend/.env`:

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/

# Database name (default: propai)
DB_NAME=propai

# JWT signing secret — change before production deployment
SECRET_KEY=<strong-random-secret>

# CORS allowed origins (comma-separated)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Performance metrics rolling window size (default: 500)
PERFORMANCE_WINDOW_SIZE=500
```

The application operates correctly without `MONGODB_URI` set by falling back to an in-memory data store. In this mode, user registration, landlord listings, and usability logs persist only for the duration of the server session. The AI recommendation engine operates independently of the database and is unaffected by this fallback.

The frontend requires `frontend/.env` with:
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

*End of Dissertation — COM748 Masters Research Project*
