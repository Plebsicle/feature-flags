"use client"

import { motion,easeOut } from "framer-motion"
import Link from "next/link"
import { Mail, ArrowLeft, Flag } from "@/components/ui/icons"
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
        ease: easeOut,
      },
    },
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
        <Card className="shadow-lg border border-border bg-card">
          <CardHeader className="text-center pb-6 pt-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
              className="w-20 h-20 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-6"
            >
              <Mail className="w-10 h-10 text-primary" />
            </motion.div>
            <div className="flex items-center justify-center mb-4">
              <Flag className="w-6 h-6 text-primary mr-2" />
              <span className="text-lg font-semibold text-foreground">Bitswitch</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Check Your Email
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-3 text-base">
              We&apos;ve sent a password reset link to your email address.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-muted border border-border rounded-lg p-4">
              <p className="text-foreground text-sm">
                If an account exists for this email, you&apos;ll receive instructions to reset your password shortly.
              </p>
            </div>
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive an email? Check your spam folder or contact support if the issue persists.
            </p>
            <Link href="/auth/signin">
              <Button
                variant="outline"
                className="w-full h-12 border-border text-foreground hover:bg-muted group"
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
