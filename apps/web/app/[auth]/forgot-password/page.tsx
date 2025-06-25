"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { motion } from "framer-motion"
import Link from "next/link"
import { Mail, ArrowRight, ArrowLeft, KeyRound, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster, toast } from "react-hot-toast"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://locahost:8000"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const promise = axios.post(`/${BACKEND_URL}/auth/sendVerificationEmailForgetPassword`,{
      email
    });

    toast.promise(promise, {
        loading: 'Sending reset link...',
        success: (response) => {
            if(response.status === 200){
                router.push("/auth/check-email-password-reset");
                return 'Reset link sent successfully!';
            } else {
                throw new Error('Failed to send reset link');
            }
        },
        error: (err) => {
            console.error(err);
            return 'Failed to send reset link. Please try again.';
        }
    }).finally(() => {
        setIsLoading(false)
    })
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
                className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4"
              >
                <KeyRound className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <div className="flex items-center justify-center mb-4">
                  <Flag className="w-6 h-6 text-indigo-600 mr-2" />
                  <span className="text-lg font-semibold text-gray-900">FeatureFlag</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Forgot Password?
                </CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  No worries, we'll send you reset instructions.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-900">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter the email associated with your account.
                  </p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
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
                        Send Reset Link
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.form>
            </CardContent>
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
          </Card>
        </motion.div>
      </div>
    </>
  )
}
