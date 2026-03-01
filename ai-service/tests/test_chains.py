from app.chains.trip_planner_chain import TripPlannerChain
from app.schemas.assistant_response import AssistantResponse
from app.schemas.assistant_request import AssistantRequest
from app.schemas.structured_plan import StructuredPlan
from app.services.prompt_service import PromptService


class FakeLlamaClient:
    def generate_plan(self, request: AssistantRequest, prompt_template: str) -> AssistantResponse:
        assert "Build a concise" in prompt_template
        return AssistantResponse(
            destination=request.destination,
            summary="Structured test summary",
            steps=[
                StructuredPlan(
                    title="Arrival",
                    description="Check in and get oriented.",
                    dayNumber=1,
                )
            ],
        )


def test_trip_planner_chain_builds_minimal_plan() -> None:
    chain = TripPlannerChain(prompt_service=PromptService(), llama_client=FakeLlamaClient())
    response = chain.build_plan(
        AssistantRequest(
            userId=1,
            destination="Austin",
            budget=900,
            days=2,
            people=1,
            prompt="Weekend music trip",
        )
    )

    assert response.destination == "Austin"
    assert len(response.steps) >= 1
