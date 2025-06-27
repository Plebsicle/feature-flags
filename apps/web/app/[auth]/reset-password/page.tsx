"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { redirect, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft, CheckCircle, XCircle, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Toaster, toast } from "react-hot-toast"

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center text-xs ${met ? "text-emerald-600" : "text-gray-500"}`}>
    {met ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </li>
)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://locahost:8000"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")

  const passwordRequirements = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[^A-Za-z0-9]/.test(password),
    passwordsMatch: password === confirmPassword && password.length > 0 && confirmPassword.length > 0,
  }
  const allRequirementsMet = Object.values(passwordRequirements).every(Boolean)

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token. Redirecting...");
      setTimeout(()=> {
        router.push('/auth/forgot-password');
      },3000);
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast.error("Password reset token is missing.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }
    if (!allRequirementsMet) {
      toast.error("Password does not meet all requirements.")
      return
    }

    setIsLoading(true)
    
    const promise = axios.post(`/${BACKEND_URL}/auth/checkVerificationEmailForgetPassword`,{
      password,token
    });

    toast.promise(promise, {
      loading: 'Resetting your password...',
      success: (response) => {
        if(response.status === 200){
          setTimeout(()=>{
            router.push('/auth/signin');
          },3000);
          return "Your password has been reset successfully! Redirecting...";
        } else {
          throw new Error('Failed to reset password');
        }
      },
      error: (err) => {
        console.error(err);
        setTimeout(()=> {
          router.push('/auth/forgot-password');
        },3000);
        return "Reset Password Failed. Please try again.";
      }
    }).finally(() => {
        setIsLoading(false);
    });
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
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                variants={itemVariants}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
                className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4"
              >
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-center mb-4">
                  <Flag className="w-6 h-6 text-indigo-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Bitswitch</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Reset Your Password
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Choose a new strong password for your account.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                    New Password
                  </Label>
                  <div className="mt-1 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <ul className="space-y-1">
                      <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters long" />
                      <PasswordRequirement met={passwordRequirements.uppercase} text="1 uppercase letter (A-Z)" />
                      <PasswordRequirement met={passwordRequirements.lowercase} text="1 lowercase letter (a-z)" />
                      <PasswordRequirement met={passwordRequirements.number} text="1 number (0-9)" />
                      <PasswordRequirement met={passwordRequirements.specialChar} text="1 special character (!@#$...)" />
                      <PasswordRequirement met={passwordRequirements.passwordsMatch} text="Passwords match" />
                    </ul>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={!token || isLoading}
                      aria-describedby="password-requirements"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Choose a strong and secure password.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-900"
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
                      className="pl-10 pr-10 h-12"
                      required
                      disabled={!token || isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={isLoading || !allRequirementsMet || !token}
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
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
            </CardContent>
            {!isLoading && (
              <CardFooter className="pt-6">
                <motion.div variants={itemVariants} className="w-full">
                  <Link href="/auth/signin">
                    <Button
                      variant="ghost"
                      className="w-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 group"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                      Back to Sign In
                    </Button>
                  </Link>
                </motion.div>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      </div>
    </>
  )
}