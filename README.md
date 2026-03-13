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

## Hugging Face Space (Professor Demo)

If you want a single demo link quickly, deploy to a Docker Space.

### 1) Create Space

- Go to Hugging Face Spaces and create a new Space.
- Choose SDK: `Docker`.
- Create an empty Space repo.

### 2) Push This Code to the Space

Use git on your machine:

```bash
git remote add hf https://huggingface.co/spaces/<your-username>/<your-space-name>
git push hf main
```

### 3) Set Space Variables (Settings -> Variables)

- `MONGODB_URI`
- `SECRET_KEY`
- `DB_NAME` (example: `propai`)
- `PERFORMANCE_WINDOW_SIZE` (example: `500`)

`CORS_ORIGINS` is optional for HF because frontend and backend are served from the same origin in this Docker setup.

### 4) Done

- Space auto-builds from `Dockerfile`.
- App runs on port `7860` and serves both UI and API from one link.

## Thesis

Main dissertation file:

- `docs/research_thesis.md`

Before final submission, update personal metadata fields in the thesis header.
