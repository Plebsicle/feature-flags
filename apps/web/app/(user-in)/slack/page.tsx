import { cookies } from 'next/headers';
import { MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SlackIntegrationClient from "@/components/slack-integration-client";

const BACKEND_URL = process.env.BACKEND_URL;

interface SlackChannel {
  id: string;
  channel_name: string;
  is_private: boolean;
}

interface SlackIntegration {
  connected: boolean;
  teamName?: string;
  teamId?: string;
  channels?: SlackChannel[];
  installedAt?: string;
}

async function getSlackIntegration(): Promise<SlackIntegration | null> {
  try {
    const cookieStore = await cookies();
    
    // Get sessionId cookie as specified by the user
    const sessionId = cookieStore.get('sessionId')?.value;
    console.log(sessionId);
    if (!sessionId) {
      console.error('No sessionId cookie found');
      return { connected: false };
    }

    // Build cookie header with sessionId
    const cookieHeader = `sessionId=${sessionId}`;
    
    console.log('Fetching Slack integration with sessionId cookie');

    const response = await fetch(`${BACKEND_URL}/slack/integration`, {
      method: 'GET',
      headers: {
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store', // Prevent caching for dynamic data
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return { connected: false };
    }

    const data = await response.json();
    
    if (!data.success) {
      console.error('Backend returned error:', data);
      return { connected: false };
    }

    return data.data || data;
  } catch (err) {
    console.error('Error fetching Slack integration data:', err);
    return { connected: false };
  }
}

// Server component for the page header
function PageHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Slack Integration</h1>
          <p className="text-gray-600 text-lg">
            Connect your workspace to receive real-time notifications
          </p>
        </div>
      </div>
      
      {/* Feature Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Flag Alerts</h3>
                <p className="text-xs text-gray-600">Get notified when flags change</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Success Metrics</h3>
                <p className="text-xs text-gray-600">Track performance updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Team Updates</h3>
                <p className="text-xs text-gray-600">Keep everyone informed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function SlackIntegrationPage() {
  const integrationData = await getSlackIntegration();

  if (!integrationData) {
    return (
      <div className="space-y-8">
        <div className="max-w-6xl mx-auto">
          <PageHeader />
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-2">
                Unable to Load Integration Data
              </h3>
              <p className="text-red-700">
                Please refresh the page or contact support if the issue persists.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader />
        
        {/* Client Component for Interactive Functionality */}
        <SlackIntegrationClient initialIntegration={integrationData} />
        
        {/* Additional Information Section */}
        <div className="mt-8">
          <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900">Integration Benefits</CardTitle>
              <CardDescription>
                Maximize your team's productivity with Slack notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Real-time Notifications</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Feature flag status changes</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Kill switch activations</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Metric threshold alerts</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Team Collaboration</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Automated rollout updates</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Performance insights</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Issue notifications</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}