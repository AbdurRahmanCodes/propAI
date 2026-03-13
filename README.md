# UK Property Listing Platform

AI-driven rental property platform with direct landlord-to-tenant workflows, recommendation ranking, and side-by-side AI vs query comparison.

## Tech Stack

- Frontend: React + Vite + Framer Motion
- Backend: FastAPI + Pandas + scikit-learn
- Database: MongoDB Atlas (for auth, listings, favourites, usability logs)
- Model: Content-based filtering (cosine similarity)

## Project Structure

- `frontend/` - React application
- `backend/` - FastAPI API server
- `outputs/` - model artifacts, metrics, and dashboard figure assets
- `docs/` - research/project documentation (including thesis)

## Local Setup

### 1) Backend

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Create env file:

```bash
cp .env.example .env
```

Then edit `backend/.env` with real credentials.

Run backend:

```bash
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default: `http://localhost:5173`
Backend default: `http://localhost:8000`

## Key Features

- JWT authentication with tenant/landlord roles
- Property listing and detail pages
- AI recommendations with explanation chips
- AI vs query comparison page
- Admin dashboard for evaluation, exposure, and performance metrics

## Security Notes

- Never commit `.env` files
- Use `backend/.env.example` as a template
- Rotate secrets immediately if they were ever exposed

## Deployment (Recommended)

Use Vercel for the frontend and Railway for the FastAPI backend.

### 1) Deploy Backend (Railway)

- Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
- Select this repository.
- Railway will detect `railway.toml` and configure automatically.
- Add environment variables (from `backend/.env.example`):
  - `MONGODB_URI` — your MongoDB Atlas connection string
  - `SECRET_KEY` — a long random secret
  - `DB_NAME` — propai
  - `CORS_ORIGINS` — your Vercel frontend URL (add after Vercel deploy)
  - `PERFORMANCE_WINDOW_SIZE` — 500
- Click Deploy. Copy your Railway URL, for example:
  `https://your-project.up.railway.app`

### 2) Deploy Frontend (Vercel)

- Import this repository in Vercel.
- Set Root Directory to `frontend`.
- Add environment variable:
	- `VITE_API_BASE_URL` = your deployed backend URL
- Deploy.

The frontend will call the backend using `VITE_API_BASE_URL` in `frontend/src/services/api.js`.

### 3) Post-Deploy Checks

- Register a user and log in.
- Open Properties and Recommendations pages.
- Open Compare and Admin Dashboard pages.
- Confirm there are no CORS errors.

## Thesis

Main dissertation file:

- `docs/research_thesis.md`

Before final submission, update personal metadata fields in the thesis header.
