"use client"

import { Copy } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => navigator.clipboard.writeText(text)}
    >
      <Copy className="w-4 h-4" />
    </Button>
  )
} 