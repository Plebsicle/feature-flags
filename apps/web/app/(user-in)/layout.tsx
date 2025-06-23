"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Flag,
  BarChart3,
  Bell,
  FileText,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  Skull,
  User,
  LoaderIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

interface UserData {
  name: string
  email: string
  organisationName: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  ownerEmail: string
  ownerName: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        
        
        
        const  response = await fetch(`${BACKEND_URL}/auth/me`, {
            method: "GET",
            credentials: "include",
          })
        
        
        if (response.ok) {
          const data = await response.json()
          // Handle both possible response structures
          const user = data.data || data
          setUserData(user)
        } else {
          console.log("Authentication failed, redirecting to signin")
          router.push("/auth/signin")
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
        router.push("/auth/signin")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
    router.push("/auth/signin")
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  const getFilteredSidebarItems = (role: string) => {
    const allItems = [
      {
        name: "Flags",
        href: "/flags",
        icon: Flag,
        gradient: "from-blue-500 to-indigo-600",
        allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      },
      {
        name: "Metrics",
        href: "/metrics",
        icon: BarChart3,
        gradient: "from-emerald-500 to-teal-600",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Alerts",
        href: "/alerts",
        icon: Bell,
        gradient: "from-orange-500 to-amber-600",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Kill Switches",
        href: "/killSwitch",
        icon: Skull,
        gradient: "from-red-500 to-rose-600",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Audit Logs",
        href: "/auditLogs",
        icon: FileText,
        gradient: "from-purple-500 to-violet-600",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Integrate Slack",
        href: "/slack",
        icon: MessageSquare,
        gradient: "from-green-500 to-emerald-600",
        allowedRoles: ['OWNER'],
      },
      {
        name: "Organisation Settings",
        href: "/organisationSettings/inviteMembers",
        icon: Settings,
        gradient: "from-gray-500 to-slate-600",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Logout",
        icon: LogOut,
        onClick: handleLogout,
        gradient: "from-red-500 to-rose-600",
        allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      },
    ]

    return allItems.filter(item => item.allowedRoles.includes(role as any))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-white">
          <LoaderIcon className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-lg mb-4">Unable to load user data</p>
          <Button onClick={() => router.push("/auth/signin")} className="bg-blue-600 hover:bg-blue-700">
            Go to Sign In
          </Button>
        </div>
      </div>
    )
  }

  const sidebarItems = getFilteredSidebarItems(userData.role)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <motion.nav
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }}
        className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50"
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-neutral-300 hover:text-white hover:bg-slate-800/50 p-2"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Link href="/dashboard" className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white">Launch Flagly</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-white">{userData.name}</span>
                <span className="text-xs text-neutral-400">{userData.role}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer"
                onClick={handleProfileClick}
              >
                <User className="w-4 h-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="flex pt-16">
        <motion.aside
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut", delay: 0.2 } }}
          className={cn(
            "fixed left-0 top-16 bottom-0 z-40 w-64 sm:w-72 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="p-4 sm:p-6 h-full overflow-y-auto">
            <div className="mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userData.organisationName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-medium text-sm">{userData.organisationName}</h3>
                  <p className="text-neutral-400 text-xs">{userData.role}</p>
                </div>
              </div>
            </div>

            <nav className="space-y-2">
              {sidebarItems.map((item, index) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                const itemContent = (
                  <div
                    className={cn(
                      "group flex items-center px-3 sm:px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 relative overflow-hidden cursor-pointer",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-white"
                        : "text-neutral-400 hover:text-white hover:bg-slate-800/40"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl"
                        transition={{ type: "spring", duration: 0.6 }}
                      />
                    )}
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 transition-all duration-300 relative z-10",
                        isActive
                          ? `bg-gradient-to-r ${item.gradient}`
                          : "bg-slate-800/60 group-hover:bg-slate-700/60"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 sm:w-5 sm:h-5 transition-colors duration-300",
                          isActive ? "text-white" : "text-neutral-400 group-hover:text-neutral-300"
                        )}
                      />
                    </div>
                    <span className="relative z-10 font-medium text-sm sm:text-base">
                      {item.name}
                    </span>
                    {!isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-700/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                    )}
                  </div>
                )

                return (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { duration: 0.6, delay: index * 0.1 },
                    }}
                  >
                    {item.href ? (
                      <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                        {itemContent}
                      </Link>
                    ) : (
                      <div onClick={item.onClick}>{itemContent}</div>
                    )}
                  </motion.div>
                )
              })}
            </nav>
          </div>
        </motion.aside>

        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 lg:ml-72">
          <div className="min-h-screen">{children}</div>
        </main>
      </div>
    </div>
  )
}