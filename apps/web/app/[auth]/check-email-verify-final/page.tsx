"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { CheckCircle2, ShieldCheck, AlertTriangle, Loader2 } from "lucide-react"
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
                    toast.success("Email verified successfully! Redirecting to sign in...");
                    setTimeout(() => router.push(`/auth/signin`), 2000);
                }
                else{
                    throw new Error("Verification failed");
                }
            } catch(e) {
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
                    toast.success("Email verified successfully! Redirecting to dashboard...");
                    setTimeout(() => router.push('/dashboard'), 2000);
                }
                else{
                    throw new Error("Verification failed");
                }
            } catch(e) {
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
  let iconColorClass = "text-blue-400 animate-spin"
  let gradientFrom = "from-slate-900"
  let gradientVia = "via-blue-900"
  let gradientTo = "to-sky-900"
  let titleGradientFrom = "from-blue-400"
  let titleGradientTo = "to-sky-400"

  if (status === "success") {
    IconComponent = ShieldCheck
    iconColorClass = "text-white"
    gradientFrom = "from-slate-900"
    gradientVia = "via-green-900"
    gradientTo = "to-emerald-900"
    titleGradientFrom = "from-green-400"
    titleGradientTo = "to-emerald-400"
  } else if (status === "error") {
    IconComponent = AlertTriangle
    iconColorClass = "text-white"
    gradientFrom = "from-slate-900"
    gradientVia = "via-red-900"
    gradientTo = "to-pink-900"
    titleGradientFrom = "from-red-400"
    titleGradientTo = "to-pink-400"
  }

  return (
    <>
      <Toaster />
      <div
        className={`min-h-screen bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo} flex items-center justify-center p-4 transition-colors duration-500`}
      >
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-md">
          <Card className="bg-slate-800/70 dark:bg-neutral-800/70 backdrop-blur-xl border-slate-700/50 shadow-2xl">
            <CardHeader className="text-center pb-6 pt-8">
              <motion.div
                key={status} // Re-trigger animation on status change
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 180 }}
                className={`w-20 h-20 bg-gradient-to-r ${titleGradientFrom} ${titleGradientTo} rounded-full flex items-center justify-center mx-auto mb-6`}
              >
                <IconComponent className={`w-10 h-10 ${iconColorClass}`} />
              </motion.div>
              <CardTitle
                className={`text-3xl font-bold bg-gradient-to-r ${titleGradientFrom} ${titleGradientTo} bg-clip-text text-transparent`}
              >
                {status === "verifying" && "Verifying Email"}
                {status === "success" && "Email Verified!"}
                {status === "error" && "Verification Failed"}
              </CardTitle>
              <CardDescription className="text-neutral-400 dark:text-neutral-300 mt-3 text-lg">{message}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {status === "success" && (
                <Link href="/signin">
                  <Button
                    className={`w-full h-12 bg-gradient-to-r ${titleGradientFrom} ${titleGradientTo} hover:opacity-90 text-white font-semibold rounded-xl transition-all duration-300`}
                  >
                    Proceed to Sign In
                    <CheckCircle2 className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
              {status === "error" && (
                <Link href="/auth/request-verification-email">
                  <Button
                    variant="outline"
                    className={`w-full h-12 border-pink-500 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors duration-300 group`}
                  >
                    Request New Verification Link
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  )
}
