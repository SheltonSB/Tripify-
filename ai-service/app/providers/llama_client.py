import json
import logging
import re
import time
from typing import Any

import httpx
from pydantic import ValidationError

from app.core.config import get_settings
from app.schemas.assistant_request import AssistantRequest
from app.schemas.assistant_response import AssistantResponse


class LlamaClientError(RuntimeError):
    """Raised when the Ollama integration cannot return a valid plan."""


logger = logging.getLogger(__name__)


class LlamaClient:
    """Ollama-backed Llama adapter."""

    def __init__(
        self,
        base_url: str | None = None,
        model_name: str | None = None,
        timeout_seconds: float | None = None,
        http_client: httpx.Client | None = None,
    ) -> None:
        settings = get_settings()
        self._base_url = base_url or settings.ollama_base_url
        self._model_name = model_name or settings.model_name
        self._timeout_seconds = timeout_seconds or settings.request_timeout_seconds
        self._http_client = http_client or httpx.Client(
            base_url=self._base_url,
            timeout=self._timeout_seconds,
        )

    def generate_plan(self, request: AssistantRequest, prompt_template: str) -> AssistantResponse:
        prompt = self._build_prompt(request, prompt_template)
        start_time = time.perf_counter()
        try:
            logger.info(
                "Dispatching Ollama prompt destination=%s trip_id=%s quotes=%s places=%s weather=%s",
                request.destination,
                request.trip_id,
                len(request.price_quotes),
                len(request.places),
                request.weather.summary if request.weather else "none",
            )
            response = self._http_client.post(
                "/api/generate",
                json={
                    "model": self._model_name,
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                },
            )
            response.raise_for_status()

            payload = response.json()
            raw_content = payload.get("response")
            if not isinstance(raw_content, str) or not raw_content.strip():
                raise LlamaClientError("Ollama returned an empty response payload")

            structured = self._parse_model_json(raw_content)
            structured = self._normalize_structured_response(structured, request)

            validated = AssistantResponse.model_validate(structured)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info(
                "Ollama response received destination=%s steps=%s durationMs=%s",
                validated.destination,
                len(validated.steps),
                duration_ms,
            )
            return validated
        except LlamaClientError:
            raise
        except httpx.HTTPError as exception:
            logger.exception("Ollama transport failure")
            raise LlamaClientError(
                f"Failed to reach Ollama at {self._base_url} using model '{self._model_name}'"
            ) from exception
        except ValidationError as exception:
            logger.exception("Ollama schema validation failure; using fallback plan")
            fallback = self._build_fallback_plan(request)
            return AssistantResponse.model_validate(fallback)

    def _build_prompt(self, request: AssistantRequest, prompt_template: str) -> str:
        fixed_cost = sum(
            quote.amount
            for quote in request.price_quotes
            if quote.category.strip().lower() in {"flight", "lodging", "hotel"}
        )
        remaining_budget = max(request.budget - fixed_cost, 0)
        activity_budget_per_day = remaining_budget / request.days if request.days > 0 else remaining_budget
        pricing_lines = "\n".join(
            f"- {quote.provider} {quote.category}: {quote.amount:.2f} {quote.currency} ({quote.source_reference})"
            for quote in request.price_quotes
        ) or "- No pricing data available."
        places_lines = "\n".join(
            (
                f"- {place.name} [{place.category}] vibe={place.vibe} "
                f"live-estimated-cost={place.estimated_cost:.2f} via {place.provider}"
                f"{f' distance_m={place.distance_meters:.0f}' if place.distance_meters is not None else ''}"
            )
            for place in request.places
        ) or "- No place recommendations available."
        weather_line = (
            f"- {request.weather.city}: {request.weather.summary}, "
            f"{request.weather.temperature_celsius:.1f}C, alert_active={request.weather.alert_active}"
            if request.weather
            else "- No weather data available."
        )

        return f"""{prompt_template}

You are Tripify's travel planning assistant.
Return only valid JSON with this exact shape:
{{
  "destination": "string",
  "summary": "string",
  "steps": [
    {{
      "title": "string",
      "description": "string",
      "dayNumber": 1
    }}
  ]
}}

Requirements:
- Keep the response budget-aware.
- Use {request.days} day(s) and {request.people} traveler(s).
- Budget ceiling: {request.budget:.2f}.
- Fixed travel + hotel cost estimate: {fixed_cost:.2f}.
- Remaining budget for activities: {remaining_budget:.2f}.
- Approximate activity budget per day: {activity_budget_per_day:.2f}.
- Origin: {request.origin}.
- Destination: {request.destination}.
- Preferred vibe: {request.vibe}.
- If the user's prompt adds constraints, follow them.
- Provide between 2 and 5 steps.
- dayNumber values must be positive integers.
- If named places are provided, use those exact place names verbatim in the step titles or descriptions.
- Prefer specific venues from the Places list over generic phrases.
- Do not invent venue names that are not listed in the Places data.
- If there are only a few named places, reuse those exact names and fill the rest with general activities, neighborhoods, or timing advice.
- Use the weather context in the itinerary.
- Mention the current conditions or temperature in at least one step description.
- If there is a weather alert, prefer indoor or weather-safe suggestions and state that in the plan.
- The Places list is already ranked by affordability, weather fit, and relevance. Prefer earlier places first.
- If distance data is present, prefer nearer places before farther ones unless the prompt clearly asks otherwise.
- Activity costs from Places are live estimates derived from provider price bands, not exact ticketing data. Do not overstate them as guaranteed prices.
- Keep the combined trip realistic relative to the fixed costs and the remaining activity budget.

Context from upstream services:
Pricing:
{pricing_lines}

Weather:
{weather_line}

Places:
{places_lines}

User prompt:
{request.prompt or "No extra prompt provided."}
"""

    def _parse_model_json(self, raw_content: str) -> dict[str, Any]:
        cleaned = raw_content.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            if lines and lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            cleaned = "\n".join(lines).strip()
            if cleaned.startswith("json"):
                cleaned = cleaned[4:].strip()

        try:
            parsed = json.loads(cleaned)
        except json.JSONDecodeError as exception:
            raise LlamaClientError("Ollama returned invalid JSON for the trip plan") from exception

        if not isinstance(parsed, dict):
            raise LlamaClientError("Ollama returned JSON that was not an object")
        return parsed

    def _normalize_structured_response(
        self,
        structured: dict[str, Any],
        request: AssistantRequest,
    ) -> dict[str, Any]:
        destination = self._coerce_text(structured.get("destination")) or request.destination
        summary = self._coerce_text(structured.get("summary")) or f"Balanced trip to {destination}"
        weather_note = self._weather_note(request)

        raw_steps = structured.get("steps")
        if not isinstance(raw_steps, list):
            raw_steps = structured.get("itinerary")
        if not isinstance(raw_steps, list):
            raw_steps = []

        steps: list[dict[str, Any]] = []
        for index, raw_step in enumerate(raw_steps[:5], start=1):
            normalized_step = self._normalize_step(raw_step, index, destination)
            if normalized_step:
                steps.append(normalized_step)

        if not steps:
            return self._build_fallback_plan(request)

        if len(steps) == 1 and request.days > 1:
            steps.append(
                {
                    "title": f"More time in {destination}",
                    "description": (
                        f"Use the remaining time to explore neighborhoods, local food, and flexible activities in {destination}."
                        f"{weather_note}"
                    ),
                    "dayNumber": min(2, request.days),
                }
            )

        if weather_note and weather_note.lower() not in steps[0]["description"].lower():
            steps[0]["description"] = f'{steps[0]["description"]}{weather_note}'

        return {
            "destination": destination,
            "summary": f"{summary}{weather_note}" if weather_note and weather_note.lower() not in summary.lower() else summary,
            "steps": steps,
        }

    def _normalize_step(self, raw_step: Any, default_day: int, destination: str) -> dict[str, Any] | None:
        if isinstance(raw_step, str):
            text = raw_step.strip()
            if not text:
                return None
            return {
                "title": text[:80],
                "description": text,
                "dayNumber": default_day,
            }

        if not isinstance(raw_step, dict):
            return None

        title = (
            self._coerce_text(raw_step.get("title"))
            or self._coerce_text(raw_step.get("name"))
            or self._coerce_text(raw_step.get("headline"))
            or f"Explore {destination}"
        )
        description = (
            self._coerce_text(raw_step.get("description"))
            or self._coerce_text(raw_step.get("details"))
            or self._coerce_text(raw_step.get("summary"))
            or f"Spend time exploring {destination}."
        )
        day_number = self._coerce_int(
            raw_step.get("dayNumber"),
            raw_step.get("day_number"),
            raw_step.get("day"),
            default=default_day,
        )

        return {
            "title": title,
            "description": description,
            "dayNumber": day_number,
        }

    def _build_fallback_plan(self, request: AssistantRequest) -> dict[str, Any]:
        destination = request.destination
        steps: list[dict[str, Any]] = []
        weather_note = self._weather_note(request)

        for index, place in enumerate(request.places[: min(3, max(2, request.days))], start=1):
            steps.append(
                {
                    "title": place.name,
                    "description": (
                        f"Spend part of day {index} at {place.name}. "
                        f"It fits a {place.vibe} plan and is categorized as {place.category}."
                        f"{weather_note if index == 1 else ''}"
                    ),
                    "dayNumber": index,
                }
            )

        while len(steps) < min(2, max(1, request.days)):
            day_number = len(steps) + 1
            steps.append(
                {
                    "title": f"Explore {destination}",
                    "description": (
                        f"Use day {day_number} to explore local neighborhoods, meals, and flexible activities in {destination}."
                        f"{weather_note if day_number == 1 else ''}"
                    ),
                    "dayNumber": day_number,
                }
            )

        return {
            "destination": destination,
            "summary": f"Balanced trip to {destination}{weather_note}",
            "steps": steps,
        }

    def _coerce_text(self, value: Any) -> str:
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, (int, float)):
            return str(value)
        return ""

    def _coerce_int(self, *values: Any, default: int) -> int:
        for value in values:
            if isinstance(value, bool):
                continue
            if isinstance(value, int):
                return max(1, value)
            if isinstance(value, float):
                return max(1, int(value))
            if isinstance(value, str):
                match = re.search(r"\d+", value)
                if match:
                    return max(1, int(match.group(0)))
        return max(1, default)

    def _weather_note(self, request: AssistantRequest) -> str:
        if not request.weather:
            return ""

        city = request.weather.city
        summary = request.weather.summary
        temperature = round(request.weather.temperature_celsius)

        if request.weather.alert_active:
            return (
                f" Weather note: {city} is currently {summary} at about {temperature}C, so prefer indoor or weather-safe stops."
            )

        return f" Weather note: {city} is currently {summary} at about {temperature}C."
