import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProvider } from "../contexts/auth-context"
import { GoogleProviderWrapper } from '../src/components/google-auth-provider'
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <GoogleProviderWrapper>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        </GoogleProviderWrapper>
      </body>
    </html>
  )
}
