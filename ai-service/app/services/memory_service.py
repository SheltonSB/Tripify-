class MemoryService:
    """Minimal in-memory conversation store.

    This keeps the shape ready for later Redis-backed memory without coupling
    the planning chain to storage details.
    """

    def __init__(self) -> None:
        self._memory: dict[int, list[str]] = {}

    def append(self, user_id: int | None, message: str) -> None:
        if user_id is None:
            return
        self._memory.setdefault(user_id, []).append(message)

    def get(self, user_id: int | None) -> list[str]:
        if user_id is None:
            return []
        return list(self._memory.get(user_id, []))
