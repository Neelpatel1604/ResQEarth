"""PDF Report Generator for prevention plans."""
import io
from datetime import datetime
from typing import Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from app.models.schemas import PreventionPlan, DisasterThreat, SimulationResult
import logging

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate PDF reports for prevention plans."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#333333'),
            spaceAfter=20,
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
        ))
        
        # Success style (green)
        self.styles.add(ParagraphStyle(
            name='SuccessText',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.HexColor('#10b981'),
            spaceAfter=10,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold',
        ))
        
        # Info style
        self.styles.add(ParagraphStyle(
            name='InfoText',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#666666'),
            spaceAfter=8,
        ))
    
    def generate_report(
        self,
        prevention_plan: PreventionPlan,
        disaster: DisasterThreat,
        simulation_result: Optional[SimulationResult] = None,
    ) -> bytes:
        """
        Generate a PDF report for a prevention plan.
        
        Args:
            prevention_plan: The prevention plan to report on
            disaster: The disaster threat information
            simulation_result: Optional simulation results
            
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18,
        )
        
        story = []
        
        # Page 1: Executive Summary
        story.extend(self._generate_executive_summary(prevention_plan, disaster, simulation_result))
        story.append(PageBreak())
        
        # Page 2: Satellite Data & Analysis
        story.extend(self._generate_satellite_analysis(disaster, prevention_plan))
        story.append(PageBreak())
        
        # Page 3: Action Plan Details
        story.extend(self._generate_action_plan(prevention_plan, disaster))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def _generate_executive_summary(
        self,
        plan: PreventionPlan,
        disaster: DisasterThreat,
        simulation: Optional[SimulationResult],
    ) -> list:
        """Generate executive summary page."""
        elements = []
        
        # Title
        elements.append(Paragraph("DISASTER PREVENTED", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.3*inch))
        
        # Location and Date
        location_name = disaster.location.name or f"{disaster.location.latitude}, {disaster.location.longitude}"
        date_str = datetime.now().strftime("%B %d, %Y")
        elements.append(Paragraph(
            f"{location_name} | {date_str}",
            self.styles['CustomSubtitle']
        ))
        elements.append(Spacer(1, 0.2*inch))
        
        # Success Message
        if plan.success:
            elements.append(Paragraph(
                "✓ PREVENTION SUCCESSFUL",
                self.styles['SuccessText']
            ))
        else:
            elements.append(Paragraph(
                "⚠ PREVENTION PLAN GENERATED",
                self.styles['InfoText']
            ))
        elements.append(Spacer(1, 0.3*inch))
        
        # Key Metrics Table
        metrics_data = [
            ['Metric', 'Value'],
            ['Initial Risk', f'{plan.initial_risk:.1f}%'],
            ['Final Risk', f'{plan.final_risk:.1f}%'],
            ['Risk Reduction', f'{plan.risk_reduction:.1f}%'],
            ['Total Cost', f'${plan.total_cost:,.2f}'],
        ]
        
        if disaster.area_at_risk_hectares:
            metrics_data.append(['Area at Risk', f'{disaster.area_at_risk_hectares:,.0f} hectares'])
        
        if simulation and simulation.hectares_saved:
            metrics_data.append(['Hectares Saved', f'{simulation.hectares_saved:,.0f} hectares'])
        
        if simulation and simulation.damage_avoided_usd:
            metrics_data.append(['Damage Avoided', f'${simulation.damage_avoided_usd:,.2f}'])
        
        metrics_table = Table(metrics_data, colWidths=[3*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ]))
        elements.append(metrics_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Summary Paragraph
        summary_text = (
            f"This prevention plan successfully reduced the {disaster.type.value} risk "
            f"from {plan.initial_risk:.1f}% to {plan.final_risk:.1f}% through "
            f"{len(plan.actions)} strategic prevention actions. "
        )
        
        if simulation and simulation.disaster_prevented:
            summary_text += (
                f"The 72-hour simulation confirms that the disaster was prevented, "
                f"saving {simulation.hectares_saved:,.0f} hectares and preventing "
                f"an estimated ${simulation.damage_avoided_usd:,.0f} in damages."
            )
        
        elements.append(Paragraph(summary_text, self.styles['Normal']))
        
        return elements
    
    def _generate_satellite_analysis(
        self,
        disaster: DisasterThreat,
        plan: PreventionPlan,
    ) -> list:
        """Generate satellite data analysis page."""
        elements = []
        
        elements.append(Paragraph("SATELLITE DATA ANALYSIS", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Disaster Information
        elements.append(Paragraph("Disaster Information", self.styles['CustomSubtitle']))
        disaster_info = [
            ['Type', disaster.type.value.replace('_', ' ').title()],
            ['Location', disaster.location.name or f"{disaster.location.latitude}, {disaster.location.longitude}"],
            ['Coordinates', f"{disaster.location.latitude:.4f}°N, {disaster.location.longitude:.4f}°E"],
            ['Time Window', f'{disaster.time_window_hours} hours'],
            ['Confidence', f'{disaster.confidence or "N/A"}%'],
        ]
        
        if disaster.area_at_risk_hectares:
            disaster_info.append(['Area at Risk', f'{disaster.area_at_risk_hectares:,.0f} hectares'])
        
        disaster_table = Table(disaster_info, colWidths=[2*inch, 4*inch])
        disaster_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
        ]))
        elements.append(disaster_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Satellite Data
        if disaster.satellite_data:
            elements.append(Paragraph("Satellite Data Sources", self.styles['CustomSubtitle']))
            sat_data = []
            
            if disaster.satellite_data.fuel_dryness is not None:
                sat_data.append(['Fuel Dryness', f'{disaster.satellite_data.fuel_dryness}%'])
            if disaster.satellite_data.temperature_anomaly is not None:
                sat_data.append(['Temperature Anomaly', f'+{disaster.satellite_data.temperature_anomaly}°C'])
            if disaster.satellite_data.wind_speed is not None:
                sat_data.append(['Wind Speed', f'{disaster.satellite_data.wind_speed} km/h'])
            if disaster.satellite_data.wind_direction is not None:
                sat_data.append(['Wind Direction', f'{disaster.satellite_data.wind_direction}°'])
            if disaster.satellite_data.rain_forecast is not None:
                sat_data.append(['Rain Forecast', f'{disaster.satellite_data.rain_forecast} mm'])
            if disaster.satellite_data.soil_moisture is not None:
                sat_data.append(['Soil Moisture', f'{disaster.satellite_data.soil_moisture}%'])
            if disaster.satellite_data.lightning_density is not None:
                sat_data.append(['Lightning Density', f'{disaster.satellite_data.lightning_density}'])
            if disaster.satellite_data.population_at_risk is not None:
                sat_data.append(['Population at Risk', f'{disaster.satellite_data.population_at_risk:,}'])
            
            if sat_data:
                sat_table = Table(sat_data, colWidths=[2.5*inch, 3.5*inch])
                sat_table.setStyle(TableStyle([
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9f9f9')]),
                ]))
                elements.append(sat_table)
            else:
                elements.append(Paragraph("Satellite data not available for this disaster.", self.styles['InfoText']))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Risk Analysis
        elements.append(Paragraph("Risk Analysis", self.styles['CustomSubtitle']))
        risk_text = (
            f"The initial risk assessment indicated a {plan.initial_risk:.1f}% probability of disaster occurrence. "
            f"Through the implementation of {len(plan.actions)} prevention actions, the risk was reduced to "
            f"{plan.final_risk:.1f}%, representing a {plan.risk_reduction:.1f}% reduction in disaster probability."
        )
        elements.append(Paragraph(risk_text, self.styles['Normal']))
        
        return elements
    
    def _generate_action_plan(
        self,
        plan: PreventionPlan,
        disaster: DisasterThreat,
    ) -> list:
        """Generate action plan details page."""
        elements = []
        
        elements.append(Paragraph("PREVENTION ACTION PLAN", self.styles['CustomTitle']))
        elements.append(Spacer(1, 0.2*inch))
        
        # Action Summary
        elements.append(Paragraph(f"Total Actions: {len(plan.actions)}", self.styles['CustomSubtitle']))
        elements.append(Spacer(1, 0.1*inch))
        
        # Actions Table
        if plan.actions:
            action_data = [['#', 'Action Type', 'Location', 'Cost', 'Effectiveness']]
            
            for i, action in enumerate(plan.actions, 1):
                action_type = action.type.value.replace('_', ' ').title()
                location = f"{action.location.latitude:.4f}, {action.location.longitude:.4f}"
                cost = f"${action.cost:,.2f}"
                effectiveness = f"{action.effectiveness or 0:.1f}%"
                
                action_data.append([str(i), action_type, location, cost, effectiveness])
            
            # Add total row
            action_data.append([
                '',
                'TOTAL',
                '',
                f"${plan.total_cost:,.2f}",
                f"{plan.risk_reduction:.1f}%"
            ])
            
            action_table = Table(action_data, colWidths=[0.5*inch, 2*inch, 2*inch, 1*inch, 1*inch])
            action_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 0), (2, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.white),
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e5e7eb')),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 10),
                ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f9f9f9')]),
            ]))
            elements.append(action_table)
        else:
            elements.append(Paragraph("No actions in this prevention plan.", self.styles['InfoText']))
        
        elements.append(Spacer(1, 0.3*inch))
        
        # Detailed Action Descriptions
        elements.append(Paragraph("Action Details", self.styles['CustomSubtitle']))
        for i, action in enumerate(plan.actions, 1):
            action_type = action.type.value.replace('_', ' ').title()
            location_name = action.location.name or f"{action.location.latitude:.4f}, {action.location.longitude:.4f}"
            
            action_desc = f"<b>{i}. {action_type}</b><br/>"
            action_desc += f"Location: {location_name}<br/>"
            action_desc += f"Coordinates: {action.location.latitude:.4f}°N, {action.location.longitude:.4f}°E<br/>"
            action_desc += f"Cost: ${action.cost:,.2f}<br/>"
            action_desc += f"Effectiveness: {action.effectiveness or 0:.1f}%"
            
            if action.quantity:
                action_desc += f"<br/>Quantity: {action.quantity}"
            
            if action.description:
                action_desc += f"<br/>{action.description}"
            
            elements.append(Paragraph(action_desc, self.styles['Normal']))
            elements.append(Spacer(1, 0.15*inch))
        
        elements.append(Spacer(1, 0.2*inch))
        
        # Footer
        footer_text = (
            f"Generated by ResQ-Earth PREVENT on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>"
            f"Using NASA FIRMS, ESA Sentinel, and NOAA satellite data"
        )
        elements.append(Paragraph(footer_text, self.styles['InfoText']))
        
        return elements


# Singleton instance
_report_generator: Optional[ReportGenerator] = None


def get_report_generator() -> ReportGenerator:
    """Get or create the report generator instance."""
    global _report_generator
    if _report_generator is None:
        _report_generator = ReportGenerator()
    return _report_generator

