from app.chains.chat_helper_chain import ChatHelperChain
from app.schemas.assistant_chat_request import AssistantChatRequest
from app.schemas.assistant_chat_response import AssistantChatResponse
from app.chains.trip_planner_chain import TripPlannerChain
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse
from app.services.memory_service import MemoryService


class AssistantService:
    def __init__(
        self,
        trip_planner_chain: TripPlannerChain,
        chat_helper_chain: ChatHelperChain,
        memory_service: MemoryService,
    ) -> None:
        self._trip_planner_chain = trip_planner_chain
        self._chat_helper_chain = chat_helper_chain
        self._memory_service = memory_service

    def build_plan(self, request: AssistantRequest) -> AssistantResponse:
        self._memory_service.append(request.user_id, request.prompt)
        return self._trip_planner_chain.build_plan(request)

    def chat(self, request: AssistantChatRequest) -> AssistantChatResponse:
        history = self._memory_service.get(request.user_id)
        self._memory_service.append(request.user_id, request.message)
        response = self._chat_helper_chain.reply(request, history)
        self._memory_service.append(request.user_id, response.reply)
        return response
