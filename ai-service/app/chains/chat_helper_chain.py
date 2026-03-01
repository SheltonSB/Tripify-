from app.providers.llama_client import LlamaClient
from app.schemas.assistant_chat_request import AssistantChatRequest
from app.schemas.assistant_chat_response import AssistantChatResponse
from app.services.prompt_service import PromptService


class ChatHelperChain:
    def __init__(self, prompt_service: PromptService, llama_client: LlamaClient) -> None:
        self._prompt_service = prompt_service
        self._llama_client = llama_client

    def reply(self, request: AssistantChatRequest, history: list[str]) -> AssistantChatResponse:
        prompt_template = self._prompt_service.load("assistant_chat")
        return self._llama_client.generate_chat_reply(request, prompt_template, history)
