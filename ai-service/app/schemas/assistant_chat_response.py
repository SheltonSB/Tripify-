from pydantic import BaseModel, ConfigDict, Field


class AssistantChatResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    destination: str
    area_name: str = Field(default="", alias="areaName")
    reply: str
