"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Flag,
  BarChart3,
  Bell,
  FileText,
  UserPlus,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FlagCreationProvider } from "../../contexts/flag-creation"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL   || "http://localhost:8000" 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
    router.push("/auth/signin")
  }

  const sidebarItems = [
    {
      name: "Flags",
      href: "/flags",
      icon: Flag,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      name: "Metrics",
      href: "/metrics",
      icon: BarChart3,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      name: "Alerts",
      href: "/alerts",
      icon: Bell,
      gradient: "from-orange-500 to-amber-600",
    },
    {
      name: "Audit Logs",
      href: "/auditLogs",
      icon: FileText,
      gradient: "from-purple-500 to-violet-600",
    },
    {
      name: "Invite Members",
      href: "/inviteMembers",
      icon: UserPlus,
      gradient: "from-pink-500 to-rose-600",
    },
    {
      name: "Integrate Slack",
      href: "/slack",
      icon: MessageSquare,
      gradient: "from-green-500 to-emerald-600",
    },
    {
      name: "Settings",
      href: "/organisation/settings",
      icon: Settings,
      gradient: "from-gray-500 to-slate-600",
    },
    {
      name: "Logout",
      icon: LogOut,
      onClick: handleLogout,
      gradient: "from-red-500 to-rose-600",
    },
  ]

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
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
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
          <div className="min-h-screen">
            <FlagCreationProvider>
              {children}
            </FlagCreationProvider>
            </div>
        </main>
      </div>
    </div>
  )
}
