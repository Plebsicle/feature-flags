'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Skull,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Flag,
  Layers,
  Plus,
  Minus,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { $Enums } from "@repo/db/client"
import { toast } from "sonner"

// TypeScript types to match create page  
export interface killSwitchFlagConfig {
  flagKey: string;
  environments: $Enums.environment_type[];
}

// Types based on the API response
type KillSwitch = {
  flag_mappings: {
    id: string;
    created_at: Date;
    environments: $Enums.environment_type[];
    kill_switch_id: string;
    flag_id: string;
  }[];
} & {
  name: string;
  id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  organization_id: string;
  description: string | null;
  created_by: string;
  activated_at: Date | null;
  activated_by: string | null;
}

interface KillSwitchResponse {
  killSwitch: KillSwitch
  success: boolean
  message: string
}

type EditFormData = {
  name: string
  description: string
  is_active: boolean
  flags: killSwitchFlagConfig[]
}

interface KillSwitchDetailClientProps {
  killSwitchId: string
}

export default function KillSwitchDetailClient({ killSwitchId }: KillSwitchDetailClientProps) {
  const router = useRouter()

  const [killSwitch, setKillSwitch] = useState<KillSwitch | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<EditFormData>({
    name: '',
    description: '',
    is_active: false,
    flags: []
  })

  const ENV_OPTIONS = ['DEV', 'STAGING', 'PROD', 'TEST'] as $Enums.environment_type[];

  useEffect(() => {
    const fetchKillSwitch = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        const response = await fetch(`/${backendUrl}/killSwitch/${killSwitchId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        console.log(result);
        if (result.success) {
          setKillSwitch(result.data ?? null)
          setEditForm({
            name: result.data?.name ?? '',
            description: result.data?.description || '',
            is_active: result.data?.is_active ?? false,
            flags: result.data?.flag_mappings?.map((fm : {flag_id:string,environments:$Enums.environment_type[]}) => ({
                flagKey: fm.flag_id,
                environments: fm.environments
              })) ?? []
          })
        } else {
          throw new Error(result.message || 'Failed to fetch kill switch')  
        }
      } catch (error) {
        console.error('Error fetching kill switch:', error)
        setError('Failed to fetch kill switch')
      } finally {
        setLoading(false)
      }
    }

    if (killSwitchId) {
      fetchKillSwitch()
    }
  }, [killSwitchId])

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEnvironmentColor = (env: $Enums.environment_type) => {
    switch (env) {
      case 'DEV':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'STAGING':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'PROD':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'TEST':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    if (killSwitch) {
      setEditForm({
        name: killSwitch.name,
        description: killSwitch.description || '',
        is_active: killSwitch.is_active,
        flags: killSwitch.flag_mappings.map(fm => ({
          flagKey: fm.flag_id,
          environments: fm.environments
        }))
      })
    }
    setIsEditing(false)
  }

  // Validation to match create page
  const validate = (): boolean => {
    if (!editForm.name.trim()) return false;
    if (!editForm.description.trim()) return false;
    if (!Array.isArray(editForm.flags) || editForm.flags.length === 0) return false;
    for (const flag of editForm.flags) {
      if (!flag.flagKey.trim()) return false;
      if (!Array.isArray(flag.environments) || flag.environments.length === 0) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error("Please fill all fields and add at least one flag with environments.");
      return;
    }
    setIsSaving(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`/${backendUrl}/killSwitch`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          killSwitchId,
          name: editForm.name,
          description: editForm.description,
          is_active: editForm.is_active,
          flags: editForm.flags
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Kill switch updated successfully')
        setIsEditing(false)
        // Refresh the data
        window.location.reload()
      } else {
        throw new Error(result.message || 'Failed to update kill switch')
      }
    } catch (error) {
      console.error('Error updating kill switch:', error)
      toast.error('Failed to update kill switch. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
      const response = await fetch(`/${backendUrl}/killSwitch/${killSwitchId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success('Kill switch deleted successfully')
        router.push('/killSwitch')
      } else {
        throw new Error(result.message || 'Failed to delete kill switch')
      }
    } catch (error) {
      console.error('Error deleting kill switch:', error)
      toast.error('Failed to delete kill switch. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const addFlag = () => {
    setEditForm(prev => ({
      ...prev,
      flags: [...prev.flags, { flagKey: '', environments: [] }]
    }))
  }

  const removeFlag = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      flags: prev.flags.filter((_, i) => i !== index)
    }))
  }

  const updateFlagKey = (idx: number, value: string) => {
    setEditForm(prev => ({
      ...prev,
      flags: prev.flags.map((flag, i) => (i === idx ? { ...flag, flagKey: value } : flag)),
    }))
  }

  const toggleEnvironment = (flagIdx: number, env: $Enums.environment_type) => {
    setEditForm(prev => ({
      ...prev,
      flags: prev.flags.map((flag, i) => 
        i === flagIdx 
          ? {
              ...flag,
              environments: flag.environments.includes(env)
                ? flag.environments.filter(e => e !== env)
                : [...flag.environments, env]
            }
          : flag
      )
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="w-8 h-8 animate-spin text-red-400" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !killSwitch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Error loading kill switch</h3>
            <p className="text-neutral-400">{error}</p>
            <Button 
              onClick={() => router.push('/killSwitch')} 
              className="mt-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white"
            >
              Back to Kill Switches
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Skull className="w-8 h-8 text-red-400" />
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="text-3xl sm:text-4xl font-bold text-white bg-slate-800/40 border-slate-700/30"
                  />
                ) : (
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">{killSwitch.name}</h1>
                )}
                <Badge className={`text-sm ${killSwitch.is_active ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                  {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
                </Badge>
              </div>
              <p className="text-neutral-400 text-base sm:text-lg">
                Emergency kill switch configuration and management
              </p>
            </div>
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                    disabled={isSaving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleEdit}
                    variant="outline"
                    className="border-blue-700 text-blue-300 hover:bg-blue-800/20"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-red-700 text-red-300 hover:bg-red-800/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-slate-800 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete Kill Switch</AlertDialogTitle>
                        <AlertDialogDescription className="text-neutral-400">
                          Are you sure you want to delete the <span className="font-medium text-white">"{killSwitch.name}"</span> kill switch? 
                          This action cannot be undone and will permanently remove all configuration data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel 
                          className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
                          disabled={isDeleting}
                        >
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Kill Switch
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-neutral-300">Name</Label>
                    {isEditing ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                      />
                    ) : (
                      <p className="text-white mt-1">{killSwitch.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-neutral-300">Description</Label>
                    {isEditing ? (
                      <Textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                        rows={3}
                      />
                    ) : (
                      <p className="text-neutral-400 mt-1">{killSwitch.description || 'No description provided'}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label className="text-neutral-300">Active Status</Label>
                    {isEditing ? (
                      <Switch
                        checked={editForm.is_active}
                        onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                      />
                    ) : (
                      <Badge className={`${killSwitch.is_active ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                        {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Flag Mappings */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">Flag Mappings</CardTitle>
                    {isEditing && (
                      <Button
                        onClick={addFlag}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Flag
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      {editForm.flags.map((flag, index) => (
                        <div key={index} className="p-4 border border-slate-700/30 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-neutral-300">Flag {index + 1}</Label>
                            <Button
                              onClick={() => removeFlag(index)}
                              size="sm"
                              variant="outline"
                              className="border-red-700 text-red-300 hover:bg-red-800/20"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div>
                            <Label className="text-neutral-300 text-sm">Flag Key</Label>
                            <Input
                              value={flag.flagKey}
                              onChange={e => updateFlagKey(index, e.target.value)}
                              className="mt-1 bg-slate-800/40 border-slate-700/30 text-white"
                              placeholder="Enter flag key"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-neutral-300 text-sm">Environments</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {ENV_OPTIONS.map(env => (
                                <Button
                                  key={env}
                                  type="button"
                                  size="sm"
                                  variant={flag.environments.includes(env) ? "default" : "outline"}
                                  onClick={() => toggleEnvironment(index, env)}
                                  className={flag.environments.includes(env)
                                    ? "bg-blue-600 text-white border-0"
                                    : "border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                                  }
                                >
                                  {env}
                                </Button>
                              ))}
                            </div>
                            {flag.environments.length === 0 && (
                              <p className="text-xs text-red-400 mt-1">Select at least one environment.</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {editForm.flags.length === 0 && (
                        <p className="text-neutral-400 text-center py-4">No flags configured. Click "Add Flag" to get started.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {killSwitch.flag_mappings.map((mapping, index) => (
                        <div key={mapping.id} className="p-4 border border-slate-700/30 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Flag className="w-4 h-4 text-blue-400" />
                              <span className="text-white font-medium">Flag {index + 1}</span>
                            </div>
                            <code className="text-xs text-neutral-400 bg-slate-700/50 px-2 py-1 rounded">
                              {mapping.flag_id}
                            </code>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {mapping.environments.map((env) => (
                              <Badge key={env} className={`text-xs ${getEnvironmentColor(env)}`}>
                                {env}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                      {killSwitch.flag_mappings.length === 0 && (
                        <p className="text-neutral-400 text-center py-4">No flag mappings configured.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              {/* Status Information */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Status Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {killSwitch.is_active ? (
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-400" />
                    )}
                    <div>
                      <p className="text-white font-medium">
                        {killSwitch.is_active ? 'Active' : 'Inactive'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {killSwitch.is_active ? 'Kill switch is currently active' : 'Kill switch is not active'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-400">Created</p>
                      <p className="text-sm text-white">{formatDate(killSwitch.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-400">Last Updated</p>
                      <p className="text-sm text-white">{formatDate(killSwitch.updated_at)}</p>
                    </div>
                  </div>
                  {killSwitch.activated_at && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <div>
                        <p className="text-sm text-neutral-400">Activated</p>
                        <p className="text-sm text-white">{formatDate(killSwitch.activated_at)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-neutral-400" />
                    <div>
                      <p className="text-sm text-neutral-400">Created By</p>
                      <p className="text-sm text-white">{killSwitch.created_by}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-white">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Total Flags</span>
                    <span className="text-white font-medium">{killSwitch.flag_mappings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">Environments</span>
                    <span className="text-white font-medium">
                      {Array.from(new Set(killSwitch.flag_mappings.flatMap(fm => fm.environments))).length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 