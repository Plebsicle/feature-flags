"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "../../../contexts/auth-context"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const success = await login(email, password);
    if (success) {
      router.push("/dashboard")
    } else {
      setError("Invalid credentials. Please try again.")
    }
  }

  const handleGoogleSuccess = async (credentialResponse: {credential? : string})=> {
    try{
      const googleToken = credentialResponse.credential;
      const response = await login(undefined,undefined,googleToken);
      if(response){
        router.push('/dashboard');
      }
      else{
      setError("Invalid credentials. Please try again.");
      }
    }
    catch(e){
      console.error(e);
      console.log('Google Login Failed');
    }
  }

  const handleGoogleFailure = () =>{
    // toast for google failure 
    console.log('Google Login Failed');
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-6 sm:p-8"
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-neutral-400 dark:text-neutral-300 mt-2">Sign in to continue your journey</p>
            </motion.div>

            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                  Email
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-purple-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                    <p>Enter your registered email address.</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-purple-500 hover:text-purple-400 transition-colors"
                  >
                    Forgot password?
                  </Link>
                  
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-purple-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
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
                    <p>Enter your account password.</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 text-sm text-center bg-red-900/30 dark:bg-red-900/40 p-3 rounded-lg border border-red-700/50"
                >
                  {error}
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </motion.div>
              <motion.div variants={itemVariants} className="text-center text-sm">
                <Link
                  href="/auth/request-verification-email"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Resend verification email?
                </Link>
              </motion.div>
            </motion.form>

            <motion.div variants={itemVariants} className="mt-6">
              <div className="relative">
                <Separator className="my-4" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-slate-800 dark:bg-neutral-800 px-4 text-sm text-neutral-500 dark:text-neutral-400">
                    Or continue with
                  </span>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 mt-4 border-2 border-slate-600 dark:border-neutral-600 hover:border-slate-500 dark:hover:border-neutral-500 bg-slate-700/30 hover:bg-slate-700/50 text-neutral-200 transition-all duration-300"
                >
                  <div className="flex justify-center items-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleFailure}
                  theme="filled_blue" // "filled_blue" or "outline" or "filled_black"
                  shape="rectangular" // "rectangular", "square", "circle", "pill"
                  logo_alignment="left" // "left" or "center"
                  text="signin_with" // "signin_with", "signup_with", "continue_with", "signin"
                  size="large" // "small", "medium", "large"
                  width="300px" // Custom width
                  // containerProps={{ style: { width: '100%' } }} // Example of container props
                />
              </div>
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mt-6">
              <p className="text-neutral-400 dark:text-neutral-300">
                Don't have an account?{" "}
                <Link href="/auth/signup" className="text-purple-500 hover:text-purple-400 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
