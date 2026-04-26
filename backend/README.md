# SAMS Backend (FastAPI)

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create `.env` from `.env.example` and update values.
4. Run server:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

By default, the backend uses SQLite (`sqlite:///./sams.db`) for easy local startup.
For production, set `DATABASE_URL` in `.env` to PostgreSQL (example included in `.env.example`).

## API Docs

- Swagger UI: http://127.0.0.1:8000/docs
- OpenAPI JSON: http://127.0.0.1:8000/openapi.json
