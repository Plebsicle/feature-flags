"use client"

import { motion } from "framer-motion"
import { Flag, BarChart3, Users } from "lucide-react"

export function InteractiveElements() {
  const handleCreateFlag = () => {
    console.log("Creating new flag...")
    // Handle navigation or modal opening
  }

  const handleViewAnalytics = () => {
    console.log("Opening analytics...")
  }

  const handleInviteTeam = () => {
    console.log("Opening invite modal...")
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCreateFlag}
        className="w-full p-3 sm:p-4 text-left rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-indigo-500/20 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-white font-medium text-sm sm:text-base">Create New Flag</div>
            <div className="text-neutral-400 text-xs sm:text-sm">Set up a new feature flag</div>
          </div>
        </div>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleViewAnalytics}
        className="w-full p-3 sm:p-4 text-left rounded-lg bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:from-emerald-500/20 hover:to-teal-500/20 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-white font-medium text-sm sm:text-base">View Analytics</div>
            <div className="text-neutral-400 text-xs sm:text-sm">Check flag performance</div>
          </div>
        </div>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleInviteTeam}
        className="w-full p-3 sm:p-4 text-left rounded-lg bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-violet-500/20 transition-all duration-300"
      >
        <div className="flex items-center space-x-3">
          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-white font-medium text-sm sm:text-base">Invite Team</div>
            <div className="text-neutral-400 text-xs sm:text-sm">Add new team members</div>
          </div>
        </div>
      </motion.button>
    </>
  )
}
