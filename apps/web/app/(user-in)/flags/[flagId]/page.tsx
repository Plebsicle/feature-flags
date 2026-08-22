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
} from "@/components/ui/icons";
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

// Types based on the updated API r esponse
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
  } catch (err) {
    console.error("Error fetching feature flag data:", err);
    return null;
  }
}

// Loading component
const FlagDetailLoading = () => (
  <div className="min-h-screen bg-transparent">
    <div className="max-w-7xl mx-auto">
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded-xl w-1/3 mb-4" />
          <div className="h-4 bg-muted/50 rounded-lg w-2/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card
                key={i}
                className="animate-pulse rounded-xl border-border shadow-sm"
              >
                <CardHeader>
                  <div className="h-6 bg-muted rounded-lg w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted/50 rounded-lg w-full" />
                    <div className="h-4 bg-muted/50 rounded-lg w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card className="animate-pulse rounded-xl border-border shadow-sm">
              <CardHeader>
                <div className="h-6 bg-muted rounded-lg w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted/50 rounded-lg w-full" />
                  <div className="h-4 bg-muted/50 rounded-lg w-2/3" />
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
  params: Promise<{ flagId: string }>;
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
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "STRING":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "NUMBER":
        return "bg-primary/10 text-primary border-primary/20";
      case "JSON":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-7xl mx-auto">
        <Suspense fallback={<FlagDetailLoading />}>
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <Link href="/flags">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed hover:border-solid transition-all font-medium text-xs h-9 rounded-md"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${flag.is_active ? "bg-primary shadow-sm" : "bg-muted-foreground/30"}`}
                    />
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                      {flag.name}
                    </h1>
                    <Badge className={`rounded-md border font-medium text-xs px-2 py-0.5 ${getFlagTypeColor(flag.flag_type)}`}>
                      {flag.flag_type}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4">
                    <code className="text-sm text-foreground bg-muted border border-border px-2 py-1 rounded-md font-mono">
                      {flag.key}
                    </code>
                    <div className="flex items-center space-x-2">
                      {flag.is_active ? (
                        <ToggleRight className="w-5 h-5 text-primary" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-muted-foreground/50" />
                      )}
                      <span className={`text-sm font-medium ${flag.is_active ? "text-primary" : "text-muted-foreground"}`}>
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
              <Card className="rounded-xl border-dashed border-border bg-card/50 shadow-sm">
                <CardContent className="p-6">
                  <p className="text-muted-foreground leading-relaxed text-sm">{flag.description}</p>
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
                    <Card className="bg-card border-border hover:shadow-md hover:border-primary/50 transition-all duration-300 cursor-pointer group rounded-xl shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg border border-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Database className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-lg tracking-tight">
                              Environments
                            </h3>
                            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Manage config</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                {/* API Integration */}
                <Card className="bg-card border-border rounded-xl shadow-sm">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-xl text-foreground font-semibold flex items-center">
                      <Code className="w-5 h-5 mr-2 text-primary" />
                      API Integration
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-sm">
                      Use this flag in your application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">
                        Flag Key
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 flex-1">
                          <code className="text-lg font-mono text-foreground font-medium">
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
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        JavaScript SDK Example
                      </label>
                      <div className="bg-muted/50 border border-border rounded-lg p-4">
                        <code className="text-sm font-mono text-foreground">
                          {`const isEnabled = await client.isEnabled('${flag.key}');`}
                        </code>
                      </div>
                    </div>
                    
                    {/* Quick Actions moved here */}
                    <div className="border-t border-border/50 pt-4">
                      <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
                      <div className="grid grid-cols-1 gap-3">
                        <Link href={`/create-flag/environments?flagKey=${flag.id}`}>
                          <Button
                            variant="outline"
                            className="w-full bg-transparent hover:bg-muted border-dashed border-border rounded-md h-10 text-sm"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Environment
                          </Button>
                        </Link>
                        <ExternalLinkButton url={`https://www.npmjs.com/package/bitswitch-sdk`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View SDK
                        </ExternalLinkButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Flag Details */}
                <Card className="rounded-xl border-border shadow-sm">
                  <CardHeader className="border-b border-border/50">
                    <CardTitle className="text-lg text-foreground font-semibold">Flag Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Type</label>
                      <Badge className={`rounded-md font-medium text-xs px-2 py-0.5 border ${getFlagTypeColor(flag.flag_type)}`}>
                        {flag.flag_type}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Status</label>
                      <div className="flex items-center space-x-2">
                        {flag.is_active ? (
                          <ToggleRight className="w-5 h-5 text-primary" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted-foreground/50" />
                        )}
                        <span className={`text-sm font-medium ${flag.is_active ? "text-primary" : "text-muted-foreground"}`}>
                          {flag.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <Separator className="bg-border/50" />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Created</label>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDate(flag.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-1">Last Updated</label>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {formatDate(flag.updated_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {flag.tags && flag.tags.length > 0 && (
                  <Card className="bg-card border-border rounded-xl shadow-sm">
                    <CardHeader className="border-b border-border/50">
                      <CardTitle className="text-lg text-foreground font-semibold flex items-center">
                        <Tag className="w-4 h-4 mr-2 text-primary" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        {flag.tags.map((tag, index) => {
                          const colors = [
                            "bg-blue-500/10 text-blue-500 border-blue-500/20",
                            "bg-green-500/10 text-green-500 border-green-500/20", 
                            "bg-primary/10 text-primary border-primary/20",
                            "bg-orange-500/10 text-orange-500 border-orange-500/20",
                            "bg-pink-500/10 text-pink-500 border-pink-500/20",
                            "bg-teal-500/10 text-teal-500 border-teal-500/20"
                          ]
                          const colorClass = colors[index % colors.length]
                          
                          return (
                            <Badge
                              key={index}
                              className={`${colorClass} rounded-md font-medium text-xs px-2 py-0.5 border`}
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
