"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { cn } from "@/lib/utils"

// Custom Calendar Component with Light Styling
const Calendar = ({ className, classNames, showOutsideDays = true, ...props }: any) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium text-gray-900",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-600 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-indigo-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-900 hover:bg-gray-100 rounded"
        ),
        day_selected: "bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white focus:bg-indigo-600 focus:text-white",
        day_today: "bg-gray-100 text-gray-900 font-semibold",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle: "aria-selected:bg-indigo-50 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  )
}

// Reusable LightDateTimePicker Component
interface LightDateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export const LightDateTimePicker = ({ 
  value, 
  onChange, 
  placeholder = "Pick a date", 
  className 
}: LightDateTimePickerProps) => {
  const [date, setDate] = useState<Date | undefined>(value)

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Preserve existing time if date already exists
      if (date) {
        selectedDate.setHours(date.getHours(), date.getMinutes())
      }
      setDate(selectedDate)
      onChange?.(selectedDate)
    }
  }

  const handleTimeChange = (field: 'hours' | 'minutes', value: string) => {
    if (!date) return
    
    const newDate = new Date(date)
    if (field === 'hours') {
      newDate.setHours(parseInt(value) || 0)
    } else {
      newDate.setMinutes(parseInt(value) || 0)
    }
    setDate(newDate)
    onChange?.(newDate)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-8 text-sm border-gray-300 bg-white hover:bg-gray-50",
            !date && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-600" />
          {date ? format(date, "PPP HH:mm") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border border-gray-200 shadow-lg" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t border-gray-200 p-3 bg-white">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-700">Hours</Label>
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={date ? date.getHours().toString().padStart(2, '0') : '00'}
                  onChange={(e) => handleTimeChange('hours', e.target.value)}
                  className="h-8 text-xs border-gray-300 bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-700">Minutes</Label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={date ? date.getMinutes().toString().padStart(2, '0') : '00'}
                  onChange={(e) => handleTimeChange('minutes', e.target.value)}
                  className="h-8 text-xs border-gray-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 