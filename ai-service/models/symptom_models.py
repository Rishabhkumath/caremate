"""
Symptom Models - Pydantic schemas for symptom analysis endpoints
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class SymptomRequest(BaseModel):
    """Request model for symptom analysis"""
    symptoms: List[str] = Field(
        ...,
        min_length=1,
        max_length=20,
        description="List of reported symptoms"
    )
    duration: Optional[str] = Field(
        None,
        description="How long symptoms have persisted (e.g., '2 days', '1 week')"
    )
    severity: Optional[str] = Field(
        None,
        description="Severity level",
        pattern="^(mild|moderate|severe)$"
    )
    patient_age: Optional[int] = Field(
        None,
        ge=0,
        le=120,
        description="Patient's age"
    )
    patient_gender: Optional[str] = Field(
        None,
        pattern="^(male|female|other)$",
        description="Patient's gender"
    )
    
    @field_validator('symptoms')
    @classmethod
    def validate_symptoms(cls, v):
        """Clean and validate symptoms list"""
        cleaned = [symptom.strip().lower() for symptom in v if symptom.strip()]
        if not cleaned:
            raise ValueError("At least one valid symptom required")
        return cleaned
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "symptoms": ["fever", "headache", "fatigue"],
                "duration": "2 days",
                "severity": "moderate",
                "patient_age": 35,
                "patient_gender": "female"
            }
        }
    )

class ConditionMatch(BaseModel):
    """Matched condition model"""
    name: str
    match_score: float = Field(..., ge=0, le=100)
    common_symptoms: List[str]
    description: str
    typical_duration: str
    should_see_doctor: bool

class SymptomResponse(BaseModel):
    """Response model for symptom analysis"""
    possible_conditions: List[ConditionMatch] = Field(
        ...,
        description="List of possible conditions matching symptoms"
    )
    advice: str = Field(
        ...,
        description="Health advice based on symptoms"
    )
    urgency_level: str = Field(
        ...,
        description="Urgency level (emergency, urgent, soon, normal, low)",
        pattern="^(emergency|urgent|soon|normal|low)$"
    )
    disclaimer: str = Field(
        "This analysis is for informational purposes only. Consult a healthcare provider for medical advice.",
        description="Medical disclaimer"
    )
    matched_symptoms: List[str] = Field(
        ...,
        description="Symptoms that were matched in the database"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "possible_conditions": [
                    {
                        "name": "Common Cold",
                        "match_score": 85.5,
                        "common_symptoms": ["runny nose", "cough", "sneezing"],
                        "description": "Viral infection of upper respiratory tract",
                        "typical_duration": "7-10 days",
                        "should_see_doctor": False
                    }
                ],
                "advice": "Rest, stay hydrated, and monitor symptoms...",
                "urgency_level": "normal",
                "matched_symptoms": ["fever", "headache"]
            }
        }
    )

class SeverityAssessment(BaseModel):
    """Quick severity assessment model"""
    urgency_level: str
    symptoms_count: int
    requires_attention: bool
    recommendation: str
