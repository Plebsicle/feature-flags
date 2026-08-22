import { Loader2 } from "lucide-react"
import { Flag } from "@/components/ui/icons"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center mb-6">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center relative z-10 border border-primary/20">
          <Flag className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex items-center space-x-2 text-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground tracking-wide">Loading Bitswitch...</span>
      </div>
    </div>
  )
}
