'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, Send, Users, History, AlertTriangle, Upload, FileText } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AlertsPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [alertHistory, setAlertHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [manualAlert, setManualAlert] = useState({
    disaster_type: 'flood',
    severity: 'moderate',
    location: '',
    description: '',
    probability: 50,
  });

  useEffect(() => {
    fetchSubscribers();
    fetchAlertHistory();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/subscribers`);
      const data = await response.json();
      if (data.success) {
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const fetchAlertHistory = async () => {
    try {
      const response = await fetch(`${API_URL}/api/alerts/history?limit=10`);
      const data = await response.json();
      if (data.success) {
        setAlertHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const sendTestAlert = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/alerts/test`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Test alert sent to ${data.sent_count} subscribers!` });
        fetchAlertHistory();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send test alert' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const sendManualAlert = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/alerts/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualAlert),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Alert sent to ${data.sent_count} subscribers!` });
        fetchAlertHistory();
        // Reset form
        setManualAlert({
          disaster_type: 'flood',
          severity: 'moderate',
          location: '',
          description: '',
          probability: 50,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send alert' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const checkAndSendAlerts = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_URL}/api/alerts/check-and-send`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        const summary = data.summary;
        setMessage({
          type: 'success',
          text: `Monitoring complete: ${summary.disasters_detected} disasters detected, ${summary.total_emails_sent} emails sent`,
        });
        fetchAlertHistory();
      } else {
        setMessage({ type: 'error', text: 'Failed to check for disasters' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setMessage({ type: 'error', text: 'Please select a CSV file' });
      return;
    }

    setUploading(true);
    setMessage(null);
    
    try {
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await fetch(`${API_URL}/api/alerts/subscribers/upload-csv`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: `CSV uploaded successfully! ${data.count} subscribers loaded.` 
        });
        setCsvFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh subscribers list
        fetchSubscribers();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upload CSV' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to upload CSV' });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setMessage({ type: 'error', text: 'Please select a CSV file' });
        return;
      }
      setCsvFile(file);
      setMessage(null);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Disaster Alert System</h1>
      </div>

      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* CSV Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Subscribers CSV
          </CardTitle>
          <CardDescription>
            Upload a CSV file with subscriber data. Format: email, name, location, disaster_types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-upload">CSV File</Label>
            <div className="flex gap-3">
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
                disabled={uploading}
              />
              <Button 
                onClick={handleCsvUpload} 
                disabled={uploading || !csvFile}
                className="min-w-[120px]"
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload CSV
                  </>
                )}
              </Button>
            </div>
            {csvFile && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Selected: {csvFile.name}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <strong>CSV Format:</strong>
            <pre className="mt-1 text-xs">
{`email,name,location,disaster_types
user@example.com,John Doe,California,"flood,wildfire"
jane@example.com,Jane Smith,Texas,"flood,hurricane"`}
            </pre>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscribers Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Subscribers
            </CardTitle>
            <CardDescription>
              {subscribers.length} people subscribed to alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {subscribers.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No subscribers found. Upload a CSV file to add subscribers.
                </div>
              ) : (
                subscribers.map((sub, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="font-medium">{sub.name}</div>
                    <div className="text-sm text-muted-foreground">{sub.email}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {sub.location} • {sub.disaster_types.join(', ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Test and monitor the alert system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={sendTestAlert} disabled={loading || subscribers.length === 0} className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Send Test Alert
            </Button>
            <Button onClick={checkAndSendAlerts} disabled={loading} className="w-full" variant="outline">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Check for Disasters Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Manual Alert Card */}
      <Card>
        <CardHeader>
          <CardTitle>Send Manual Alert</CardTitle>
          <CardDescription>Manually trigger a disaster alert</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Disaster Type</Label>
              <Select
                value={manualAlert.disaster_type}
                onValueChange={(value) => setManualAlert({ ...manualAlert, disaster_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="wildfire">Wildfire</SelectItem>
                  <SelectItem value="earthquake">Earthquake</SelectItem>
                  <SelectItem value="hurricane">Hurricane</SelectItem>
                  <SelectItem value="tornado">Tornado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select
                value={manualAlert.severity}
                onValueChange={(value) => setManualAlert({ ...manualAlert, severity: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Input
              placeholder="e.g., Sacramento, CA"
              value={manualAlert.location}
              onChange={(e) => setManualAlert({ ...manualAlert, location: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the disaster and recommended actions..."
              value={manualAlert.description}
              onChange={(e) => setManualAlert({ ...manualAlert, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Probability (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={manualAlert.probability}
              onChange={(e) => setManualAlert({ ...manualAlert, probability: Number(e.target.value) })}
            />
          </div>

          <Button onClick={sendManualAlert} disabled={loading || !manualAlert.location} className="w-full">
            <Send className="mr-2 h-4 w-4" />
            Send Alert
          </Button>
        </CardContent>
      </Card>

      {/* Alert History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>Last 10 alerts sent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertHistory.map((alert, idx) => {
              const disaster = alert.disaster;
              return (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {disaster.type.toUpperCase()} - {disaster.severity.toUpperCase()}
                      </div>
                      <div className="text-sm text-muted-foreground">{disaster.location}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{alert.sent_count} emails</div>
                      <div className="text-xs text-muted-foreground">{disaster.probability}% probability</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
