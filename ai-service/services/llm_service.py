"""
LLM Service - Handles local Ollama communication for chatbot responses
"""

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from utils.prompt_templates import ChatTemplates, SystemPrompts

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        """Initialize Ollama configuration."""
        self.provider = (os.getenv("LLM_PROVIDER", "ollama") or "ollama").strip().lower()
        self.base_url = (os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") or "http://localhost:11434").rstrip("/")
        self.model = (
            os.getenv("OLLAMA_MODEL")
            or os.getenv("LLM_MODEL")
            or "tinyllama:latest"
        ).strip()
        self.max_tokens = int(
            os.getenv("OLLAMA_MAX_TOKENS")
            or os.getenv("LLM_MAX_TOKENS")
            or os.getenv("OPENAI_MAX_TOKENS")
            or 500
        )
        self.temperature = float(
            os.getenv("OLLAMA_TEMPERATURE")
            or os.getenv("LLM_TEMPERATURE")
            or os.getenv("OPENAI_TEMPERATURE")
            or 0.7
        )
        self.request_timeout = float(os.getenv("OLLAMA_TIMEOUT", 60))

        if not self.is_configured:
            logger.warning("Ollama is not fully configured. Check OLLAMA_BASE_URL and OLLAMA_MODEL.")

    @property
    def is_configured(self) -> bool:
        return bool(self.base_url and self.model)

    def _build_messages(self, message: str, context: Optional[Dict[str, Any]] = None):
        messages = [{"role": "system", "content": SystemPrompts.HEALTHCARE_ASSISTANT}]

        if context:
            history = context.get("history")
            if isinstance(history, list):
                for item in history[-10:]:
                    role = item.get("role")
                    content = item.get("content")
                    if role in {"user", "assistant", "system"} and isinstance(content, str) and content.strip():
                        messages.append({"role": role, "content": content.strip()})

            metadata = {k: v for k, v in context.items() if k != "history"}
            if metadata:
                messages.append(
                    {
                        "role": "system",
                        "content": f"Patient context: {json.dumps(metadata, ensure_ascii=True, default=str)}",
                    }
                )

        messages.append(
            {
                "role": "user",
                "content": (
                    f"{message}\n\n"
                    "Reply in plain English. Use 2 to 4 short sentences. "
                    "Do not use JSON, key-value pairs, headings, or labels."
                ),
            }
        )
        return messages

    def _looks_structured(self, text: str) -> bool:
        stripped = text.strip()
        if not stripped:
            return False

        if stripped.startswith("{") or stripped.startswith("["):
            return True

        structured_lines = 0
        for line in stripped.splitlines():
            clean_line = line.strip().lstrip("-* ").strip()
            if not clean_line:
                continue
            if re.match(r"^[A-Za-z][A-Za-z0-9_ /\-]{1,30}\s*:\s*.+$", clean_line):
                structured_lines += 1

        return structured_lines >= 2

    def _flatten_json_like_response(self, raw_text: str) -> str:
        try:
            data = json.loads(raw_text)
        except Exception:
            return ""

        if isinstance(data, dict):
            parts = []
            for key, value in data.items():
                pretty_key = str(key).replace("_", " ").strip().capitalize()
                if isinstance(value, list):
                    value_text = ", ".join(str(item) for item in value if str(item).strip())
                else:
                    value_text = str(value).strip()
                if value_text:
                    parts.append(f"{pretty_key}: {value_text}.")
            return " ".join(parts).strip()

        if isinstance(data, list):
            values = [str(item).strip() for item in data if str(item).strip()]
            return ". ".join(values).strip()

        return str(data).strip()

    def _flatten_key_value_lines(self, raw_text: str) -> str:
        parts = []
        for line in raw_text.splitlines():
            clean_line = line.strip().lstrip("-* ").strip()
            if not clean_line:
                continue
            match = re.match(r"^([A-Za-z][A-Za-z0-9_ /\-]{1,30})\s*:\s*(.+)$", clean_line)
            if not match:
                continue
            key = match.group(1).replace("_", " ").strip().capitalize()
            value = match.group(2).strip()
            if value:
                parts.append(f"{key}: {value}.")
        return " ".join(parts).strip()

    def _clean_response_text(self, raw_text: str) -> str:
        text = raw_text.strip()
        if not text:
            return text

        assistant_match = re.search(r"Assistant\s*:\s*(.+)", text, flags=re.IGNORECASE | re.DOTALL)
        if assistant_match:
            text = assistant_match.group(1).strip()

        text = re.sub(r"^(User|Patient|Assistant)\s*:\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"^\([^)]*\)\s*", "", text)
        text = re.sub(r"\b\d+\.\s*$", "", text).strip()
        text = re.sub(r"(Here are some simple steps to take:|In simple terms:)\s*$", "", text, flags=re.IGNORECASE).strip()

        if self._looks_structured(text):
            flattened = self._flatten_json_like_response(text) or self._flatten_key_value_lines(text)
            if flattened:
                text = flattened

        text = re.sub(r"\s+", " ", text).strip()
        text = re.sub(r"\s+([.,!?;:])", r"\1", text)
        return text

    def _limit_sentences(self, text: str, max_sentences: int = 4) -> str:
        parts = re.split(r"(?<=[.!?])\s+", text.strip())
        parts = [part.strip() for part in parts if part.strip()]
        if len(parts) <= max_sentences:
            return text.strip()
        return " ".join(parts[:max_sentences]).strip()

    async def _post_chat(self, messages: list[Dict[str, str]], temperature: Optional[float] = None) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature if temperature is None else temperature,
                "num_predict": self.max_tokens,
                "stop": ["User:", "Patient:", "Assistant:"],
            },
        }

        async with httpx.AsyncClient(timeout=self.request_timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        content = data.get("message", {}).get("content", "").strip()
        if not content:
            raise ValueError("Ollama returned an empty response")
        return content

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=8))
    async def generate_response(self, message: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate chatbot response using Ollama.
        """
        try:
            if not self.is_configured:
                logger.error("Ollama request skipped because the service is not configured")
                return ChatTemplates.get_configuration_response()

            messages = self._build_messages(message, context)
            ai_response = self._clean_response_text(await self._post_chat(messages))
            ai_response = self._limit_sentences(ai_response, max_sentences=4)
            logger.info("Generated Ollama response of length: %s", len(ai_response))
            return ai_response
        except httpx.ConnectError as exc:
            logger.error("Ollama connection error: %s", exc)
            return ChatTemplates.get_connectivity_response()
        except httpx.HTTPStatusError as exc:
            logger.error("Ollama HTTP error %s: %s", exc.response.status_code, exc)
            return ChatTemplates.get_fallback_response()
        except Exception as exc:
            logger.error("Error generating LLM response: %s", exc)
            return ChatTemplates.get_fallback_response()

    async def generate_structured_response(self, message: str, output_format: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a structured JSON response using Ollama.
        """
        try:
            if not self.is_configured:
                logger.error("Structured Ollama request skipped because the service is not configured")
                return {"error": "AI service is not configured. Add valid Ollama settings in ai-service/.env."}

            messages = [
                {"role": "system", "content": SystemPrompts.STRUCTURED_OUTPUT},
                {
                    "role": "user",
                    "content": (
                        f"Input: {message}\n\n"
                        f"Output format: {json.dumps(output_format)}\n\n"
                        "Return only valid JSON with the same keys."
                    ),
                },
            ]

            raw_response = await self._post_chat(messages, temperature=0.3)
            return json.loads(raw_response)
        except json.JSONDecodeError as exc:
            logger.error("Structured Ollama response was not valid JSON: %s", exc)
            return {"error": "Failed to parse structured response"}
        except Exception as exc:
            logger.error("Error generating structured response: %s", exc)
            return {"error": "Failed to generate structured response"}

    async def moderate_content(self, message: str) -> bool:
        """
        Minimal safety gate for healthcare chatbot content.
        """
        try:
            disallowed_markers = ("kill yourself", "how to make a bomb", "commit suicide")
            normalized = message.lower()
            return not any(marker in normalized for marker in disallowed_markers)
        except Exception as exc:
            logger.error("Error moderating content: %s", exc)
            return True
