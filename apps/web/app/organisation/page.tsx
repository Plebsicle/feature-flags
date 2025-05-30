"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Building2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "../../contexts/auth-context"

export default function OrganizationPage() {
  const [organizationName, setOrganizationName] = useState("")
  const { partialSignupDetails,completeSignup,isLoading } = useAuth()
  const router = useRouter()

  if (!partialSignupDetails) {
    router.push("/auth/signin")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
      const {googleToken} = partialSignupDetails;
      console.log(googleToken);
       const response = await completeSignup(organizationName);
      if(response ){
        if(googleToken)
       { 
        router.push("dashboard");
       }
        else {
          router.push('/auth/check-email-verify');
        }
      }
      else{
        // add toast here 
        console.log("Signup Failed");
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-purple-900 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <motion.div variants={itemVariants}>
            <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
              <CardHeader className="text-center pb-6 pt-6 sm:pt-8">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Building2 className="w-8 h-8 text-white" />
                </motion.div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Almost There!
                </CardTitle>
                <CardDescription className="text-neutral-400 dark:text-neutral-300">
                  What's the name of your organization?
                </CardDescription>
              </CardHeader>

              <CardContent>
                <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <Label
                      htmlFor="organization"
                      className="text-sm font-medium text-neutral-300 dark:text-neutral-200"
                    >
                      Organization Name
                    </Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="organization"
                            type="text"
                            value={organizationName}
                            onChange={(e) => setOrganizationName(e.target.value)}
                            placeholder="Enter your organization name"
                            className="pl-10 h-12 bg-slate-700/50 dark:bg-neutral-700/50 border-2 border-slate-600 dark:border-neutral-600 focus:border-violet-500 transition-colors text-neutral-100 placeholder:text-neutral-400"
                            required
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-700 text-neutral-200 border-slate-600">
                        <p>The name of your company or team.</p>
                      </TooltipContent>
                    </Tooltip>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      This helps us personalize your experience.
                    </p>
                  </motion.div>
                </motion.form>
              </CardContent>

              <CardFooter className="flex flex-col gap-3">
                <motion.div variants={itemVariants} className="w-full">
                  <Button
                    onClick={handleSubmit}
                    disabled={isLoading || !organizationName.trim()}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Sparkles className="mr-2 w-5 h-5" />
                        Complete Setup
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="text-center mt-6 text-neutral-500 dark:text-neutral-400 text-sm"
          >
            Welcome to the team, {partialSignupDetails.name}! 🎉
          </motion.div>
        </motion.div>
      </div>
    </TooltipProvider>
  )
}
