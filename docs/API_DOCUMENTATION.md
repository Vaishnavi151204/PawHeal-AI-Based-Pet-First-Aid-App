# PawHeal API Documentation

## FastAPI AI Backend (`/api/v1`)

All protected routes expect `Authorization: Bearer <supabase-jwt>`.

### `GET /api/v1/health`
Returns service liveness metadata (`status`, `service`, `version`, `environment`, `timestamp`).

### `POST /api/v1/injury/analyze`
Multipart form-data endpoint:
- `image`: JPEG, PNG, or WEBP file ($\le 5$ MB)
- `body_area`: string (required)
- `symptoms`: string (optional)
- `pet_context_json`: optional JSON string containing pet name, species, breed, age, weight, allergies, and medical history.

Returns structured JSON:
- `visible_observations`
- `possible_category`
- `urgency_level` (`low` | `moderate` | `urgent` | `emergency`)
- `safe_immediate_actions`
- `actions_to_avoid`
- `veterinary_recommendation`
- `emergency_warning_signs`
- `disclaimer`

### `POST /api/v1/chat/message`
JSON request body:
```json
{
  "message": "My dog stepped on glass and is licking his paw",
  "pet": { "name": "Max", "species": "Dog", "weight_kg": 24.5 },
  "history": []
}
```
Returns `reply`, `urgency_flag` (`routine` | `monitor` | `urgent_vet`), and `suggested_follow_ups`.

## Live Express Full-Stack Endpoints (`/api`)

The web server (`server.ts`) exposes `/api/health`, `/api/auth/*`, `/api/profile`, `/api/pets/*`, `/api/injury/*`, `/api/chat/*`, `/api/nearby`, and `/api/tracker/*`.
