from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_assistant_plan_endpoint_returns_structured_response() -> None:
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
