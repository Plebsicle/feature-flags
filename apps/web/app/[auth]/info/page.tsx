"use client"

import type React from "react"

import { use, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, User, Lock, Shield, Eye, EyeOff, CheckCircle, XCircle, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../../contexts/auth-context"
import { useRouter } from "next/navigation"
import axios from "axios"
import { useSearchParams } from "next/navigation"
import { Toaster, toast } from "react-hot-toast"

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center text-xs ${met ? "text-emerald-600" : "text-gray-500"}`}>
    {met ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </li>
)

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://locahost:8000"

export default function InfoPage() {
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

    if (!name.trim()) {
      toast.error("Please enter your full name.")
      return
    }
    if (!allPasswordRequirementsMet) {
      toast.error("Password does not meet all requirements.")
      return
    }

    const promise = axios.post(`/${BACKEND_URL}/auth/memberSignupVerification`,{
        name , password, token
    });

    toast.promise(promise, {
      loading: 'Setting up your account...',
      success: (response) => {
        if(response.status === 200){
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return "Account setup completed successfully! Redirecting...";
        } else {
          throw new Error('Account setup failed');
        }
      },
      error: (err) => {
        console.error(err);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 3000);
        return "An error occurred. Please try again."
      }
    });
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
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants}>
            <Card className="shadow-lg border border-gray-200">
              <CardHeader className="text-center pb-6 pt-6 sm:pt-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4"
                >
                  <Shield className="w-8 h-8 text-indigo-600" />
                </motion.div>
                <div className="flex items-center justify-center mb-4">
                  <Flag className="w-6 h-6 text-indigo-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">Bitswitch</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Additional Information
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Please provide your details to complete the process
                </CardDescription>
              </CardHeader>

              <CardContent>
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-gray-900">
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
                        className="pl-10 h-12"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-900">
                      Password
                    </Label>
                    <div className="mt-1 mb-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <ul className="space-y-1">
                        <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters long" />
                        <PasswordRequirement met={passwordRequirements.uppercase} text="1 uppercase letter (A-Z)" />
                        <PasswordRequirement met={passwordRequirements.lowercase} text="1 lowercase letter (a-z)" />
                        <PasswordRequirement met={passwordRequirements.number} text="1 number (0-9)" />
                        <PasswordRequirement met={passwordRequirements.specialChar} text="1 special character (!@#$...)" />
                      </ul>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-12"
                        required
                        disabled={isLoading}
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
                </motion.form>
              </CardContent>

              <CardFooter className="pt-6">
                <motion.div variants={itemVariants} className="w-full">
                  <Button
                    onClick={handleSubmit}
                    disabled={!name.trim() || !allPasswordRequirementsMet || isLoading}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Complete Setup
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
    </>
  )
}