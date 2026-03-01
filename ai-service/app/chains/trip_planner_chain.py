from app.providers.llama_client import LlamaClient
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse
from app.schemas.structured_plan import StructuredPlan
from app.services.prompt_service import PromptService


class TripPlannerChain:
    def __init__(self, prompt_service: PromptService, llama_client: LlamaClient) -> None:
        self._prompt_service = prompt_service
        self._llama_client = llama_client

    def build_plan(self, request: AssistantRequest) -> AssistantResponse:
        _ = self._prompt_service.load("trip_planner")
        summary = self._llama_client.create_summary(
            destination=request.destination,
            budget=request.budget,
            days=request.days,
            people=request.people,
        )

        steps = [
            StructuredPlan(
                title="Arrival and orientation",
                description=f"Settle into {request.destination} and map the neighborhood.",
                dayNumber=1,
            ),
            StructuredPlan(
                title="Priority experiences",
                description="Focus on your highest-value activities while staying on budget.",
                dayNumber=min(request.days, 2),
            ),
        ]

        return AssistantResponse(
            destination=request.destination,
            summary=summary,
            steps=steps,
        )
