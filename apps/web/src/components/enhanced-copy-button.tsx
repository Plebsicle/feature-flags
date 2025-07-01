"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EnhancedCopyButtonProps {
  text: string
  successMessage?: string
}

export function EnhancedCopyButton({ 
  text, 
  successMessage = "Copied to clipboard!" 
}: EnhancedCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <div className="relative">
      <Button
        onClick={copyToClipboard}
        size="sm"
        variant="outline"
        className="border-gray-300 hover:bg-gray-50 transition-colors"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-2 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </>
        )}
      </Button>
      {copied && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-green-600 text-white text-xs py-1 px-3 rounded-md shadow-lg whitespace-nowrap">
            {successMessage}
          </div>
        </div>
      )}
    </div>
  )
} 