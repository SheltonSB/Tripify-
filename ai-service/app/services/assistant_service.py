from app.chains.trip_planner_chain import TripPlannerChain
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse
from app.services.memory_service import MemoryService


class AssistantService:
    def __init__(self, trip_planner_chain: TripPlannerChain, memory_service: MemoryService) -> None:
        self._trip_planner_chain = trip_planner_chain
        self._memory_service = memory_service

    def build_plan(self, request: AssistantRequest) -> AssistantResponse:
        self._memory_service.append(request.user_id, request.prompt)
        return self._trip_planner_chain.build_plan(request)
