from pathlib import Path


class PromptService:
    def __init__(self) -> None:
        self._prompt_dir = Path(__file__).resolve().parent.parent / "prompts"

    def load(self, name: str) -> str:
        prompt_path = self._prompt_dir / f"{name}.txt"
        return prompt_path.read_text(encoding="utf-8").strip()
