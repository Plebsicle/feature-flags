import { cookies } from 'next/headers';
import { MessageSquare, AlertCircle, CheckCircle } from "@/components/ui/icons";
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
  } catch (err) { console.error(err);
    return { connected: false };
  }
}

// Server component for the page header
function PageHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <MessageSquare className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Slack Integration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Connect your workspace to receive real-time notifications
          </p>
        </div>
      </div>
      
      {/* Feature Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Flag Alerts</h3>
                <p className="text-xs font-medium text-muted-foreground">Get notified when flags change</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Success Metrics</h3>
                <p className="text-xs font-medium text-muted-foreground">Track performance updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Team Updates</h3>
                <p className="text-xs font-medium text-muted-foreground">Keep everyone informed</p>
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
          
          <Card className="border-destructive bg-destructive/10 rounded-xl backdrop-blur shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-destructive/20 rounded-full border border-destructive/30 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Unable to Load Integration Data
              </h3>
              <p className="text-sm text-destructive/80">
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
          <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg text-foreground font-semibold">Integration Benefits</CardTitle>
              <CardDescription className="text-muted-foreground text-sm mt-1">
                Maximize your team&apos;s productivity with Slack notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Real-time Notifications</h4>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Team Collaboration</h4>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}