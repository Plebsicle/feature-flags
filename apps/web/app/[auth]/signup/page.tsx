"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleLogin } from '@react-oauth/google';
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "../../../contexts/auth-context"

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center text-xs ${met ? "text-green-400" : "text-neutral-400"}`}>
    {met ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </li>
)

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { signup, isLoading } = useAuth()
  const router = useRouter()

  const passwordRequirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  }
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!allRequirementsMet) {
      setError("Password does not meet all requirements.")
      return
    }

    const success = signup(name, email, password);
    if (success) {
      router.push("/organisation");
    } else {
      setError("Failed to create account. Please try again.")
    }
  }

  const handleGoogleSuccess =  (credentialResponse: { credential?: string }) =>{
    try{
      const googleToken = credentialResponse.credential;
       const results = signup(undefined,undefined,undefined,googleToken);
       if(results)
        router.push('/organisation');
    }
    catch(e){
      setError("Failed to create account. Please try again.")
    }
  }

  const handleGoogleFailure = () =>{
    // toast for google failure 
    console.log('Google Signup Failed');
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 flex items-center justify-center p-4">
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
                className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <User className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-neutral-400 dark:text-neutral-300 mt-2">Join us and start your journey today</p>
            </motion.div>

            <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                  Full Name
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-emerald-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                    <p>Please enter your full name.</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

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
                        className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-emerald-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                    <p>We'll use this for login and communication.</p>
                  </TooltipContent>
                </Tooltip>
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                  Password
                </Label>
                <div className="mt-1 mb-2 p-3 bg-slate-700/30 dark:bg-neutral-700/30 rounded-md border border-slate-600/50 dark:border-neutral-600/50">
                  <ul className="space-y-1">
                    <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters long" />
                    <PasswordRequirement met={passwordRequirements.uppercase} text="1 uppercase letter (A-Z)" />
                    <PasswordRequirement met={passwordRequirements.lowercase} text="1 lowercase letter (a-z)" />
                    <PasswordRequirement met={passwordRequirements.number} text="1 number (0-9)" />
                    <PasswordRequirement met={passwordRequirements.specialChar} text="1 special character (!@#$...)" />
                  </ul>
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
                        placeholder="Create a password"
                        className="pl-10 pr-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-emerald-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                        required
                        aria-describedby="password-requirements"
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
                    <p>Choose a strong and secure password.</p>
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
                  disabled={isLoading || !allRequirementsMet}
                  className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
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
                </Button>
              </motion.div>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center mt-6">
              <p className="text-neutral-400 dark:text-neutral-300">
                Already have an account?{" "}
                <Link
                  href="/auth/signin"
                  className="text-emerald-500 hover:text-emerald-400 font-semibold transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
