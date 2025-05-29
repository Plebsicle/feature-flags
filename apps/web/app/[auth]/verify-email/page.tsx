"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Mail, ArrowRight, ArrowLeft, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import axios from "axios"

export default function VerifyEmail() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    const results = await axios.post(`/http://localhost:8000/auth/sendVerificationEmailManual`,{
        email
    });
    
    if(results.status === 200){
        setIsLoading(false)
        router.push("/auth/check-email-verify");
    }
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                variants={itemVariants}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
                className="w-16 h-16 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <KeyRound className="w-8 h-8 text-white" />
              </motion.div>
              <motion.div variants={itemVariants}>
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
                  Verify Email ?
                </CardTitle>
                <CardDescription className="text-neutral-400 dark:text-neutral-300 mt-2">
                  No worries, we'll send you verification instructions.
                </CardDescription>
              </motion.div>
            </CardHeader>

            <CardContent>
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-neutral-300 dark:text-neutral-200">
                    Email Address
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
                          className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-rose-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                          required
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                      <p>Enter the email associated with your account.</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>

                {message && (
                  <motion.p
                    variants={itemVariants}
                    className={`text-sm p-3 rounded-md ${
                      message.includes("Error")
                        ? "bg-red-900/30 text-red-400 border border-red-700/50"
                        : "bg-green-900/30 text-green-400 border border-green-700/50"
                    }`}
                  >
                    {message}
                  </motion.p>
                )}

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    disabled={isLoading || !email}
                    className="w-full h-12 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Send Verification Link
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
                    className="w-full text-neutral-400 hover:text-neutral-200 hover:bg-slate-700/50 group"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to Sign In
                  </Button>
                </Link>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
