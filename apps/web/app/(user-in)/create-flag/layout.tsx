"use client"

import { FlagCreationProvider } from "../../../contexts/flag-creation"

export default function createFlag({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FlagCreationProvider>
      {children}
    </FlagCreationProvider>
  )
}
