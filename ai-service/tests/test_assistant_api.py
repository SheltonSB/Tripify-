from fastapi.testclient import TestClient

from app.api import assistant
from app.main import app


client = TestClient(app)


class FakeAssistantService:
    def build_plan(self, request):
        return {
            "destination": request.destination,
            "summary": "Structured assistant response",
            "steps": [
                {
                    "title": "Arrival",
                    "description": "Check in and explore the area.",
                    "dayNumber": 1,
                }
            ],
        }


def test_assistant_plan_endpoint_returns_structured_response(monkeypatch) -> None:
    monkeypatch.setattr(assistant, "_assistant_service", FakeAssistantService())
    response = client.post(
        "/internal/assistant/plan",
        json={
            "userId": 1,
            "destination": "Chicago",
            "budget": 1200,
            "days": 3,
            "people": 2,
            "prompt": "Plan a food-focused weekend",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["destination"] == "Chicago"
    assert isinstance(payload["steps"], list)
