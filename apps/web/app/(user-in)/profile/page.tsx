"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion,easeOut } from "framer-motion"
import {
  User,
  Mail,
  Building,
  Shield,
  Crown,
  UserCheck,
  Eye,
  ArrowLeft,
  LoaderIcon,
  Edit3,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

interface UserData {
  name: string
  email: string
  organisationName: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  ownerEmail: string
  ownerName: string
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'OWNER':
      return Crown
    case 'ADMIN':
      return Shield
    case 'MEMBER':
      return UserCheck
    case 'VIEWER':
      return Eye
    default:
      return User
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'OWNER':
      return { bg: "bg-primary/10 border border-primary/20", text: "text-primary", icon: "text-primary drop-shadow-[0_0_8px_var(--primary)]" }
    case 'ADMIN':
      return { bg: "bg-primary/10 border border-primary/20", text: "text-primary", icon: "text-primary drop-shadow-[0_0_8px_var(--primary)]" }
    case 'MEMBER':
      return { bg: "bg-emerald-500/10 border border-emerald-500/20", text: "text-emerald-400", icon: "text-emerald-400 drop-shadow-[0_0_8px_var(--emerald-400)]" }
    case 'VIEWER':
      return { bg: "bg-blue-500/10 border border-blue-500/20", text: "text-blue-400", icon: "text-blue-400 drop-shadow-[0_0_8px_var(--blue-400)]" }
    default:
      return { bg: "bg-muted/50 border border-border", text: "text-muted-foreground", icon: "text-muted-foreground" }
  }
}

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'OWNER':
      return "Full access to all features and organization management"
    case 'ADMIN':
      return "Administrative access with feature management capabilities"
    case 'MEMBER':
      return "Standard access with feature flag management"
    case 'VIEWER':
      return "Read-only access to view flags and metrics"
    default:
      return "User role"
  }
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {        
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
          const user = data.data
          setUserData(user)
        } else {
          setError("Unable to fetch user data")
          setTimeout(() => {
            router.push("/auth/signin")
          }, 2000)
        }
      } catch {
        // console.error("Failed to fetch user data:", error)
        setError("Network error occurred")
        setTimeout(() => {
          router.push("/auth/signin")
        }, 2000)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.6,
        ease: easeOut,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-3 text-foreground">
          <LoaderIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center max-w-md rounded-xl border-destructive bg-destructive/10 backdrop-blur shadow-sm">
          <p className="text-lg mb-4 text-destructive font-semibold">{error}</p>
          <p className="text-destructive/80 mb-4 text-sm font-medium">Redirecting to sign in...</p>
          <Button onClick={() => router.push("/auth/signin")} className="rounded-lg font-medium text-sm">
            Go to Sign In Now
          </Button>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center max-w-md rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
          <p className="text-lg mb-4 text-foreground font-semibold">No user data available</p>
          <Button onClick={() => router.push("/auth/signin")} className="rounded-lg font-medium text-sm">
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  const RoleIcon = getRoleIcon(userData.role)
  const roleColors = getRoleColor(userData.role)

  return (
    <div className="space-y-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <Button
            variant="ghost"
            className="mb-6 rounded-lg font-medium text-sm hover:bg-muted"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1">Profile</h1>
              <p className="text-muted-foreground text-sm">Manage your account information</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm h-full">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl text-foreground font-semibold flex items-center">
                  <User className="w-5 h-5 mr-3 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Your account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center space-x-4 p-4 bg-muted/10 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Full Name</p>
                    <p className="text-foreground font-semibold text-lg leading-tight">{userData.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/10 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Email Address</p>
                    <p className="text-foreground font-medium text-sm leading-tight">{userData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role & Permissions */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm h-full">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl text-foreground font-semibold flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-primary" />
                  Role & Permissions
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Your access level and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4 p-4 bg-muted/10 border border-border rounded-lg h-full">
                  <div className={`w-12 h-12 ${roleColors.bg} rounded-lg flex items-center justify-center`}>
                    <RoleIcon className={`w-6 h-6 ${roleColors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-semibold text-foreground">{userData.role}</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium uppercase ${roleColors.bg} ${roleColors.text}`}>
                        Active
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {getRoleDescription(userData.role)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organization Details */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="hover:shadow-md transition-shadow duration-200 rounded-xl border-border bg-card/80 backdrop-blur shadow-sm">
              <CardHeader className="border-b border-border/50 pb-4">
                <CardTitle className="text-xl text-foreground font-semibold flex items-center">
                  <Building className="w-5 h-5 mr-3 text-primary" />
                  Organization Details
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Information about your organization and ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <div className="flex items-center space-x-4 p-4 bg-muted/10 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Organization</p>
                    <p className="text-foreground font-semibold text-lg leading-tight">{userData.organisationName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-muted/10 border border-border rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Organization Owner</p>
                    <p className="text-foreground font-semibold text-lg leading-tight">{userData.ownerName}</p>
                    <p className="text-muted-foreground text-xs mt-1">{userData.ownerEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-primary/50 bg-primary/5 hover:shadow-md transition-shadow duration-200 rounded-xl backdrop-blur shadow-sm">
              <CardHeader className="border-b border-primary/20 pb-4">
                <CardTitle className="text-xl text-primary font-semibold flex items-center">
                  <Edit3 className="w-5 h-5 mr-3 text-primary" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-primary/70 text-sm mt-1">
                  Common tasks and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="rounded-lg border-primary/50 text-primary hover:bg-primary/20 hover:text-primary font-medium text-sm"
                    onClick={() => router.push("/flags")}
                  >
                    View Feature Flags
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-lg border-primary/50 text-primary hover:bg-primary/20 hover:text-primary font-medium text-sm"
                    onClick={() => router.push("/metrics")}
                  >
                    View Metrics
                  </Button>
                  {(userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'MEMBER') && (
                    <Button
                      variant="outline"
                      className="rounded-lg border-primary/50 text-primary hover:bg-primary/20 hover:text-primary font-medium text-sm"
                      onClick={() => router.push("/organisationSettings/inviteMembers")}
                    >
                      Organization Settings
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}