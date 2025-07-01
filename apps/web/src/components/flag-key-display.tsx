"use client"

import { useState } from "react"
import { Copy, Check, Code } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FlagKeyDisplayProps {
  flagId: string
}

export function FlagKeyDisplay({ flagId }: FlagKeyDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(flagId)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 shadow-sm max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold text-center text-gray-900 flex items-center justify-center">
          <Code className="w-6 h-6 mr-2 text-indigo-600" />
          Flag Key
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-center space-x-3">
          <div className="bg-white border border-gray-300 rounded-lg px-4 py-3 flex-1 max-w-md">
            <code className="text-lg font-mono text-gray-800 break-all font-medium">
              {flagId}
            </code>
          </div>
          <Button
            onClick={copyToClipboard}
            size="sm"
            variant="outline"
            className="h-12 px-4 border-gray-300 hover:bg-gray-50 transition-colors"
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
        </div>
        {copied && (
          <div className="text-center mt-3">
            <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
              Flag key has been copied to clipboard
            </span>
          </div>
        )}
        <p className="text-sm text-gray-600 text-center mt-3">
          Use this key to reference the flag in your application
        </p>
      </CardContent>
    </Card>
  )
} 