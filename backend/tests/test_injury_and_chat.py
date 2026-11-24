from fastapi.testclient import TestClient

from app.core.security import AuthenticatedUser, verify_supabase_token
from app.main import app


def test_injury_analyze_requires_auth() -> None:
    client = TestClient(app)
    response = client.post(
        "/api/v1/injury/analyze",
        data={"body_area": "Paw"},
        files={"image": ("paw.jpg", b"fake-bytes", "image/jpeg")},
    )
    assert response.status_code == 401


def test_chat_rejects_empty_message_when_authenticated() -> None:
    app.dependency_overrides[verify_supabase_token] = lambda: AuthenticatedUser(user_id="user-1")
    try:
        client = TestClient(app)
        response = client.post("/api/v1/chat/message", json={"message": ""})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
