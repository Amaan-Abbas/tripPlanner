import os
import sys
import json
from typing import List, Optional
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Setup sys.path to ensure absolute imports resolve correctly
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the orchestrator coordinator
from backend.coordinator import run_agentic_trip_planner

app = FastAPI(
    title="Agentic AI Trip Planner Backend",
    description="Multi-agent orchestrator API providing real-time trip planning streaming",
    version="1.0.0"
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    destination: str = Field(..., description="Target destination city or place name")
    duration: int = Field(3, ge=1, le=7, description="Duration of the trip in days")
    budget_tier: str = Field("Moderate", description="Budget constraint: Budget, Moderate, Luxury")
    travel_style: str = Field("Cultural", description="Traveler profile style")
    interests: List[str] = Field(default=[], description="User interest tags")
    constraints: List[str] = Field(default=[], description="User special requirements or constraints")
    api_key: Optional[str] = Field(None, description="Deprecated body fallback for the Gemini API Key")

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend service status."""
    return {"status": "ok", "message": "Backend service is running."}

@app.post("/api/plan")
async def plan_trip(
    req: PlanRequest,
    llm_provider: Optional[str] = Header("gemini", alias="X-Llm-Provider"),
    gemini_api_key: Optional[str] = Header(None, alias="X-Gemini-Api-Key"),
    openai_api_key: Optional[str] = Header(None, alias="X-OpenAI-Api-Key"),
    brave_api_key: Optional[str] = Header(None, alias="X-Brave-Api-Key"),
    weather_api_key: Optional[str] = Header(None, alias="X-Weather-Api-Key")
):
    """
    Accepts trip parameters and streams progress logs, intermediate agent states,
    and the final structured trip plan using Server-Sent Events (SSE).
    """
    provider = (llm_provider or "gemini").lower().strip()
    
    if provider == "gemini":
        api_key = (gemini_api_key or req.api_key or "").strip()
        if len(api_key) < 10:
            raise HTTPException(status_code=400, detail="A valid Gemini API Key is required to run the agents when LLM provider is Gemini.")
    elif provider == "openai":
        api_key = (openai_api_key or "").strip()
        if len(api_key) < 10:
            raise HTTPException(status_code=400, detail="A valid OpenAI API Key is required to run the agents when LLM provider is OpenAI.")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported LLM provider: {provider}")
        
    inputs = {
        "destination": req.destination,
        "duration": req.duration,
        "budget_tier": req.budget_tier,
        "travel_style": req.travel_style,
        "interests": req.interests,
        "constraints": req.constraints,
        "llm_provider": provider,
        "brave_api_key": brave_api_key,
        "weather_api_key": weather_api_key
    }
    
    def generate_events():
        try:
            for event in run_agentic_trip_planner(api_key=api_key, inputs=inputs):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            err_event = {
                "type": "error",
                "message": f"Server processing error: {str(e)}"
            }
            yield f"data: {json.dumps(err_event)}\n\n"
            
    return StreamingResponse(generate_events(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
