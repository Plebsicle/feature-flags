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
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-900">{rule.name}</CardTitle>
              <CardDescription className="text-gray-600">
                {rule.description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {rule.is_enabled ? (
              <ToggleRight className="w-5 h-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-5 h-5 text-gray-400" />
            )}
            <span className={`text-sm font-medium ${rule.is_enabled ? 'text-emerald-600' : 'text-gray-600'}`}>
              {rule.is_enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-700">Conditions</label>
            <p className="text-gray-900 mt-1">{formatConditionsForDisplay(rule.conditions)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Status</label>
            <Badge 
              variant={rule.is_enabled ? "default" : "secondary"}
              className={`mt-1 ${rule.is_enabled ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}`}
            >
              {rule.is_enabled ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="text-sm font-medium text-gray-700">Rule ID</label>
            <code className="block text-xs text-gray-600 bg-gray-100 p-2 rounded mt-1 font-mono break-all">
              {rule.id}
            </code>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Created</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDate(rule.created_at)}</span>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Updated</label>
            <div className="flex items-center space-x-1 mt-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-sm text-gray-900">{formatDate(rule.updated_at)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-gray-200">
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Link href={`/flags/${flagId}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Flag
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Targeting Rules
                </h1>
                <p className="text-gray-600 text-base sm:text-lg mt-1">
                  Define conditions for when this flag should be enabled
                </p>
              </div>
            </div>
            <RuleModal
              mode="create"
              environmentId={environmentId}
            />
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{rules.length}</p>
                    <p className="text-sm text-gray-600">Total Rules</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <ToggleRight className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {rules.filter(rule => rule.is_enabled).length}
                    </p>
                    <p className="text-sm text-gray-600">Enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <ToggleLeft className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {rules.filter(rule => !rule.is_enabled).length}
                    </p>
                    <p className="text-sm text-gray-600">Disabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Rules List */}
          {rules.length > 0 ? (
            <div className="space-y-6">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  environmentId={environmentId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No rules configured</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first targeting rule to control when this feature flag should be enabled for specific users or conditions.
              </p>
              <RuleModal
                mode="create"
                environmentId={environmentId}
              />
            </div>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Rule Management Tips
              </CardTitle>
              <CardDescription className="text-gray-600">
                Best practices for creating effective targeting rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">User Attributes</h4>
                  <p className="text-sm text-gray-600">
                    Target users based on attributes like email, plan type, or custom properties
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Rule Priority</h4>
                  <p className="text-sm text-gray-600">
                    Rules are evaluated in order - place more specific rules higher in the list
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}