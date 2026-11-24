# PawHeal Database Schema

The Supabase PostgreSQL schema is version-controlled in [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql).

## Tables

| Table | Primary Key | Owner FK | Purpose |
| :--- | :--- | :--- | :--- |
| `profiles` | `id (uuid)` | `auth.users(id)` | Pet owner profile & reminder preferences |
| `pets` | `id (uuid)` | `user_id -> profiles(id)` | Pet profiles, species, weight, allergies, medical history |
| `injury_assessments` | `id (uuid)` | `user_id -> profiles(id)` | AI multimodal injury triage history |
| `chat_sessions` | `id (uuid)` | `user_id -> profiles(id)` | Pet-care assistant conversation threads |
| `chat_messages` | `id (uuid)` | `user_id -> profiles(id)` | User and assistant messages per session |
| `vaccinations` | `id (uuid)` | `user_id -> profiles(id)` | Vaccine history and booster due dates |
| `medications` | `id (uuid)` | `user_id -> profiles(id)` | Dosage schedules and active reminder toggles |
| `appointments` | `id (uuid)` | `user_id -> profiles(id)` | Scheduled, completed, or cancelled vet visits |
| `health_records` | `id (uuid)` | `user_id -> profiles(id)` | Weight measurements and general clinical notes |

## Row Level Security (RLS)

Every table enables PostgreSQL RLS and enforces `auth.uid() = user_id` (or `auth.uid() = id` on `profiles`), preventing cross-user reads or writes at the database layer.
