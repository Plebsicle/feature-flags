import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DeleteFlagButton } from "@/components/delete-flag-button";
import { EditFeatureFlagModal } from "@/components/edit-flag-buton";
import { ExternalLinkButton } from "@/components/external-link-button";
import { EnhancedCopyButton } from "@/components/enhanced-copy-button";
  import {
  Calendar, 
  Code,
  Tag,
  Activity,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  ExternalLink,
  Database,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

// Types based on the updated API response
type FlagType = "BOOLEAN" | "STRING" | "NUMBER" | "JSON";

interface FeatureFlag {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  description: string | null;
  flag_type: FlagType;
  is_active: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
  tags: string[];
}

interface FlagResponse {
  data: FeatureFlag;
  success: boolean;
  message: string;
}

// Server-side data fetching
async function getFeatureFlagData(flagId: string): Promise<FeatureFlag | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("sessionId")?.value;

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
    const response = await fetch(
      `${backendUrl}/flag/getFeatureFlagData/${flagId}`,
      {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { Cookie: `sessionId=${sessionId}` }),
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: FlagResponse = await response.json();

    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to fetch flag data");
    }
  } catch (error) {
    console.error("Error fetching feature flag data:", error);
    return null;
  }
}

// Loading component
const FlagDetailLoading = () => (
  <div className="min-h-screen bg-gray-50">
    <div className="max-w-7xl mx-auto p-6 lg:p-8">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card
                key={i}
                className="animate-pulse"
              >
                <CardHeader>
                  <div className="h-6 bg-gray-300 rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-300 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  </div>
);



// Main Flag Detail Page Component
export default async function FlagDetailPage(props: {
  params: { flagId: string };
}) {
  const { flagId } = await props.params;
  const flag = await getFeatureFlagData(flagId);

  if (!flag) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFlagTypeColor = (type: FlagType) => {
    switch (type) {
      case "BOOLEAN":
        return "bg-blue-100 text-blue-800";
      case "STRING":
        return "bg-emerald-100 text-emerald-800";
      case "NUMBER":
        return "bg-purple-100 text-purple-800";
      case "JSON":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <Suspense fallback={<FlagDetailLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/flags">
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Flags
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${flag.is_active ? "bg-emerald-500" : "bg-gray-400"}`}
                    />
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      {flag.name}
                    </h1>
                    <Badge className={getFlagTypeColor(flag.flag_type)}>
                      {flag.flag_type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                      {flag.key}
                    </code>
                    <div className="flex items-center space-x-2">
                      {flag.is_active ? (
                        <ToggleRight className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                      <span className={`text-sm font-medium ${flag.is_active ? "text-emerald-600" : "text-gray-600"}`}>
                        {flag.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <EditFeatureFlagModal flagId={flag.id} flagName={flag.name} currentDescription={flag.description} currentIsActive={flag.is_active} currentTags={flag.tags} />
                <DeleteFlagButton flagId={flag.id} flagName={flag.name} />
              </div>
            </div>

            {/* Description */}
            {flag.description && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-gray-700 leading-relaxed">{flag.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href={`/flags/environments/${flag.id}`}>
                    <Card className="bg-white border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-[#6366F1] rounded-xl flex items-center justify-center group-hover:shadow-lg transition-all duration-200">
                            <Database className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-lg">
                              Environments
                            </h3>
                            <p className="text-sm text-gray-600 group-hover:text-gray-700">Manage configurations</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* API Integration */}
                <Card className="bg-white border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 flex items-center">
                      <Code className="w-5 h-5 mr-2 text-[#6366F1]" />
                      API Integration
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      Use this flag in your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <label className="text-sm font-bold text-gray-900 mb-3 block">
                        Flag Key
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-1">
                          <code className="text-lg font-mono text-gray-800 font-medium">
                            {flag.key}
                          </code>
                        </div>
                        <EnhancedCopyButton 
                          text={flag.key}
                          successMessage="Flag key has been copied"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        JavaScript SDK Example
                      </label>
                      <div className="bg-white border border-gray-300 rounded-lg p-4">
                        <code className="text-sm font-mono text-gray-800">
                          {`const isEnabled = await client.isEnabled('${flag.key}');`}
                        </code>
                      </div>
                    </div>
                    
                    {/* Quick Actions moved here */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <Link href={`/create-flag/environments?flagKey=${flag.id}`}>
                          <Button
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-50 border-gray-200"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Environment
                          </Button>
                        </Link>
                        <ExternalLinkButton url={`/api/flags/${flag.id}`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View API
                        </ExternalLinkButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Flag Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Flag Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Type</label>
                      <Badge className={`mt-1 ${getFlagTypeColor(flag.flag_type)}`}>
                        {flag.flag_type}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <div className="flex items-center space-x-2 mt-1">
                        {flag.is_active ? (
                          <ToggleRight className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                        <span className={`text-sm font-medium ${flag.is_active ? "text-emerald-600" : "text-gray-600"}`}>
                          {flag.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-700">Created</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(flag.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Last Updated</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {formatDate(flag.updated_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {flag.tags && flag.tags.length > 0 && (
                  <Card className="bg-white border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900 flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-[#6366F1]" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {flag.tags.map((tag, index) => {
                          const colors = [
                            "bg-blue-100 text-blue-800 border-blue-200",
                            "bg-green-100 text-green-800 border-green-200", 
                            "bg-purple-100 text-purple-800 border-purple-200",
                            "bg-orange-100 text-orange-800 border-orange-200",
                            "bg-pink-100 text-pink-800 border-pink-200",
                            "bg-teal-100 text-teal-800 border-teal-200"
                          ]
                          const colorClass = colors[index % colors.length]
                          
                          return (
                            <Badge
                              key={index}
                              className={`${colorClass} font-medium px-3 py-1`}
                            >
                              {tag}
                            </Badge>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}


              </div>
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
