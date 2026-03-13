# Usability Evaluation Documentation

## Methodology

A task-based usability evaluation was conducted to assess how effectively tenants can interact with the platform, particularly how well they can interpret and act on AI-driven recommendations.

This aligns with the COM748 research proposal's Objective 6:  
*"Usability evaluation will be performed through task-based testing to assess how effectively tenants can interpret and use recommendations."*

## Evaluation Design

**Method:** Task-based think-aloud study with SUS (System Usability Scale) questionnaire  
**Platform:** In-application evaluation at `/usability` route

### 5 Structured Tasks

| Task | Description | Success Criteria |
|------|-------------|-----------------|
| T1 | Browse Property Listings | Views at least one property card |
| T2 | Search with Filters | Uses budget + bedroom filters |
| T3 | Get AI Recommendations | Enters preferences, receives top-5 results |
| T4 | Compare AI vs Simple Query | Visits `/compare`, reviews both columns |
| T5 | Save a Property | Adds a property to favourites |

## System Usability Scale (SUS)

The SUS is a validated 5-item (adapted from standard 10-item) questionnaire, scored on a 1–5 Likert scale:

| Item | Statement |
|------|-----------|
| Q1 | I think I would like to use this system frequently. |
| Q2 | I found the system unnecessarily complex. |
| Q3 | I thought the system was easy to use. |
| Q4 | I think I would need support to use this system. |
| Q5 | I found the various functions of this system well integrated. |

### SUS Scoring Formula

```
SUS Score = [Σ (qi - 1 for odd i) + (5 - qi for even i)] × 2.5
```
Score range: 0–100  
Interpretation:
- \> 85 = Excellent
- 70–85 = Good 
- 51–70 = OK
- < 50 = Poor

## Data Collection

Usability sessions are logged to MongoDB via `POST /usability/log`:
- Session ID (timestamp-based)
- Tasks completed (0–5)
- Whether all tasks were completed
- SUS score (computed client-side)
- Time taken (seconds)
- Optional free-text feedback

Results are aggregated at `GET /usability/summary` and displayed on the Admin Dashboard under "Usability Evaluation."

## Notes for Thesis

- Evaluation was conducted as a within-platform simulation — participants self-report task completion via checkboxes
- This approach is appropriate for a prototype system where external lab testing is infeasible
- SUS scores above 70 indicate the platform is usable for its target audience
- Direct landlord contact is available only on landlord-created listings and can be discussed as an additional interaction feature rather than a core SUS task
- Any usability findings should be reported as simulated-participant results rather than live public-user evidence
- Future work could include eye-tracking or A/B testing against alternative designs
