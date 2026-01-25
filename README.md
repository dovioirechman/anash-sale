# My Blog

A minimal blog that reads articles from Google Drive.

## Structure

```
my-blog/
├── client/          # React frontend
└── server/          # Node.js backend
```

## Article Format

Create JSON files in your Google Drive folder:

```json
{
  "id": "unique-id",
  "title": "Article Title",
  "topic": "Technology",
  "summary": "Short description",
  "content": "Full article content...",
  "date": "2024-01-15"
}
```

## Setup

### 1. Google Cloud Console

1. Create a project at [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Get refresh token using OAuth playground

### 2. Server

```bash
cd server
cp .env.example .env
# Fill in your Google credentials
npm install
npm run dev
```

### 3. Client

```bash
cd client
npm install
npm run dev
```

## API Endpoints

- `GET /api/articles` - List all articles
- `GET /api/articles?topic=X` - Filter by topic
- `GET /api/articles/topics` - List all topics
- `GET /api/articles/:id` - Get single article
- `POST /api/articles/refresh` - Refresh cache from Drive

