"use client"

import { useState, useEffect } from "react"
import { useTrip } from "@/lib/store/trip-context"
import { MapPin, Plus, Trash2, ArrowUp, ArrowDown, Utensils, AlignLeft, Car, Moon, Sparkles, X, Search, Check, ChevronDown, Repeat, Landmark, Ticket, Star, Eye, Save, Tent } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LocationPicker } from "@/components/ui/LocationPicker"
import { LocationAutocomplete } from "./LocationAutocomplete"
import { BusinessAutocomplete } from "./BusinessAutocomplete"
import { PackagePreviewModal } from "./PackagePreviewModal"
import { EventType, TimelineEvent, MealEvent } from "@/lib/types/trip"
import { v4 as uuidv4 } from "uuid"
import { createBusinessAction } from "@/features/business/actions/create-business"

function getEventIcon(type: EventType) {
  switch (type) {
    case 'EXPERIENCE': return <MapPin className="w-4 h-4 text-emerald-500" />
    case 'TRANSPORT': return <Car className="w-4 h-4 text-blue-500" />
    case 'MEAL': return <Utensils className="w-4 h-4 text-amber-500" />
    case 'STAY': return <Moon className="w-4 h-4 text-purple-500" />
    default: return <AlignLeft className="w-4 h-4 text-slate-500" />
  }
}

interface LibraryBusiness {
  name: string;
  lat: number;
  lng: number;
  id: string;
  category?: string;
  service?: any;
}

export function BuilderWorkspace({
  selectedId,
  onSelectEvent,
  variant = 'pro',
  onPinOnMap,
  libraryBusinesses = [],
}: {
  selectedId?: string | null,
  onSelectEvent?: (id: string) => void,
  variant?: 'live' | 'pro',
  onPinOnMap?: (target: string) => void,
  libraryBusinesses?: LibraryBusiness[],
}) {
  const { currentTrip, setCurrentTrip, activeDayNumber, addEvent, removeEvent, updateEvent, setViewState, setPanelMode, setExchangeTargetIndex, routeData } = useTrip()
  const [viewingPackage, setViewingPackage] = useState<string | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [dropError, setDropError] = useState<{id: string, message: string} | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleExchange = (index: number, type: string, category?: string) => {
    setExchangeTargetIndex(index)
    setPanelMode('categories')

    let cat = ""
    if (type === "MEAL" || type === "DINING") cat = "Dining"
    else if (type === "STAY" || type === "LODGING") cat = "Stays"
    else if (type === "TRANSPORT") cat = "Transport"
    else if (category) cat = category // Pass through specific categories like BOLETO, CULTURE, ADVENTURE

    if (cat) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("cat", cat)
      router.push(`?${params.toString()}`, { scroll: false })
    }
  }

  useEffect(() => {
    if (dropError) {
      const timer = setTimeout(() => setDropError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [dropError]);

  const activeDay = currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)

  if (!activeDay) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 h-full">
        <Sparkles className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-lg font-serif">Select a day to start building</p>
      </div>
    )
  }

  const handleAddMockEvent = (type: EventType) => {
    const id = uuidv4()
    let defaultStartTime = "10:00"
    if (activeDay && activeDay.events.length > 0) {
      const lastEvent = activeDay.events[activeDay.events.length - 1]
      if (lastEvent.startTime) {
        const [hours, minutes] = lastEvent.startTime.split(':').map(Number)
        defaultStartTime = `${String((hours + 2) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
    } else if (activeDay && activeDay.startAnchor?.time) {
      const [hours, minutes] = activeDay.startAnchor.time.split(':').map(Number)
      defaultStartTime = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    let newEvent: TimelineEvent;

    switch (type) {
      case 'TRANSPORT':
        newEvent = { id, type, startTime: defaultStartTime, title: 'Private Transfer', method: 'CAR', from: '', to: '', priceUsd: 50, details: 'Standard SUV or similar' };
        break;
      case 'MEAL':
        newEvent = { id, type, startTime: defaultStartTime, title: 'Lunch Reservation', priceUsd: 40, notes: '' } as any;
        break;
      case 'STAY':
        newEvent = { id, type, startTime: defaultStartTime, title: 'Hotel Stay', priceUsd: 250, checkIn: '15:00' } as any;
        break;
      case 'NOTE':
        newEvent = { id, type, startTime: defaultStartTime, title: 'Note', content: 'Remember to confirm with the local guide.' };
        break;
      case 'EXPERIENCE':
      default:
        newEvent = { id, type: 'EXPERIENCE', startTime: defaultStartTime, title: 'New Activity', durationMins: 120, priceUsd: 85, service: { id: "e-mock", name: "Guided Excursion", category: "CULTURE", description: "Immersive guided experience with a local expert.", imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=500&q=80" } as any };
        break;
    }
    
    if (type === 'EXPERIENCE') {
        setPanelMode('categories')
        setShowAddMenu(false)
        return
    }

    addEvent(activeDayNumber!, newEvent)
    setShowAddMenu(false)
  }

  const handleAddCustomStop = () => {
    const id = uuidv4()
    let defaultStartTime = "10:00"
    if (activeDay && activeDay.events.length > 0) {
      const lastEvent = activeDay.events[activeDay.events.length - 1]
      if (lastEvent.startTime) {
        const [hours, minutes] = lastEvent.startTime.split(':').map(Number)
        defaultStartTime = `${String((hours + 2) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
    } else if (activeDay && activeDay.startAnchor?.time) {
      const [hours, minutes] = activeDay.startAnchor.time.split(':').map(Number)
      defaultStartTime = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    const newEvent: TimelineEvent = {
      id,
      type: 'EXPERIENCE',
      startTime: defaultStartTime,
      title: 'Scenic Viewpoint',
      category: 'VIEWPOINT',
      description: 'Stunning viewpoint location.',
      photos: [],
    } as any

    addEvent(activeDayNumber!, newEvent)
    setShowAddMenu(false)
  }

  const handleAddLibraryItemDrop = (data: any) => {
    const id = data.id || uuidv4()
    let defaultStartTime = "10:00"
    if (activeDay && activeDay.events.length > 0) {
      const lastEvent = activeDay.events[activeDay.events.length - 1]
      if (lastEvent.startTime) {
        const [hours, minutes] = lastEvent.startTime.split(':').map(Number)
        defaultStartTime = `${String((hours + 2) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
      }
    } else if (activeDay && activeDay.startAnchor?.time) {
      const [hours, minutes] = activeDay.startAnchor.time.split(':').map(Number)
      defaultStartTime = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
    }

    const tagsStr = (data.tags || '').toLowerCase() + ' ' + (data.category || '').toLowerCase();
    
    let type: EventType = 'EXPERIENCE';
    if (!data.isPackage) {
      if (tagsStr.includes('stay') || tagsStr.includes('hotel') || tagsStr.includes('lodge')) {
        type = 'STAY';
      } else if (tagsStr.includes('transport') || tagsStr.includes('taxi')) {
        type = 'TRANSPORT';
      } else if (tagsStr.includes('food') || tagsStr.includes('restaurant') || tagsStr.includes('dining')) {
        type = 'MEAL';
      }
    }

    let newEvent: TimelineEvent;
    switch (type) {
      case 'TRANSPORT':
        newEvent = { id, type, startTime: defaultStartTime, title: data.name, method: 'CAR', from: '', to: '', businessId: data.id, packageId: data.isPackage ? data.id : undefined, service: data } as any;
        break;
      case 'MEAL':
        newEvent = { id, type, startTime: defaultStartTime, title: data.name, businessId: data.id, packageId: data.isPackage ? data.id : undefined, service: data, locationLat: data.lat, locationLng: data.lng } as any;
        break;
      case 'STAY':
        newEvent = { id, type, startTime: defaultStartTime, title: data.name, businessId: data.id, packageId: data.isPackage ? data.id : undefined, service: data, lat: data.lat, lng: data.lng } as any;
        break;
      case 'EXPERIENCE':
      default:
        newEvent = { id, type: 'EXPERIENCE', startTime: defaultStartTime, title: data.name, businessId: data.id, packageId: data.isPackage ? data.id : undefined, service: data } as any;
        break;
    }

    addEvent(activeDayNumber!, newEvent)
    setShowAddMenu(false)
  }

  const moveEvent = (dayNumber: number, eventId: string, direction: number) => {
    if (!currentTrip) return
    const day = currentTrip.days.find((d: any) => d.dayNumber === dayNumber)
    if (!day) return
    const index = day.events.findIndex((e: any) => e.id === eventId)
    if (index < 0) return
    if (index + direction < 0 || index + direction >= day.events.length) return
    const newEvents = [...day.events]
    const temp = newEvents[index]
    newEvents[index] = newEvents[index + direction]
    newEvents[index + direction] = temp
    const newDays = currentTrip.days.map((d: any) => d.dayNumber === dayNumber ? { ...d, events: newEvents } : d)
    setCurrentTrip({ ...currentTrip, days: newDays })
  }

  const updateDay = (dayNumber: number, updates: any) => {
    if (!currentTrip) return
    const newDays = currentTrip.days.map((d: any) => d.dayNumber === dayNumber ? { ...d, ...updates } : d)
    setCurrentTrip({ ...currentTrip, days: newDays })
  }

  return (
    <div className="flex-1 bg-transparent relative flex flex-col h-full">
      <AnimatePresence mode="wait">
        <motion.div 
          key={activeDay.dayNumber}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto p-8"
        >
          
          <div className="mb-10 flex justify-between items-start pt-10 pl-6">
            <div>
              <h2 className="text-4xl font-serif font-bold text-slate-900 mb-1">Day {activeDay.dayNumber}</h2>
              <p className="text-slate-500 text-lg">{activeDay.date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto relative border-l border-slate-200 ml-4 pl-8 space-y-8 pb-32">
            
            {/* START ANCHOR */}
            <div className="relative group">
              <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-900 z-20 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-slate-900" />
              </div>
              <div 
                className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow transition-shadow"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  try {
                    const data = JSON.parse(e.dataTransfer.getData("application/json"));
                    if (data && data.name) {
                      updateDay(activeDay.dayNumber, { startAnchor: { ...activeDay.startAnchor, title: data.name, lat: data.lat, lng: data.lng, service: data } });
                    }
                  } catch (err) {}
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.2em] block">Starting Point</span>
                  {variant === 'pro' && (
                    <input 
                      type="time" 
                      value={activeDay.startAnchor?.time || "09:00"} 
                      onChange={(e) => updateDay(activeDay.dayNumber, { startAnchor: { ...activeDay.startAnchor, time: e.target.value }})}
                      className="text-sm font-mono text-slate-900 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-slate-300 outline-none cursor-pointer transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                    />
                  )}
                </div>
                {dropError && dropError.id === `startAnchor-${activeDay.dayNumber}` && (
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md animate-in slide-in-from-top-1 fade-in">{dropError.message}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="flex flex-col gap-1 w-full">
                      <LocationPicker
                        placeholder={variant === 'pro' ? "e.g. Hotel Monasterio, Cusco" : "Establish your starting point"}
                        value={activeDay.startAnchor?.title || ""}
                        onChange={(val, lat, lng, service) => {
                          const updates: any = { title: val };
                          if (lat !== undefined) updates.lat = lat;
                          if (lng !== undefined) updates.lng = lng;
                          if (service !== undefined) updates.service = service;
                          updateDay(activeDay.dayNumber, { startAnchor: { ...activeDay.startAnchor, ...updates } });
                        }}
                        className="w-full p-2 bg-transparent border-b border-slate-200 text-base outline-none focus:border-slate-900 font-semibold text-slate-900 transition-colors"
                        extraLocations={libraryBusinesses}
                      />
                      {(activeDay.startAnchor as any)?.service && (
                          <>
                            <div className="flex items-center gap-2 mb-1 mt-1">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border flex items-center gap-1 w-fit",
                                (activeDay.startAnchor as any).service?.category?.toUpperCase() === 'DINING'
                                  ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                  : (activeDay.startAnchor as any).service?.category?.toUpperCase() === 'CULTURE'
                                  ? "bg-purple-50 text-purple-700 border-purple-200/50"
                                  : (activeDay.startAnchor as any).service?.category?.toUpperCase() === 'BOLETO'
                                  ? "bg-sky-50 text-sky-700 border-sky-200/50"
                                  : "bg-rose-50 text-rose-600 border-rose-100/50"
                              )}>
                                {(activeDay.startAnchor as any).service?.category?.toUpperCase() === 'DINING' && <Utensils className="w-2.5 h-2.5" />}
                                {(activeDay.startAnchor as any).service?.category?.toUpperCase() === 'CULTURE' && <Landmark className="w-2.5 h-2.5" />}
                                {(activeDay.startAnchor as any).service?.category?.toUpperCase() === 'BOLETO' && <Ticket className="w-2.5 h-2.5" />}
                                {(activeDay.startAnchor as any).service?.category || 'LOCATION'}
                              </span>
                              {(activeDay.startAnchor as any).service?.rating && (
                                <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                  <Star className="w-3 h-3 fill-current" /> {(activeDay.startAnchor as any).service.rating}
                                </div>
                              )}
                            </div>
                            {(activeDay.startAnchor as any).service?.description && (
                              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic font-serif mt-1">&ldquo;{(activeDay.startAnchor as any).service.description}&rdquo;</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleExchange(-1, "START_ANCHOR", (activeDay.startAnchor as any)?.service?.category)} className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">
                      <Repeat className="w-3.5 h-3.5" /> Exchange
                    </button>
                    {variant === 'pro' && onPinOnMap && (
                      <button
                        onClick={(e) => {
                          if ((activeDay.startAnchor as any)?.service) {
                            e.preventDefault();
                            return;
                          }
                          onPinOnMap('start');
                        }}
                        disabled={!!(activeDay.startAnchor as any)?.service}
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-bold transition-colors",
                          (activeDay.startAnchor as any)?.service 
                            ? "text-slate-300 cursor-not-allowed" 
                            : "text-sky-600 hover:text-sky-700"
                        )}
                        title={(activeDay.startAnchor as any)?.service ? "Location is fixed to the attached experience" : "Pin location on map"}
                      >
                        <MapPin className="w-3.5 h-3.5" /> Pin on Map
                      </button>
                    )}
                  </div>
                  {(activeDay.startAnchor as any)?.service && (
                    <button
                      onClick={() => setViewingPackage((activeDay.startAnchor as any).service.id)}
                      className="text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-xl transition-colors"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>            </div>

            {/* EVENTS LOOP */}
            {activeDay.events.map((evt: any, index: number) => {
              const prevLocEvent = activeDay.events.slice(0, index).reverse().find((e: any) => ['EXPERIENCE', 'MEAL', 'STAY'].includes(e.type));
              const nextLocEvent = activeDay.events.slice(index + 1).find((e: any) => ['EXPERIENCE', 'MEAL', 'STAY'].includes(e.type));
              const suggestedFrom = prevLocEvent?.title || activeDay.startAnchor?.title || "Starting Location";
              const suggestedTo = nextLocEvent?.title || activeDay.endAnchor?.title || "Destination";

              return (
              <div 
                key={`${evt.id}-${index}`} 
                id={`event-${evt.id}`}
                className="relative group animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
                onClick={() => onSelectEvent && onSelectEvent(evt.id)}
              >
                <div className={`absolute -left-[37px] top-8 w-4 h-4 rounded-full border-2 z-20 flex items-center justify-center transition-colors ${selectedId === evt.id ? 'bg-slate-400 border-slate-400' : 'bg-white border-slate-200'}`}>
                  <div className={`w-1 h-1 rounded-full ${selectedId === evt.id ? 'bg-white' : 'bg-slate-200'}`} />
                </div>
                
                <div className={`bg-white border rounded-3xl p-6 transition-shadow relative ${selectedId === evt.id ? 'border-slate-300 shadow-md ring-1 ring-slate-900/5' : 'border-slate-100 shadow-sm hover:shadow-md'}`}>
                  
                  {/* Action Buttons (appears on hover) */}
                  <div className="absolute -top-3 -right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button 
                      onClick={() => moveEvent(activeDay.dayNumber, evt.id, -1)}
                      className="w-8 h-8 bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 rounded-full flex items-center justify-center shadow-sm"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => removeEvent(activeDay.dayNumber, evt.id)}
                      className="w-8 h-8 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-full flex items-center justify-center shadow-sm"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => moveEvent(activeDay.dayNumber, evt.id, 1)}
                      className="w-8 h-8 bg-white border border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200 rounded-full flex items-center justify-center shadow-sm"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-4 border-b border-slate-50 pb-3">
                    <div className="flex items-center gap-2">
                      {getEventIcon(evt.type)}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{evt.type}</span>
                    </div>
                    {variant === 'pro' && (
                      <input 
                        type="time" 
                        value={evt.startTime} 
                        onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { startTime: e.target.value })}
                        className="text-sm font-mono text-slate-900 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-slate-300 outline-none cursor-pointer transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      />
                    )}
                  </div>
                  
                  {evt.type === 'EXPERIENCE' && (
                    <div className="space-y-4">
                      {['VIEWPOINT', 'CAMPGROUND', 'TRAILHEAD', 'REST_STOP', 'WAYPOINT', 'WATER_SOURCE', 'ARCHEOLOGICAL_SITE'].includes(evt.category || '') ? (
                        <div className="p-4 bg-sky-50/40 rounded-2xl border border-sky-100/50 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              {/* Title / Name */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stop Name</label>
                                <input 
                                  type="text" 
                                  value={evt.title || ''} 
                                  onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { title: e.target.value })} 
                                  className="w-full text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-400 focus:bg-white"
                                  placeholder="e.g. Salkantay Viewpoint"
                                />
                              </div>

                              {/* Category Selector */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stop Type</label>
                                  <select
                                    value={evt.category || 'VIEWPOINT'}
                                    onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { category: e.target.value })}
                                    className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:border-slate-400 cursor-pointer"
                                  >
                                    <option value="VIEWPOINT">Viewpoint</option>
                                    <option value="CAMPGROUND">Campground</option>
                                    <option value="TRAILHEAD">Trailhead</option>
                                    <option value="REST_STOP">Rest Stop</option>
                                    <option value="WAYPOINT">Waypoint</option>
                                    <option value="WATER_SOURCE">Water Source</option>
                                    <option value="ARCHEOLOGICAL_SITE">Archeological Site</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Price (USD)</label>
                                  <input 
                                    type="number" 
                                    value={evt.priceUsd || 0} 
                                    onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { priceUsd: parseFloat(e.target.value) || 0 })} 
                                    className="w-full text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-400"
                                  />
                                </div>
                              </div>

                              {/* Coordinates */}
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Latitude</label>
                                  <input 
                                    type="number" 
                                    step="any"
                                    value={evt.lat != null ? evt.lat : ''} 
                                    onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { lat: e.target.value ? parseFloat(e.target.value) : undefined })} 
                                    className="w-full text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-slate-400"
                                    placeholder="-13.16"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Longitude</label>
                                  <input 
                                    type="number" 
                                    step="any"
                                    value={evt.lng != null ? evt.lng : ''} 
                                    onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { lng: e.target.value ? parseFloat(e.target.value) : undefined })} 
                                    className="w-full text-xs font-mono text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-slate-400"
                                    placeholder="-72.54"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onPinOnMap) onPinOnMap('event-' + evt.id);
                                }}
                                className="w-full flex items-center justify-center gap-1.5 py-2 border border-sky-200 hover:bg-sky-50 rounded-xl text-xs font-bold text-sky-600 transition-colors"
                              >
                                <MapPin className="w-3.5 h-3.5" /> Pin Stop on Map
                              </button>

                              {/* Description */}
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stop Description</label>
                                <textarea 
                                  value={evt.description || ""} 
                                  onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { description: e.target.value })} 
                                  className="w-full text-xs text-slate-600 bg-white border border-slate-200 rounded-xl p-2.5 outline-none focus:border-slate-400 resize-none h-16 leading-normal"
                                  placeholder="Describe viewpoints or trail details..."
                                />
                              </div>

                              {/* Photos Manager */}
                              <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Photos</label>
                                <div className="flex gap-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="e.g. /images/viewpoint.jpg"
                                    id={`new-photo-input-${evt.id}`}
                                    className="flex-1 text-[11px] text-slate-700 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none focus:border-slate-400"
                                    onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const val = input.value.trim();
                                        if (val) {
                                          const currentPhotos = evt.photos || [];
                                          updateEvent(activeDay.dayNumber, evt.id, { photos: [...currentPhotos, val] });
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const input = document.getElementById(`new-photo-input-${evt.id}`) as HTMLInputElement;
                                      const val = input?.value.trim();
                                      if (val) {
                                        const currentPhotos = evt.photos || [];
                                        updateEvent(activeDay.dayNumber, evt.id, { photos: [...currentPhotos, val] });
                                        input.value = '';
                                      }
                                    }}
                                    className="px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                                  >
                                    +
                                  </button>
                                </div>

                                {evt.photos && evt.photos.length > 0 && (
                                  <div className="flex flex-wrap gap-2 p-2 bg-white rounded-xl border border-slate-100">
                                    {evt.photos.map((url: string, pIdx: number) => (
                                      <div key={pIdx} className="relative group/photo w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt="Stop Photo" className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=100&q=80" }} />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const filtered = evt.photos!.filter((_: string, pi: number) => pi !== pIdx);
                                            updateEvent(activeDay.dayNumber, evt.id, { photos: filtered });
                                          }}
                                          className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-opacity"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Export / Save to Library */}
                              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 font-bold">Unsaved Custom Stop</span>
                                <button
                                  type="button"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!evt.title) {
                                      alert("Please provide a name for this custom stop.");
                                      return;
                                    }
                                    const confirmSave = window.confirm(`Would you like to register "${evt.title}" as a reusable place in your Library?`);
                                    if (!confirmSave) return;
                                    
                                    const res = await createBusinessAction({
                                      name: evt.title,
                                      category: evt.category || 'VIEWPOINT',
                                      lat: evt.lat,
                                      lng: evt.lng,
                                      description: evt.description,
                                      imageUrl: evt.photos && evt.photos.length > 0 ? evt.photos[0] : undefined,
                                      heroImages: evt.photos || [],
                                      locationSlug: 'vallecito',
                                    });

                                    if (res.success && res.business) {
                                      alert(`Successfully registered "${evt.title}" in the library!`);
                                      updateEvent(activeDay.dayNumber, evt.id, {
                                        businessId: res.business.id,
                                        service: res.business,
                                      } as any);
                                    } else {
                                      alert(`Failed to save: ${res.error}`);
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                                >
                                  <Save className="w-3.5 h-3.5" /> Save to Library
                                </button>
                              </div>

                            </div>
                            
                            <button 
                              onClick={() => {
                                if (window.confirm("Convert back to standard library experience?")) {
                                  updateEvent(activeDay.dayNumber, evt.id, { category: undefined } as any);
                                }
                              }}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : ((evt as any).businessId || (evt as any).packageId || (evt as any).service) ? (
                        <div className={cn(variant === 'pro' ? "p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50" : "", "flex flex-col gap-3")}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-serif font-bold text-slate-900 text-lg leading-tight">{evt.title || "Selected Vallecito Experience"}</h4>
                              <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5", variant === 'pro' ? "text-emerald-700/80" : "text-slate-400")}>
                                <MapPin className="w-3.5 h-3.5" /> {variant === 'pro' ? ((evt as any).service?.category?.replace('_', ' ') || "Experience") : "Expedition"}
                              </p>
                            </div>
                            {variant === 'pro' && (
                              <button 
                                onClick={() => updateEvent(activeDay.dayNumber, evt.id, { businessId: undefined, packageId: undefined, service: undefined } as any)}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {variant === 'live' && (evt as any).service?.description && (
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic font-serif">"{(evt as any).service.description}"</p>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={() => handleExchange(index, evt.type, (evt as any).service?.category || (evt as any).category)} 
                              className="text-xs font-bold text-slate-500 bg-white border border-slate-100 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                              Exchange
                            </button>
                            {((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id) && (
                              <button 
                                onClick={() => setViewingPackage((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id)} 
                                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div 
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                const tagsStr = (data.tags || '').toLowerCase() + ' ' + (data.category || '').toLowerCase();
                                const isFoodOrStayOrTransport = 
                                  tagsStr.includes('food') || tagsStr.includes('restaurant') || tagsStr.includes('dining') || 
                                  tagsStr.includes('stay') || tagsStr.includes('hotel') || tagsStr.includes('lodge') || 
                                  tagsStr.includes('transport') || tagsStr.includes('taxi');
                                  
                                if (!data.isPackage && isFoodOrStayOrTransport) {
                                  setDropError({ id: evt.id, message: 'Please drop an experience, ticket, or package here (not stays, meals, or transport)' });
                                  return;
                                }
                                if (data && data.id) {
                                  updateEvent(activeDay.dayNumber, evt.id, { 
                                    title: data.name, 
                                    businessId: data.id,
                                    packageId: data.isPackage ? data.id : undefined,
                                    service: data
                                  } as any);
                                }
                              } catch (err) {}
                            }}
                            className="flex flex-col items-center justify-center gap-1.5 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-emerald-200 transition-colors cursor-pointer"
                            onClick={() => handleExchange(index, evt.type, (evt as any).service?.category || (evt as any).category)}
                          >
                            <Repeat className="w-5 h-5 text-slate-400" />
                            <span className="text-xs font-bold text-slate-500">Exchange experience</span>
                            {dropError && dropError.id === evt.id && (
                              <span className="text-[10px] font-bold text-rose-500 text-center mt-1 animate-in slide-in-from-top-1 fade-in">{dropError.message}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {evt.type === 'TRANSPORT' && (
                    <div className="space-y-3">
                      {variant === 'live' ? (
                        <div className="py-2 pl-4 border-l-2 border-dashed border-slate-200 ml-[-33px] my-2 relative">
                          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm py-2 px-4 rounded-2xl border border-slate-100/50 shadow-sm w-fit group/transit transition-all hover:border-slate-200">
                             <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                {getEventIcon(evt.type)}
                                <span>{(evt as any).method || 'CAR'}</span>
                             </div>
                             <div className="h-3 w-px bg-slate-200 mx-1" />
                             <div className="text-[11px] font-mono text-slate-500 font-bold">
                                {routeData && routeData.legs && routeData.legs[index] 
                                  ? `${Math.ceil(routeData.legs[index].duration / 60)}m (Mapbox)` 
                                  : `${evt.durationMins || 30}m (Est)`}
                             </div>
                             <div className="flex items-center gap-1 opacity-0 group-hover/transit:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => updateEvent(activeDay.dayNumber, evt.id, { method: 'WALK' })}
                                  className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all", (evt as any).method === 'WALK' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                >
                                  Walk
                                </button>
                                <button 
                                  onClick={() => updateEvent(activeDay.dayNumber, evt.id, { method: 'PUBLIC' })}
                                  className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all", (evt as any).method === 'PUBLIC' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                >
                                  Public
                                </button>
                                <button 
                                  onClick={() => updateEvent(activeDay.dayNumber, evt.id, { method: 'CAR' })}
                                  className={cn("px-2 py-0.5 rounded-md text-[9px] font-black uppercase transition-all", (evt as any).method === 'CAR' ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400 hover:bg-slate-200")}
                                >
                                  Private
                                </button>
                             </div>
                             {(evt as any).method === 'CAR' && (
                               <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-100">
                                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Pickup:</span>
                                  <input 
                                    type="time" 
                                    value={(evt as any).pickupTime || evt.startTime}
                                    onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { pickupTime: e.target.value })}
                                    className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100/50 px-1.5 py-0.5 rounded border border-transparent focus:bg-white focus:border-slate-200 outline-none"
                                  />
                               </div>
                             )}
                          </div>
                        </div>
                      ) : (
                        <div 
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            try {
                              const data = JSON.parse(e.dataTransfer.getData("application/json"));
                              const tagsStr = (data.tags || '').toLowerCase() + ' ' + (data.category || '').toLowerCase();
                              if (data.isPackage || (!tagsStr.includes('transport') && !tagsStr.includes('taxi'))) {
                                setDropError({ id: evt.id, message: 'Please drop a transport provider here' });
                                return;
                              }                                  if (data && data.id) {
                                updateEvent(activeDay.dayNumber, evt.id, { 
                                  title: data.name, 
                                  businessId: data.id,
                                  packageId: data.isPackage ? data.id : undefined,
                                  service: data
                                } as any);
                              }
                            } catch (err) {}
                          }}
                          className="space-y-3"
                        >
                          {((evt as any).businessId || (evt as any).packageId || (evt as any).service) && (
                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-center justify-between gap-4 mb-3">
                              <div>
                                <h4 className="font-serif font-bold text-slate-900 text-base leading-tight">{evt.title}</h4>
                                <p className="text-[11px] text-blue-700/80 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                                  <Car className="w-3 h-3" /> Transport Provider
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id) && (
                                  <button 
                                    onClick={() => setViewingPackage((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id)} 
                                    className="text-xs font-bold text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                                  >
                                    Details
                                  </button>
                                )}
                                <button 
                                  onClick={() => updateEvent(activeDay.dayNumber, evt.id, { businessId: undefined, packageId: undefined, service: undefined } as any)}
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 text-sm font-medium text-slate-900 relative">
                             <div className="flex-1">
                               <LocationAutocomplete 
                                 value={(evt as any).from || ""} 
                                 onChange={(val, lat, lng) => updateEvent(activeDay.dayNumber, evt.id, { from: val, fromLat: lat, fromLng: lng })} 
                                 className="w-full border-b border-slate-200 pb-1.5 outline-none focus:border-slate-900 transition-colors" 
                                 placeholder={suggestedFrom}
                               />
                             </div>
                             <span className="text-slate-300">&rarr;</span>
                             <div className="flex-1">
                               <LocationAutocomplete 
                                 value={(evt as any).to || ""} 
                                 onChange={(val, lat, lng) => updateEvent(activeDay.dayNumber, evt.id, { to: val, toLat: lat, toLng: lng })} 
                                 className="w-full border-b border-slate-200 pb-1.5 outline-none focus:border-slate-900 transition-colors" 
                                 placeholder={suggestedTo}
                               />
                             </div>
                          </div>
                          {dropError && dropError.id === evt.id && (
                            <span className="text-[10px] font-bold text-rose-500 text-center mt-1 animate-in slide-in-from-top-1 fade-in block">{dropError.message}</span>
                          )}
                          <div className="flex items-start gap-3">
                            <input type="text" value={(evt as any).details || ''} onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { details: e.target.value })} className="flex-1 text-sm text-slate-500 outline-none bg-slate-50 p-3 rounded-xl border border-transparent focus:border-slate-200 transition-colors" placeholder="Driver notes or vehicle details..." />
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center bg-slate-50 px-3 py-2.5 rounded-xl border border-transparent focus-within:border-slate-200 relative">
                                <select
                                  value={evt.durationMins || 30}
                                  onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { durationMins: parseInt(e.target.value) || 30 })}
                                  className="text-sm font-bold text-slate-700 bg-transparent outline-none cursor-pointer appearance-none pr-6 w-full relative z-10"
                                >
                                  {![10, 15, 30, 45, 60, 90, 120, 180, 240].includes(evt.durationMins || 30) && (
                                    <option value={evt.durationMins}>{evt.durationMins} mins</option>
                                  )}
                                  <option value={10}>10 mins</option>
                                  <option value={15}>15 mins</option>
                                  <option value={30}>30 mins</option>
                                  <option value={45}>45 mins</option>
                                  <option value={60}>1 hr</option>
                                  <option value={90}>1.5 hr</option>
                                  <option value={120}>2 hr</option>
                                  <option value={180}>3 hr</option>
                                  <option value={240}>4 hr</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none z-0" />
                              </div>
                              {(() => {
                                const mapboxMins = routeData && routeData.legs && routeData.legs[index] ? Math.ceil(routeData.legs[index].duration / 60) : null;
                                if (mapboxMins !== null && Math.abs(mapboxMins - (evt.durationMins || 30)) > 5) {
                                  return (
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); updateEvent(activeDay.dayNumber, evt.id, { durationMins: mapboxMins }); }}
                                      className="text-[10px] text-blue-600 font-bold hover:underline transition-colors"
                                    >
                                      Use Mapbox ({mapboxMins}m)
                                    </button>
                                  )
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {evt.type === 'MEAL' && (
                    <div className="space-y-4">
                      {((evt as any).businessId || (evt as any).packageId || (evt as any).service) ? (
                        <div className={cn(variant === 'pro' ? "p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50" : "", "flex flex-col gap-3")}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-serif font-bold text-slate-900 text-lg leading-tight">{evt.title}</h4>
                              <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5", variant === 'pro' ? "text-amber-700/80" : "text-slate-400")}>
                                <Utensils className="w-3.5 h-3.5" /> {variant === 'pro' ? "Reserved Dining" : "Dining Reservation"}
                              </p>
                            </div>
                            {variant === 'pro' && (
                              <button 
                                onClick={() => updateEvent(activeDay.dayNumber, evt.id, { businessId: undefined, packageId: undefined, service: undefined } as any)}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          
                          {variant === 'pro' && (
                            <input 
                              type="text" 
                              value={(evt as any).notes || ''} 
                              onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { notes: e.target.value } as any)} 
                              className="w-full text-sm text-slate-600 outline-none bg-white p-3 rounded-xl border border-amber-100/50 focus:border-amber-200 transition-colors" 
                              placeholder="Reservation notes or dietary requirements..." 
                            />
                          )}

                          {variant === 'live' && (evt as any).service?.description && (
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic font-serif">"{(evt as any).service.description}"</p>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={() => handleExchange(index, evt.type, (evt as any).service?.category || (evt as any).category)} 
                              className="text-xs font-bold text-slate-500 bg-white border border-slate-100 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                              Exchange
                            </button>
                            {((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id) && (
                              <button 
                                onClick={() => setViewingPackage((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id)} 
                                className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="font-serif font-bold text-slate-900 text-base leading-tight">{evt.title}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70 flex items-center gap-1 mt-0.5">
                              <Utensils className="w-3 h-3" /> No restaurant linked
                            </p>
                          </div>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                const tagsStr = (data.tags || '').toLowerCase() + ' ' + (data.category || '').toLowerCase();
                                if (data.isPackage || (!tagsStr.includes('food') && !tagsStr.includes('restaurant') && !tagsStr.includes('dining'))) {
                                  setDropError({ id: evt.id, message: 'Please drop a restaurant or dining experience here' });
                                  return;
                                }
                                if (data && data.id) {
                                  updateEvent(activeDay.dayNumber, evt.id, {
                                    title: data.name,
                                    businessId: data.id,
                                    packageId: data.isPackage ? data.id : undefined,
                                    service: data,
                                    locationLat: data.lat,
                                    locationLng: data.lng
                                  } as any);
                                }
                              } catch (err) {}
                            }}
                            className="flex flex-col items-center justify-center gap-1 p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-amber-200 transition-colors cursor-pointer"
                            onClick={() => handleExchange(index, evt.type, 'Dining')}
                          >
                            <Plus className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">Add Restaurant</span>
                            <span className="text-[10px] text-slate-400">from library or drag &amp; drop</span>
                            {dropError && dropError.id === evt.id && (
                              <span className="text-[10px] font-bold text-rose-500 text-center mt-1 animate-in slide-in-from-top-1 fade-in">{dropError.message}</span>
                            )}
                          </div>
                          <input type="text" value={(evt as any).notes || ''} onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { notes: e.target.value } as any)} className="w-full text-sm text-slate-600 outline-none bg-white p-3 rounded-xl border border-amber-100/50 focus:border-amber-200 transition-colors" placeholder="Reservation notes or dietary requirements..." />
                        </div>
                      )}
                    </div>
                  )}

                  {evt.type === 'NOTE' && (
                    <textarea 
                      value={(evt as any).content || ""} 
                      onChange={(e) => updateEvent(activeDay.dayNumber, evt.id, { content: e.target.value })}
                      className="w-full text-sm text-slate-600 outline-none resize-none h-20 bg-slate-50 p-4 rounded-2xl border border-transparent focus:border-slate-200 transition-colors leading-relaxed" 
                      placeholder="Add free-text notes, instructions, or recommendations for the client..." 
                    />
                  )}

                  {evt.type === 'STAY' && (
                    <div className="space-y-4">
                      {((evt as any).businessId || (evt as any).packageId || (evt as any).service) ? (
                        <div className={cn(variant === 'pro' ? "p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50" : "", "flex flex-col gap-3")}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h4 className="font-serif font-bold text-slate-900 text-lg leading-tight">{evt.title}</h4>
                              <p className={cn("text-[11px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5", variant === 'pro' ? "text-purple-700/80" : "text-slate-400")}>
                                <Moon className="w-3.5 h-3.5" /> {variant === 'pro' ? "Booked Stay" : "Basecamp"}
                              </p>
                            </div>
                            {variant === 'pro' && (
                              <button 
                                onClick={() => updateEvent(activeDay.dayNumber, evt.id, { businessId: undefined, packageId: undefined, service: undefined } as any)}
                                className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 shadow-sm transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {variant === 'live' && (evt as any).service?.description && (
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic font-serif">"{(evt as any).service.description}"</p>
                          )}

                          <div className="flex items-center gap-2 mt-1">
                            <button 
                              onClick={() => handleExchange(index, evt.type, (evt as any).service?.category || (evt as any).category)} 
                              className="text-xs font-bold text-slate-500 bg-white border border-slate-100 hover:bg-slate-50 px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                              Exchange
                            </button>
                            {((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id) && (
                              <button 
                                onClick={() => setViewingPackage((evt as any).packageId || (evt as any).businessId || (evt as any).service?.id)} 
                                className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors"
                              >
                                View Details
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div>
                            <h4 className="font-serif font-bold text-slate-900 text-base leading-tight">{evt.title}</h4>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-purple-600/70 flex items-center gap-1 mt-0.5">
                              <Moon className="w-3 h-3" /> No accommodation linked
                            </p>
                          </div>
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              try {
                                const data = JSON.parse(e.dataTransfer.getData("application/json"));
                                const tagsStr = (data.tags || '').toLowerCase() + ' ' + (data.category || '').toLowerCase();
                                if (data.isPackage || (!tagsStr.includes('stay') && !tagsStr.includes('hotel') && !tagsStr.includes('lodge'))) {
                                  setDropError({ id: evt.id, message: 'Please drop an accommodation or stay here' });
                                  return;
                                }
                                if (data && data.id) {
                                  updateEvent(activeDay.dayNumber, evt.id, {
                                    title: data.name,
                                    businessId: data.id,
                                    packageId: data.isPackage ? data.id : undefined,
                                    service: data,
                                    lat: data.lat,
                                    lng: data.lng
                                  } as any);
                                }
                              } catch (err) {}
                            }}
                            className="flex flex-col items-center justify-center gap-1 p-5 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-purple-200 transition-colors cursor-pointer"
                            onClick={() => handleExchange(index, evt.type, 'Stays')}
                          >
                            <Plus className="w-4 h-4 text-slate-400" />
                            <span className="text-xs font-bold text-slate-600">Add Accommodation</span>
                            <span className="text-[10px] text-slate-400">from library or drag &amp; drop</span>
                            {dropError && dropError.id === evt.id && (
                              <span className="text-[10px] font-bold text-rose-500 text-center mt-1 animate-in slide-in-from-top-1 fade-in">{dropError.message}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            )})}

            {/* ADD BLOCK BUTTON */}
            <div 
              className="relative pt-6"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData("application/json"));
                  if (data) {
                    handleAddLibraryItemDrop(data);
                  }
                } catch (err) {}
              }}
            >
              {variant === 'live' ? (
                <button 
                  onClick={() => { setPanelMode('categories'); }}
                  className="w-full py-5 border border-slate-200 rounded-3xl text-slate-500 font-bold hover:border-slate-900 hover:text-slate-900 transition-all flex items-center justify-center gap-2 bg-white shadow-sm hover:shadow"
                >
                  <Plus className="w-4 h-4" /> Add Next Stop
                </button>
              ) : !showAddMenu ? (
                <button 
                  onClick={() => setShowAddMenu(true)}
                  className="w-full py-5 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center justify-center gap-2 bg-transparent"
                >
                  <Plus className="w-4 h-4" /> Add block
                </button>
              ) : (
                <div className="bg-white border border-slate-100 shadow-xl rounded-3xl p-5 animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Block Type</span>
                    <button onClick={() => setShowAddMenu(false)} className="text-slate-400 hover:text-slate-900 bg-slate-50 p-1.5 rounded-full"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleAddMockEvent('EXPERIENCE')} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-colors text-sm font-semibold text-slate-700">
                      <MapPin className="w-4 h-4 text-emerald-500" /> Experience
                    </button>
                    <button onClick={() => handleAddMockEvent('TRANSPORT')} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-colors text-sm font-semibold text-slate-700">
                      <Car className="w-4 h-4 text-blue-500" /> Transport
                    </button>
                    <button onClick={() => handleAddMockEvent('MEAL')} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50 transition-colors text-sm font-semibold text-slate-700">
                      <Utensils className="w-4 h-4 text-amber-500" /> Meal
                    </button>
                    <button onClick={() => handleAddMockEvent('STAY')} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50 transition-colors text-sm font-semibold text-slate-700">
                      <Moon className="w-4 h-4 text-purple-500" /> Stay
                    </button>
                    <button onClick={handleAddCustomStop} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-sky-200 hover:bg-sky-50 transition-colors text-sm font-semibold text-slate-700 col-span-2">
                      <MapPin className="w-4 h-4 text-sky-500" /> Custom Stop / Trekking POI
                    </button>
                    <button onClick={() => handleAddMockEvent('NOTE')} className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 col-span-2">
                      <AlignLeft className="w-4 h-4 text-slate-500" /> Free Text Note
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* END ANCHOR */}
            <div className="relative pt-6">
              <div 
                className="relative group cursor-pointer"
                onClick={() => onSelectEvent && onSelectEvent(`endAnchor-${activeDay.dayNumber}`)}
              >
                <div className={`absolute -left-[37px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 z-20 flex items-center justify-center transition-colors ${selectedId === `endAnchor-${activeDay.dayNumber}` ? 'bg-rose-600 border-rose-600' : 'bg-white border-rose-600 group-hover:bg-rose-50'}`}>
                  <div className={`w-1 h-1 rounded-full ${selectedId === `endAnchor-${activeDay.dayNumber}` ? 'bg-white' : 'bg-rose-600'}`} />
                </div>
                <div 
                  className={`bg-white border rounded-3xl p-5 transition-shadow ${selectedId === `endAnchor-${activeDay.dayNumber}` ? 'border-rose-200 shadow-md ring-1 ring-rose-600/5' : 'border-slate-100 shadow-sm hover:shadow'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    try {
                      const data = JSON.parse(e.dataTransfer.getData("application/json"));
                      if (data && data.name) {                        updateDay(activeDay.dayNumber, { endAnchor: { ...activeDay.endAnchor, title: data.name, lat: data.lat, lng: data.lng, service: data } });
                      }
                    } catch (err) {}
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em] block">End of Day</span>
                    {variant === 'pro' && (
                      <input 
                        type="time" 
                        value={activeDay.endAnchor?.time || "18:00"} 
                        onChange={(e) => updateDay(activeDay.dayNumber, { endAnchor: { ...activeDay.endAnchor, time: e.target.value }})}
                        className="text-sm font-mono text-slate-900 font-bold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-slate-300 outline-none cursor-pointer transition-all [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                      />
                    )}
                  </div>
                  {dropError && dropError.id === `endAnchor-${activeDay.dayNumber}` && (
                    <div className="mb-2">
                      <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md animate-in slide-in-from-top-1 fade-in">{dropError.message}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="flex flex-col gap-1 w-full">
                        <LocationPicker
                          placeholder="Where will your journey end?"
                          value={activeDay.endAnchor?.title || ""}
                          onChange={(val, lat, lng, service) => {
                            const updates: any = { title: val };
                            if (lat !== undefined) updates.lat = lat;
                            if (lng !== undefined) updates.lng = lng;
                            if (service !== undefined) updates.service = service;
                            updateDay(activeDay.dayNumber, { endAnchor: { ...activeDay.endAnchor, ...updates } });
                          }}
                          className="w-full p-2 bg-transparent border-b border-slate-200 text-base outline-none focus:border-slate-900 font-semibold text-slate-900 transition-colors"
                          extraLocations={libraryBusinesses}
                        />
                        {(activeDay.endAnchor as any)?.service && (
                          <>
                            <div className="flex items-center gap-2 mb-1 mt-1">
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md border flex items-center gap-1 w-fit",
                                (activeDay.endAnchor as any).service?.category?.toUpperCase() === 'DINING'
                                  ? "bg-amber-50 text-amber-700 border-amber-200/50"
                                  : (activeDay.endAnchor as any).service?.category?.toUpperCase() === 'CULTURE'
                                  ? "bg-purple-50 text-purple-700 border-purple-200/50"
                                  : (activeDay.endAnchor as any).service?.category?.toUpperCase() === 'BOLETO'
                                  ? "bg-sky-50 text-sky-700 border-sky-200/50"
                                  : "bg-rose-50 text-rose-600 border-rose-100/50"
                              )}>
                                {(activeDay.endAnchor as any).service?.category?.toUpperCase() === 'DINING' && <Utensils className="w-2.5 h-2.5" />}
                                {(activeDay.endAnchor as any).service?.category?.toUpperCase() === 'CULTURE' && <Landmark className="w-2.5 h-2.5" />}
                                {(activeDay.endAnchor as any).service?.category?.toUpperCase() === 'BOLETO' && <Ticket className="w-2.5 h-2.5" />}
                                {(activeDay.endAnchor as any).service?.category || 'LOCATION'}
                              </span>
                              {(activeDay.endAnchor as any).service?.rating && (
                                <div className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                                  <Star className="w-3 h-3 fill-current" /> {(activeDay.endAnchor as any).service.rating}
                                </div>
                              )}
                            </div>
                            {(activeDay.endAnchor as any).service?.description && (
                              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed italic font-serif mt-1">&ldquo;{(activeDay.endAnchor as any).service.description}&rdquo;</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleExchange(-2, "END_ANCHOR", (activeDay.endAnchor as any)?.service?.category)} className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors">
                        <Repeat className="w-3.5 h-3.5" /> Exchange
                      </button>
                      {variant === 'pro' && onPinOnMap && (
                        <button
                          onClick={(e) => {
                            if ((activeDay.endAnchor as any)?.service) {
                              e.preventDefault();
                              return;
                            }
                            onPinOnMap('end');
                          }}
                          disabled={!!(activeDay.endAnchor as any)?.service}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-bold transition-colors",
                            (activeDay.endAnchor as any)?.service 
                              ? "text-slate-300 cursor-not-allowed" 
                              : "text-sky-600 hover:text-sky-700"
                          )}
                          title={(activeDay.endAnchor as any)?.service ? "Location is fixed to the attached experience" : "Pin location on map"}
                        >
                          <MapPin className="w-3.5 h-3.5" /> Pin on Map
                        </button>
                      )}
                    </div>
                    {(activeDay.endAnchor as any)?.service && (
                      <button
                        onClick={() => setViewingPackage((activeDay.endAnchor as any).service.id)}
                        className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>

      <PackagePreviewModal
        packageId={viewingPackage}
        onClose={() => setViewingPackage(null)}
      />

    </div>
  )
}
