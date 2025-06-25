"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GoogleLogin } from '@react-oauth/google';
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, User, Eye, EyeOff, CheckCircle, XCircle, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../../contexts/auth-context"
import { Toaster, toast } from "react-hot-toast"

const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <li className={`flex items-center text-xs ${met ? "text-emerald-600" : "text-gray-500"}`}>
    {met ? <CheckCircle className="w-3 h-3 mr-1.5" /> : <XCircle className="w-3 h-3 mr-1.5" />}
    {text}
  </li>
)

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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
    if (!allRequirementsMet) {
      toast.error("Password does not meet all requirements.")
      return
    }

    const promise = signup(name, email, password);
    toast.promise(promise, {
      loading: 'Creating your account...',
      success: (success) => {
        if (success) {
          router.push("/organisation");
          return 'Account created successfully!';
        } else {
          throw new Error('Failed to create account');
        }
      },
      error: 'Failed to create account. Please try again.'
    });
  }

  const handleGoogleSuccess =  (credentialResponse: { credential?: string }) =>{
    const googleToken = credentialResponse.credential;
    const promise = signup(undefined,undefined,undefined,googleToken);
    toast.promise(promise, {
      loading: 'Signing up with Google...',
      success: (success) => {
        if (success) {
          router.push('/organisation');
          return 'Account created successfully!';
        } else {
          throw new Error('Failed to create account');
        }
      },
      error: 'Google signup failed. Please try again.'
    });
  }

  const handleGoogleFailure = () =>{
    toast.error('Google signup failed. Please try again.');
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
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
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div 
          variants={containerVariants} 
          initial="hidden" 
          animate="visible" 
          className="w-full max-w-md"
        >
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Flag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-600 mt-1">Get started with your free account</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-center">Sign up</CardTitle>
                <CardDescription className="text-center">
                  Enter your details to create your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="mt-1 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                      <ul className="space-y-1">
                        <PasswordRequirement met={passwordRequirements.minLength} text="At least 8 characters long" />
                        <PasswordRequirement met={passwordRequirements.uppercase} text="1 uppercase letter (A-Z)" />
                        <PasswordRequirement met={passwordRequirements.lowercase} text="1 lowercase letter (a-z)" />
                        <PasswordRequirement met={passwordRequirements.number} text="1 number (0-9)" />
                        <PasswordRequirement met={passwordRequirements.specialChar} text="1 special character (!@#$...)" />
                      </ul>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !allRequirementsMet}
                    className="w-full"
                    size="lg"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Create account
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleFailure}
                      text="signup_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                      width="100%"
                    />
                  </div>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/auth/signin" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Sign in
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
