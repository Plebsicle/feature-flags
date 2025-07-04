"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"

interface MultipleSelectorProps {
  value?: string[]
  onValueChange?: (value: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyIndicator?: React.ReactNode
}

export function MultipleSelector({
  value = [],
  onValueChange,
  placeholder = "Select items...",
  className,
  disabled = false,
  emptyIndicator,
}: MultipleSelectorProps) {
  const [inputValue, setInputValue] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: string) => {
    onValueChange?.(value.filter((i) => i !== item))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement
    if (input.value) {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        const newValue = input.value.trim()
        if (newValue && !value.includes(newValue)) {
          onValueChange?.([...value, newValue])
          setInputValue("")
        }
      }
    }
    if (e.key === "Backspace" && input.value === "") {
      e.preventDefault()
      const newSelected = [...value]
      newSelected.pop()
      onValueChange?.(newSelected)
    }
  }

  const selectables = React.useMemo(() => {
    return inputValue ? [inputValue] : []
  }, [inputValue])

  return (
    <Command
      onKeyDown={handleKeyDown}
      className={cn("overflow-visible bg-transparent", className)}
    >
      <div className="group border border-gray-300 px-3 py-2 text-sm bg-white rounded-md focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:border-indigo-500">
        <div className="flex gap-1 flex-wrap">
          {value.map((item) => (
            <Badge key={item} variant="secondary">
              {item}
              <button
                className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUnselect(item)
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={() => handleUnselect(item)}
                disabled={disabled}
              >
                <X className="h-3 w-3 text-gray-500 hover:text-gray-700" />
              </button>
            </Badge>
          ))}
          <CommandInput
            value={inputValue}
            onValueChange={setInputValue}
            onBlur={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="ml-2 bg-transparent outline-none placeholder:text-gray-500 flex-1"
          />
        </div>
      </div>
      <div className="relative mt-2">
        {open && selectables.length > 0 && (
          <div className="absolute w-full z-10 top-0 rounded-md border border-gray-200 bg-white text-gray-900 shadow-lg outline-none animate-in">
            <CommandList>
              <CommandGroup className="h-full overflow-auto">
                {selectables.map((item) => (
                  <CommandItem
                    key={item}
                    onMouseDown={(e: React.MouseEvent<HTMLElement>) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onSelect={() => {
                      setInputValue("")
                      if (!value.includes(item)) {
                        onValueChange?.([...value, item])
                      }
                    }}
                    className="cursor-pointer"
                  >
                    Add &quot;{item}&quot;
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandEmpty>
                {emptyIndicator || "No results found."}
              </CommandEmpty>
            </CommandList>
          </div>
        )}
      </div>
    </Command>
  )
}