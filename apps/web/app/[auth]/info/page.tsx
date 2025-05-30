"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, User, Lock, Shield, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "../../../contexts/auth-context"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useSearchParams } from "next/navigation"

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center text-xs ${met ? "text-green-400" : "text-neutral-400"}`}>
    {met ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </li>
)

export default function InfoPage() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const searchParams = useSearchParams();
  const [token,setToken] = useState<string>("");
  const {isLoading}  = useAuth();
  const router = useRouter()

  const passwordRequirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
  }
  const allPasswordRequirementsMet = Object.values(passwordRequirements).every(Boolean)

  useEffect(()=>{
    const tokenParams = searchParams?.get("token");
    if(tokenParams)
      setToken(tokenParams);
  },[]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccessMessage("")

    if (!name.trim()) {
      setError("Please enter your full name.")
      return
    }
    if (!allPasswordRequirementsMet) {
      setError("Password does not meet all requirements.")
      return
    }

    try {
      const results = await axios.post('http://localhost:8000/auth/memberSignupVerification',{
        name , password, token
      });
      if(results.status === 200){
        setSuccessMessage("Account setup completed successfully! Redirecting to dashboard...")
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      else{
        setError("Account setup failed. Please try again.")
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    }
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
    <TooltipProvider>
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
                {!successMessage && (
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
                          disabled={isLoading}
                        />
                      </div>
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
                              placeholder="Enter your password"
                              className="pl-10 pr-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-orange-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                              required
                              disabled={isLoading}
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
                      <motion.p
                        variants={itemVariants}
                        className="text-sm p-3 rounded-md bg-red-900/30 text-red-400 border border-red-700/50"
                      >
                        {error}
                      </motion.p>
                    )}
                  </motion.form>
                )}

                {successMessage && (
                  <motion.div variants={itemVariants} className="text-center space-y-4">
                    <p className="text-lg text-green-400">{successMessage}</p>
                  </motion.div>
                )}
              </CardContent>

              <CardFooter>
                {!successMessage && (
                  <motion.div variants={itemVariants} className="w-full">
                    <Button
                      onClick={handleSubmit}
                      disabled={isLoading || !allPasswordRequirementsMet || !name.trim()}
                      className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
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
                )}
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}