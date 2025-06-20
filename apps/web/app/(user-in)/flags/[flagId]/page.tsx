import { Suspense } from "react";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { DeleteFlagButton } from "@/components/delete-flag-button";
import { EditFeatureFlagModal } from "@/components/edit-flag-buton";
import {
  Flag,
  Calendar,
  User,
  Code,
  Tag,
  Activity,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Settings,
  Database,
  Users,
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
  <div className="space-y-6">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-600 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-700 rounded w-2/3" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {[...Array(2)].map((_, i) => (
          <Card
            key={i}
            className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse"
          >
            <CardHeader>
              <div className="h-6 bg-gray-600 rounded w-1/2" />
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
      <div className="space-y-6">
        <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-600 rounded w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 bg-gray-700 rounded w-full" />
              <div className="h-4 bg-gray-700 rounded w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

// Main Flag Detail Page Component
export default async function FlagDetailPage(props: {
  params: { flagId: string };
}) {
  const { flagId } = props.params;
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
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "STRING":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "NUMBER":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "JSON":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<FlagDetailLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/flags">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Flags
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${flag.is_active ? "bg-emerald-400" : "bg-gray-400"}`}
                    />
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">
                      {flag.name}
                    </h1>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="text-sm text-neutral-400 bg-slate-700/50 px-2 py-1 rounded">
                      {flag.key}
                    </code>
                    <Badge className={`${getFlagTypeColor(flag.flag_type)}`}>
                      {flag.flag_type}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Key
                </Button>
                <EditFeatureFlagModal
                  flagId={flag.id}
                  flagName={flag.name}
                  currentDescription={flag.description}
                  currentIsActive={flag.is_active}
                  currentTags={flag.tags}
                />
                <DeleteFlagButton flagId={flag.id} flagName={flag.name} />
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Overview */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center">
                      <Flag className="w-5 h-5 mr-2 text-blue-400" />
                      Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Description
                      </label>
                      <p className="text-white mt-1">
                        {flag.description || "No description provided"}
                      </p>
                    </div>
                    <Separator className="bg-slate-700/50" />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-neutral-400">
                          Status
                        </label>
                        <div className="flex items-center space-x-2 mt-1">
                          {flag.is_active ? (
                            <ToggleRight className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-6 h-6 text-gray-400" />
                          )}
                          <span
                            className={`font-medium ${flag.is_active ? "text-emerald-400" : "text-gray-400"}`}
                          >
                            {flag.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-neutral-400">
                          Type
                        </label>
                        <div className="mt-1">
                          <Badge
                            className={`${getFlagTypeColor(flag.flag_type)}`}
                          >
                            {flag.flag_type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Management Actions */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-xl text-white flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-purple-400" />
                      Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Link href={`/flags/environments/${flag.id}`}>
                        <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                          <Database className="w-4 h-4 mr-2" />
                          View Environments
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Manage Users
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {flag.tags && flag.tags.length > 0 && (
                  <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        <Tag className="w-5 h-5 mr-2 text-purple-400" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {flag.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="border-slate-600 text-neutral-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-6">
                {/* Metadata */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Flag ID
                      </label>
                      <p className="text-white text-sm font-mono mt-1 break-all">
                        {flag.id}
                      </p>
                    </div>
                    <Separator className="bg-slate-700/50" />
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Organization ID
                      </label>
                      <p className="text-white text-sm font-mono mt-1 break-all">
                        {flag.organization_id}
                      </p>
                    </div>
                    <Separator className="bg-slate-700/50" />
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Created By
                      </label>
                      <p className="text-white text-sm mt-1">
                        {flag.created_by}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-orange-400" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Created
                      </label>
                      <p className="text-white text-sm mt-1">
                        {formatDate(flag.created_at)}
                      </p>
                    </div>
                    <Separator className="bg-slate-700/50" />
                    <div>
                      <label className="text-sm font-medium text-neutral-400">
                        Last Updated
                      </label>
                      <p className="text-white text-sm mt-1">
                        {formatDate(flag.updated_at)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View in SDK
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full border-slate-700 text-neutral-300 hover:bg-slate-800/50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Integration Code
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Suspense>
      </div>
    </div>
  );
}
