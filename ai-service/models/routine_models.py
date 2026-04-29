"""
Routine Models - Pydantic schemas for routine recommendation endpoints
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

class MealPlan(BaseModel):
    """Meal plan item model"""
    time: str
    suggestion: str
    options: List[str] = Field(default_factory=list)

class ExerciseItem(BaseModel):
    """Exercise plan item model"""
    name: str
    duration: str
    frequency: str
    intensity: str
    benefits: str
    precautions: Optional[str] = None

class MedicationReminder(BaseModel):
    """Medication reminder model"""
    time: str
    type: str
    action: str
    note: Optional[str] = None

class RoutineResponse(BaseModel):
    """Response model for routine recommendation"""
    patient_id: str
    diet_plan: List[MealPlan] = Field(
        ...,
        description="Personalized meal plan with timings"
    )
    exercise_plan: List[ExerciseItem] = Field(
        ...,
        description="Personalized exercise recommendations"
    )
    sleep_recommendation: str = Field(
        ...,
        description="Sleep schedule and tips"
    )
    medication_reminders: List[MedicationReminder] = Field(
        ...,
        description="Medication reminder structure"
    )
    wellness_tips: List[str] = Field(
        ...,
        description="Daily wellness tips"
    )
    generated_at: str = Field(
        ...,
        description="Timestamp when routine was generated"
    )
    valid_until: Optional[str] = Field(
        None,
        description="When this routine expires"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "patient_id": "pat_12345",
                "diet_plan": [
                    {
                        "time": "Breakfast (7:00 AM)",
                        "suggestion": "Oatmeal with fruits and nuts",
                        "options": ["oatmeal with berries", "whole grain cereal"]
                    }
                ],
                "exercise_plan": [
                    {
                        "name": "Brisk Walking",
                        "duration": "30 minutes",
                        "frequency": "daily",
                        "intensity": "moderate",
                        "benefits": "Improves cardiovascular health"
                    }
                ],
                "sleep_recommendation": "7-9 hours of sleep...",
                "medication_reminders": [
                    {
                        "time": "8:00 AM",
                        "type": "medication_check",
                        "action": "Take prescribed medications"
                    }
                ],
                "wellness_tips": ["Stay hydrated", "Practice deep breathing"],
                "generated_at": "2024-01-15T08:00:00"
            }
        }
    )

class RoutineTemplate(BaseModel):
    """Routine template model"""
    name: str
    category: str
    suitable_for: List[str]
    template_data: Dict[str, Any]