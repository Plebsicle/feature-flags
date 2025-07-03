"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle2, ShieldCheck, AlertTriangle, Loader2, Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import axios from "axios"
import { Toaster, toast } from "react-hot-toast"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://locahost:8000"

export default function CheckEmailVerifyFinalPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [message, setMessage] = useState("Verifying your email...")

  useEffect(() => {
    const token = searchParams?.get("token")
    const orgName = searchParams?.get('org');

    if (!token) {
      setStatus("error")
      setMessage("Invalid or missing verification token.")
      return
    }
    if(!orgName){
        // Manual Email Verification
        const fetchDetails = async () => {
            try {
                const results = await axios.post(`/${BACKEND_URL}/auth/verifyEmailManual`,{
                    token
                });
                if(results.status === 200){
                    setStatus("success")
                    setMessage("Email verified successfully!")
                    toast.success("Email verified successfully! Redirecting to sign in...");
                    setTimeout(() => router.push(`/auth/signin`), 2000);
                }
                else{
                    throw new Error("Verification failed");
                }
            } catch(e) {
                setStatus("error")
                setMessage("Verification of Email Failed");
                toast.error("Verification failed. Request a new link.");
                setTimeout(()=> {
                  router.push('/auth/request-verification-email');
                },3000);
            }
        }
        fetchDetails();
    }
    else{
        // Signup Email Verification
        const fetchDetails = async ()=>{
            try {
                const results = await axios.post(`/${BACKEND_URL}/auth/verifyEmailSignup`,{
                    orgName,token
                });
                if(results.status === 200){
                    setStatus("success")
                    setMessage("Email verified successfully!")
                    toast.success("Email verified successfully! Redirecting to dashboard...");
                    setTimeout(() => router.push('/dashboard'), 2000);
                }
                else{
                    throw new Error("Verification failed");
                }
            } catch(e) {
                setStatus("error")
                setMessage("Verification of Email Failed");
                toast.error("Verification failed. Please try signing up again.");
            }
        }
        fetchDetails();
    }
  }, [searchParams])

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

  let IconComponent = Loader2
  let iconColorClass = "text-indigo-600 animate-spin"
  let bgColorClass = "bg-indigo-100"
  let statusColor = "text-indigo-600"

  if (status === "success") {
    IconComponent = ShieldCheck
    iconColorClass = "text-emerald-600"
    bgColorClass = "bg-emerald-100"
    statusColor = "text-emerald-600"
  } else if (status === "error") {
    IconComponent = AlertTriangle
    iconColorClass = "text-red-600"
    bgColorClass = "bg-red-100"
    statusColor = "text-red-600"
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <Card className="shadow-lg border border-gray-200">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                key={status} // Re-trigger animation on status change
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
                className={`w-20 h-20 ${bgColorClass} rounded-lg flex items-center justify-center mx-auto mb-6`}
              >
                <IconComponent className={`w-10 h-10 ${iconColorClass}`} />
              </motion.div>
              <div className="flex items-center justify-center mb-4">
                <Flag className="w-6 h-6 text-indigo-600 mr-2" />
                <span className="text-lg font-semibold text-gray-900">Bitswitch</span>
              </div>
              <CardTitle className={`text-2xl font-bold text-gray-900`}>
                {status === "verifying" && "Verifying Email"}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </CardTitle>
              <CardDescription className="text-gray-600 mt-3 text-base">{message}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {status === "success" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-emerald-700 text-sm mb-4">
                    Your email has been successfully verified. You can now access all features of your account.
                  </p>
                  <Link href="/auth/signin">
                    <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white">
                      Proceed to Sign In
                      <CheckCircle2 className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
              {status === "error" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm mb-4">
                    We couldn&apos;t verify your email. This could be due to an expired or invalid verification link.
                  </p>
                  <Link href="/auth/request-verification-email">
                    <Button
                      variant="outline"
                      className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      Request New Verification Link
                    </Button>
                  </Link>
                </div>
              )}
              {status === "verifying" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-indigo-700 text-sm">
                    Please wait while we verify your email address...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
