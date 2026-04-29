"""
Chatbot Router - Handles healthcare chat interactions
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
import logging

from models.chat_models import ChatRequest, ChatResponse
from services.llm_service import LLMService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize service
llm_service = LLMService()

@router.post("/", response_model=ChatResponse)
async def chat_with_assistant(request: ChatRequest):
    """
    Chat with the virtual nursing assistant
    
    - Ask health-related questions
    - Get explanations about symptoms
    - Receive medication guidance
    - Daily health advice
    
    Note: This assistant does NOT provide medical diagnoses
    """
    try:
        logger.info(f"Received chat message: {request.message[:50]}...")
        
        response = await llm_service.generate_response(
            message=request.message,
            context=request.context
        )
        
        return ChatResponse(
            response=response,
            disclaimer="This information is for educational purposes only. Not a medical diagnosis."
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/stream", response_model=ChatResponse)
async def stream_chat(request: ChatRequest):
    """
    Stream chat response (for future implementation)
    """
    raise HTTPException(status_code=501, detail="Streaming not implemented yet")

@router.get("/history/{session_id}")
async def get_chat_history(session_id: str):
    """
    Retrieve chat history for a session (placeholder)
    """
    return {"message": "Chat history endpoint - to be implemented"}