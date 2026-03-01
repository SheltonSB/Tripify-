from pydantic import BaseModel, ConfigDict, Field


class PricingQuote(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: str
    category: str
    currency: str
    amount: float
    source_reference: str = Field(alias="sourceReference")


class WeatherContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    city: str
    summary: str
    temperature_celsius: float = Field(alias="temperatureCelsius")
    alert_active: bool = Field(alias="alertActive")


class PlaceContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    category: str
    vibe: str
    estimated_cost: float = Field(alias="estimatedCost")
    provider: str
    distance_meters: float | None = Field(default=None, alias="distanceMeters")


class AssistantRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    user_id: int | None = Field(default=None, alias="userId")
    trip_id: int | None = Field(default=None, alias="tripId")
    destination: str
    budget: float
    days: int
    people: int
    prompt: str = ""
    origin: str = "Current location"
    latitude: float | None = None
    longitude: float | None = None
    vibe: str = "balanced"
    price_quotes: list[PricingQuote] = Field(default_factory=list, alias="priceQuotes")
    weather: WeatherContext | None = None
    places: list[PlaceContext] = Field(default_factory=list)
