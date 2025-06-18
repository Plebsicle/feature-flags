import { Suspense } from "react"
import { notFound } from "next/navigation"
import { cookies } from "next/headers"
import {
  Target,
  Calendar,
  ArrowLeft,
  Plus,
  ToggleLeft,
  ToggleRight,
  Edit,
  Trash2,
  Copy,
  Settings,
  Code,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import RuleModal from "@/components/RuleModal"
import DeleteRuleButton from "@/components/delete-rule-button"
import { Condition } from "@repo/types/rule-config"

// Types for rule data
interface RuleData {
  name: string;
  id: string;
  created_at: Date;
  updated_at: Date;
  description: string | null;
  flag_environment_id: string;
  is_enabled: boolean;
  conditions: Condition[]; // JsonValue from Prisma
}

interface RulesResponse {
  data: RuleData[]
  success: boolean
  message: string
}

// Server-side data fetching
async function getRulesData(environmentId: string): Promise<RuleData[] | null> {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('sessionId')?.value

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const response = await fetch(`${backendUrl}/flag/getRules/${environmentId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId && { 'Cookie': `sessionId=${sessionId}` }),
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: RulesResponse = await response.json()
    if (result.success) {
      return result.data
    } else {
      throw new Error(result.message || 'Failed to fetch rules data')
    }
  } catch (error) {
    console.error('Error fetching rules data:', error)
    return null
  }
}

// Loading component
const RulesLoading = () => (
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
    <div className="grid gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-600 rounded w-1/3" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-3/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// Helper function to format conditions for display
const formatConditionsForDisplay = (conditions: any): string => {
  if (!conditions || typeof conditions !== 'object') {
    return 'No conditions'
  }
  
  // Handle if conditions is an array
  if (Array.isArray(conditions)) {
    return `${conditions.length} condition${conditions.length !== 1 ? 's' : ''}`
  }
  
  // Handle if conditions is a single object
  return '1 condition'
}

// Rule Card Component
const RuleCard = ({ rule, environmentId }: { rule: RuleData; environmentId: string }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/50 transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{rule.name}</CardTitle>
              <CardDescription className="text-neutral-400">
                {rule.description || 'No description provided'}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {rule.is_enabled ? (
                <ToggleRight className="w-5 h-5 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-gray-400" />
              )}
              <span className={`text-sm font-medium ${rule.is_enabled ? 'text-emerald-400' : 'text-gray-400'}`}>
                {rule.is_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <RuleModal
              mode="edit"
              environmentId={environmentId}
              existingRule={rule}
              flagRuleId={rule.id}
            />
            <DeleteRuleButton
              ruleId={rule.id}
              ruleName={rule.name}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-neutral-400 font-medium text-sm">Conditions</label>
            <p className="text-white mt-1">{formatConditionsForDisplay(rule.conditions)}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium text-sm">Status</label>
            <Badge 
              variant={rule.is_enabled ? "default" : "secondary"}
              className={rule.is_enabled ? "bg-emerald-900/50 text-emerald-200" : "bg-gray-900/50 text-gray-200"}
            >
              {rule.is_enabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <Separator className="bg-slate-700/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-neutral-400 font-medium">Rule ID</label>
            <p className="text-white font-mono mt-1 break-all">{rule.id}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Created</label>
            <p className="text-white mt-1">{formatDate(rule.created_at)}</p>
          </div>
          <div>
            <label className="text-neutral-400 font-medium">Updated</label>
            <p className="text-white mt-1">{formatDate(rule.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Main Rules Page Component
export default async function FlagRulesPage({
  params,
  searchParams
}: {
  params: Promise<{ flagId: string }>
  searchParams: Promise<{ environmentId?: string }>
}) {
  const { flagId } = await params
  const { environmentId } = await searchParams
  if (!environmentId) {
    notFound()
  }
  const rules = await getRulesData(environmentId)

  if (rules === null) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<RulesLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href={`/flags/environments/${flagId}`}>
                  <Button variant="outline" size="sm" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Environment
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center">
                    <Target className="w-8 h-8 mr-3 text-orange-400" />
                    Targeting Rules
                  </h1>
                  <p className="text-neutral-400 mt-1">
                    Manage conditions that determine when your flag should be evaluated
                  </p>
                </div>
              </div>
              <RuleModal
                mode="create"
                environmentId={environmentId}
              />
            </div>

            {/* Rules Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{rules.length}</p>
                      <p className="text-sm text-neutral-400">Total Rules</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {rules.filter(rule => rule.is_enabled).length}
                      </p>
                      <p className="text-sm text-neutral-400">Enabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-500/20 rounded-lg flex items-center justify-center">
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {rules.filter(rule => !rule.is_enabled).length}
                      </p>
                      <p className="text-sm text-neutral-400">Disabled</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rules List */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-semibold text-white">Rule Configurations</h2>
              </div>
              
              {rules.length === 0 ? (
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardContent className="p-12 text-center">
                    <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Rules Found</h3>
                    <p className="text-neutral-400 mb-6">
                      This environment doesn't have any targeting rules yet. Create your first rule to get started.
                    </p>
                    <RuleModal
                      mode="create"
                      environmentId={environmentId}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} environmentId={environmentId} />
                  ))}
                </div>
              )}
            </div>

            {/* Action Bar */}
            {rules.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-700/50">
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                  <Copy className="w-4 h-4 mr-2" />
                  Bulk Copy Rules
                </Button>
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                  <Code className="w-4 h-4 mr-2" />
                  Export Configuration
                </Button>
                <Button variant="outline" className="border-slate-700 text-neutral-300 hover:bg-slate-800/50">
                  <Settings className="w-4 h-4 mr-2" />
                  Bulk Operations
                </Button>
              </div>
            )}
          </div>
        </Suspense>
      </div>
    </div>
  )
}
