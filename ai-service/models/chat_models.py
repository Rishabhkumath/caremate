"""
Chat Models - Pydantic schemas for chatbot endpoints
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime

class ChatRequest(BaseModel):
    """Request model for chat endpoint"""
    message: str = Field(
        ..., 
        min_length=1, 
        max_length=2000,
        description="User's message to the assistant"
    )
    context: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional context (patient history, preferences)"
    )
    session_id: Optional[str] = Field(
        None,
        description="Session ID for conversation continuity"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "message": "What can help with my headache?",
                "session_id": "sess_12345"
            }
        }
    )

class ChatResponse(BaseModel):
    """Response model for chat endpoint"""
    response: str = Field(
        ...,
        description="AI-generated response"
    )
    disclaimer: str = Field(
        "This information is for educational purposes only. Not a medical diagnosis.",
        description="Medical disclaimer"
    )
    suggested_questions: Optional[List[str]] = Field(
        None,
        description="Follow-up questions the user might ask"
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Response timestamp"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "response": "For headaches, try resting in a dark room...",
                "disclaimer": "This information is for educational purposes only...",
                "suggested_questions": ["When should I see a doctor?", "What causes headaches?"]
            }
        }
    )

class ChatHistory(BaseModel):
    """Chat history model"""
    session_id: str
    messages: List[Dict[str, str]]
    created_at: datetime
    updated_at: datetime