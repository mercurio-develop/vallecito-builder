"use client"
import { TripDay, Traveler } from "@prisma/client";
import { TimelineEvent, FullTrip } from "@/lib/types/trip";

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SecureManifestForm } from "@/features/checkout/components/SecureManifestForm"
import { PackagePreviewModal } from "@/features/pro-builder/components/PackagePreviewModal"
import { AiConcierge } from "@/features/concierge/components/ai-concierge"
import { ChevronLeft, ChevronRight, MapPin, Clock, Navigation, Bed, ChevronDown, X, Download, Share, CheckCircle2 } from "lucide-react"
import dynamic from "next/dynamic"
import ReactMarkdown from 'react-markdown'

const TouristMap = dynamic(() => import("./TouristMap"), { ssr: false })

import { LookbookGallery } from "@/features/trip/LookbookGallery"

interface TripDashboardProps {
  trip: FullTrip
}

const ALTITUDES: Record<string, string> = {
  "Cusco": "3,400m",
  "Urubamba": "2,870m",
  "Ollantaytambo": "2,792m",
  "Pisac": "2,972m",
  "Machu Picchu": "2,430m",
  "Aguas Calientes": "2,040m",
  "Maras": "3,300m",
  "Moray": "3,500m"
}

function getAltitude(town: string | undefined): string | null {
  if (!town) return null;
  const match = Object.entries(ALTITUDES).find(([key]) => town.toLowerCase().includes(key.toLowerCase()));
  return match ? match[1] : null;
}

export function TripDashboard({ trip }: TripDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [activeDayNum, setActiveDayNum] = useState<number>(1)
  const [isBookingMode, setIsBookingMode] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isLookbookMode, setIsLookbookMode] = useState(trip.status === "DRAFT" || trip.status === "PROPOSED")
  const [sidebarTab, setSidebarTab] = useState<"itinerary" | "travelers" | "summary">("itinerary")
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [viewingPackage, setViewingPackage] = useState<string | null>(null)

  const handleExportICS = () => {
    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Vallecito//Travel Planner//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH"
    ];

    trip.days.forEach((day: TripDay) => {
      let events = [];
      try {
        events = JSON.parse(day.eventsJson || "[]");
      } catch(e) {}
      
      events.forEach((evt: TimelineEvent) => {
        if (evt.type === 'NOTE') return;
        
        // Format YYYYMMDDTHHMMSSZ
        const [hour, minute] = (evt.startTime || "09:00").split(":");
        const d = new Date(day.date);
        d.setUTCHours(parseInt(hour, 10), parseInt(minute, 10), 0);
        
        const end = new Date(d.getTime() + 2 * 60 * 60 * 1000); // assume 2 hours
        
        const formatICSDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        
        icsContent.push(
          "BEGIN:VEVENT",
          `UID:${evt.id}@vallecito.app`,
          `DTSTAMP:${formatICSDate(new Date())}`,
          `DTSTART:${formatICSDate(d)}`,
          `DTEND:${formatICSDate(end)}`,
          `SUMMARY:${evt.title || (evt.type === 'TRANSPORT' ? evt.from + " to " + evt.to : evt.type)}`,
          `LOCATION:${(evt as any).location || (evt as any).from || ''}`,
          `DESCRIPTION:${(evt as any).description || (evt as any).notes || (evt as any).details || ''}`,
          "END:VEVENT"
        );
      });
    });

    icsContent.push("END:VCALENDAR");

    const blob = new Blob([icsContent.join("\r\n")], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${trip.tripTitle.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeDay = useMemo(() => {
    return trip.days.find((d: any) => d.dayNumber === activeDayNum) || trip.days[0]
  }, [trip.days, activeDayNum])

  const activeEvents = useMemo(() => {
    if (!activeDay || !activeDay.eventsJson) return []
    try {
      return JSON.parse(activeDay.eventsJson)
    } catch (e) {
      return []
    }
  }, [activeDay])

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null
    if (selectedEventId === 'start') {
      return {
        id: 'start',
        type: 'START',
        title: 'Morning Departure',
        startTime: activeDay.startTime,
        location: activeDay.meetingPoint || "Hotel",
        notes: activeDay.guideNotes || "Meet your driver/guide here to begin the day."
      }
    }
    if (selectedEventId === 'end') {
      const acc = activeEvents.find((e: TimelineEvent) => e.type === 'STAY')
      return {
        id: 'end',
        type: 'REST',
        title: acc?.title || `Overnight in ${activeDay.sleepTown}`,
        startTime: acc?.startTime || "Evening",
        location: (acc as any)?.location || activeDay.sleepTown,
        notes: (acc as any)?.description || (acc as any)?.notes || "Rest and recharge for tomorrow.",
        imageUrl: (acc as any)?.imageUrl
      }
    }
    return activeEvents.find((e: TimelineEvent) => e.id === selectedEventId) || null
  }, [selectedEventId, activeEvents, activeDay])

  if (isBookingMode) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        {!isSuccess ? (
          <div className="w-full max-w-xl">
            <button 
              onClick={() => setIsBookingMode(false)}
              className="mb-6 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Itinerary
            </button>
            <SecureManifestForm 
              tripId={trip.id || "mock-trip-123"} 
              paxCount={trip.paxCount || 1} 
              onComplete={() => setIsSuccess(true)} 
            />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center px-4"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-3xl font-serif text-slate-900 mb-4">Journey Secured</h2>
            <p className="text-slate-500 max-w-md">Your manifest is securely encrypted. We are now confirming your trains and sanctuary tickets.</p>
          </motion.div>
        )}
      </div>
    )
  }

  if (isLookbookMode) {
    return (
      <div className="relative w-full h-[calc(100vh-56px)]">
        <LookbookGallery trip={trip} />
        <div className="absolute top-6 right-6 z-50">
          <button 
            onClick={() => setIsLookbookMode(false)}
            className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-full font-bold shadow-xl border border-white hover:scale-105 transition-transform"
          >
            View Full Itinerary
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100vh-56px)] bg-slate-50 flex overflow-hidden print:h-auto print:overflow-visible">
      
      {/* LEFT SIDEBAR - COLLAPSIBLE */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="h-full bg-slate-900 flex flex-col border-r border-slate-800 z-20 shrink-0 print:w-full print:border-r-0 print:bg-white"
          >
            <div className="w-[320px] h-full flex flex-col print:w-full print:h-auto">
              {/* Trip Header */}
              <div className="p-6 border-b border-slate-800 relative print:border-b-2 print:border-slate-200">
                <div className="absolute top-6 right-6 flex gap-2 print:hidden">
                  <button 
                    onClick={handleExportICS}
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-colors"
                    title="Add to Calendar (.ics)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-colors"
                    title="Export as PDF"
                  >
                    <Share className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-rose-400 text-[10px] uppercase tracking-[0.2em] font-bold mb-2 print:text-rose-600">
                  Curated by {(trip as any).agency?.name || "Vallecito"}
                </p>
                <h2 className="text-2xl font-serif font-bold text-white mb-2 leading-tight pr-16 print:text-slate-900 print:text-3xl">
                  {trip.tripTitle}
                </h2>
                <div className="flex gap-4 text-slate-400 text-xs font-semibold print:text-slate-500">
                  <span>{trip.paxCount} Travelers</span>
                  <span>•</span>
                  <span>{trip.days.length} Days</span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-800 print:hidden">
                <button 
                  onClick={() => setSidebarTab("itinerary")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === "itinerary" ? "text-rose-400 border-b-2 border-rose-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Itin
                </button>
                <button 
                  onClick={() => setSidebarTab("travelers")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === "travelers" ? "text-rose-400 border-b-2 border-rose-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Pax
                </button>
                <button 
                  onClick={() => setSidebarTab("summary")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${sidebarTab === "summary" ? "text-rose-400 border-b-2 border-rose-400 bg-slate-800/50" : "text-slate-500 hover:text-slate-300"}`}
                >
                  Price
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide print:hidden">
                {sidebarTab === "itinerary" && (
                  trip.days.map((day: TripDay) => {
                    const isActive = day.dayNumber === activeDayNum
                    let dayEvents = []
                    try { dayEvents = JSON.parse(day.eventsJson || "[]") } catch(e) {}
                    
                    return (
                      <div key={day.dayNumber} className={`rounded-2xl transition-all duration-300 overflow-hidden border ${isActive ? 'bg-slate-800 border-slate-700 shadow-lg' : 'bg-transparent border-transparent hover:bg-slate-800/30'}`}>
                        <button
                          onClick={() => {
                            setActiveDayNum(day.dayNumber)
                            setSelectedEventId(null)
                          }}
                          className="w-full text-left p-5 flex justify-between items-center"
                        >
                          <div>
                            <h3 className={`font-bold text-lg mb-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>Day {day.dayNumber}</h3>
                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{new Date(day.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                          </div>
                          {!isActive && dayEvents.length > 0 && (
                            <div className="flex -space-x-1.5">
                              {dayEvents.slice(0, 3).map((e: TimelineEvent) => (
                                <div key={e.id} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[8px] text-slate-300">
                                  {e.type ? e.type.charAt(0) : 'E'}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-300">
                                  +{dayEvents.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </button>
                        {isActive && (
                          <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                            {dayEvents.length === 0 ? (
                              <p className="text-sm text-slate-500 font-medium bg-slate-900/50 p-4 rounded-xl text-center border border-slate-700 border-dashed">Open day</p>
                            ) : (
                              <div className="flex flex-col gap-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
                                {dayEvents.map((e: TimelineEvent) => (
                                  <button key={e.id} onClick={() => setSelectedEventId(e.id)} className="relative flex items-center justify-between group pl-8 w-full text-left">
                                    <div className={`absolute left-1.5 w-2 h-2 rounded-full z-10 transition-colors ${selectedEventId === e.id ? 'bg-rose-500' : 'bg-slate-400 group-hover:bg-rose-400'}`} />
                                    <span className={`text-sm font-medium truncate pr-4 transition-colors ${selectedEventId === e.id ? 'text-white' : 'text-slate-300 group-hover:text-slate-100'}`}>{e.title || e.type}</span>
                                    <span className="text-slate-500 text-[10px] font-bold font-mono shrink-0">{e.startTime || ''}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
                
                {sidebarTab === "travelers" && (
                  <div className="space-y-4">
                    {trip.travelers?.length > 0 ? trip.travelers.map((traveler: Traveler) => (
                      <div key={traveler.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-bold">{traveler.firstName} {traveler.lastName}</h4>
                          {traveler.isLeadGuest && <span className="bg-rose-500/20 text-rose-400 text-[10px] px-2 py-0.5 rounded-md font-bold">LEAD</span>}
                        </div>
                        <div className="space-y-2 text-xs text-slate-400">
                          <div className="flex justify-between">
                            <span>Passport:</span>
                            <span className="text-slate-300 font-mono">{traveler.passportNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Nationality:</span>
                            <span className="text-slate-300">{traveler.nationality}</span>
                          </div>
                          {traveler.dietaryRestrictions && (
                            <div className="pt-2 border-t border-slate-700/50">
                              <span className="text-amber-400 block mb-1">Dietary Restrictions:</span>
                              <p className="text-slate-300 italic">{traveler.dietaryRestrictions}</p>
                            </div>
                          )}
                          {traveler.medicalNotes && (
                            <div className="pt-2 border-t border-slate-700/50">
                              <span className="text-rose-400 block mb-1">Medical Notes:</span>
                              <p className="text-slate-300 italic">{traveler.medicalNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center text-slate-500 text-sm py-8">
                        No traveler information provided yet.
                      </div>
                    )}
                  </div>
                )}
                
                {sidebarTab === "summary" && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                      <h4 className="text-white font-bold mb-4 font-serif text-lg">Pricing Breakdown</h4>
                      <div className="space-y-3 text-sm text-slate-400">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span>Base Trip Cost</span>
                          <span className="text-slate-200">${trip.totalPriceUsd || "0.00"}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
                          <span>Taxes & Fees</span>
                          <span className="text-slate-200">Included</span>
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-bold text-white">Total Due</span>
                          <span className="font-bold text-rose-400 text-lg">${trip.totalPriceUsd || "0.00"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-4">
                      <h4 className="text-emerald-400 font-bold mb-3 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> What&apos;s Included
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          All private ground transportation
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          English-speaking expert guides
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          Boleto Turístico and entrance tickets
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          24/7 Vallecito Concierge support
                        </li>
                      </ul>
                    </div>

                    <div className="bg-rose-900/10 border border-rose-800/20 rounded-2xl p-4">
                      <h4 className="text-rose-400 font-bold mb-3 text-sm flex items-center gap-2">
                        <X className="w-4 h-4" /> Not Included
                      </h4>
                      <ul className="space-y-2 text-xs text-slate-300">
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500/50 mt-0.5">•</span>
                          International and domestic flights
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500/50 mt-0.5">•</span>
                          Travel insurance
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-rose-500/50 mt-0.5">•</span>
                          Gratuities for guides and drivers
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md print:hidden">
                <button 
                  onClick={() => setIsBookingMode(true)}
                  className="w-full bg-rose-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-500 transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-lg">🛎️</span> Secure Trip
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT CONTENT - MAP */}
      <div className="flex-1 relative h-full bg-slate-100 flex overflow-hidden print:hidden">
        
        {/* Toggle Sidebar Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-6 left-6 z-50 w-10 h-10 bg-white/90 backdrop-blur-md border border-white rounded-full shadow-lg flex items-center justify-center text-slate-700 hover:text-slate-900 hover:scale-105 transition-all"
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* MAP COMPONENT */}
        <div className="absolute inset-0 z-0">
          <TouristMap 
            trip={trip} 
            activeDayNum={activeDayNum} 
            selectedEventId={selectedEventId} 
            onEventSelect={setSelectedEventId} 
          />
        </div>
      </div>

      {/* RIGHT SIDEBAR - DAY & EVENT DETAILS */}
      <div className="w-[400px] h-full bg-white flex flex-col border-l border-slate-200 z-20 shrink-0 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] print:w-full print:border-none print:shadow-none print:h-auto">
        <AnimatePresence mode="wait">
          {selectedEvent ? (
            <motion.div
              key="event-detail"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col print:hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50 shrink-0">
                <button 
                  onClick={() => setSelectedEventId(null)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center text-slate-600 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">Back to Itinerary</span>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                {(() => {
                  const photos = selectedEvent.photos || (selectedEvent.imageUrl ? [selectedEvent.imageUrl] : []);
                  if (photos.length === 0) return null;
                  
                  return (
                    <div className="-mx-6 -mt-6 mb-6 flex flex-col gap-2">
                      <div className="h-48 relative overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          id="active-detail-photo"
                          src={photos[0]} 
                          alt={selectedEvent.title} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />
                      </div>
                      {photos.length > 1 && (
                        <div className="flex gap-2 px-6 overflow-x-auto py-1 scrollbar-hide">
                          {photos.map((photo: string, pIdx: number) => (
                            <button
                              key={pIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                const activePhotoEl = document.getElementById("active-detail-photo") as HTMLImageElement;
                                if (activePhotoEl) activePhotoEl.src = photo;
                              }}
                              className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:border-slate-400 active:scale-95 transition-all"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={photo} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=100&q=80" }} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg mb-4 relative z-10">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-mono font-bold text-slate-700">{selectedEvent.startTime}</span>
                  </div>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 leading-tight">
                    {selectedEvent.title || selectedEvent.name || (selectedEvent.type === 'TRANSPORT' ? `${selectedEvent.from} → ${selectedEvent.to}` : selectedEvent.type)}
                  </h2>
                </div>

                <div className="space-y-6">
                  {selectedEvent.description && (
                    <div className="mt-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">About</span>
                      <div className="text-sm text-slate-600 leading-relaxed prose prose-sm prose-slate max-w-none">
                        <ReactMarkdown>{selectedEvent.description}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.location || selectedEvent.from) && (
                    <div className="flex gap-3">
                      <div className="mt-0.5"><MapPin className="w-4 h-4 text-rose-500" /></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Location</span>
                        <p className="text-sm text-slate-700 font-medium">
                          {selectedEvent.location || (selectedEvent.type === 'TRANSPORT' ? `Pickup: ${selectedEvent.from}\nDropoff: ${selectedEvent.to}` : '')}
                        </p>
                      </div>
                    </div>
                  )}

                  {(selectedEvent.details || selectedEvent.notes) && (
                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block mb-2">Important Notes</span>
                      <div className="text-sm text-amber-900 leading-relaxed prose prose-sm max-w-none prose-p:my-1">
                        <ReactMarkdown>{selectedEvent.details || selectedEvent.notes}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  
                  {selectedEvent.type === 'TRANSPORT' && selectedEvent.method && (
                    <div className="flex gap-3">
                      <div className="mt-0.5"><Navigation className="w-4 h-4 text-blue-500" /></div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transit Method</span>
                        <p className="text-sm text-slate-700 font-medium">{selectedEvent.method}</p>
                      </div>
                    </div>
                  )}

                  {((selectedEvent as any).service || selectedEvent.packageId || selectedEvent.businessId) && (
                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => setViewingPackage(selectedEvent.packageId || selectedEvent.businessId || (selectedEvent as any).service?.id)}
                        className="w-full bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-colors"
                      >
                        View Service Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 shrink-0">
                <button className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-bold shadow-md hover:bg-slate-800 transition-colors">
                  Contact Support
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="day-detail"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col overflow-y-auto scrollbar-hide p-6 print:overflow-visible print:h-auto"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-md tracking-wider">
                  DAY {activeDay.dayNumber}
                </div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">
                  Expedition Detail
                </span>
              </div>

              <h3 className="text-2xl font-serif font-bold text-slate-900 mb-2 leading-tight">
                {(activeDay as any).tourPackage?.title || (activeDay as any).dayTheme || "Free Exploration"}
              </h3>
              
              {(activeDay as any).tourPackage?.description && (
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                  {(activeDay as any).tourPackage.description}
                </p>
              )}

              <div className="space-y-4">
                {/* Start / Meeting */}
                <div 
                  className={`flex items-start gap-4 group cursor-pointer p-3 rounded-2xl transition-all border ${selectedEventId === 'start' ? 'bg-rose-50 border-rose-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                  onClick={() => setSelectedEventId(selectedEventId === 'start' ? null : 'start')}
                >
                  <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${selectedEventId === 'start' ? 'bg-rose-100 border-rose-200' : 'bg-blue-50 border-blue-100'}`}>
                    <Navigation className={`w-4 h-4 ${selectedEventId === 'start' ? 'text-rose-600' : 'text-blue-500'}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Start</span>
                    <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> {activeDay.startTime}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {activeDay.meetingPoint || "Your Hotel"}
                    </p>
                  </div>
                </div>

                {/* Guide Notes */}
                {activeDay.guideNotes && (
                  <div className="relative border-l-2 border-rose-200 ml-4 pl-6 py-2">
                    <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    </div>
                    <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3">
                        <p className="text-xs text-rose-800 italic leading-relaxed font-medium">
                          &quot;{activeDay.guideNotes}&quot;
                        </p>
                    </div>
                  </div>
                )}

                {/* Events Timeline */}
                {activeEvents.length > 0 && (
                  <div className="relative border-l-2 border-slate-200 ml-4 pl-6 py-2 space-y-6">
                    {activeEvents.map((evt: TimelineEvent, idx: number) => {
                      const isSelected = selectedEventId === evt.id;
                      return (
                        <div 
                          key={evt.id || idx} 
                          onClick={() => {
                            if (evt.type !== 'NOTE') {
                              setSelectedEventId(isSelected ? null : evt.id)
                            }
                          }}
                          className={`relative group ${evt.type !== 'NOTE' ? 'cursor-pointer' : ''}`}
                        >
                          <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-white border-2 z-10 transition-colors ${isSelected ? 'border-rose-500 scale-125' : 'border-slate-300 group-hover:border-slate-400'}`} />
                          
                          <div className={`p-3 rounded-xl transition-all ${isSelected ? 'bg-rose-50 border-rose-200 shadow-sm' : 'hover:bg-slate-50 border-transparent'} border`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-rose-500' : 'text-slate-400'}`}>{evt.type}</span>
                              <span className="text-xs font-mono text-slate-500 font-bold">{evt.startTime}</span>
                            </div>

                            {evt.type === 'TRANSPORT' && (
                              <div className="mt-1">
                                <p className="text-xs font-semibold text-slate-700">{evt.from} → {evt.to}</p>
                                {evt.details && <p className="text-[10px] text-slate-500 mt-1">{evt.details}</p>}
                              </div>
                            )}

                            {evt.type === 'EXPERIENCE' && (
                              <div className="mt-1 space-y-1">
                                <h4 className="font-serif font-bold text-slate-900 text-base leading-tight">{evt.title}</h4>
                                {(evt as any).category && ['VIEWPOINT', 'CAMPGROUND', 'TRAILHEAD', 'REST_STOP', 'WAYPOINT', 'WATER_SOURCE'].includes((evt as any).category) && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-100/50 tracking-wider">
                                    {(evt as any).category.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            )}

                            {evt.type === 'MEAL' && (
                              <div className="mt-1">
                                <h4 className="font-bold text-amber-700 text-sm">{evt.title}</h4>
                                {evt.notes && <p className="text-xs text-slate-500 mt-0.5">{evt.notes}</p>}
                              </div>
                            )}

                            {evt.type === 'NOTE' && (
                              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mt-1">
                                <p className="text-xs text-amber-800 leading-relaxed">{evt.content}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Sleep Town */}
                {(() => {
                  const acc = activeEvents.find((e: TimelineEvent) => e.type === 'STAY');
                  return (
                    <div 
                      className={`flex items-start gap-4 group cursor-pointer p-3 rounded-2xl transition-all border ${selectedEventId === 'end' ? 'bg-rose-50 border-rose-200 shadow-sm' : 'border-transparent hover:bg-slate-50'}`}
                      onClick={() => setSelectedEventId(selectedEventId === 'end' ? null : 'end')}
                    >
                      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center border shrink-0 transition-colors ${selectedEventId === 'end' ? 'bg-rose-100 border-rose-200' : 'bg-indigo-50 border-indigo-100'}`}>
                        <Bed className={`w-4 h-4 ${selectedEventId === 'end' ? 'text-rose-600' : 'text-indigo-500'}`} />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Rest</span>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                            {acc ? `Overnight at ${acc.title}` : `Overnight in ${activeDay.sleepTown}`}
                          </p>
                          {getAltitude((acc as any)?.location || activeDay.sleepTown) && (
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                              🏔️ {getAltitude((acc as any)?.location || activeDay.sleepTown)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PackagePreviewModal 
        packageId={viewingPackage}
        onClose={() => setViewingPackage(null)}
      />
    </div>
  )
}
