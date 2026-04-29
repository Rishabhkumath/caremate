"""
Health Constants - Common healthcare constants and utilities
"""

from typing import Dict, List, Any

# Urgency levels for symptom assessment
URGENCY_LEVELS = {
    "EMERGENCY": "emergency",
    "URGENT": "urgent",
    "SOON": "soon",
    "NORMAL": "normal",
    "LOW": "low"
}

# Common advice for various situations
COMMON_ADVICE = {
    "EMERGENCY": "This may be a medical emergency. Please call emergency services immediately.",
    "URGENT": "Please see a healthcare provider urgently, within 24 hours.",
    "GENERAL": "Monitor your symptoms. If they worsen or persist, consult a healthcare provider.",
    "REST": "Ensure you get adequate rest and stay hydrated.",
    "SYMPTOM_SPECIFIC": {
        "fever": "Rest and stay hydrated. Monitor your temperature regularly.",
        "headache": "Rest in a quiet, dark room. Stay hydrated.",
        "cough": "Honey and warm fluids may help soothe your throat.",
        "fatigue": "Prioritize rest and maintain a balanced diet.",
        "nausea": "Eat small, bland meals. Avoid strong smells."
    }
}

# Normal ranges for vital signs
VITAL_RANGES = {
    "temperature": {
        "celsius": {"min": 36.1, "max": 37.2, "unit": "°C"},
        "fahrenheit": {"min": 97.0, "max": 99.0, "unit": "°F"}
    },
    "heart_rate": {
        "adult": {"min": 60, "max": 100, "unit": "bpm"},
        "child": {"min": 70, "max": 120, "unit": "bpm"},
        "athlete": {"min": 40, "max": 60, "unit": "bpm"}
    },
    "blood_pressure": {
        "systolic": {"min": 90, "max": 120, "unit": "mmHg"},
        "diastolic": {"min": 60, "max": 80, "unit": "mmHg"}
    },
    "oxygen_saturation": {
        "min": 95, "max": 100, "unit": "%"
    },
    "respiratory_rate": {
        "adult": {"min": 12, "max": 20, "unit": "breaths/min"},
        "child": {"min": 18, "max": 30, "unit": "breaths/min"}
    }
}

# Common symptom categories
SYMPTOM_CATEGORIES = {
    "respiratory": ["cough", "shortness of breath", "wheezing", "chest congestion"],
    "gastrointestinal": ["nausea", "vomiting", "diarrhea", "abdominal pain", "constipation"],
    "neurological": ["headache", "dizziness", "confusion", "numbness", "tingling"],
    "musculoskeletal": ["muscle pain", "joint pain", "back pain", "stiffness"],
    "cardiovascular": ["chest pain", "palpitations", "swelling in legs"],
    "general": ["fever", "fatigue", "weakness", "chills", "sweating"],
    "dermatological": ["rash", "itching", "dry skin", "hives"],
    "ENT": ["sore throat", "runny nose", "ear pain", "sinus pressure"]
}

# Emergency symptoms requiring immediate attention
EMERGENCY_SYMPTOMS = [
    "chest pain",
    "difficulty breathing",
    "severe bleeding",
    "unconscious",
    "seizure",
    "head injury",
    "sudden severe headache",
    "sudden vision loss",
    "slurred speech",
    "facial drooping",
    "arm weakness",
    "severe allergic reaction",
    "suicidal thoughts"
]

# Age groups for recommendations
AGE_GROUPS = {
    "infant": {"min": 0, "max": 1},
    "toddler": {"min": 1, "max": 3},
    "child": {"min": 3, "max": 12},
    "teen": {"min": 12, "max": 18},
    "adult": {"min": 18, "max": 65},
    "senior": {"min": 65, "max": 120}
}

# Medication timing suggestions
MEDICATION_TIMES = {
    "morning": "8:00 AM",
    "afternoon": "1:00 PM",
    "evening": "6:00 PM",
    "bedtime": "9:00 PM",
    "with_food": "Take with meals",
    "empty_stomach": "Take 30 minutes before meals"
}

# Wellness tips by category
WELLNESS_TIPS = {
    "hydration": [
        "Drink at least 8 glasses of water daily",
        "Start your day with a glass of water",
        "Keep a water bottle handy as reminder"
    ],
    "stress": [
        "Practice deep breathing for 5 minutes daily",
        "Take short breaks during work",
        "Try meditation or mindfulness"
    ],
    "sleep": [
        "Maintain consistent sleep schedule",
        "Avoid screens 1 hour before bed",
        "Create relaxing bedtime routine"
    ],
    "exercise": [
        "Aim for 30 minutes of activity daily",
        "Take stairs instead of elevator",
        "Stretch every hour if sitting long"
    ],
    "nutrition": [
        "Eat rainbow of fruits and vegetables",
        "Limit processed foods and sugar",
        "Don't skip breakfast"
    ]
}

# Health check reminders
HEALTH_CHECK_REMINDERS = {
    "daily": [
        "Check blood pressure if hypertensive",
        "Monitor blood sugar if diabetic",
        "Take prescribed medications"
    ],
    "weekly": [
        "Track weight",
        "Review any new symptoms",
        "Plan healthy meals"
    ],
    "monthly": [
        "Check medication supply",
        "Review health goals",
        "Schedule follow-up appointments"
    ],
    "yearly": [
        "Annual physical examination",
        "Dental check-up",
        "Eye examination",
        "Recommended screenings"
    ]
}

# Medical disclaimer
MEDICAL_DISCLAIMER = """This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."""

# Default responses for common queries
DEFAULT_RESPONSES = {
    "greeting": "Hello! I'm your CareMate Virtual Nursing Assistant. How can I help you today?",
    "fallback": "I'm not sure I understand. Could you please rephrase your question?",
    "emergency": "If this is a medical emergency, please call emergency services immediately.",
    "thanks": "You're welcome! Take care of your health. Is there anything else I can help with?"
}