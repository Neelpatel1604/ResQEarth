"""AI Chat service for natural language disaster prevention assistance."""
import logging
from typing import List, Dict, Optional
from app.models.schemas import DisasterThreat, PreventionPlan, PreventionAction
from app.config import settings

logger = logging.getLogger(__name__)

# Try to import OpenAI, but make it optional
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI library not installed. AI chat will use fallback responses.")


class AIChatService:
    """Service for AI-powered chat assistance about disaster prevention."""
    
    def __init__(self):
        """Initialize the AI chat service."""
        self.openai_client = None
        self.use_openai = False
        
        if OPENAI_AVAILABLE and hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
            try:
                self.openai_client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                self.use_openai = True
                logger.info("OpenAI client initialized successfully")
            except Exception as e:
                logger.warning(f"Failed to initialize OpenAI client: {e}")
                self.use_openai = False
    
    def _format_disaster_context(self, disaster: Optional[DisasterThreat] = None) -> str:
        """Format disaster information as context for the AI."""
        if not disaster:
            return "No specific disaster context available."
        
        context = f"""
Disaster Information:
- Type: {disaster.type.value}
- Location: {disaster.location.name or f"{disaster.location.latitude}, {disaster.location.longitude}"}
- Risk Level: {disaster.risk_percentage}%
- Time Window: {disaster.time_window_hours} hours
- Confidence: {disaster.confidence or 'N/A'}%
"""
        
        if disaster.area_at_risk_hectares:
            context += f"- Area at Risk: {disaster.area_at_risk_hectares} hectares\n"
        
        if disaster.satellite_data:
            sat_data = disaster.satellite_data
            context += f"""
Satellite Data:
- Fuel Dryness: {sat_data.fuel_dryness or 'N/A'}%
- Temperature Anomaly: {sat_data.temperature_anomaly or 'N/A'}°C
- Wind Speed: {sat_data.wind_speed or 'N/A'} km/h
- Wind Direction: {sat_data.wind_direction or 'N/A'}°
- Rain Forecast: {sat_data.rain_forecast or 'N/A'} mm
- Soil Moisture: {sat_data.soil_moisture or 'N/A'}%
- Lightning Density: {sat_data.lightning_density or 'N/A'}
- Population at Risk: {sat_data.population_at_risk or 'N/A'}
"""
        
        return context
    
    def _format_prevention_plan_context(self, plan: Optional[PreventionPlan] = None) -> str:
        """Format prevention plan information as context for the AI."""
        if not plan:
            return "No prevention plan context available."
        
        context = f"""
Prevention Plan:
- Initial Risk: {plan.initial_risk}%
- Final Risk: {plan.final_risk}%
- Risk Reduction: {plan.risk_reduction}%
- Total Cost: ${plan.total_cost:,.2f}
- Success: {'Yes' if plan.success else 'No'}
- Calculation Time: {plan.calculation_time:.2f}s

Actions ({len(plan.actions)}):
"""
        
        for i, action in enumerate(plan.actions, 1):
            context += f"""
{i}. {action.type.value.replace('_', ' ').title()}
   - Location: {action.location.name or f"{action.location.latitude}, {action.location.longitude}"}
   - Cost: ${action.cost:,.2f}
   - Effectiveness: {action.effectiveness or 'N/A'}%
   - Quantity: {action.quantity or 1}
"""
        
        return context
    
    def _get_system_prompt(self) -> str:
        """Get the system prompt for the AI assistant."""
        return """You are an expert AI assistant for ResQ-Earth PREVENT, a disaster prediction and prevention platform.

Your role is to:
1. Answer questions about disaster risks, prevention strategies, and action effectiveness
2. Explain why certain prevention actions are recommended or why risks remain
3. Provide insights about satellite data and its implications
4. Suggest optimal prevention strategies based on budget and risk constraints
5. Explain technical concepts in accessible language

Guidelines:
- Be concise but informative
- Use specific data from the context when available
- Provide actionable recommendations
- Explain the reasoning behind your answers
- If asked about risk percentages or effectiveness, reference the actual data
- For questions about "why" something happened, analyze the satellite data and action combinations
- Always prioritize safety and effectiveness

Format your responses in clear, structured paragraphs. Use bullet points when listing multiple items."""
    
    def _get_fallback_response(self, query: str, disaster: Optional[DisasterThreat] = None, plan: Optional[PreventionPlan] = None) -> str:
        """Generate a fallback response when OpenAI is not available."""
        query_lower = query.lower()
        
        # Simple keyword-based responses
        if "risk" in query_lower or "why" in query_lower:
            if disaster:
                risk = disaster.risk_percentage
                response = f"Based on the current data, the disaster risk is {risk}%. "
                
                if plan:
                    response += f"The prevention plan has reduced the risk from {plan.initial_risk}% to {plan.final_risk}%. "
                    if plan.final_risk > 5:
                        response += "The remaining risk may be due to factors like wind conditions, fuel dryness, or incomplete coverage of prevention actions. "
                
                if disaster.satellite_data:
                    if disaster.satellite_data.wind_speed and disaster.satellite_data.wind_speed > 50:
                        response += "High wind speeds can increase fire spread risk. "
                    if disaster.satellite_data.fuel_dryness and disaster.satellite_data.fuel_dryness > 70:
                        response += "High fuel dryness increases ignition probability. "
                
                return response
            else:
                return "I need more context about the specific disaster to provide a detailed risk analysis. Please select a disaster on the map first."
        
        elif "action" in query_lower or "prevent" in query_lower or "recommend" in query_lower:
            if plan and plan.actions:
                response = "Based on the current prevention plan, the following actions are recommended:\n\n"
                for i, action in enumerate(plan.actions[:5], 1):  # Limit to 5 actions
                    response += f"{i}. {action.type.value.replace('_', ' ').title()} - "
                    response += f"Effectiveness: {action.effectiveness or 'N/A'}%, Cost: ${action.cost:,.2f}\n"
                return response
            else:
                return "Common prevention actions include controlled burns, water bomber pre-drops, goat crews for fuel reduction, and community alerts. The optimal combination depends on the specific disaster type, location, and budget constraints."
        
        elif "cost" in query_lower or "budget" in query_lower:
            if plan:
                return f"The current prevention plan costs ${plan.total_cost:,.2f}. This represents a cost of ${plan.total_cost / max(plan.risk_reduction, 1):,.2f} per percentage point of risk reduction."
            else:
                return "Prevention costs vary based on the actions selected. The genetic algorithm optimizes for maximum risk reduction per dollar spent."
        
        elif "satellite" in query_lower or "data" in query_lower:
            if disaster and disaster.satellite_data:
                return "Satellite data provides critical insights: fuel dryness indicates ignition risk, wind patterns show spread direction, temperature anomalies highlight hotspots, and soil moisture affects fire behavior. This data is used to predict disaster probability and optimize prevention strategies."
            else:
                return "Satellite data from NASA FIRMS, Sentinel satellites, and other sources provides real-time monitoring of environmental conditions that contribute to disaster risk."
        
        else:
            return "I can help you understand disaster risks, prevention strategies, and action effectiveness. Please ask specific questions about the disaster you're viewing, or ask about prevention recommendations, risk analysis, or satellite data interpretation."
    
    async def chat(
        self,
        query: str,
        disaster: Optional[DisasterThreat] = None,
        prevention_plan: Optional[PreventionPlan] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> str:
        """
        Generate an AI response to a user query.
        
        Args:
            query: User's question or message
            disaster: Optional disaster context
            prevention_plan: Optional prevention plan context
            chat_history: Optional conversation history
            
        Returns:
            AI-generated response string
        """
        if not query or not query.strip():
            return "Please ask a question about disaster prevention, risk analysis, or prevention strategies."
        
        # Build context
        context_parts = []
        
        if disaster:
            context_parts.append(self._format_disaster_context(disaster))
        
        if prevention_plan:
            context_parts.append(self._format_prevention_plan_context(prevention_plan))
        
        context = "\n".join(context_parts)
        
        # Use OpenAI if available
        if self.use_openai and self.openai_client:
            try:
                messages = [
                    {"role": "system", "content": self._get_system_prompt()}
                ]
                
                # Add context if available
                if context:
                    messages.append({
                        "role": "system",
                        "content": f"Context:\n{context}"
                    })
                
                # Add chat history
                if chat_history:
                    for msg in chat_history[-10:]:  # Limit to last 10 messages
                        messages.append({
                            "role": msg.get("role", "user"),
                            "content": msg.get("content", "")
                        })
                
                # Add current query
                messages.append({"role": "user", "content": query})
                
                # Call OpenAI API
                response = self.openai_client.chat.completions.create(
                    model="gpt-4o-mini",  # Using mini for cost efficiency
                    messages=messages,
                    temperature=0.7,
                    max_tokens=500,
                )
                
                return response.choices[0].message.content.strip()
                
            except Exception as e:
                logger.error(f"Error calling OpenAI API: {e}")
                # Fall back to rule-based responses
                return self._get_fallback_response(query, disaster, prevention_plan)
        else:
            # Use fallback responses
            return self._get_fallback_response(query, disaster, prevention_plan)


# Singleton instance
_chat_service: Optional[AIChatService] = None


def get_chat_service() -> AIChatService:
    """Get or create the AI chat service instance."""
    global _chat_service
    if _chat_service is None:
        _chat_service = AIChatService()
    return _chat_service

