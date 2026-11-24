# PawHeal Security & Safety Architecture

1. **Server-Side AI Keys**: `GEMINI_API_KEY` is accessed exclusively on the backend (`server/gemini.ts` and `backend/app/services/gemini_service.py`) and is never bundled into Flutter or browser code.
2. **Authentication & Ownership Isolation**:
   - Web API: Passwords hashed with PBKDF2-SHA512 (120,000 iterations, per-user random salt) and HMAC-SHA256 signed sessions; every CRUD query scopes by `req.authUser.id`.
   - FastAPI + Supabase: JWT Bearer tokens verified via `PyJWT` using `SUPABASE_JWT_SECRET`; PostgreSQL enforces `auth.uid() = user_id` via Row Level Security.
3. **Input & Image Validation**: Image uploads enforce MIME type allowlists (`image/jpeg`, `image/png`, `image/webp`) and a 5 MB size cap.
4. **Veterinary Safety Guardrails**: Prompts and schemas explicitly prohibit definitive medical diagnoses, fabricated confidence percentages, or recommending human OTC NSAIDs/acetaminophen for pets.
