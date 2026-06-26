import { TripDay, Traveler } from "@prisma/client";
import { TimelineEvent, FullTrip } from "@/lib/types/trip";
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { Loader2, X } from "lucide-react"
import { EditorialModal } from "@/components/ui/EditorialModal"

export function EventDetailsModal({ event, onClose }: { event: TimelineEvent, onClose: () => void }) {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!event) return

    // Only experiences have a packageId to fetch full details for
    if (event.type === 'EXPERIENCE' && event.packageId) {
      setLoading(true)
      fetch(`/api/experiences/${event.packageId}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found')
          return res.json()
        })
        .then(data => setDetails(data))
        .catch(console.error)
        .finally(() => setLoading(false))
    } else {
      // For other events (Business, Meal, Note), just use the event data as generic details
      setDetails({
        name: event.title || (event as any).name || (event as any).experienceTitle || "Activity Details",
        editorialCategory: event.type,
        editorialSummary: (event as any).details || (event as any).notes || (event as any).content || "No additional details provided.",
      })
    }
  }, [event])

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm relative"
      >
        <button onClick={onClose} className="absolute -top-3 -right-3 z-10 p-1.5 bg-white text-slate-500 hover:text-slate-900 rounded-full shadow-md border border-slate-200">
          <X className="w-4 h-4" />
        </button>

        {loading ? (
          <div className="bg-white rounded-xl flex flex-col items-center justify-center h-48 text-slate-400 shadow-lg">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <span className="text-xs">Loading details...</span>
          </div>
        ) : details ? (
          <EditorialModal item={details} onClose={onClose} />
        ) : null}
      </motion.div>
    </div>,
    document.body
  )
}
