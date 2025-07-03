"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
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
} from "lucide-react"
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
      return { bg: "bg-amber-100", text: "text-amber-800", icon: "text-amber-600" }
    case 'ADMIN':
      return { bg: "bg-purple-100", text: "text-purple-800", icon: "text-purple-600" }
    case 'MEMBER':
      return { bg: "bg-indigo-100", text: "text-indigo-800", icon: "text-indigo-600" }
    case 'VIEWER':
      return { bg: "bg-emerald-100", text: "text-emerald-800", icon: "text-emerald-600" }
    default:
      return { bg: "bg-gray-100", text: "text-gray-800", icon: "text-gray-600" }
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
      } catch (error) {
        console.error("Failed to fetch user data:", error)
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
        ease: "easeOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center space-x-3 text-gray-900">
          <LoaderIcon className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg font-medium">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center max-w-md">
          <p className="text-lg mb-4 text-gray-900">{error}</p>
          <p className="text-gray-600 mb-4">Redirecting to sign in...</p>
          <Button onClick={() => router.push("/auth/signin")}>
            Go to Sign In Now
          </Button>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="p-8 text-center max-w-md">
          <p className="text-lg mb-4 text-gray-900">No user data available</p>
          <Button onClick={() => router.push("/auth/signin")}>
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
            className="mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
              <p className="text-gray-600 text-lg">Manage your account information</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-3 text-indigo-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Full Name</p>
                    <p className="text-gray-900 font-medium">{userData.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Email Address</p>
                    <p className="text-gray-900 font-medium">{userData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role & Permissions */}
          <motion.div variants={itemVariants}>
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-3 text-emerald-600" />
                  Role & Permissions
                </CardTitle>
                <CardDescription>
                  Your access level and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-12 h-12 ${roleColors.bg} rounded-lg flex items-center justify-center`}>
                    <RoleIcon className={`w-6 h-6 ${roleColors.icon}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg font-semibold text-gray-900">{userData.role}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors.bg} ${roleColors.text}`}>
                        Active
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {getRoleDescription(userData.role)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organization Details */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Building className="w-5 h-5 mr-3 text-amber-600" />
                  Organization Details
                </CardTitle>
                <CardDescription>
                  Information about your organization and ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Organization</p>
                    <p className="text-gray-900 font-medium">{userData.organisationName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Organization Owner</p>
                    <p className="text-gray-900 font-medium">{userData.ownerName}</p>
                    <p className="text-gray-600 text-sm">{userData.ownerEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-indigo-200 bg-indigo-50 hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 flex items-center">
                  <Edit3 className="w-5 h-5 mr-3 text-indigo-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push("/flags")}
                  >
                    View Feature Flags
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/metrics")}
                  >
                    View Metrics
                  </Button>
                  {(userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'MEMBER') && (
                    <Button
                      variant="outline"
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