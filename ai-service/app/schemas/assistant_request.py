from pydantic import BaseModel, ConfigDict, Field


class AssistantRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: int | None = Field(default=None, alias="userId")
    destination: str
    budget: float
    days: int
    people: int
    prompt: str = ""
