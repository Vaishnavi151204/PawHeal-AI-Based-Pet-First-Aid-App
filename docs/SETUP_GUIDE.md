# PawHeal Setup Guide

## 1. Environment Variables
Copy `.env.example` to `.env` (never commit `.env`):
```bash
cp .env.example .env
```
Configure `GEMINI_API_KEY` on the server side. For Supabase + Flutter deployments, configure `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, and `GOOGLE_MAPS_API_KEY`.

## 2. Live Web Application
```bash
npm install
npm run dev
```

## 3. Supabase Database Migration
Apply `supabase/migrations/0001_initial_schema.sql` using the Supabase CLI or SQL Editor:
```bash
supabase db push
```

## 4. FastAPI AI Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 5. Flutter Android Client
```bash
flutter pub get
flutter run \
  --dart-define=SUPABASE_URL=... \
  --dart-define=SUPABASE_ANON_KEY=... \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000 \
  --dart-define=GOOGLE_MAPS_API_KEY=...
```
