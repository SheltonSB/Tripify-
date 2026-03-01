import json
import logging
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
            if "destination" not in structured:
                structured["destination"] = request.destination

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
            logger.exception("Ollama schema validation failure")
            raise LlamaClientError("Ollama returned JSON that does not match the plan schema") from exception

    def _build_prompt(self, request: AssistantRequest, prompt_template: str) -> str:
        pricing_lines = "\n".join(
            f"- {quote.provider} {quote.category}: {quote.amount:.2f} {quote.currency} ({quote.source_reference})"
            for quote in request.price_quotes
        ) or "- No pricing data available."
        places_lines = "\n".join(
            f"- {place.name} [{place.category}] vibe={place.vibe} approx={place.estimated_cost:.2f} via {place.provider}"
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
- Origin: {request.origin}.
- Destination: {request.destination}.
- Preferred vibe: {request.vibe}.
- If the user's prompt adds constraints, follow them.
- Provide between 2 and 5 steps.
- dayNumber values must be positive integers.

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
