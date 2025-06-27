"use client"

import { Button } from "@/components/ui/button"

interface ExternalLinkButtonProps {
  url: string;
  children: React.ReactNode;
}

export function ExternalLinkButton({ url, children }: ExternalLinkButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full"
      onClick={() => window.open(url, '_blank')}
    >
      {children}
    </Button>
  )
} 