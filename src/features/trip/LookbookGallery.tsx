"use client"

import { motion } from "framer-motion"
import { FullTrip, TimelineEvent } from "@/lib/types/trip"
import { TripDay } from "@prisma/client"
import { MapPin, Sun, TrendingUp, Clock } from "lucide-react"

interface LookbookGalleryProps {
  trip: FullTrip
}

export function LookbookGallery({ trip }: LookbookGalleryProps) {
  // Extract all unique images from the trip events
  const images = trip.days.flatMap((day: TripDay) => {
    let events: TimelineEvent[] = []
    try {
      events = JSON.parse(day.eventsJson || "[]")
    } catch (e) {}

    return events.filter(e => e.type !== 'NOTE' && (e as any).service?.imageUrl).map(e => ({
      url: (e as any).service!.imageUrl,
      title: e.title || (e as any).service!.name,
      category: e.type,
      location: (e as any).service?.locationSlug || day.sleepTown
    }))
  })

  // Deduplicate images
  const uniqueImages = images.filter((img, index, self) => 
    index === self.findIndex((t) => t.url === img.url)
  )

  return (
    <div className="w-full h-full overflow-y-auto bg-white">
      {/* Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
        <img 
          src={uniqueImages[0]?.url || "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=2000&auto=format&fit=crop"} 
          alt={trip.tripTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-12 max-w-5xl mx-auto text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-rose-400 font-bold tracking-[0.2em] uppercase text-sm mb-4">
              A Custom Expedition by {(trip as any).agency?.name || "Vallecito"}
            </p>
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6 leading-tight">
              {trip.tripTitle}
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl leading-relaxed">
              Discover the magic of the Andes. This curated lookbook offers a glimpse into the experiences, stays, and landscapes selected specifically for your journey.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-12">
        {/* Fast Facts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <Clock className="w-6 h-6 text-rose-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Duration</h4>
            <p className="text-xl font-serif text-slate-900">{trip.days.length} Days</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <MapPin className="w-6 h-6 text-blue-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Basecamp</h4>
            <p className="text-xl font-serif text-slate-900">{trip.baseCampStrategy || "Sacred Valley"}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <Sun className="w-6 h-6 text-amber-500 mb-3" />
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pace</h4>
            <p className="text-xl font-serif text-slate-900">Balanced</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
            <TrendingUp className="w-6 h-6 text-emerald-600 mb-3" />
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Max Altitude</h4>
            <p className="text-xl font-serif text-slate-900">~3,400m</p>
          </div>
        </div>

        {/* Masonry Gallery */}
        <div className="mb-12">
          <h3 className="text-3xl font-serif text-slate-900 mb-8">The Experience</h3>
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {uniqueImages.map((img, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative group break-inside-avoid overflow-hidden rounded-2xl"
              >
                <img 
                  src={img.url} 
                  alt={img.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-1 block">
                    {img.category}
                  </span>
                  <h4 className="text-lg font-serif font-bold">{img.title}</h4>
                  {img.location && (
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {img.location}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
