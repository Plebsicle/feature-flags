"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { MailCheck, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyEmailPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-sky-900 flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
              className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-sky-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <MailCheck className="w-10 h-10 text-white" />
            </motion.div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-neutral-400 dark:text-neutral-300 mt-3 text-lg">
              We've sent a verification link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-neutral-300 dark:text-neutral-200 mb-8">
              Please check your inbox (and spam folder, just in case!) and click the link to complete your registration.
            </p>
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="w-full h-12 border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors duration-300 group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                Back to Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
