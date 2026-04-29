"""
Routine Advisor Service - Generates personalized daily health routines
"""

import json
import os
import logging
import random
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class RoutineAdvisor:
    def __init__(self):
        """Initialize routine advisor with templates"""
        self.templates = self._load_templates()
        self.routine_cache = {}
        
    def _load_templates(self) -> Dict[str, Any]:
        """Load routine templates from JSON file"""
        try:
            templates_path = os.path.join(
                os.path.dirname(__file__), 
                '..', 
                'data', 
                'routine_templates.json'
            )
            with open(templates_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning("Routine templates not found, using default data")
            return self._get_default_templates()
        except Exception as e:
            logger.error(f"Error loading templates: {str(e)}")
            return self._get_default_templates()
    
    def generate_routine(
        self,
        patient_id: str,
        age: Optional[int] = None,
        conditions: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized daily routine
        
        Args:
            patient_id: Unique patient identifier
            age: Patient's age (for age-appropriate recommendations)
            conditions: List of medical conditions
            
        Returns:
            Complete daily routine with diet, exercise, sleep, and medications
        """
        # Adjust based on age
        age_group = self._determine_age_group(age)
        
        # Select appropriate templates
        diet = self._generate_diet_plan(age_group, conditions)
        exercise = self._generate_exercise_plan(age_group, conditions)
        sleep = self._generate_sleep_recommendation(age_group)
        medications = self._generate_medication_reminders(conditions)
        tips = self._generate_wellness_tips(age_group, conditions)
        
        # Cache the routine
        routine = {
            "diet": diet,
            "exercise": exercise,
            "sleep": sleep,
            "medications": medications,
            "tips": tips,
            "generated_for": patient_id,
            "valid_until": datetime.now().replace(hour=23, minute=59, second=59).isoformat()
        }
        
        self.routine_cache[patient_id] = routine
        return routine
    
    def _determine_age_group(self, age: Optional[int]) -> str:
        """Determine age group for appropriate recommendations"""
        if age is None:
            return "adult"
        elif age < 12:
            return "child"
        elif age < 18:
            return "teen"
        elif age < 65:
            return "adult"
        else:
            return "senior"
    
    def _generate_diet_plan(
        self, 
        age_group: str, 
        conditions: Optional[List[str]]
    ) -> List[Dict[str, str]]:
        """Generate personalized diet plan"""
        templates = self.templates.get("diet_plans", {})
        
        # Select base diet template
        if conditions and "diabetes" in str(conditions).lower():
            base_diet = templates.get("diabetes", templates.get("balanced", {}))
        elif conditions and "hypertension" in str(conditions).lower():
            base_diet = templates.get("low_sodium", templates.get("balanced", {}))
        else:
            base_diet = templates.get(age_group, templates.get("adult", {}))
        
        # Customize meals
        meals = []
        meal_times = ["Breakfast (7:00 AM)", "Morning Snack (10:00 AM)", 
                     "Lunch (1:00 PM)", "Afternoon Snack (4:00 PM)", 
                     "Dinner (7:00 PM)"]
        
        for i, meal_time in enumerate(meal_times):
            if i < len(base_diet.get("meals", [])):
                meals.append({
                    "time": meal_time,
                    "suggestion": base_diet["meals"][i],
                    "options": self._get_meal_options(base_diet["meals"][i])
                })
        
        return meals
    
    def _generate_exercise_plan(
        self,
        age_group: str,
        conditions: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """Generate personalized exercise plan"""
        templates = self.templates.get("exercise_plans", {})
        
        # Check for restrictions
        has_restrictions = False
        if conditions:
            restricted_conditions = ["heart disease", "arthritis", "injury"]
            has_restrictions = any(
                c in str(conditions).lower() 
                for c in restricted_conditions
            )
        
        # Select appropriate exercises
        if has_restrictions:
            exercises = templates.get("gentle", templates.get("general", []))
        else:
            exercises = templates.get(age_group, templates.get("adult", []))
        
        # Format exercise plan
        exercise_plan = []
        for exercise in exercises[:4]:  # Limit to 4 exercises
            exercise_plan.append({
                "name": exercise.get("name", "Walking"),
                "duration": exercise.get("duration", "30 minutes"),
                "frequency": exercise.get("frequency", "daily"),
                "intensity": exercise.get("intensity", "moderate"),
                "benefits": exercise.get("benefits", "Improves cardiovascular health"),
                "precautions": exercise.get("precautions", "Consult doctor before starting")
            })
        
        return exercise_plan
    
    def _generate_sleep_recommendation(self, age_group: str) -> str:
        """Generate sleep recommendations based on age"""
        recommendations = {
            "child": "10-12 hours of sleep. Maintain consistent bedtime routine.",
            "teen": "8-10 hours of sleep. Limit screen time before bed.",
            "adult": "7-9 hours of sleep. Create a relaxing bedtime environment.",
            "senior": "7-8 hours of sleep. Consider short naps if needed."
        }
        
        base_rec = recommendations.get(age_group, recommendations["adult"])
        
        # Add general tips
        tips = [
            "Maintain consistent sleep-wake schedule",
            "Avoid caffeine 6 hours before bedtime",
            "Keep bedroom dark and quiet",
            "Limit screen time 1 hour before sleep"
        ]
        
        return f"{base_rec} Tips: {'; '.join(tips[:3])}"
    
    def _generate_medication_reminders(
        self,
        conditions: Optional[List[str]]
    ) -> List[Dict[str, str]]:
        """Generate medication reminder structure"""
        if not conditions:
            return [{
                "time": "As prescribed",
                "note": "No specific medications in routine"
            }]
        
        # Generic reminder structure (actual meds from patient's profile)
        reminders = []
        times = ["8:00 AM", "1:00 PM", "8:00 PM"]
        
        for i, time in enumerate(times):
            reminders.append({
                "time": time,
                "type": "medication_check",
                "action": f"Check and take prescribed medications",
                "note": "Use medication tracker app to log doses"
            })
        
        return reminders
    
    def _generate_wellness_tips(
        self,
        age_group: str,
        conditions: Optional[List[str]]
    ) -> List[str]:
        """Generate wellness tips based on profile"""
        templates = self.templates.get("wellness_tips", {})
        
        # Base tips
        tips = templates.get("general", [
            "Stay hydrated - drink 8 glasses of water daily",
            "Practice deep breathing for stress relief",
            "Take short breaks during prolonged sitting"
        ])
        
        # Age-specific tips
        if age_group in templates:
            tips.extend(templates[age_group][:2])
        
        # Condition-specific tips
        if conditions:
            for condition in conditions:
                condition_key = condition.lower().replace(" ", "_")
                if condition_key in templates:
                    tips.extend(templates[condition_key][:1])
        
        return tips[:5]  # Return top 5 tips
    
    def _get_meal_options(self, meal_suggestion: str) -> List[str]:
        """Get alternative options for a meal suggestion"""
        options_map = {
            "oatmeal": ["oatmeal with berries", "whole grain cereal", "quinoa bowl"],
            "yogurt": ["greek yogurt", "cottage cheese", "smoothie"],
            "salad": ["green salad", "vegetable soup", "roasted vegetables"],
            "chicken": ["grilled chicken", "baked fish", "tofu"],
            "rice": ["brown rice", "quinoa", "whole wheat pasta"]
        }
        
        for key, options in options_map.items():
            if key in meal_suggestion.lower():
                return options
        
        return ["similar healthy alternatives"]
    
    def get_templates(self) -> Dict[str, Any]:
        """Get all available templates"""
        return self.templates
    
    def customize_routine(self, patient_id: str, preferences: Dict) -> Dict[str, Any]:
        """Customize routine based on patient preferences"""
        if patient_id not in self.routine_cache:
            return {"error": "No routine found for patient"}
        
        routine = self.routine_cache[patient_id]
        
        # Apply customizations
        if "preferred_meal_times" in preferences:
            for i, meal in enumerate(routine["diet"]):
                if i < len(preferences["preferred_meal_times"]):
                    meal["time"] = preferences["preferred_meal_times"][i]
        
        if "exercise_preferences" in preferences:
            # Filter exercises based on preferences
            routine["exercise"] = [
                e for e in routine["exercise"]
                if e["name"].lower() in preferences["exercise_preferences"]
            ]
        
        if "sleep_time" in preferences:
            routine["sleep"] = f"Sleep by {preferences['sleep_time']}. " + routine["sleep"]
        
        return routine
    
    def _get_default_templates(self) -> Dict[str, Any]:
        """Return default templates if file not found"""
        return {
            "diet_plans": {
                "adult": {
                    "meals": [
                        "Oatmeal with fruits and nuts",
                        "Greek yogurt with berries",
                        "Grilled chicken salad with olive oil",
                        "Apple with almond butter",
                        "Baked salmon with quinoa and vegetables"
                    ]
                },
                "senior": {
                    "meals": [
                        "Scrambled eggs with whole grain toast",
                        "Smoothie with protein powder",
                        "Vegetable soup with crackers",
                        "Cottage cheese with peaches",
                        "Mashed potatoes with soft cooked fish"
                    ]
                },
                "diabetes": {
                    "meals": [
                        "Steel-cut oats with cinnamon",
                        "Handful of almonds",
                        "Turkey and avocado wrap",
                        "Celery with peanut butter",
                        "Grilled fish with steamed vegetables"
                    ]
                }
            },
            "exercise_plans": {
                "adult": [
                    {"name": "Brisk Walking", "duration": "30 minutes", "frequency": "daily", "intensity": "moderate"},
                    {"name": "Swimming", "duration": "20 minutes", "frequency": "3 times/week", "intensity": "moderate"},
                    {"name": "Yoga", "duration": "15 minutes", "frequency": "daily", "intensity": "light"}
                ],
                "gentle": [
                    {"name": "Chair Yoga", "duration": "15 minutes", "frequency": "daily", "intensity": "light"},
                    {"name": "Walking", "duration": "20 minutes", "frequency": "daily", "intensity": "light"},
                    {"name": "Stretching", "duration": "10 minutes", "frequency": "daily", "intensity": "light"}
                ]
            },
            "wellness_tips": {
                "general": [
                    "Stay hydrated throughout the day",
                    "Practice mindful breathing for stress relief",
                    "Take breaks from screens every hour",
                    "Maintain social connections"
                ]
            }
        }