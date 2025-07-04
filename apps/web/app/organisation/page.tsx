"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Building2, Sparkles, Flag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../../contexts/auth-context"

export default function OrganizationPage() {
  const [organizationName, setOrganizationName] = useState("")
  const { partialSignupDetails, completeSignup, isLoading, clearPartialSignup } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!partialSignupDetails) {
      router.push("/auth/signin")
    }
  }, [partialSignupDetails, router])

  if (!partialSignupDetails) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Before signup", partialSignupDetails);
    const { googleToken } = partialSignupDetails;
    console.log(googleToken);
    // Store whether this is a Google signup before partialSignupDetails is cleared
    const isGoogleSignup = !!googleToken;
    const response = await completeSignup(organizationName);
    console.log("After signup", partialSignupDetails);
    console.log(response);
    if (response) {
      if (isGoogleSignup) {
        router.push("/dashboard");
      }
      else {
        router.push('/auth/check-email-verify');
      }
      clearPartialSignup()
    }
    else {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center pb-6 pt-6 sm:pt-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4"
              >
                <Building2 className="w-8 h-8 text-indigo-600" />
              </motion.div>
              <div className="flex items-center justify-center mb-4">
                <Flag className="w-6 h-6 text-indigo-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">FeatureFlag</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Almost There!
              </CardTitle>
              <CardDescription className="text-gray-600">
                What&apos;s the name of your organization?
              </CardDescription>
            </CardHeader>

            <CardContent>
              <motion.form variants={itemVariants} onSubmit={handleSubmit} className="space-y-6">
                <motion.div variants={itemVariants} className="space-y-2">
                  <Label
                    htmlFor="organization"
                    className="text-sm font-medium text-gray-900"
                  >
                    Organization Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      id="organization"
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Enter your organization name"
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <p className="text-xs text-indigo-700">
                      This helps us personalize your feature flag management experience and organize your team&apos;s projects.
                    </p>
                  </div>
                </motion.div>
              </motion.form>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <motion.div variants={itemVariants} className="w-full">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !organizationName.trim()}
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
          className="text-center mt-6"
        >
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 text-sm">
              Welcome to the team, <span className="font-semibold text-indigo-600">{partialSignupDetails.name}</span>! 🎉
            </p>
            <p className="text-gray-500 text-xs mt-1">
              You&apos;re just one step away from managing your feature flags professionally.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
