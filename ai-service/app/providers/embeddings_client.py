class EmbeddingsClient:
    """Placeholder embeddings adapter for future retrieval workflows."""

    def embed(self, text: str) -> list[float]:
        token_count = max(len(text.split()), 1)
        return [float(token_count), 1.0, 0.0]
