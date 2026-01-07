# Global OSINT Monitor

Global OSINT Monitor is a web-based platform designed to collect, classify, and visualize open-source intelligence (OSINT) events from public news sources around the world.

The system automatically ingests news feeds, categorizes events, geolocates them, and presents the information through an interactive map and a structured news feed.

---

## Features

- Automated ingestion of global news sources via RSS
- Event categorization (conflict, disaster, politics, health)
- Country and geolocation detection
- Interactive world map with event markers
- Event detail pages with extended content
- Persistent storage using PostgreSQL
- Serverless-ready architecture
- Automated background ingestion via cron jobs
- Deployed and production-ready on Vercel

---

## Tech Stack

### Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Leaflet / React-Leaflet

### Backend
- Next.js API Routes
- PostgreSQL (Supabase, pooled connection)
- RSS ingestion with rss-parser
- Serverless-compatible SQL client

### Infrastructure
- Vercel (hosting, cron jobs)
- Supabase Postgres (database)
- Environment-based configuration

---

## Architecture Overview

The platform follows a serverless-first architecture:

- News sources are periodically ingested through a protected API endpoint.
- Events are deduplicated and stored in a PostgreSQL database.
- The frontend fetches persisted events through read-only API endpoints.
- A cron job triggers ingestion automatically at regular intervals.
- No in-memory state is used; all data is persisted.

---

## Environment Variables

The following environment variables are required:

```env
POSTGRES_URL=postgres://user:password@pooler.supabase.com:6543/postgres
INGEST_SECRET=your_secret_token
````

Environment variables are managed through Vercel for production deployments.

---

## API Endpoints

### GET /api/events

Returns the latest persisted events.

### GET /api/ingest

Triggers ingestion of external news sources.
Protected via token-based authentication.

Example:

```
/api/ingest?token=YOUR_SECRET
```

---

## Deployment

The project is deployed on Vercel and uses scheduled cron jobs to automatically ingest new events.

To deploy:

1. Push the repository to GitHub
2. Import the project into Vercel
3. Configure environment variables
4. Deploy

No additional infrastructure setup is required.

---

## Project Status

This project is production-ready and designed as a foundation for further OSINT analysis features such as trending detection, search, and analytics.

---

## License

MIT License



