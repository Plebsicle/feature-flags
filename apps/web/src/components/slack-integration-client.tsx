"use client"

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Settings, X, Loader2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster, toast } from 'react-hot-toast';

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

interface SlackIntegrationClientProps {
  initialIntegration: SlackIntegration;
}

const SlackIntegrationClient: React.FC<SlackIntegrationClientProps> = ({ 
  initialIntegration 
}) => {
  const [integration, setIntegration] = useState<SlackIntegration>(initialIntegration);
  const [availableChannels, setAvailableChannels] = useState<Array<{id: string, name: string, is_private: boolean}>>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showChannelSetup, setShowChannelSetup] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // Initialize selected channels from initial data
  useEffect(() => {
    if (integration.connected && integration.channels) {
      setSelectedChannels(integration.channels.map((ch: SlackChannel) => ch.id));
    }
  }, [integration]);

  const fetchIntegrationStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/slack/integration`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setIntegration(data);
      
      if (data.connected && data.channels) {
        setSelectedChannels(data.channels.map((ch: SlackChannel) => ch.id));
      }
    } catch (error) { // console.error(error);
    }
  };

  const handleConnectSlack = async () => {
    setLoading(true);
    const promise = fetch(`${BACKEND_URL}/slack/auth/url`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    toast.promise(promise, {
        loading: 'Redirecting to Slack...',
        success: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.json() as Promise<{ authUrl?: string }>;
            data.then(d => {
                if (d.authUrl) {
                    window.location.href = d.authUrl;
                } else {
                    throw new Error('No auth URL received');
                }
            })
            return 'Redirecting...';
        },
        error: () => {
            // console.error('Error connecting to Slack:', err);
            return 'Failed to connect to Slack';
        }
    }).finally(() => {
        setLoading(false);
    });
  };

  const handleDisconnectSlack = async () => {
    const promise = new Promise<void>((resolve, reject) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p>Are you sure you want to disconnect Slack?</p>
                <div className="flex gap-2">
                    <Button
                        onClick={() => {
                            toast.dismiss(t.id);
                            resolve();
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        size="sm"
                    >
                        Disconnect
                    </Button>
                    <Button
                        onClick={() => {
                            toast.dismiss(t.id);
                            reject(new Error("User cancelled"));
                        }}
                        variant="outline"
                        size="sm"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        ), {
            duration: 10000, // Keep the toast open longer for confirmation
        });
    });

    try {
        await promise;
    } catch (_error) { // console.error(_error)
        return;
    }

    setLoading(true);
    const disconnectPromise = fetch(`${BACKEND_URL}/slack/integration`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    toast.promise(disconnectPromise, {
        loading: 'Disconnecting Slack...',
        success: (response) => {
            if (response.ok) {
                setIntegration({ connected: false });
                setAvailableChannels([]);
                setSelectedChannels([]);
                setShowChannelSetup(false);
                return 'Slack disconnected successfully!';
            } else {
                throw new Error('Failed to disconnect');
            }
        },
        error: () => {
            // console.error('Error disconnecting Slack:', err);
            return 'Failed to disconnect Slack';
        }
    }).finally(() => {
        setLoading(false);
    });
  };

  const fetchChannels = async () => {
    if (!integration.teamId) return;
    
    setLoading(true);
    const promise = fetch(`${BACKEND_URL}/slack/channels/${integration.teamId}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    toast.promise(promise, {
        loading: 'Fetching channels...',
        success: (response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = response.json() as Promise<{ channels?: any[] }>;
            data.then(d => {
                setAvailableChannels(d.channels || []);
                setShowChannelSetup(true);
            })
            return 'Channels fetched successfully!';
        },
        error: () => {
            // console.error('Error fetching channels:', err);
            return 'Failed to fetch channels';
        }
    }).finally(() => {
        setLoading(false);
    });
  };

  const handleSaveChannels = async () => {
    if (!integration.teamId || selectedChannels.length === 0) {
        toast.error("Please select at least one channel to save.");
        return;
    }
    
    const channelsToSave = availableChannels
      .filter(ch => selectedChannels.includes(ch.id))
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        is_private: ch.is_private
      }));

    setLoading(true);
    const promise = fetch(`${BACKEND_URL}/slack/channels/${integration.teamId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channels: channelsToSave }),
    });

    toast.promise(promise, {
        loading: 'Saving channels...',
        success: (response) => {
            if (response.ok) {
                setShowChannelSetup(false);
                fetchIntegrationStatus(); // Refresh data without awaiting
                return 'Channels saved successfully!';
            } else {
                throw new Error('Failed to save');
            }
        },
        error: () => {
            // console.error('Error saving channels:', err);
            return 'Failed to save channels';
        }
    }).finally(() => {
        setLoading(false);
    });
  };

  const toggleChannelSelection = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId]
    );
  };

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        {/* Main Integration Card */}
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-foreground font-semibold">
                    Slack Integration
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-sm mt-1">
                    Connect your Slack workspace to receive alerts and notifications
                  </CardDescription>
                </div>
              </div>
              {integration.connected && (
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {!integration.connected ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-muted/10 border border-border rounded-xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold text-foreground mb-2">
                  Connect your Slack workspace
                </h4>
                <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
                  Get real-time alerts and notifications directly in your Slack channels when feature flags are updated or metrics change.
                </p>
                <Button
                  onClick={handleConnectSlack}
                  disabled={loading}
                  className="rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Add to Slack
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Connection Success Banner */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-emerald-600">
                        Connected to {integration.teamName}
                      </h4>
                      <p className="text-xs text-emerald-600/80 mt-1">
                        Your Slack workspace is successfully connected. Configure channels below to receive notifications.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configured Channels */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                    <div className="bg-primary/10 border border-primary/20 p-1.5 rounded-lg mr-2">
                      <Settings className="w-4 h-4 text-primary" />
                    </div>
                    Configured Channels
                  </h4>
                  {integration.channels && integration.channels.length > 0 ? (
                    <div className="space-y-2">
                      {integration.channels.map((channel) => (
                        <div 
                          key={channel.id} 
                          className="flex items-center justify-between bg-muted/10 px-4 py-3 rounded-lg border border-border"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-foreground">
                              #{channel.channel_name}
                            </span>
                            {channel.is_private && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium uppercase bg-muted/50 border border-border text-muted-foreground">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground bg-muted/10 px-4 py-3 rounded-lg border border-border">
                      No channels configured yet
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={fetchChannels}
                    disabled={loading}
                    variant="outline"
                    className="rounded-lg font-medium text-sm border-border text-foreground hover:bg-muted/50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Configure Channels'}
                  </Button>
                  
                  <Button
                    onClick={handleDisconnectSlack}
                    disabled={loading}
                    variant="outline"
                    className="rounded-lg font-medium text-sm border-destructive/50 text-destructive hover:bg-destructive/10 hover:border-destructive"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Channel Setup Modal/View */}
        {showChannelSetup && (
           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
             <div className="relative bg-card border border-border shadow-sm rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
               <div className="p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-semibold text-foreground">Select Channels</h3>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowChannelSetup(false)}
                     className="rounded-lg font-medium text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 p-2"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="max-h-60 overflow-y-auto space-y-3">
                   {availableChannels.map((channel) => (
                     <label 
                       key={channel.id}
                       className="flex items-center p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/10 transition-colors cursor-pointer"
                     >
                       <input
                         type="checkbox"
                         checked={selectedChannels.includes(channel.id)}
                         onChange={() => toggleChannelSelection(channel.id)}
                         className="h-4 w-4 text-primary focus:ring-primary border-border bg-card rounded"
                       />
                       <span className="ml-3 text-sm font-medium text-foreground">
                         #{channel.name}
                         {channel.is_private && (
                           <span className="ml-1 text-xs text-muted-foreground opacity-70">(private)</span>
                         )}
                       </span>
                     </label>
                   ))}
                 </div>
                 
                 <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-border/50">
                   <Button
                     onClick={() => setShowChannelSetup(false)}
                     variant="outline"
                     className="rounded-lg font-medium text-sm border-border text-foreground hover:bg-muted/50"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleSaveChannels}
                     disabled={loading || selectedChannels.length === 0}
                     className="rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                   >
                     {loading ? (
                       <>
                         <Loader2 className="animate-spin -ml-1 mr-3 h-4 w-4" />
                         Saving...
                       </>
                     ) : (
                       'Save Channels'
                     )}
                   </Button>
                 </div>
               </div>
             </div>
           </div>
        )}
      </div>
    </>
  );
};

export default SlackIntegrationClient; 