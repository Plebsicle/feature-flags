"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Mail, ArrowLeft, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CheckEmailPasswordResetPage() {
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
              className="w-20 h-20 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-10 h-10 text-indigo-600" />
            </motion.div>
            <div className="flex items-center justify-center mb-4">
              <Flag className="w-6 h-6 text-indigo-600 mr-2" />
              <span className="text-lg font-semibold text-gray-900">Bitswitch</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-gray-600 mt-3 text-base">
              We&apos;ve sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-700 text-sm">
                If an account exists for this email, you&apos;ll receive instructions to reset your password shortly.
              </p>
            </div>
            <p className="text-gray-600 text-sm">
              Didn&apos;t receive an email? Check your spam folder or contact support if the issue persists.
            </p>
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
