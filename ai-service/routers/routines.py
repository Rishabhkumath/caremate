"""
Routine Recommendation Router - Handles daily health routine generation
"""

from fastapi import APIRouter, HTTPException, Path
from typing import Optional
import logging

from models.routine_models import RoutineResponse
from services.routine_advisor import RoutineAdvisor

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize service
routine_advisor = RoutineAdvisor()

@router.get("/recommend-routine/{patient_id}", response_model=RoutineResponse)
async def recommend_routine(
    patient_id: str = Path(..., description="Patient ID"),
    age: Optional[int] = None,
    conditions: Optional[str] = None
):
    """
    Generate personalized daily health routine
    
    - Diet recommendations based on templates
    - Exercise plans suitable for patient
    - Sleep schedule optimization
    - Medication reminders structure
    """
    try:
        logger.info(f"Generating routine for patient: {patient_id}")
        
        routine = routine_advisor.generate_routine(
            patient_id=patient_id,
            age=age,
            conditions=conditions.split(",") if conditions else []
        )
        
        return RoutineResponse(
            patient_id=patient_id,
            diet_plan=routine["diet"],
            exercise_plan=routine["exercise"],
            sleep_recommendation=routine["sleep"],
            medication_reminders=routine["medications"],
            wellness_tips=routine["tips"],
            generated_at=__import__("datetime").datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Error generating routine: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates")
async def get_routine_templates():
    """
    Get all available routine templates
    """
    try:
        templates = routine_advisor.get_templates()
        return {"templates": templates}
    except Exception as e:
        logger.error(f"Error getting templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/customize/{patient_id}")
async def customize_routine(patient_id: str, preferences: dict):
    """
    Customize routine based on patient preferences
    """
    try:
        customized = routine_advisor.customize_routine(patient_id, preferences)
        return customized
    except Exception as e:
        logger.error(f"Error customizing routine: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))