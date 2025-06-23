"use client"

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, ExternalLink, Settings, X, Loader2 } from 'lucide-react';
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
      const response = await fetch(`/${BACKEND_URL}/slack/integration`, {
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
    } catch (error) {
      console.error('Error fetching integration status:', error);
    }
  };

  const handleConnectSlack = async () => {
    setLoading(true);
    const promise = fetch(`/${BACKEND_URL}/slack/auth/url`, {
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
        error: (err) => {
            console.error('Error connecting to Slack:', err);
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
    } catch (error) {
        // User cancelled
        return;
    }

    setLoading(true);
    const disconnectPromise = fetch(`/${BACKEND_URL}/slack/integration`, {
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
        error: (err) => {
            console.error('Error disconnecting Slack:', err);
            return 'Failed to disconnect Slack';
        }
    }).finally(() => {
        setLoading(false);
    });
  };

  const fetchChannels = async () => {
    if (!integration.teamId) return;
    
    setLoading(true);
    const promise = fetch(`/${BACKEND_URL}/slack/channels/${integration.teamId}`, {
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
        error: (err) => {
            console.error('Error fetching channels:', err);
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
    const promise = fetch(`/${BACKEND_URL}/slack/channels/${integration.teamId}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channels: channelsToSave }),
    });

    toast.promise(promise, {
        loading: 'Saving channels...',
        success: async (response) => {
            if (response.ok) {
                setShowChannelSetup(false);
                await fetchIntegrationStatus(); // Refresh data
                return 'Channels saved successfully!';
            } else {
                throw new Error('Failed to save');
            }
        },
        error: (err) => {
            console.error('Error saving channels:', err);
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
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-neutral-100 font-semibold">
                    Slack Integration
                  </CardTitle>
                  <CardDescription className="text-neutral-400">
                    Connect your Slack workspace to receive alerts and notifications
                  </CardDescription>
                </div>
              </div>
              {integration.connected && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!integration.connected ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-lg font-medium text-neutral-100 mb-2">
                  Connect your Slack workspace
                </h4>
                <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                  Get real-time alerts and notifications directly in your Slack channels when feature flags are updated or metrics change.
                </p>
                <Button
                  onClick={handleConnectSlack}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300"
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
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-emerald-300">
                        Connected to {integration.teamName}
                      </h4>
                      <p className="text-sm text-emerald-400/80 mt-1">
                        Your Slack workspace is successfully connected. Configure channels below to receive notifications.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configured Channels */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Configured Channels
                  </h4>
                  {integration.channels && integration.channels.length > 0 ? (
                    <div className="space-y-2">
                      {integration.channels.map((channel) => (
                        <div 
                          key={channel.id} 
                          className="flex items-center justify-between bg-slate-700/40 px-4 py-3 rounded-lg border border-slate-600/30"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-mono text-neutral-200">
                              #{channel.channel_name}
                            </span>
                            {channel.is_private && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-600/50 text-slate-300">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-500 bg-slate-700/20 px-4 py-3 rounded-lg border border-slate-600/20">
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
                    className="bg-slate-700/40 border-slate-600/40 text-neutral-200 hover:bg-slate-700/60 hover:border-slate-500/60"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Configure Channels'}
                  </Button>
                  
                  <Button
                    onClick={handleDisconnectSlack}
                    disabled={loading}
                    variant="outline"
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60"
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
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
             <div className="relative bg-slate-800/95 border border-slate-700/50 shadow-2xl rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
               <div className="p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-neutral-100">Select Channels</h3>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowChannelSetup(false)}
                     className="text-neutral-400 hover:text-white hover:bg-slate-700/50 p-2"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="max-h-60 overflow-y-auto space-y-3">
                   {availableChannels.map((channel) => (
                     <label 
                       key={channel.id}
                       className="flex items-center p-3 rounded-lg hover:bg-slate-700/40 transition-colors cursor-pointer"
                     >
                       <input
                         type="checkbox"
                         checked={selectedChannels.includes(channel.id)}
                         onChange={() => toggleChannelSelection(channel.id)}
                         className="h-4 w-4 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-800 border-slate-600 rounded bg-slate-700"
                       />
                       <span className="ml-3 text-sm text-neutral-200">
                         #{channel.name}
                         {channel.is_private && (
                           <span className="ml-1 text-xs text-neutral-500">(private)</span>
                         )}
                       </span>
                     </label>
                   ))}
                 </div>
                 
                 <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-700/50">
                   <Button
                     onClick={() => setShowChannelSetup(false)}
                     variant="outline"
                     className="bg-slate-700/40 border-slate-600/40 text-neutral-300 hover:bg-slate-700/60"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleSaveChannels}
                     disabled={loading || selectedChannels.length === 0}
                     className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
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