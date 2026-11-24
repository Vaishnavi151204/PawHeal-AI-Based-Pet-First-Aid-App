from fastapi import APIRouter, Depends

from app.core.config import Settings, get_settings
from app.core.security import AuthenticatedUser, verify_supabase_token
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse
from app.services.gemini_service import GeminiService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    body: ChatMessageRequest,
    _user: AuthenticatedUser = Depends(verify_supabase_token),
    settings: Settings = Depends(get_settings),
) -> ChatMessageResponse:
    service = GeminiService(settings)
    return await service.chat_reply(body)
