"use client"

import { useTrip } from "@/lib/store/trip-context"
import { usePreferences } from "@/lib/store/preferences-context"
import { cn } from "@/lib/utils"
import { Calendar } from "lucide-react"

export function PlanningDatePicker() {
  const { setAiPromptToTrigger } = useTrip()
  const { targetDate, setTargetDate } = usePreferences()

  const isToday = (date: Date) => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  const isTomorrow = (date: Date) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
  }

  const handleSetToday = () => {
    const d = new Date()
    setTargetDate(d)
    setAiPromptToTrigger(`[INTERNAL] User set planning date to Today (${d.toLocaleDateString()}). Acknowledge and ask how you can help plan their adventure for today.`)
  }

  const handleSetTomorrow = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setTargetDate(tomorrow)
    setAiPromptToTrigger(`[INTERNAL] User set planning date to Tomorrow (${tomorrow.toLocaleDateString()}). Acknowledge and ask how you can help plan their adventure for tomorrow.`)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Planning For</span>
      </div>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={handleSetToday}
          className={cn(
            "px-3 py-1 text-[11px] font-bold rounded-lg transition-all",
            isToday(targetDate) ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Today
        </button>
        <button
          onClick={handleSetTomorrow}
          className={cn(
            "px-3 py-1 text-[11px] font-bold rounded-lg transition-all",
            isTomorrow(targetDate) ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          )}
        >
          Tomorrow
        </button>
        <div className="relative group">
            <input 
                type="date" 
                value={`${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`}
                onChange={(e) => {
                    const [y, m, d] = e.target.value.split('-').map(Number)
                    const newDate = new Date(y, m - 1, d)
                    setTargetDate(newDate)
                    setAiPromptToTrigger(`[INTERNAL] User set planning date to ${newDate.toLocaleDateString()}. Acknowledge and ask how you can help plan their adventure for this date.`)
                }}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <button
                className={cn(
                    "px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5",
                    (!isToday(targetDate) && !isTomorrow(targetDate)) ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
            >
                <Calendar className="w-3 h-3" />
                {(!isToday(targetDate) && !isTomorrow(targetDate)) 
                    ? targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : "Pick Date"
                }
            </button>
        </div>
      </div>
    </div>
  )
}
