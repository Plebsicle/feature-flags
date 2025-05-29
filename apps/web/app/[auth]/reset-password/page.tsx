"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.")
      // Optionally redirect or disable form
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!token) {
      setError("Password reset token is missing.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    setIsLoading(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)

    // Mock success
    setSuccessMessage("Your password has been reset successfully! You can now sign in.")
    // router.push("/signin"); // Or redirect after a delay
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-emerald-900 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                variants={itemVariants}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
                className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <ShieldCheck className="w-8 h-8 text-white" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Reset Your Password
                </CardTitle>
                <CardDescription className="text-neutral-400 dark:text-neutral-300 mt-2">
                  Choose a new strong password for your account.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              {!successMessage && (
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                      New Password
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="pl-10 pr-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-green-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                            required
                            disabled={!token || isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                        <p>Must be at least 8 characters.</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-sm font-medium text-neutral-300 dark:text-neutral-200"
                    >
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-green-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
                        disabled={!token || isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </motion.div>

                  {error && (
                    <motion.p
                      variants={itemVariants}
                      className="text-sm p-3 rounded-md bg-red-900/30 text-red-400 border border-red-700/50"
                    >
                      {error}
                    </motion.p>
                  )}

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={isLoading || !password || !confirmPassword || !token}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
                    >
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          Reset Password
                          <ArrowRight className="ml-2 w-5 h-5" />
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
              {successMessage && (
                <motion.div variants={itemVariants} className="text-center space-y-4">
                  <p className="text-lg text-green-400">{successMessage}</p>
                  <Link href="/signin">
                    <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      Sign In Now
                    </Button>
                  </Link>
                </motion.div>
              )}
            </CardContent>
            {!successMessage && (
              <CardFooter className="pt-6">
                <motion.div variants={itemVariants} className="w-full">
                  <Link href="/signin">
                    <Button
                      variant="ghost"
                      className="w-full text-neutral-400 hover:text-neutral-200 hover:bg-slate-700/50 group"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back to Sign In
                    </Button>
                  </Link>
                </motion.div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
