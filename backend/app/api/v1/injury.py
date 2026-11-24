import json
from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser, verify_supabase_token
from app.schemas.injury import InjuryAnalyzeResponse, PetContext
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/injury", tags=["injury"])


@router.post("/analyze", response_model=InjuryAnalyzeResponse)
async def analyze_injury(
    image: UploadFile = File(...),
    body_area: str = Form(..., min_length=2, max_length=100),
    symptoms: str = Form(default="", max_length=1500),
    pet_context_json: str = Form(default=""),
    _user: AuthenticatedUser = Depends(verify_supabase_token),
    settings: Settings = Depends(get_settings),
) -> InjuryAnalyzeResponse:
    pet: PetContext | None = None
    if pet_context_json.strip():
        pet = PetContext.model_validate(json.loads(pet_context_json))

    image_bytes = await image.read()
    service = GeminiService(settings)
    return await service.analyze_injury(
        image_bytes=image_bytes,
        mime_type=image.content_type or "",
        body_area=body_area,
        symptoms=symptoms,
        pet=pet,
    )
