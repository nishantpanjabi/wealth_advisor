# Wealth Advisor Frontend

Production-focused React frontend for Wealth Advisor.

## Stack

- React 18 (JSX)
- React Router
- Tailwind CSS
- TanStack Query for server-state caching and mutations
- Token-based auth with automatic refresh flow

## Local Development

1. Copy env file:
   - `cp .env.example .env` (or create `.env` manually on Windows)
2. Install dependencies:
   - `npm install`
3. Run app:
   - `npm run dev`

Default frontend URL: `http://localhost:5173`

## Environment Variables

- `VITE_API_BASE_URL`: backend base URL, example `http://localhost:8081`

## Production Build

- `npm run build`
- `npm run preview`

## Docker Deployment

Build image:

- `docker build -t wealth-advisor-frontend .`

Run container:

- `docker run -p 8080:80 wealth-advisor-frontend`

The Nginx config includes SPA fallback (`/index.html`) for client-side routes.

## Hosting Notes

- Ensure backend CORS allows your production frontend domain.
- Set `VITE_API_BASE_URL` to your production backend URL during build.
- Deploy static assets behind HTTPS and CDN where possible.
