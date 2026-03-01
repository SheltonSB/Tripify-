from pydantic import BaseModel, ConfigDict, Field


class AssistantChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: int | None = Field(default=None, alias="userId")
    destination: str
    area_name: str = Field(default="", alias="areaName")
    message: str
    vibe: str = "balanced"
    latitude: float | None = None
    longitude: float | None = None
