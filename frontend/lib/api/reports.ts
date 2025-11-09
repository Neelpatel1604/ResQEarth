/**
 * Report API client for PDF generation.
 */
import { PreventionPlan } from '@/lib/map/data';

export interface ReportRequest {
  prevention_plan: PreventionPlan;
  threat_id: string;
  include_simulation?: boolean;
}

/**
 * Generate and download a PDF report for a prevention plan.
 */
export async function generateReport(request: ReportRequest): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      detail: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return await response.blob();
}

/**
 * Download a PDF report.
 */
export function downloadReport(blob: Blob, filename: string = 'prevention_report.pdf'): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

