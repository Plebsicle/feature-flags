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
import { Toaster, toast } from 'react-hot-toast'

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
  killSwitchKey?: string;
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
            flags: result.data?.flag_mappings?.map((fm : {flag_id:string,environments:$Enums.environment_type[],flagKey : string}) => ({
                flagKey: fm.flagKey,
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
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'STAGING':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'PROD':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'TEST':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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
    return true;
  }

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    const promise = fetch(`/${backendUrl}/killSwitch/${killSwitchId}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description,
        is_active: editForm.is_active,
        flags: editForm.flags
      }),
    })

    toast.promise(promise, {
      loading: 'Updating kill switch...',
      success: (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = response.json() as Promise<{ success: boolean; message?: string }>;
        result.then(data => {
          if (data.success) {
            setIsEditing(false)
            // Refresh the data
            window.location.reload()
          } else {
            throw new Error(data.message || 'Failed to update kill switch')
          }
        })
        return 'Kill switch updated successfully!'
      },
      error: (err) => {
        console.error('Error updating kill switch:', err)
        return 'Failed to update kill switch. Please try again.'
      }
    }).finally(() => {
      setIsSaving(false)
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    const promise = fetch(`/${backendUrl}/killSwitch`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ killSwitchId }),
    })

    toast.promise(promise, {
      loading: 'Deleting kill switch...',
      success: (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = response.json() as Promise<{ success: boolean; message?: string }>;
        result.then(data => {
          if (data.success) {
            router.push('/killSwitch')
          } else {
            throw new Error(data.message || 'Failed to delete kill switch')
          }
        })
        return 'Kill switch deleted successfully!'
      },
      error: (err) => {
        console.error('Error deleting kill switch:', err)
        return 'Failed to delete kill switch. Please try again.'
      }
    }).finally(() => {
      setIsDeleting(false)
    })
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
      flags: prev.flags.map((flag, i) => 
        i === idx ? { ...flag, flagKey: value } : flag
      )
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
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-2 rounded-lg">
            <Skull className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-32 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Kill Switch</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!killSwitch) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
          <Skull className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Kill Switch Not Found</h3>
          <p className="text-gray-600 mb-4">The kill switch you're looking for doesn't exist or has been deleted.</p>
          <Button 
            onClick={() => router.push('/killSwitch')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Back to Kill Switches
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Toaster />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${killSwitch.is_active ? 'bg-red-100' : 'bg-gray-100'}`}>
            <Skull className={`w-6 h-6 ${killSwitch.is_active ? 'text-red-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{killSwitch.name}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={killSwitch.is_active ? "destructive" : "secondary"}>
                {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
              {killSwitch.killSwitchKey && (
                <Badge variant="outline" className="font-mono text-xs">
                  {killSwitch.killSwitchKey}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <>
              <Button 
                variant="outline" 
                onClick={handleEdit}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Kill Switch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this kill switch? This action cannot be undone and will permanently remove all associated flag mappings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
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
                        'Delete Kill Switch'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {isEditing && (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="bg-indigo-100 p-2 rounded-md mr-3">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 font-medium">Name *</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Kill switch name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-900 font-medium">Description *</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this kill switch controls"
                    className="min-h-[100px]"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded ${editForm.is_active ? 'bg-red-100' : 'bg-gray-100'}`}>
                      {editForm.is_active ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <Activity className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <Label className="text-gray-900 font-medium">Active Status</Label>
                      <p className="text-sm text-gray-600">
                        {editForm.is_active ? 'Kill switch is currently active' : 'Kill switch is currently inactive'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={editForm.is_active}
                    onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label className="text-gray-500 text-sm">Name</Label>
                  <p className="text-gray-900 font-medium">{killSwitch.name}</p>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-sm">Description</Label>
                  <p className="text-gray-900">{killSwitch.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <Label className="text-gray-500 text-sm">Status</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {killSwitch.is_active ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Activity className="w-5 h-5 text-gray-400" />
                    )}
                    <span className={`font-medium ${killSwitch.is_active ? 'text-red-600' : 'text-gray-600'}`}>
                      {killSwitch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-md mr-3">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-500 text-sm">Created</Label>
              <p className="text-gray-900">{formatDate(killSwitch.created_at)}</p>
            </div>
            
            <div>
              <Label className="text-gray-500 text-sm">Last Updated</Label>
              <p className="text-gray-900">{formatDate(killSwitch.updated_at)}</p>
            </div>
            
            <div>
              <Label className="text-gray-500 text-sm">Last Activated</Label>
              <p className="text-gray-900">{formatDate(killSwitch.activated_at)}</p>
            </div>
            
            <div>
              <Label className="text-gray-500 text-sm">Organization ID</Label>
              <p className="text-gray-900 font-mono text-sm">{killSwitch.organization_id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Flag Mappings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-2 rounded-md mr-3">
                  <Flag className="w-5 h-5 text-emerald-600" />
                </div>
                Flag Mappings
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={addFlag}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Flag
                </Button>
              )}
            </CardTitle>
            <CardDescription>
              Feature flags controlled by this kill switch
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                {editForm.flags.map((flag, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-gray-900 font-medium">Flag {index + 1}</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFlag(index)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`flag-key-${index}`} className="text-gray-900">Flag Key *</Label>
                      <Input
                        id={`flag-key-${index}`}
                        value={flag.flagKey}
                        onChange={(e) => updateFlagKey(index, e.target.value)}
                        placeholder="Enter flag key"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-gray-900">Environments *</Label>
                      <div className="flex flex-wrap gap-2">
                        {ENV_OPTIONS.map((env) => (
                          <button
                            key={env}
                            type="button"
                            onClick={() => toggleEnvironment(index, env)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              flag.environments.includes(env)
                                ? getEnvironmentColor(env)
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {env}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                {editForm.flags.length === 0 && (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No flags configured yet</p>
                    <Button
                      onClick={addFlag}
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Flag
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {killSwitch.flag_mappings && killSwitch.flag_mappings.length > 0 ? (
                  killSwitch.flag_mappings.map((mapping, index) => (
                    <div key={mapping.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Flag {index + 1}</h4>
                        <Badge variant="outline" className="font-mono text-xs">
                          {mapping.flag_id}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-gray-500 text-sm">Environments</Label>
                        <div className="flex flex-wrap gap-2">
                          {mapping.environments.map((env) => (
                            <Badge key={env} className={getEnvironmentColor(env)}>
                              {env}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No flags mapped to this kill switch</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 