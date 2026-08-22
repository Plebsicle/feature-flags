'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Skull,
  Edit3,
  Trash2,
  Save,
  X,
  Calendar,
  Activity,
  AlertTriangle,
  Flag,
  Plus,
  Minus,
  Loader2,
  Key
} from "@/components/ui/icons"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { EnhancedCopyButton } from "@/components/enhanced-copy-button"
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
    flagKey : string
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
        const response = await fetch(`${backendUrl}/killSwitch/${killSwitchId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()
        // console.log(result);
        if (result.success) {
          setKillSwitch(result.data ?? null)
          setEditForm({
            name: result.data?.name ?? '',
            description: result.data?.description || '',
            is_active: result.data?.is_active ?? false,
            flags: result.data?.flag_mappings?.map((fm : {flag_id:string,environments:$Enums.environment_type[],flagKey : string,created_at : Date,kill_switch_id : string}) => ({
                flagKey: fm.flagKey,
                environments: fm.environments
              })) ?? []
          })
          // console.log(editForm);
        } else {
          throw new Error(result.message || 'Failed to fetch kill switch')  
        }
      } catch {
        console.error('Error fetching kill switch')
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
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'STAGING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'PROD':
        return 'bg-red-500/10 text-red-400 border-red-500/20'
      case 'TEST':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
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
          flagKey: fm.flagKey,
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
    
    const promise = fetch(`${backendUrl}/killSwitch/${killSwitchId}`, {
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
            // refresh
            window.location.reload();
          } else {
            throw new Error(data.message || 'Failed to update kill switch')
          }
        })
        return 'Kill switch updated successfully!'
      },
      error: () => {
        // console.error('Error updating kill switch:', err)
        return 'Failed to update kill switch. Please try again.'
      }
    }).finally(() => {
      setIsSaving(false)
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    
    const promise = fetch(`${backendUrl}/killSwitch/${killSwitchId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
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
      error: () => {
        // console.error('Error deleting kill switch:', err)
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
        <div className="flex items-center space-x-4">
          <div className="bg-muted p-3 rounded-xl">
            <Skull className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <div className="h-8 bg-muted rounded-lg w-48 animate-pulse mb-2"></div>
            <div className="h-4 bg-muted/50 rounded-lg w-32 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-xl border-border bg-card/50">
              <CardHeader className="border-b border-border/50">
                <div className="h-6 bg-muted rounded-lg w-3/4"></div>
                <div className="h-4 bg-muted/50 rounded-lg w-1/2"></div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded-lg"></div>
                  <div className="h-4 bg-muted/50 rounded-lg w-2/3"></div>
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
      <div className="text-center py-16">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-8 max-w-md mx-auto shadow-sm">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Error Loading Kill Switch</h3>
          <p className="text-sm text-destructive/80 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive font-medium text-sm rounded-lg h-10 px-6"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!killSwitch) {
    return (
      <div className="text-center py-16">
        <div className="bg-card/50 border border-border border-dashed rounded-xl p-10 max-w-md mx-auto backdrop-blur">
          <Skull className="w-12 h-12 text-muted-foreground mx-auto mb-6 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-3">Kill Switch Not Found</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8">The kill switch you're looking for doesn't exist or has been deleted.</p>
          <Button 
            onClick={() => router.push('/killSwitch')}
            className="font-medium text-sm h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
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
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl shadow-sm ${killSwitch.is_active ? 'bg-red-500/10 border border-red-500/20' : 'bg-muted border border-border'}`}>
            <Skull className={`w-8 h-8 ${killSwitch.is_active ? 'text-red-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">{killSwitch.name}</h1>
            <div className="flex items-center space-x-2">
              <Badge variant={killSwitch.is_active ? "destructive" : "secondary"} className="rounded-md text-xs font-medium uppercase">
                {killSwitch.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isEditing && (
            <>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                className="font-medium text-sm rounded-lg h-10 px-4"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive font-medium text-sm rounded-lg h-10 px-4"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl border-border bg-card/90 backdrop-blur-xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-semibold text-xl text-foreground">Delete Kill Switch</AlertDialogTitle>
                    <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                      Are you sure you want to delete this kill switch? This action cannot be undone and will permanently remove all associated flag mappings.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-medium text-sm rounded-lg h-10 px-6">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium text-sm rounded-lg h-10 px-6 shadow-sm"
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
                className="font-medium text-sm rounded-lg h-10 px-4"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm rounded-lg h-10 px-6 shadow-sm"
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-lg font-semibold text-foreground">
              <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">Name *</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Kill switch name"
                    className="h-10 border-border bg-background rounded-lg text-sm focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-muted-foreground">Description *</Label>
                  <Textarea
                    id="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this kill switch controls"
                    className="min-h-[100px] border-border bg-background rounded-lg text-sm focus:border-primary resize-none"
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg border ${editForm.is_active ? 'bg-red-500/10 border-red-500/20' : 'bg-muted border-border'}`}>
                      {editForm.is_active ? (
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Activity className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-foreground block mb-1">Active Status</Label>
                      <p className="text-xs text-muted-foreground">
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
              <div className="space-y-6">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground block mb-1">Name</Label>
                  <p className="text-sm text-foreground font-semibold">{killSwitch.name}</p>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-muted-foreground block mb-1">Description</Label>
                  <p className="text-sm text-foreground leading-relaxed">{killSwitch.description || 'No description provided'}</p>
                </div>
                
                <div>
                  <Label className="text-xs font-medium text-muted-foreground block mb-2">Status</Label>
                  <div className="flex items-center space-x-2">
                    {killSwitch.is_active ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Activity className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className={`text-sm font-semibold ${killSwitch.is_active ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {killSwitch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center text-lg font-semibold text-foreground">
              <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {killSwitch.killSwitchKey && (
              <div className="mb-2 p-4 bg-muted/30 border border-border rounded-lg">
                <Label className="text-xs font-medium text-muted-foreground block mb-2">Kill Switch Key</Label>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Key className="w-4 h-4 text-primary" />
                    <code className="font-mono text-xs bg-muted px-2 py-1 rounded-md text-foreground border border-border">
                      {killSwitch.killSwitchKey}
                    </code>
                  </div>
                  <EnhancedCopyButton 
                    text={killSwitch.killSwitchKey} 
                    successMessage="Key copied!" 
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-xs font-medium text-muted-foreground block mb-1">Created</Label>
                <p className="text-sm text-foreground">{formatDate(killSwitch.created_at)}</p>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-muted-foreground block mb-1">Last Updated</Label>
                <p className="text-sm text-foreground">{formatDate(killSwitch.updated_at)}</p>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-muted-foreground block mb-1">Last Activated</Label>
                <p className="text-sm text-foreground">{formatDate(killSwitch.activated_at)}</p>
              </div>
            </div>
            
          </CardContent>
        </Card>

        {/* Flag Mappings */}
        <Card className="lg:col-span-2 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="flex items-center justify-between text-lg font-semibold text-foreground">
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-lg mr-3 border border-primary/20">
                  <Flag className="w-5 h-5 text-primary" />
                </div>
                Flag Mappings
              </div>
              {isEditing && (
                <Button
                  size="sm"
                  onClick={addFlag}
                  className="font-medium text-xs h-8 px-4 rounded-md"
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Add Flag
                </Button>
              )}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-2">
              Feature flags controlled by this kill switch
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isEditing ? (
              <div className="space-y-4">
                {editForm.flags.map((flag, index) => (
                  <div key={index} className="p-4 bg-muted/20 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-foreground">Flag {index + 1}</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeFlag(index)}
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive h-8 w-8 p-0 rounded-md"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`flag-key-${index}`} className="text-xs font-medium text-muted-foreground">Flag Key *</Label>
                      <Input
                        id={`flag-key-${index}`}
                        value={flag.flagKey}
                        onChange={(e) => updateFlagKey(index, e.target.value)}
                        placeholder="Enter flag key"
                        className="h-10 border-border bg-background rounded-md text-sm focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground block mb-2">Environments *</Label>
                      <div className="flex flex-wrap gap-2">
                        {ENV_OPTIONS.map((env) => (
                          <button
                            key={env}
                            type="button"
                            onClick={() => toggleEnvironment(index, env)}
                            className={`px-3 py-1.5 text-xs font-medium uppercase transition-colors rounded-md border ${
                              flag.environments.includes(env)
                                ? `${getEnvironmentColor(env)} border-current`
                                : 'bg-background text-muted-foreground border-border hover:bg-muted/50'
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
                  <div className="text-center py-12 bg-muted/30 border border-dashed border-border rounded-lg">
                    <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-4">No flags configured yet</p>
                    <Button
                      onClick={addFlag}
                      variant="outline"
                      className="font-medium text-sm rounded-lg border-dashed hover:border-solid transition-all"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add First Flag
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {killSwitch.flag_mappings && killSwitch.flag_mappings.length > 0 ? (
                  killSwitch.flag_mappings.map((mapping, index) => (
                    <div key={mapping.id} className="p-4 bg-muted/10 border border-border rounded-lg transition-colors hover:bg-muted/20">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-foreground">Flag {index + 1}</h4>
                        <Badge variant="outline" className="text-xs rounded-md border-border">
                          {mapping.flag_id}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground block mb-2">Environments</Label>
                        <div className="flex flex-wrap gap-2">
                          {mapping.environments.map((env) => (
                            <Badge key={env} className={`${getEnvironmentColor(env)} rounded-md text-xs font-medium uppercase`}>
                              {env}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-muted/30 border border-dashed border-border rounded-lg">
                    <Flag className="w-10 h-10 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground">No flags mapped to this kill switch</p>
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