---
title: PropAI Rental Recommender
sdk: docker
app_port: 7860
---

This Space runs the full PropAI app using Docker.

Required Space Variables:
- MONGODB_URI
- SECRET_KEY
- DB_NAME (default: propai)
- CORS_ORIGINS (optional for same-origin Space)
- PERFORMANCE_WINDOW_SIZE (default: 500)

The app serves both API and frontend from one URL.
