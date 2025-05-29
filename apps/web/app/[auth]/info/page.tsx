"use client"

import type React from "react"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, User, Lock, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../../contexts/auth-context"

export default function InfoPage() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const {signup , isLoading}  = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-orange-900 to-red-900 flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <motion.div variants={itemVariants}>
          <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center pb-6 pt-6 sm:pt-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Shield className="w-8 h-8 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Additional Information
              </CardTitle>
              <CardDescription className="text-neutral-400 dark:text-neutral-300">
                Please provide your details to complete the process
              </CardDescription>
            </CardHeader>

            <CardContent>
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-orange-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-orange-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                      required
                    />
                  </div>
                </motion.div>
              </motion.form>
            </CardContent>

            <CardFooter>
              <motion.div variants={itemVariants} className="w-full">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}
