# Frontend

React + Vite client for the UK Property Listing platform.

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Default Runtime

- App URL: `http://localhost:5173`
- API base URL: `http://localhost:8000`

## Main Features

- Authentication (tenant / landlord)
- Property browsing, detail view, compare page
- AI recommendations and explanation chips
- Dashboard views for model and evaluation metrics

## Notes

- This frontend expects the FastAPI backend to be running.
- For Vercel deployment, set `VITE_API_BASE_URL` in project environment variables.
- Do not commit environment secrets.
