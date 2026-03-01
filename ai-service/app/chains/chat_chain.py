class ChatChain:
    """Reserved for conversational follow-up planning."""

    def continue_conversation(self, history: list[str], prompt: str) -> str:
        return history[-1] if history else prompt
