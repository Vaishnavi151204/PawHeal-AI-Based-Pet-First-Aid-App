# PawHeal — AI-Powered Pet Healthcare & First-Aid Platform

PawHeal is a full-stack pet healthcare, first-aid triage, and veterinary assistance application. It includes both:
1. A **live Full-Stack Web Application** (`Express` + `React` + `TypeScript` + `Tailwind CSS` + `@google/genai` + OpenStreetMap Overpass/Nominatim) runnable immediately via `npm run dev`.
2. A **Clean Architecture Flutter Android + Python FastAPI + Supabase PostgreSQL** codebase (`lib/`, `backend/`, `supabase/migrations/`, `test/`) ready for mobile deployment and GitHub portfolio presentation.

---

## Core Capabilities

- **Authentication & Account Controls**: Email sign-up, sign-in, password reset, logout, and account deletion.
- **Pet Profiles**: Manage multiple pets with species, breed, age, gender, weight, allergies, medical history, and photos.
- **AI Injury Scanner**: Upload or capture injury photos for structured Gemini triage (visible observations, general category, urgency level, safe immediate actions, actions to avoid, and veterinary escalation). Never claims a definitive diagnosis or fabricates confidence scores.
- **AI Pet-Care Chatbot**: Multi-turn assistant grounded in the selected pet's profile, complete with suggested follow-ups, retry handling, and emergency escalation.
- **Nearby Veterinary Assistance**: Search real veterinary clinics, animal hospitals, and animal welfare organizations by GPS or city/postal code.
- **Curated First-Aid Library**: Step-by-step protocols for cuts, bleeding, burns, choking, poisoning, insect bites, fractures, and heatstroke.
- **Health Tracker**: Vaccinations, medication reminders, appointments, weight logs with trend chart, health notes, and assessment history.

---

## System Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full Mermaid system diagram and Clean Architecture breakdown.

```text
├── server.ts & server/     # Live Express API + @google/genai + OSM clinic finder
├── src/                    # Live React + TypeScript + Tailwind web interface
├── lib/                    # Flutter Clean Architecture (Riverpod + GoRouter + Material 3)
├── backend/                # Python FastAPI AI gateway (/api/v1/*) + pytest suite
├── supabase/migrations/    # PostgreSQL schema with UUIDs, constraints, indexes, and RLS
├── test/                   # Flutter unit, widget, and integration tests
└── docs/                   # Architecture, Database, API, Setup, Security, and Testing docs
```

---

## Quick Start

### 1. Run the Live Full-Stack Web App
```bash
npm install
GEMINI_API_KEY="your-key" npm run dev
```
Open `http://localhost:3000`.

### 2. Run the FastAPI AI Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload --port 8000
```

### 3. Run the Flutter Android App
```bash
flutter pub get
flutter analyze
flutter test
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key \
  --dart-define=API_BASE_URL=http://10.0.2.2:8000 \
  --dart-define=GOOGLE_MAPS_API_KEY=your-maps-key
```

---

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Security](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Development Progress](DEVELOPMENT_PROGRESS.md)
