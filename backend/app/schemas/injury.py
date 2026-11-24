from typing import Literal
from pydantic import BaseModel, Field


class PetContext(BaseModel):
    name: str | None = None
    species: str | None = None
    breed: str | None = None
    age_years: float | None = None
    weight_kg: float | None = None
    allergies: str | None = None
    medical_history: str | None = None


class InjuryAnalyzeResponse(BaseModel):
    visible_observations: list[str]
    possible_category: str
    urgency_level: Literal["low", "moderate", "urgent", "emergency"]
    safe_immediate_actions: list[str]
    actions_to_avoid: list[str]
    veterinary_recommendation: str
    emergency_warning_signs: list[str]
    disclaimer: str = Field(
        default="Informational first-aid guidance only. This is not a veterinary diagnosis."
    )
