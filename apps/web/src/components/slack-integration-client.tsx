"use client"

import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Settings, X, Loader2 } from 'lucide-react';
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
      // console.error('Error fetching integration status:', error);
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
    } catch (_error) {
        // console.error(_error)
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
        success: (response) => {
            if (response.ok) {
                setShowChannelSetup(false);
                fetchIntegrationStatus(); // Refresh data without awaiting
                return 'Channels saved successfully!';
            } else {
                throw new Error('Failed to save');
            }
        },
        error: (err) => {
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
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900 font-semibold">
                    Slack Integration
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Connect your Slack workspace to receive alerts and notifications
                  </CardDescription>
                </div>
              </div>
              {integration.connected && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Connected
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {!integration.connected ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Connect your Slack workspace
                </h4>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get real-time alerts and notifications directly in your Slack channels when feature flags are updated or metrics change.
                </p>
                <Button
                  onClick={handleConnectSlack}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3"
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
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-emerald-800">
                        Connected to {integration.teamName}
                      </h4>
                      <p className="text-sm text-emerald-700 mt-1">
                        Your Slack workspace is successfully connected. Configure channels below to receive notifications.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Configured Channels */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                    <div className="bg-indigo-100 p-1.5 rounded mr-2">
                      <Settings className="w-4 h-4 text-indigo-600" />
                    </div>
                    Configured Channels
                  </h4>
                  {integration.channels && integration.channels.length > 0 ? (
                    <div className="space-y-2">
                      {integration.channels.map((channel) => (
                        <div 
                          key={channel.id} 
                          className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center">
                            <span className="text-sm font-mono text-gray-900">
                              #{channel.channel_name}
                            </span>
                            {channel.is_private && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                Private
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
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
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    {loading ? 'Loading...' : 'Configure Channels'}
                  </Button>
                  
                  <Button
                    onClick={handleDisconnectSlack}
                    disabled={loading}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
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
           <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
             <div className="relative bg-white border border-gray-200 shadow-xl rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
               <div className="p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-semibold text-gray-900">Select Channels</h3>
                   <Button
                     variant="ghost"
                     size="sm"
                     onClick={() => setShowChannelSetup(false)}
                     className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2"
                   >
                     <X className="w-4 h-4" />
                   </Button>
                 </div>
                 
                 <div className="max-h-60 overflow-y-auto space-y-3">
                   {availableChannels.map((channel) => (
                     <label 
                       key={channel.id}
                       className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                     >
                       <input
                         type="checkbox"
                         checked={selectedChannels.includes(channel.id)}
                         onChange={() => toggleChannelSelection(channel.id)}
                         className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                       />
                       <span className="ml-3 text-sm text-gray-900">
                         #{channel.name}
                         {channel.is_private && (
                           <span className="ml-1 text-xs text-gray-500">(private)</span>
                         )}
                       </span>
                     </label>
                   ))}
                 </div>
                 
                 <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                   <Button
                     onClick={() => setShowChannelSetup(false)}
                     variant="outline"
                     className="border-gray-300 text-gray-700 hover:bg-gray-50"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleSaveChannels}
                     disabled={loading || selectedChannels.length === 0}
                     className="bg-indigo-600 hover:bg-indigo-700 text-white"
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