"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { GoogleLogin } from '@react-oauth/google';
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Mail, Lock, Eye, EyeOff, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../../contexts/auth-context"
import { Toaster, toast } from "react-hot-toast"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const promise = login(email, password);
    toast.promise(promise, {
      loading: 'Signing in...',
      success: (success) => {
        if (success) {
          router.push("/dashboard")
          return 'Signed in successfully!'
        } else {
          throw new Error('Invalid credentials')
        }
      },
      error: 'Invalid credentials. Please try again.'
    })
  }

  const handleGoogleSuccess = async (credentialResponse: {credential? : string})=> {
    const googleToken = credentialResponse.credential;
    const promise = login(undefined,undefined,googleToken);

    toast.promise(promise, {
      loading: 'Signing in with Google...',
      success: (success) => {
        if (success) {
          router.push('/dashboard');
          return 'Signed in successfully!'
        } else {
          throw new Error('Invalid credentials')
        }
      },
      error: 'Google login failed. Please try again.'
    })
  }

  const handleGoogleFailure = () =>{
    toast.error('Google login failed. Please try again.');
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
            <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
            <p className="text-gray-600 mt-1">Sign in to your account</p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="shadow-lg">
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl text-center">Sign in</CardTitle>
                <CardDescription className="text-center">
                  Enter your email and password to access your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
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
                    disabled={isLoading}
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
                        Sign in
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
                      text="signin_with"
                      shape="rectangular"
                      theme="outline"
                      size="large"
                      width="100%"
                    />
                  </div>
                </form>

                <div className="mt-6 text-center text-sm">
                  <Link
                    href="/auth/request-verification-email"
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Resend verification email
                  </Link>
                </div>

                <div className="mt-4 text-center text-sm text-gray-600">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    Sign up
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
