"""
Prompt Templates - System prompts and templates for LLM interactions
"""

class SystemPrompts:
    """System prompts for different LLM roles"""
    
    HEALTHCARE_ASSISTANT = """You are a compassionate and knowledgeable Virtual Nursing Assistant for CareMate.
Your role is to provide helpful health information and guidance while being clear about your limitations.

GUIDELINES:
1. NEVER provide a medical diagnosis - always recommend consulting healthcare providers
2. Be empathetic and supportive in your responses
3. Use simple, clear language that patients can understand
4. When discussing symptoms, explain possible causes but emphasize this is not a diagnosis
5. For urgent symptoms (chest pain, difficulty breathing, severe bleeding), immediately advise seeking emergency care
6. Provide practical health tips and wellness advice
7. If you don't know something, be honest about it
8. Always include appropriate disclaimers
9. Answer in normal conversational English only
10. Do not output JSON, key-value pairs, code, XML, labels, roleplay, or headings
11. Do not write "User:", "Patient:", or "Assistant:"
12. Do not start with filler like "Sure", "Of course", or "In simple terms"
13. Keep replies to 2 to 4 short sentences
14. Give direct, readable answers to the user's exact question

GOOD EXAMPLE:
User: I have a mild headache. What should I do?
Assistant: A mild headache can happen from stress, dehydration, lack of sleep, or eye strain. Try resting, drinking water, and avoiding bright screens for a while. If it becomes severe, happens often, or comes with vomiting, weakness, or confusion, contact a doctor.

GOOD EXAMPLE:
User: Explain high blood pressure simply.
Assistant: High blood pressure means the force of blood pushing through your blood vessels stays too high. Over time, that can put extra strain on your heart and blood vessels. A doctor can help you manage it with lifestyle changes and sometimes medicine.

BAD EXAMPLES:
- symptom: headache
- advice: drink water
- {"answer":"..."}
- Patient: ...
- Assistant: ...

Remember: You are an assistant, not a doctor. Your purpose is to educate and guide, not to diagnose or treat."""

    STRUCTURED_OUTPUT = """You are a healthcare data assistant. Your task is to extract structured information from patient queries and return it in JSON format.
Always follow the specified output structure exactly. Ensure all medical terms are properly formatted."""

    SYMPTOM_ANALYSIS = """You are a symptom analysis assistant. Analyze the provided symptoms and return structured information about possible conditions.
Focus on common, non-emergency conditions and always include appropriate disclaimers."""


class ChatTemplates:
    """Templates for common chat responses"""
    
    @staticmethod
    def get_greeting_response(user_name: str = None) -> str:
        """Get personalized greeting"""
        base = "Hello! I'm your CareMate Virtual Nursing Assistant. How can I help you today?"
        if user_name:
            return f"Hello {user_name}! I'm your CareMate Virtual Nursing Assistant. How can I help you today?"
        return base
    
    @staticmethod
    def get_emergency_response() -> str:
        """Response for emergency situations"""
        return """⚠️ IMPORTANT: Your symptoms may indicate a medical emergency.

Please seek immediate medical attention:
• Call emergency services (911) right away
• Go to the nearest emergency room
• Do not wait for an online response

This is a potentially life-threatening situation that requires immediate professional medical care."""
    
    @staticmethod
    def get_see_doctor_response(specialty: str = None) -> str:
        """Response recommending doctor visit"""
        base = "Based on your symptoms, I recommend consulting with a healthcare provider."
        if specialty:
            return f"{base} A {specialty} specialist would be appropriate for your situation."
        return base
    
    @staticmethod
    def get_fallback_response() -> str:
        """Fallback response when AI is unavailable"""
        return """I apologize, but I'm having trouble processing your request right now. 
Please try again in a few moments. If this persists, contact our support team.

For immediate medical concerns, please consult a healthcare provider or call emergency services."""

    @staticmethod
    def get_configuration_response() -> str:
        """Response when the local Ollama service is not configured"""
        return """The AI assistant is not configured correctly yet.

Please make sure Ollama is running, your TinyLlama model is installed, and `ai-service/.env` contains valid `OLLAMA_BASE_URL` and `OLLAMA_MODEL` values.

Until that is fixed, I cannot generate real answers."""

    @staticmethod
    def get_rate_limit_response() -> str:
        """Response when the AI provider is busy"""
        return """The AI assistant is temporarily busy and hit its request limit.

Please wait a moment and try again."""

    @staticmethod
    def get_connectivity_response() -> str:
        """Response when the AI provider cannot be reached"""
        return """The AI assistant cannot reach the model provider right now.

Please check that Ollama is running locally and try again in a moment."""


class SymptomTemplates:
    """Templates for symptom-related responses"""
    
    COMMON_ADVICE = {
        "fever": "Rest, stay hydrated, and monitor your temperature. If fever persists over 3 days or exceeds 103°F (39.4°C), consult a doctor.",
        "headache": "Rest in a quiet, dark room. Stay hydrated. Over-the-counter pain relievers may help.",
        "cough": "Stay hydrated, use honey for soothing, and consider a humidifier.",
        "fatigue": "Ensure adequate sleep, maintain a balanced diet, and stay hydrated.",
        "nausea": "Eat small, bland meals. Stay hydrated with clear liquids. Avoid strong odors.",
        "body_aches": "Rest, apply heat or cold packs, and consider gentle stretching."
    }
    
    URGENCY_GUIDANCE = {
        "emergency": "🚨 EMERGENCY: Seek immediate medical attention!",
        "urgent": "⚠️ URGENT: Please see a doctor within 24 hours.",
        "soon": "📅 Schedule an appointment soon (within a few days).",
        "normal": "✅ Monitor symptoms. Consult doctor if they persist.",
        "low": "💚 Self-care recommended. No urgent action needed."
    }


class RoutineTemplates:
    """Templates for routine recommendations"""
    
    DIET_TIPS = {
        "breakfast": "Start your day with a balanced meal including protein, complex carbs, and fruits.",
        "lunch": "Include lean protein, vegetables, and whole grains for sustained energy.",
        "dinner": "Keep dinner light and eat at least 2-3 hours before bedtime.",
        "snacks": "Choose nutrient-dense snacks like fruits, nuts, or yogurt."
    }
    
    EXERCISE_TIPS = {
        "morning": "Morning exercise can boost metabolism and energy for the day.",
        "afternoon": "Afternoon workouts can help overcome midday slump.",
        "evening": "Evening exercise should be gentle to not interfere with sleep."
    }
    
    SLEEP_HYGIENE = [
        "Maintain consistent sleep-wake schedule",
        "Create a relaxing bedtime routine",
        "Keep bedroom cool, dark, and quiet",
        "Avoid screens 1 hour before bed",
        "Limit caffeine after 2 PM"
    ]
