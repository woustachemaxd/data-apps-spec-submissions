import { format, parseISO, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date: string // ISO date string (YYYY-MM-DD)
  onDateChange: (date: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  // Parse the ISO date string to a Date object
  const selectedDate = date ? parseISO(date) : undefined
  const isValidDate = selectedDate && isValid(selectedDate)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[180px] justify-start text-left font-normal",
            !isValidDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {isValidDate ? format(selectedDate, "PPP") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(day) => {
            if (day) {
              // Convert back to ISO date string
              onDateChange(format(day, "yyyy-MM-dd"))
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}