from datetime import datetime, timezone
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: datetime

    @classmethod
    def healthy(cls, service: str, version: str, environment: str) -> "HealthResponse":
        return cls(
            status="ok",
            service=service,
            version=version,
            environment=environment,
            timestamp=datetime.now(timezone.utc),
        )
