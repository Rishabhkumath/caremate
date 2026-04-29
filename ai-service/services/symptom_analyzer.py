"""
Symptom Analyzer Service - Rule-based symptom matching and analysis
"""

import json
import os
import logging
from typing import List, Dict, Any, Optional
from difflib import get_close_matches

from utils.health_constants import URGENCY_LEVELS, COMMON_ADVICE

logger = logging.getLogger(__name__)

class SymptomAnalyzer:
    def __init__(self):
        """Initialize symptom analyzer with database"""
        self.symptom_db = self._load_symptom_database()
        self.common_symptoms = self._build_symptom_index()
        
    def _load_symptom_database(self) -> Dict[str, Any]:
        """Load symptom database from JSON file"""
        try:
            db_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'data', 
                'symptom_database.json'
            )
            with open(db_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Symptom database not found, using default data")
            return self._get_default_symptom_data()
        except Exception as e:
            logger.error(f"Error loading symptom database: {str(e)}")
            return self._get_default_symptom_data()
    
    def _build_symptom_index(self) -> Dict[str, List[str]]:
        """Build search index for symptoms"""
        index = {}
        for condition, data in self.symptom_db.get("conditions", {}).items():
            for symptom in data.get("symptoms", []):
                if symptom not in index:
                    index[symptom] = []
                index[symptom].append(condition)
        return index
    
    def analyze(
        self,
        symptoms: List[str],
        duration: Optional[str] = None,
        severity: Optional[str] = None,
        patient_age: Optional[int] = None,
        patient_gender: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze symptoms and return possible conditions
        
        Args:
            symptoms: List of reported symptoms
            duration: How long symptoms have persisted
            severity: Severity level (mild, moderate, severe)
            patient_age: Patient's age
            patient_gender: Patient's gender
            
        Returns:
            Dictionary with conditions, advice, and urgency
        """
        # Normalize symptoms (lowercase, strip)
        normalized_symptoms = [s.strip().lower() for s in symptoms]
        
        # Match symptoms to conditions
        matched_conditions = self._match_conditions(normalized_symptoms)
        
        # Assess urgency
        urgency = self._assess_urgency(normalized_symptoms, severity)
        
        # Generate advice
        advice = self._generate_advice(
            matched_conditions, 
            urgency, 
            normalized_symptoms
        )
        
        return {
            "conditions": matched_conditions[:5],  # Top 5 matches
            "advice": advice,
            "urgency": urgency,
            "matched_symptoms": normalized_symptoms
        }
    
    def _match_conditions(self, symptoms: List[str]) -> List[Dict[str, Any]]:
        """Match symptoms to possible conditions"""
        condition_scores = {}
        
        for symptom in symptoms:
            # Find close matches for the symptom
            matches = get_close_matches(
                symptom, 
                self.common_symptoms.keys(), 
                n=3, 
                cutoff=0.6
            )
            
            for match in matches:
                for condition in self.common_symptoms.get(match, []):
                    if condition not in condition_scores:
                        condition_scores[condition] = 0
                    condition_scores[condition] += 1
        
        # Sort conditions by match score
        sorted_conditions = sorted(
            condition_scores.items(), 
            key=lambda x: x[1], 
            reverse=True
        )
        
        # Format results
        results = []
        for condition, score in sorted_conditions:
            condition_data = self.symptom_db["conditions"].get(condition, {})
            results.append({
                "name": condition,
                "match_score": round((score / len(symptoms)) * 100, 1),
                "common_symptoms": condition_data.get("symptoms", [])[:5],
                "description": condition_data.get("description", ""),
                "typical_duration": condition_data.get("typical_duration", ""),
                "should_see_doctor": condition_data.get("should_see_doctor", False)
            })
        
        return results
    
    def _assess_urgency(
        self, 
        symptoms: List[str], 
        severity: Optional[str] = None
    ) -> str:
        """Assess urgency level based on symptoms and severity"""
        # Check for emergency symptoms
        emergency_symptoms = [
            "chest pain", "difficulty breathing", "unconscious",
            "severe bleeding", "head injury", "seizure"
        ]
        
        for symptom in symptoms:
            if any(emergency in symptom for emergency in emergency_symptoms):
                return URGENCY_LEVELS["EMERGENCY"]
        
        # Check severity
        if severity == "severe":
            return URGENCY_LEVELS["URGENT"]
        elif severity == "moderate":
            return URGENCY_LEVELS["SOON"]
        
        # Count symptoms
        if len(symptoms) >= 5:
            return URGENCY_LEVELS["SOON"]
        elif len(symptoms) >= 3:
            return URGENCY_LEVELS["NORMAL"]
        
        return URGENCY_LEVELS["LOW"]
    
    def _generate_advice(
        self,
        conditions: List[Dict],
        urgency: str,
        symptoms: List[str]
    ) -> str:
        """Generate health advice based on analysis"""
        advice_parts = []
        
        # Urgency-based advice
        if urgency == URGENCY_LEVELS["EMERGENCY"]:
            advice_parts.append(COMMON_ADVICE["EMERGENCY"])
        elif urgency == URGENCY_LEVELS["URGENT"]:
            advice_parts.append(COMMON_ADVICE["URGENT"])
        
        # General advice
        advice_parts.append(COMMON_ADVICE["GENERAL"])
        
        # Symptom-specific advice
        for symptom in symptoms:
            if symptom in COMMON_ADVICE["SYMPTOM_SPECIFIC"]:
                advice_parts.append(
                    COMMON_ADVICE["SYMPTOM_SPECIFIC"][symptom]
                )
        
        # Rest advice
        if any(s in symptoms for s in ["fever", "fatigue", "weakness"]):
            advice_parts.append(COMMON_ADVICE["REST"])
        
        return " ".join(advice_parts)
    
    def assess_urgency(self, symptoms: List[str]) -> str:
        """Quick urgency assessment"""
        return self._assess_urgency(symptoms, None)
    
    def get_symptom_info(self, symptom: str) -> Dict[str, Any]:
        """Get detailed information about a specific symptom"""
        symptom = symptom.lower()
        matches = get_close_matches(symptom, self.common_symptoms.keys(), n=1)
        
        if matches:
            matched_symptom = matches[0]
            conditions = self.common_symptoms.get(matched_symptom, [])
            
            return {
                "symptom": matched_symptom,
                "possible_conditions": conditions[:10],
                "common": True,
                "related_symptoms": self._find_related_symptoms(matched_symptom)
            }
        
        return {
            "symptom": symptom,
            "message": "Symptom not found in database",
            "common": False
        }
    
    def _find_related_symptoms(self, symptom: str) -> List[str]:
        """Find symptoms that commonly occur together"""
        related = set()
        conditions = self.common_symptoms.get(symptom, [])
        
        for condition in conditions[:3]:
            condition_data = self.symptom_db["conditions"].get(condition, {})
            for s in condition_data.get("symptoms", [])[:3]:
                if s != symptom:
                    related.add(s)
        
        return list(related)[:5]
    
    def _get_default_symptom_data(self) -> Dict[str, Any]:
        """Return default symptom data if file not found"""
        return {
            "conditions": {
                "Common Cold": {
                    "symptoms": ["runny nose", "sneezing", "cough", "sore throat", "mild fever"],
                    "description": "Viral infection of upper respiratory tract",
                    "typical_duration": "7-10 days",
                    "should_see_doctor": False
                },
                "Influenza": {
                    "symptoms": ["fever", "chills", "body aches", "fatigue", "cough", "headache"],
                    "description": "Viral infection affecting respiratory system",
                    "typical_duration": "5-7 days",
                    "should_see_doctor": True
                },
                "Allergies": {
                    "symptoms": ["sneezing", "itchy eyes", "runny nose", "watery eyes"],
                    "description": "Immune response to environmental triggers",
                    "typical_duration": "Varies with exposure",
                    "should_see_doctor": False
                },
                "Migraine": {
                    "symptoms": ["severe headache", "nausea", "sensitivity to light", "sensitivity to sound"],
                    "description": "Intense throbbing headache",
                    "typical_duration": "4-72 hours",
                    "should_see_doctor": True
                }
            }
        }