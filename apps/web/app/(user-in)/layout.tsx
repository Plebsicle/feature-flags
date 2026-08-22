"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Flag,
  LineChart,
  BellRing,
  ScrollText,
  Hash,
  Building2,
  Menu,
  X,
  LogOut,
  Power,
  CircleUser,
  LoaderIcon,
  Loader2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
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
      } catch (err) {
        console.error("Failed to fetch user data:", err)
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
    } catch (err) {
      console.error("Logout error:", err)
    }
    router.push("/auth/signin")
  }

  const handleProfileClick = () => {
    router.push("/profile")
  }

  type SidebarItem = {
    name: string
    href: string
    icon: React.ElementType
    allowedRoles: string[]
  }

  type SidebarGroup = {
    label: string
    items: SidebarItem[]
  }

  const getFilteredSidebarGroups = (role: string): SidebarGroup[] => {
    const groups: SidebarGroup[] = [
      {
        label: "Main",
        items: [
          {
            name: "Dashboard",
            href: "/dashboard",
            icon: Flag, // Just a placeholder, dashboard usually has LayoutDashboard or something but we can reuse Flag for now. Wait, dashboard doesn't have an item in the old sidebar, users reached it by clicking the logo? Let's add it. No, wait, old layout had Flag for /flags, and nothing for /dashboard. Let's look at the old items.
            allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
          },
          {
            name: "Flags",
            href: "/flags",
            icon: Flag,
            allowedRoles: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
          }
        ]
      },
      {
        label: "Analytics",
        items: [
          {
            name: "Metrics",
            href: "/metrics",
            icon: LineChart,
            allowedRoles: ['OWNER', 'ADMIN'],
          },
          {
            name: "Alerts",
            href: "/alerts",
            icon: BellRing,
            allowedRoles: ['OWNER', 'ADMIN'],
          },
        ]
      },
      {
        label: "Operations",
        items: [
          {
            name: "Kill Switches",
            href: "/killSwitch",
            icon: Power,
            allowedRoles: ['OWNER', 'ADMIN'],
          },
          {
            name: "Audit Logs",
            href: "/auditLogs",
            icon: ScrollText,
            allowedRoles: ['OWNER', 'ADMIN'],
          },
        ]
      },
      {
        label: "Integrations",
        items: [
          {
            name: "Integrate Slack",
            href: "/slack",
            icon: Hash,
            allowedRoles: ['OWNER'],
          },
        ]
      },
      {
        label: "Management",
        items: [
          {
            name: "Organisation Settings",
            href: "/organisationSettings/inviteMembers",
            icon: Building2,
            allowedRoles: ['OWNER'],
          },
        ]
      }
    ]

    return groups.map(group => ({
      ...group,
      items: group.items.filter(item => item.allowedRoles.includes(role))
    })).filter(group => group.items.length > 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative z-10 border border-primary/20">
            <Flag className="w-8 h-8 text-primary animate-pulse" />
          </div>
        </div>
        <div className="flex items-center space-x-2 text-foreground">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground tracking-wide">Loading Dashboard...</span>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md rounded-xl">
          <p className="text-lg mb-4 text-foreground">Unable to load user data</p>
          <Button onClick={() => router.push("/auth/signin")} className="rounded-lg">
            Go to Sign In
          </Button>
        </Card>
      </div>
    )
  }

  const sidebarGroups = getFilteredSidebarGroups(userData.role)

  // Determine current page name for breadcrumbs
  let currentPageName = "Dashboard"
  for (const group of sidebarGroups) {
    for (const item of group.items) {
      if (pathname?.startsWith(item.href)) {
        currentPageName = item.name
        break
      }
    }
  }

  return (
    <div className="min-h-screen bg-background font-inter-tight">
      {/* Header */}
      <header className={cn(
        "fixed top-0 right-0 z-40 bg-surface-overlay backdrop-blur-xl border-b border-border transition-all duration-200 ease-in-out h-16",
        sidebarExpanded ? "left-0 lg:left-64" : "left-0 lg:left-20"
      )}>
        <div className="px-4 sm:px-6 h-full flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground font-medium">
              <span className="hover:text-foreground transition-colors cursor-pointer" onClick={() => router.push('/dashboard')}>{userData.organisationName}</span>
              <span>/</span>
              <span className="text-foreground">{currentPageName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 pl-2 pr-2 sm:pr-3 rounded-lg"
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border border-border">
                    <CircleUser className="w-5 h-5 text-foreground" />
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{userData.name}</p>
                    <p className="text-xs text-muted-foreground">{userData.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={handleProfileClick}>
                  <CircleUser className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen bg-sidebar border-r border-border transform transition-all duration-200 ease-in-out flex flex-col",
        sidebarExpanded ? "w-64" : "w-20",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header (Logo) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-transparent">
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className={cn("text-xl font-bold tracking-tight text-foreground transition-opacity duration-200", !sidebarExpanded && "opacity-0 hidden")}>
              Bitswitch
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden shrink-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {sidebarGroups.map((group) => (
            <div key={group.label} className="space-y-1">
              <p className={cn("text-xs font-semibold text-muted-foreground mb-2 px-3 transition-opacity duration-200 uppercase tracking-wider", !sidebarExpanded && "opacity-0 hidden")}>
                {group.label}
              </p>
              {group.items.map((item) => {
                const isActive = pathname?.startsWith(item.href) || false
                const Icon = item.icon
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      !sidebarExpanded && "justify-center px-0"
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false)
                    }}
                    title={!sidebarExpanded ? item.name : undefined}
                  >
                    <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")} />
                    <span className={cn("transition-opacity duration-200", !sidebarExpanded && "opacity-0 hidden")}>{item.name}</span>
                    {isActive && (
                      <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarExpanded(!sidebarExpanded)}
            className="w-full hidden lg:flex items-center justify-center text-muted-foreground hover:bg-muted rounded-lg"
          >
            {sidebarExpanded ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5" />
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className={cn(
        "h-dvh overflow-y-auto pt-16 transition-all duration-200 ease-in-out",
        sidebarExpanded ? "lg:pl-64" : "lg:pl-20"
      )}>
        <div className="p-6 relative z-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
