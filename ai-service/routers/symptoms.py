"""
Symptom Analysis Router - Handles symptom matching and analysis
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import logging

from models.symptom_models import SymptomRequest, SymptomResponse
from services.symptom_analyzer import SymptomAnalyzer

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize service
symptom_analyzer = SymptomAnalyzer()

@router.post("/symptoms", response_model=SymptomResponse)
async def analyze_symptoms(request: SymptomRequest):
    """
    Analyze symptoms and provide possible conditions and advice
    
    - Input: List of symptoms (e.g., ["fever", "headache", "fatigue"])
    - Output: Possible conditions and general advice
    
    This is a rule-based system for educational purposes only
    """
    try:
        logger.info(f"Analyzing symptoms: {request.symptoms}")
        
        result = symptom_analyzer.analyze(
            symptoms=request.symptoms,
            duration=request.duration,
            severity=request.severity,
            patient_age=request.patient_age,
            patient_gender=request.patient_gender
        )
        
        return SymptomResponse(
            possible_conditions=result["conditions"],
            advice=result["advice"],
            urgency_level=result["urgency"],
            disclaimer="This analysis is for informational purposes only. Consult a healthcare provider for medical advice."
        )
        
    except Exception as e:
        logger.error(f"Error in symptom analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/symptoms/severity")
async def assess_severity(symptoms: List[str]):
    """
    Quick severity assessment for symptoms
    """
    try:
        urgency = symptom_analyzer.assess_urgency(symptoms)
        return {"urgency_level": urgency}
    except Exception as e:
        logger.error(f"Error in severity assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/common/{symptom}")
async def get_symptom_info(symptom: str):
    """
    Get information about a specific symptom
    """
    try:
        info = symptom_analyzer.get_symptom_info(symptom)
        return info
    except Exception as e:
        logger.error(f"Error getting symptom info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))