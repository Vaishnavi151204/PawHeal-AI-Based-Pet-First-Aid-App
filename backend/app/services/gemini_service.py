import asyncio
import json
import logging
from google import genai
from google.genai import types

from app.core.config import Settings
from app.core.errors import ApiError
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.schemas.injury import InjuryAnalyzeResponse, PetContext

logger = logging.getLogger(__name__)

ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


class GeminiService:
    """Encapsulates server-side Gemini multimodal and chat calls with validation & timeouts."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _client(self) -> genai.Client:
        if not self.settings.gemini_api_key:
            raise ApiError(
                message="AI service is not configured on the server.",
                status_code=503,
                code="ai_not_configured",
            )
        return genai.Client(api_key=self.settings.gemini_api_key)

    async def analyze_injury(
        self,
        image_bytes: bytes,
        mime_type: str,
        body_area: str,
        symptoms: str,
        pet: PetContext | None,
    ) -> InjuryAnalyzeResponse:
        if mime_type not in ALLOWED_IMAGE_MIME_TYPES:
            raise ApiError("Unsupported image format. Use JPEG, PNG, or WEBP.", status_code=400, code="invalid_image")
        if not image_bytes or len(image_bytes) > self.settings.max_image_size_bytes:
            raise ApiError("Image must be non-empty and under 5 MB.", status_code=400, code="image_too_large")

        pet_summary = (
            f"Pet: {pet.name or 'Unnamed'}, Species: {pet.species or 'Unknown'}, "
            f"Breed: {pet.breed or 'Unknown'}, Age: {pet.age_years}y, Weight: {pet.weight_kg}kg, "
            f"Allergies: {pet.allergies or 'None'}, History: {pet.medical_history or 'None'}."
            if pet
            else "No pet profile provided."
        )

        prompt = (
            f"{pet_summary}\n"
            f"Affected body area: {body_area}\n"
            f"Symptoms: {symptoms or 'None reported'}\n"
            "Return strict JSON matching the schema. Never claim a definitive diagnosis or fabricate confidence scores."
        )

        client = self._client()
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model=self.settings.gemini_model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt,
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=(
                            "You are a veterinary first-aid triage assistant. Never provide a definitive "
                            "diagnosis or fabricated confidence score. Escalate severe signs to immediate emergency care."
                        ),
                        response_mime_type="application/json",
                        response_schema=InjuryAnalyzeResponse,
                    ),
                ),
                timeout=self.settings.gemini_timeout_seconds,
            )
        except asyncio.TimeoutError as exc:
            raise ApiError("AI injury analysis timed out. Please retry.", status_code=504, code="ai_timeout") from exc
        except Exception as exc:
            logger.exception("Gemini injury analysis error")
            raise ApiError("AI service temporarily unavailable.", status_code=502, code="ai_upstream_error") from exc

        try:
            payload = json.loads(response.text or "{}")
            return InjuryAnalyzeResponse.model_validate(payload)
        except Exception as exc:
            logger.warning("Malformed Gemini injury JSON response")
            raise ApiError("Received malformed AI response. Please retry.", status_code=502, code="malformed_ai_response") from exc

    async def chat_reply(self, request: ChatMessageRequest) -> ChatMessageResponse:
        pet_summary = (
            f"Pet: {request.pet.name}, Species: {request.pet.species}, Weight: {request.pet.weight_kg}kg, "
            f"Allergies: {request.pet.allergies or 'None'}"
            if request.pet
            else "No specific pet profile selected."
        )
        history_block = "\n".join(f"{m.role}: {m.content}" for m in request.history[-10:])
        prompt = f"{history_block}\nuser: {request.message}".strip()

        client = self._client()
        try:
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model=self.settings.gemini_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=(
                            f"You are PawHeal, a calm veterinary first-aid assistant. {pet_summary} "
                            "Never prescribe human painkillers or claim a definitive diagnosis. "
                            "Escalate life-threatening signs with urgency_flag='urgent_vet'."
                        ),
                        response_mime_type="application/json",
                        response_schema=ChatMessageResponse,
                    ),
                ),
                timeout=self.settings.gemini_timeout_seconds,
            )
        except asyncio.TimeoutError as exc:
            raise ApiError("AI assistant timed out. Please retry.", status_code=504, code="ai_timeout") from exc
        except Exception as exc:
            logger.exception("Gemini chat error")
            raise ApiError("AI assistant temporarily unavailable.", status_code=502, code="ai_upstream_error") from exc

        try:
            payload = json.loads(response.text or "{}")
            return ChatMessageResponse.model_validate(payload)
        except Exception as exc:
            raise ApiError("Received malformed AI chat response.", status_code=502, code="malformed_ai_response") from exc
