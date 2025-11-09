"""AI Chat endpoints for disaster prevention assistance."""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from app.services.ai_chat_service import get_chat_service
from app.services.firms_service import get_firms_service
from app.models.schemas import DisasterThreat, PreventionPlan
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ChatMessage(BaseModel):
    """Chat message model."""
    role: str = Field(..., description="Message role: 'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Request for AI chat."""
    query: str = Field(..., description="User's question or message")
    threat_id: Optional[str] = Field(None, description="Optional disaster threat ID for context")
    prevention_plan_id: Optional[str] = Field(None, description="Optional prevention plan ID for context")
    chat_history: Optional[List[ChatMessage]] = Field(None, description="Previous conversation history")


class ChatResponse(BaseModel):
    """Response from AI chat."""
    response: str = Field(..., description="AI-generated response")
    threat_id: Optional[str] = Field(None, description="Disaster threat ID if context was used")
    prevention_plan_id: Optional[str] = Field(None, description="Prevention plan ID if context was used")


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with AI assistant about disaster prevention.
    
    This endpoint provides AI-powered assistance for:
    - Explaining disaster risks and prevention strategies
    - Analyzing prevention plan effectiveness
    - Interpreting satellite data
    - Recommending optimal actions
    
    Args:
        request: Chat request with query and optional context
        
    Returns:
        AI-generated response with context information
    """
    try:
        chat_service = get_chat_service()
        
        # Fetch disaster context if threat_id provided
        disaster: Optional[DisasterThreat] = None
        if request.threat_id:
            try:
                firms_service = get_firms_service()
                disasters = firms_service.fetch_wildfire_data(days=10)
                disaster = next((d for d in disasters if d.id == request.threat_id), None)
                
                if not disaster:
                    logger.warning(f"Disaster threat {request.threat_id} not found")
            except Exception as e:
                logger.error(f"Error fetching disaster context: {e}")
        
        # TODO: Fetch prevention plan context if prevention_plan_id provided
        # For now, we'll skip this as prevention plans aren't stored persistently
        prevention_plan: Optional[PreventionPlan] = None
        
        # Convert chat history format
        chat_history = None
        if request.chat_history:
            chat_history = [
                {"role": msg.role, "content": msg.content}
                for msg in request.chat_history
            ]
        
        # Generate AI response
        response = await chat_service.chat(
            query=request.query,
            disaster=disaster,
            prevention_plan=prevention_plan,
            chat_history=chat_history,
        )
        
        return ChatResponse(
            response=response,
            threat_id=request.threat_id,
            prevention_plan_id=request.prevention_plan_id,
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating chat response: {str(e)}"
        )

