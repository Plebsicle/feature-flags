"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
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
        const response = await fetch(`${BACKEND_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        })
        
        if (response.ok) {
          const data = await response.json()
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
        color: "text-indigo-600",
        bgColor: "bg-indigo-50",
        allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      },
      {
        name: "Metrics",
        href: "/metrics",
        icon: BarChart3,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Alerts",
        href: "/alerts",
        icon: Bell,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Kill Switches",
        href: "/killSwitch",
        icon: Skull,
        color: "text-red-600",
        bgColor: "bg-red-50",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Audit Logs",
        href: "/auditLogs",
        icon: FileText,
        color: "text-purple-600",
        bgColor: "bg-purple-50",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
      {
        name: "Integrate Slack",
        href: "/slack",
        icon: MessageSquare,
        color: "text-green-600",
        bgColor: "bg-green-50",
        allowedRoles: ['OWNER'],
      },
      {
        name: "Organisation Settings",
        href: "/organisationSettings/inviteMembers",
        icon: Settings,
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        allowedRoles: ['OWNER', 'ADMIN'],
      },
    ]

    return allItems.filter(item => item.allowedRoles.includes(role as any))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-gray-900">
          <LoaderIcon className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-lg font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <p className="text-lg mb-4 text-gray-900">Unable to load user data</p>
          <Button onClick={() => router.push("/auth/signin")}>
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  const sidebarItems = getFilteredSidebarItems(userData.role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              
              <Link href="/dashboard" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Flag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">
                  Bitswitch
                </span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{userData.name}</p>
                <p className="text-xs text-gray-500">{userData.organisationName}</p>
              </div>
              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileClick}
                  className="flex items-center space-x-2"
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </Button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:ml-2 sm:block">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-16 left-0 z-40 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const isActive = pathname?.startsWith(item.href || '') || false
              const Icon = item.icon
              
              if (item.href) {
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? `${item.bgColor} ${item.color}`
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              }
              
              return null
            })}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}