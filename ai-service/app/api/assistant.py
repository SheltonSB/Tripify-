from fastapi import APIRouter, HTTPException

from app.chains.trip_planner_chain import TripPlannerChain
from app.providers.llama_client import LlamaClient, LlamaClientError
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse
from app.services.assistant_service import AssistantService
from app.services.memory_service import MemoryService
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/internal/assistant", tags=["assistant"])

_assistant_service = AssistantService(
    trip_planner_chain=TripPlannerChain(
        prompt_service=PromptService(),
        llama_client=LlamaClient(),
    ),
    memory_service=MemoryService(),
)


@router.post("/plan", response_model=AssistantResponse)
async def build_plan(request: AssistantRequest) -> AssistantResponse:
    try:
        return _assistant_service.build_plan(request)
    except LlamaClientError as exception:
        raise HTTPException(status_code=502, detail=str(exception)) from exception
