from app.chains.trip_planner_chain import TripPlannerChain
from app.providers.llama_client import LlamaClient
from app.schemas.assistant_request import AssistantRequest
from app.services.prompt_service import PromptService


def test_trip_planner_chain_builds_minimal_plan() -> None:
    chain = TripPlannerChain(prompt_service=PromptService(), llama_client=LlamaClient())
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
