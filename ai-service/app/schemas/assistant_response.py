from pydantic import BaseModel

from app.schemas.structured_plan import StructuredPlan


class AssistantResponse(BaseModel):
    destination: str
    summary: str
    steps: list[StructuredPlan]
