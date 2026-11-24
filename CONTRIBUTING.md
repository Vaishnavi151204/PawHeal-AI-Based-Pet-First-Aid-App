# Contributing to PawHeal

Thank you for contributing to PawHeal!

## Engineering Standards
- Never commit `.env` files, API keys, or private Supabase credentials.
- Keep Gemini API calls strictly server-side (`server/` or `backend/`).
- Preserve veterinary safety disclaimers: never claim definitive medical diagnoses from images or fabricate confidence scores.
- Run `npm run lint && npm run build`, `flutter analyze && flutter test`, and `pytest` before opening a pull request.
