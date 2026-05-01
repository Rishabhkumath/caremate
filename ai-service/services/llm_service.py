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
                    "Give a complete, practical healthcare answer in plain English. "
                    "Use 3 to 5 short sentences. Include what the user can do now, "
                    "when to contact a doctor, and when to seek urgent help if relevant. "
                    "Do not use JSON, key-value pairs, headings, roleplay, jokes, or labels."
                ),
            }
        )
        return messages

    def _rule_based_response(self, message: str) -> Optional[str]:
        normalized = message.lower()

        emergency_terms = (
            "chest pain",
            "difficulty breathing",
            "shortness of breath",
            "severe bleeding",
            "stroke",
            "fainting",
            "unconscious",
            "suicide",
        )
        if any(term in normalized for term in emergency_terms):
            return (
                "These symptoms can be urgent and should not be handled by chat. "
                "Please call emergency services or go to the nearest emergency room now, especially if symptoms are sudden, severe, or worsening. "
                "If possible, have someone stay with the patient while help is arranged."
            )

        bp_terms = ("bp", "blood pressure", "hypertension", "systolic", "diastolic")
        if any(term in normalized for term in bp_terms):
            return (
                "For adults, a usual normal blood pressure is below 120/80 mm Hg; 130/80 or higher is considered high when it happens repeatedly. "
                "If a reading is high, sit quietly for 5 minutes and recheck it, then record both numbers with the time and any symptoms. "
                "A reading around 180/120 mm Hg or higher, or high BP with chest pain, breathing trouble, weakness, vision changes, or severe headache needs urgent medical help. "
                "For repeated high readings, book a doctor visit to review lifestyle, medicines, and proper home monitoring."
            )

        medication_terms = ("medicine", "medication", "tablet", "dose", "dosage", "insulin", "injection")
        if any(term in normalized for term in medication_terms):
            return (
                "Take medicines exactly as prescribed and do not change the dose or stop them without asking the doctor. "
                "If a dose is missed, follow the instructions on the prescription or contact the clinic or pharmacist instead of doubling doses unless told to. "
                "Seek urgent help for severe allergy symptoms such as swelling of the face, trouble breathing, fainting, or a widespread rash."
            )

        if "headache" in normalized:
            return (
                "For a mild headache, rest in a quiet place, drink water, eat something light if you have not eaten, and avoid bright screens for a while. "
                "You may use an over-the-counter pain reliever only if it is safe for you and you are not allergic or restricted from taking it. "
                "Contact a doctor if headaches happen often, last more than a day or two, or are unusual for you. "
                "Seek urgent care for a sudden severe headache, headache with vomiting, weakness, confusion, fever, stiff neck, vision changes, or after a head injury."
            )

        if "fever" in normalized:
            return (
                "For fever, rest, drink fluids, and monitor the temperature regularly. "
                "Light clothing and a comfortable room temperature can help, and fever medicine should only be used as directed for the patient. "
                "Contact a doctor if fever lasts more than 3 days, is very high, or occurs in an infant, elderly person, pregnancy, or someone with serious illness. "
                "Seek urgent help for breathing trouble, confusion, severe weakness, stiff neck, seizure, dehydration, or a rash that does not fade."
            )

        if "cough" in normalized:
            return (
                "For a mild cough, drink warm fluids, rest, avoid smoke or dust, and consider honey if the patient is over 1 year old. "
                "Watch for fever, wheezing, chest pain, or symptoms lasting more than a week. "
                "Contact a doctor if the cough is worsening, produces blood, or the patient has asthma, heart disease, or low oxygen readings. "
                "Seek urgent help for breathing difficulty, blue lips, severe chest pain, or confusion."
            )

        return None

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
        text = re.split(r"\b(User|Patient|Assistant)\s*:", text, maxsplit=1, flags=re.IGNORECASE)[0].strip()
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

    def _is_low_quality_response(self, text: str) -> bool:
        normalized = text.lower()
        if len(text.split()) < 18:
            return True

        bad_markers = (
            "wine",
            "tasting",
            "user:",
            "patient:",
            "assistant:",
            "i am not a healthcare",
            "as an ai language model",
            "i cannot provide",
            "lorem ipsum",
            "json",
        )
        if any(marker in normalized for marker in bad_markers):
            return True

        if re.search(r"\b(kill|suicide|bomb)\b", normalized):
            return True

        return False

    def _extract_ollama_content(self, data: Dict[str, Any]) -> str:
        message = data.get("message") or {}
        return (
            message.get("content")
            or data.get("response")
            or data.get("content")
            or ""
        ).strip()

    async def _post_chat(self, messages: list[Dict[str, str]], temperature: Optional[float] = None) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": self.temperature if temperature is None else temperature,
                "num_predict": self.max_tokens,
                "stop": ["User:", "Patient:"],
            },
        }

        async with httpx.AsyncClient(timeout=self.request_timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

            content = self._extract_ollama_content(data)
            if not content:
                retry_payload = {**payload, "options": {**payload["options"]}}
                retry_payload["options"].pop("stop", None)
                response = await client.post(f"{self.base_url}/api/chat", json=retry_payload)
                response.raise_for_status()
                data = response.json()
                content = self._extract_ollama_content(data)

        if not content:
            logger.warning("Ollama returned no content. Raw response keys: %s", list(data.keys()))
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

            deterministic_response = self._rule_based_response(message)
            if deterministic_response:
                logger.info("Using rule-based response for common healthcare intent")
                return deterministic_response

            messages = self._build_messages(message, context)
            ai_response = self._clean_response_text(await self._post_chat(messages))
            ai_response = self._limit_sentences(ai_response, max_sentences=5)
            if self._is_low_quality_response(ai_response):
                logger.warning("Ollama output failed quality checks")
                return ChatTemplates.get_fallback_response()
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
