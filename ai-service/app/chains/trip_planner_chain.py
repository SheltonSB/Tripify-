from app.providers.llama_client import LlamaClient
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse
from app.services.prompt_service import PromptService


class TripPlannerChain:
    def __init__(self, prompt_service: PromptService, llama_client: LlamaClient) -> None:
        self._prompt_service = prompt_service
        self._llama_client = llama_client

    def build_plan(self, request: AssistantRequest) -> AssistantResponse:
        prompt_template = self._prompt_service.load("trip_planner")
        return self._llama_client.generate_plan(request, prompt_template)
