"""
CareMate AI Service - Main Application
Virtual Nursing Assistant powered by FastAPI and Ollama
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "info").upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routers
from routers import chatbot, symptoms, routines

# Initialize FastAPI app
app = FastAPI(
    title="CareMate AI Service - Virtual Nursing Assistant",
    description="AI-powered healthcare assistant for symptom analysis, health advice, and daily routines",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(chatbot.router, prefix="/api/chat", tags=["Chatbot"])
app.include_router(symptoms.router, prefix="/api/analyze", tags=["Symptom Analysis"])
app.include_router(routines.router, prefix="/api", tags=["Routine Recommendations"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "CareMate AI Service",
        "status": "running",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "endpoints": {
            "chat": "/api/chat",
            "analyze_symptoms": "/api/analyze/symptoms",
            "recommend_routine": "/api/recommend-routine/{patientId}",
            "docs": "/api/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Detailed health check for monitoring"""
    provider = (os.getenv("LLM_PROVIDER", "ollama") or "ollama").strip().lower()
    ollama_base_url = (os.getenv("OLLAMA_BASE_URL", "http://localhost:11434") or "").strip()
    ollama_model = (os.getenv("OLLAMA_MODEL") or os.getenv("LLM_MODEL") or "tinyllama:latest").strip()
    is_configured = provider == "ollama" and bool(ollama_base_url and ollama_model)
    return {
        "status": "healthy",
        "timestamp": __import__("datetime").datetime.now().isoformat(),
        "provider": provider,
        "services": {
            "ollama": {
                "status": "configured" if is_configured else "missing_configuration",
                "base_url": ollama_base_url,
                "model": ollama_model
            }
        },
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
