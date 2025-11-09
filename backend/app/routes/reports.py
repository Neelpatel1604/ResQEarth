"""PDF Report generation endpoints."""
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from typing import Optional
from app.services.report_generator import get_report_generator
from app.services.firms_service import get_firms_service
from app.models.schemas import PreventionPlan, SimulationResult
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ReportRequest(BaseModel):
    """Request to generate a PDF report."""
    prevention_plan: PreventionPlan = Field(..., description="Prevention plan to generate report for")
    threat_id: str = Field(..., description="Disaster threat ID")
    include_simulation: bool = Field(True, description="Include simulation results if available")


@router.post("/reports/generate")
async def generate_report(request: ReportRequest):
    """
    Generate a PDF report for a prevention plan.
    
    Returns a PDF file containing:
    - Page 1: Executive Summary
    - Page 2: Satellite Data Analysis
    - Page 3: Detailed Action Plan
    
    Args:
        request: Report generation request with prevention plan and threat ID
        
    Returns:
        PDF file as response
    """
    try:
        # Fetch disaster information
        firms_service = get_firms_service()
        disasters = firms_service.fetch_wildfire_data(days=10)
        disaster = next((d for d in disasters if d.id == request.threat_id), None)
        
        if not disaster:
            raise HTTPException(
                status_code=404,
                detail=f"Disaster threat with ID '{request.threat_id}' not found"
            )
        
        # Generate PDF report
        report_generator = get_report_generator()
        
        # Optionally include simulation results (would need to be passed or fetched)
        simulation_result: Optional[SimulationResult] = None
        
        pdf_bytes = report_generator.generate_report(
            prevention_plan=request.prevention_plan,
            disaster=disaster,
            simulation_result=simulation_result,
        )
        
        # Return PDF as response
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="prevention_report_{request.threat_id}.pdf"'
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating PDF report: {str(e)}"
        )

