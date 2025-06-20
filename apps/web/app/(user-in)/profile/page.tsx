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
  Users,
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
      return "from-yellow-500 to-orange-600"
    case 'ADMIN':
      return "from-purple-500 to-violet-600"
    case 'MEMBER':
      return "from-blue-500 to-indigo-600"
    case 'VIEWER':
      return "from-green-500 to-teal-600"
    default:
      return "from-gray-500 to-slate-600"
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
        // If the first endpoint fails, try the auth endpoint
       
        const   response = await fetch(`${BACKEND_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
          })
        
        
        if (response.ok) {
          const data = await response.json()
          // Handle both possible response structures
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
        staggerChildren: 0.15,
        duration: 0.7,
        ease: "easeInOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <LoaderIcon className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading profile...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">{error}</p>
          <p className="text-neutral-400 mb-4">Redirecting to sign in...</p>
          <Button onClick={() => router.push("/auth/signin")} className="bg-blue-600 hover:bg-blue-700">
            Go to Sign In Now
          </Button>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">No user data available</p>
          <Button onClick={() => router.push("/auth/signin")} className="bg-blue-600 hover:bg-blue-700">
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  const RoleIcon = getRoleIcon(userData.role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 lg:p-8">
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
            className="text-neutral-300 hover:text-white hover:bg-slate-800/50 mb-6"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Profile</h1>
              <p className="text-neutral-400 text-lg">Manage your account information</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center">
                  <User className="w-6 h-6 mr-3 text-blue-400" />
                  Personal Information
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Your account details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-1">Full Name</p>
                    <p className="text-white font-medium text-lg">{userData.name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-1">Email Address</p>
                    <p className="text-white font-medium text-lg">{userData.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Role & Permissions */}
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-emerald-400" />
                  Role & Permissions
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Your access level and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 p-6 bg-slate-900/50 rounded-xl">
                  <div className={`w-16 h-16 bg-gradient-to-r ${getRoleColor(userData.role)} rounded-xl flex items-center justify-center`}>
                    <RoleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-2xl font-bold text-white">{userData.role}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getRoleColor(userData.role)} text-white`}>
                        Active
                      </span>
                    </div>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {getRoleDescription(userData.role)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Organization Details */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="bg-slate-800/40 backdrop-blur-xl border-slate-700/30 hover:border-slate-600/40 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center">
                  <Building className="w-6 h-6 mr-3 text-orange-400" />
                  Organization Details
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Information about your organization and ownership
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-1">Organization</p>
                    <p className="text-white font-medium text-lg">{userData.organisationName}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 bg-slate-900/50 rounded-xl">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-neutral-400 mb-1">Organization Owner</p>
                    <p className="text-white font-medium text-lg">{userData.ownerName}</p>
                    <p className="text-neutral-400 text-sm">{userData.ownerEmail}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center">
                  <Edit3 className="w-6 h-6 mr-3 text-blue-400" />
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Common tasks and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button
                    variant="outline"
                    className="border-slate-700 text-neutral-300 hover:bg-slate-800/50 hover:border-slate-600 hover:text-white"
                    onClick={() => router.push("/flags")}
                  >
                    View Feature Flags
                  </Button>
                  <Button
                    variant="outline"
                    className="border-slate-700 text-neutral-300 hover:bg-slate-800/50 hover:border-slate-600 hover:text-white"
                    onClick={() => router.push("/metrics")}
                  >
                    View Metrics
                  </Button>
                  {(userData.role === 'OWNER' || userData.role === 'ADMIN' || userData.role === 'MEMBER') && (
                    <Button
                      variant="outline"
                      className="border-slate-700 text-neutral-300 hover:bg-slate-800/50 hover:border-slate-600 hover:text-white"
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