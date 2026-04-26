from __future__ import annotations

import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any

import google.generativeai as genai

from app.core.config import settings


@dataclass
class _CacheEntry:
    expires_at: float
    value: Any


class AIService:
    """Reusable Gemini wrapper with lightweight in-memory caching."""

    def __init__(self) -> None:
        self._cache: dict[str, _CacheEntry] = {}
        self._cache_ttl_seconds = 600
        self._max_prompt_chars = 8000
        self._max_chat_history_items = 12

        self._enabled = bool(settings.gemini_api_key.strip())
        if self._enabled:
            genai.configure(api_key=settings.gemini_api_key)
            self._model = genai.GenerativeModel(settings.gemini_model)
        else:
            self._model = None

    @property
    def enabled(self) -> bool:
        return self._enabled and self._model is not None

    def _cache_key(self, prefix: str, payload: Any) -> str:
        encoded = json.dumps(payload, ensure_ascii=True, sort_keys=True, default=str)
        digest = hashlib.sha256(encoded.encode("utf-8")).hexdigest()
        return f"{prefix}:{digest}"

    def _get_cached(self, key: str) -> Any | None:
        entry = self._cache.get(key)
        if not entry:
            return None
        if time.time() > entry.expires_at:
            del self._cache[key]
            return None
        return entry.value

    def _set_cached(self, key: str, value: Any) -> None:
        self._cache[key] = _CacheEntry(expires_at=time.time() + self._cache_ttl_seconds, value=value)

    def _extract_text(self, response: Any) -> str:
        text = (getattr(response, "text", None) or "").strip()
        if text:
            return text

        candidates: list[str] = []
        for candidate in getattr(response, "candidates", []) or []:
            content = getattr(candidate, "content", None)
            parts = getattr(content, "parts", []) if content else []
            for part in parts:
                part_text = getattr(part, "text", None)
                if part_text:
                    candidates.append(str(part_text).strip())
        return "\n".join([line for line in candidates if line]).strip()

    def _parse_json_text(self, text: str, fallback: dict[str, str]) -> dict[str, str]:
        if not text:
            return fallback

        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start:end + 1]

        try:
            parsed = json.loads(cleaned)
            if isinstance(parsed, dict):
                output: dict[str, str] = {}
                for key, default_value in fallback.items():
                    value = parsed.get(key, default_value)
                    output[key] = str(value).strip() if value is not None else default_value
                return output
        except json.JSONDecodeError:
            pass

        return fallback

    def _generate_text(
        self,
        prompt: str,
        *,
        cache_namespace: str,
        temperature: float = 0.3,
        max_output_tokens: int = 700,
        use_cache: bool = True,
    ) -> str:
        if not self.enabled:
            return "AI service is currently unavailable. Please add GEMINI_API_KEY on the server."

        trimmed_prompt = prompt.strip()[: self._max_prompt_chars]
        cache_key = self._cache_key(cache_namespace, {"prompt": trimmed_prompt, "temperature": temperature})
        if use_cache:
            cached = self._get_cached(cache_key)
            if cached is not None:
                return cached

        try:
            response = self._model.generate_content(
                trimmed_prompt,
                generation_config={
                    "temperature": temperature,
                    "top_p": 0.9,
                    "max_output_tokens": max_output_tokens,
                },
            )
            text = self._extract_text(response)
            if text:
                if use_cache:
                    self._set_cached(cache_key, text)
                return text
        except Exception:
            # Keep chat/advice endpoints responsive even when provider calls fail.
            pass

        return "AI service is temporarily unavailable. Please try again in a moment."

    def smart_farm_advisor(self, payload: dict[str, Any]) -> dict[str, str]:
        fallback = {
            "cropRecommendation": "No recommendation available right now.",
            "fertilizer": "Please run a soil test and apply fertilizers in balanced doses.",
            "irrigation": "Use crop-stage-based irrigation and avoid overwatering.",
            "warnings": "No critical warning generated.",
        }

        prompt = (
            "You are an agriculture expert. Based on the following farmer data:\n"
            f"Soil pH: {payload['ph']}\n"
            f"N: {payload['n']}, P: {payload['p']}, K: {payload['k']}\n"
            f"Moisture: {payload['moisture']}\n"
            f"Crop: {payload['crop']}\n"
            f"Location: {payload['location']}\n\n"
            "Return strict JSON with exactly these keys:\n"
            "cropRecommendation, fertilizer, irrigation, warnings\n"
            "Keep response simple and practical."
        )

        text = self._generate_text(prompt, cache_namespace="advisor", temperature=0.2)
        return self._parse_json_text(text, fallback)

    def chat(self, *, message: str, history: list[dict[str, str]] | None, language: str | None = None) -> str:
        normalized_history = (history or [])[-self._max_chat_history_items :]
        language_instruction = "Answer in simple English."
        if (language or "").strip().lower().startswith("hi"):
            language_instruction = "Answer in simple Hindi."

        history_text = "\n".join(
            [f"{item.get('role', 'user')}: {item.get('content', '')}" for item in normalized_history]
        )

        prompt = (
            "You are a helpful agriculture expert. Answer clearly in simple language.\n"
            f"{language_instruction}\n"
            "If the user asks anything unsafe or unrelated, gently redirect to farming guidance.\n\n"
            f"Previous conversation:\n{history_text or 'No prior history'}\n\n"
            f"User question: {message.strip()[:1000]}"
        )

        return self._generate_text(prompt, cache_namespace="chat", temperature=0.35)

    def farm_insights(self, payload: dict[str, float]) -> dict[str, Any]:
        profit = round(payload["revenue"] - payload["cost"], 2)
        fallback = {
            "profitAnalysis": f"Estimated profit is {profit}.",
            "incomeSuggestions": "Improve yield quality and market timing to improve income.",
            "costOptimization": "Reduce avoidable input losses and track per-acre spending.",
        }

        prompt = (
            "Analyze this farm data:\n"
            f"Yield: {payload['yield']}\n"
            f"Cost: {payload['cost']}\n"
            f"Revenue: {payload['revenue']}\n"
            f"Profit: {profit}\n\n"
            "Return strict JSON with keys: profitAnalysis, incomeSuggestions, costOptimization.\n"
            "Keep each value concise and practical."
        )

        text = self._generate_text(prompt, cache_namespace="insights", temperature=0.2)
        parsed = self._parse_json_text(text, fallback)
        return {
            "profit": profit,
            "profitAnalysis": parsed["profitAnalysis"],
            "incomeSuggestions": parsed["incomeSuggestions"],
            "costOptimization": parsed["costOptimization"],
        }

    def analyze_crop_image(self, *, image_bytes: bytes, mime_type: str, location: str | None, crop: str | None) -> dict[str, str]:
        fallback = {
            "disease": "Unable to confirm from image.",
            "cause": "Insufficient visual evidence.",
            "treatment": "Consult a local agronomy expert for field confirmation.",
            "prevention": "Maintain crop hygiene and regular monitoring.",
        }

        if not self.enabled:
            return fallback

        context_lines = []
        if crop:
            context_lines.append(f"Crop: {crop}")
        if location:
            context_lines.append(f"Location: {location}")

        prompt = (
            "You are an agriculture disease analyst. Review this crop image and provide strict JSON with keys: "
            "disease, cause, treatment, prevention. Keep practical farmer-friendly language.\n"
            + "\n".join(context_lines)
        )

        cache_key = self._cache_key(
            "image",
            {
                "prompt": prompt,
                "mime_type": mime_type,
                "image_hash": hashlib.sha256(image_bytes).hexdigest(),
            },
        )
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            response = self._model.generate_content(
                [
                    prompt,
                    {"mime_type": mime_type, "data": image_bytes},
                ],
                generation_config={
                    "temperature": 0.2,
                    "top_p": 0.9,
                    "max_output_tokens": 600,
                },
            )

            text = self._extract_text(response)
            parsed = self._parse_json_text(text, fallback)
            self._set_cached(cache_key, parsed)
            return parsed
        except Exception:
            return fallback

    def smart_alerts(self, payload: dict[str, Any]) -> list[str]:
        prompt = (
            "You are an agriculture early-warning assistant.\n"
            "Based on farm data, generate up to 5 short smart alerts.\n"
            "Return plain JSON array of strings only.\n\n"
            f"Data: {json.dumps(payload, ensure_ascii=True)}"
        )

        text = self._generate_text(prompt, cache_namespace="smart-alerts", temperature=0.25)
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                cleaned = [str(item).strip() for item in parsed if str(item).strip()]
                return cleaned[:5]
        except json.JSONDecodeError:
            pass

        # Fallback simple deterministic alerts
        alerts: list[str] = []
        moisture = payload.get("moisture")
        if isinstance(moisture, (int, float)) and moisture < 30:
            alerts.append("Low moisture detected. Plan irrigation in the next 24 hours.")
        if isinstance(payload.get("ph"), (int, float)) and payload["ph"] < 5.8:
            alerts.append("Soil appears acidic. Consider liming based on local recommendations.")
        if isinstance(payload.get("ph"), (int, float)) and payload["ph"] > 8.0:
            alerts.append("Soil appears alkaline. Use organic amendments and sulfur if advised locally.")
        if not alerts:
            alerts.append("No critical AI alerts right now. Continue regular monitoring.")
        return alerts[:5]

    def generate_expert_response(self, payload: dict[str, Any], *, regenerate: bool = False) -> str:
        query = str(payload.get("query") or "").strip()
        if not query:
            return "Please share the farmer query to generate a response."

        crop = str(payload.get("crop") or "").strip() or "Not specified"
        soil = str(payload.get("soil") or "").strip() or "Not specified"
        location = str(payload.get("location") or "").strip() or "Not specified"

        prompt = (
            "You are an experienced agriculture expert helping farmers.\n\n"
            f"Farmer Query:\n\"{query[:1200]}\"\n\n"
            "Additional Details:\n"
            f"Crop: {crop}\n"
            f"Soil Type: {soil}\n"
            f"Location: {location}\n\n"
            "Generate a clear and practical response including:\n\n"
            "1. Problem understanding\n"
            "2. Step-by-step solution\n"
            "3. Recommended products or techniques\n"
            "4. Preventive measures\n\n"
            "Guidelines:\n"
            "- Use simple language\n"
            "- Be practical and actionable\n"
            "- Avoid technical jargon\n"
            "- Keep response structured and helpful\n"
            "- Keep the response under 220 words\n"
        )

        response = self._generate_text(
            prompt,
            cache_namespace="expert-response",
            temperature=0.45 if regenerate else 0.25,
            max_output_tokens=420,
            use_cache=not regenerate,
        )
        return response.strip()[:2200]


ai_service = AIService()
