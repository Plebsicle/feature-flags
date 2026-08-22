import type React from "react"
import { Inter_Tight, Pixelify_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/ui/theme-provider"
import { AuthProvider } from "../contexts/auth-context"
import { GoogleProviderWrapper } from '../src/components/google-auth-provider'
import "./globals.css"

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const pixelify = Pixelify_Sans({
  variable: "--font-pixelify",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${interTight.variable} ${pixelify.variable} antialiased`}>
        <GoogleProviderWrapper>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        </GoogleProviderWrapper>
      </body>
    </html>
  )
}
