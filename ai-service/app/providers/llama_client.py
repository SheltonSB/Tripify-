class LlamaClient:
    """Placeholder LLM adapter.

    Replace this with a real provider call when the model integration is ready.
    """

    def create_summary(self, destination: str, budget: float, days: int, people: int) -> str:
        return (
            f"{destination} trip for {people} traveler(s) over {days} day(s), "
            f"planned around a budget of {budget:.2f}."
        )
