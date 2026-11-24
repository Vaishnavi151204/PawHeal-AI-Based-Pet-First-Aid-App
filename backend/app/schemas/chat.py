from typing import Literal
from pydantic import BaseModel, Field

from app.schemas.injury import PetContext


class ChatHistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    pet: PetContext | None = None
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=20)


class ChatMessageResponse(BaseModel):
    reply: str
    urgency_flag: Literal["routine", "monitor", "urgent_vet"]
    suggested_follow_ups: list[str]
