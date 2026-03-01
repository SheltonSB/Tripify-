class ExtractionChain:
    """Reserved for turning model text into structured fields."""

    def extract(self, text: str) -> dict[str, str]:
        return {"raw": text}
