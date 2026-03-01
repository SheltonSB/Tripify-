from pydantic import BaseModel, ConfigDict, Field


class StructuredPlan(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    description: str
    day_number: int = Field(alias="dayNumber")
