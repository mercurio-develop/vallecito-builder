"use client"

import { useState, useMemo } from "react"
import { useTrip } from "@/lib/store/trip-context"
import { Calendar, Users, ChevronRight, Sparkles, MapPin, Minus, Plus } from "lucide-react"
import type { UniversalTrip, TripDay } from "@/lib/types/trip"
import { v4 as uuidv4 } from "uuid"

export function BuilderWizard() {
  const { currentTrip, setCurrentTrip, setViewState, setActiveDayNumber } = useTrip()
  
  const [title, setTitle] = useState(currentTrip?.title || "")
  const [startDate, setStartDate] = useState(currentTrip?.startDate.toISOString().split('T')[0] || "")
  const [endDate, setEndDate] = useState(currentTrip?.endDate.toISOString().split('T')[0] || "")
  const [paxCount, setPaxCount] = useState(currentTrip?.paxCount || 2) // Default to 2

  const minStartDate = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const minEndDate = useMemo(() => {
    if (!startDate) return minStartDate
    const d = new Date(startDate)
    d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [startDate, minStartDate])

  const numDays = useMemo(() => {
    if (!startDate || !endDate) return 0
    return Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)
  }, [startDate, endDate])

  const isFormValid = title.trim() !== "" && startDate && endDate && startDate >= minStartDate && endDate >= minEndDate && numDays > 0

  const generateEmptyDays = (start: string, nDays: number): TripDay[] => {
    const generated: TripDay[] = []
    const d = new Date(start)
    for (let i = 0; i < nDays; i++) {
      const currentDate = new Date(d)
      currentDate.setDate(d.getDate() + i + 1)
      generated.push({
        dayNumber: i + 1,
        date: currentDate,
        events: []
      })
    }
    return generated
  }

  const handleStartBuilding = () => {
    const days = generateEmptyDays(startDate, numDays)
    const newTrip: UniversalTrip = {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        paxCount,
        days,
        status: 'DRAFT'
    }
    setCurrentTrip(newTrip)
    setActiveDayNumber(1)
    setViewState('workspace')
  }

  const handleMagicAutoFill = () => {
    const d1 = new Date()
    d1.setDate(d1.getDate() + 14)
    const sd = d1.toISOString().split('T')[0]
    
    const d2 = new Date(d1)
    d2.setDate(d2.getDate() + 3)
    const ed = d2.toISOString().split('T')[0]

    const demoDays = generateEmptyDays(sd, 3)
    
    // Day 1: Arrival & Acclimatization (Cusco)
    demoDays[0].isComplete = true;
    demoDays[0].title = "Cusco Arrival & Acclimatization"
    demoDays[0].sleepTown = "Cusco"
    demoDays[0].startAnchor = { title: "Alejandro Velasco Astete Airport (CUZ)", lat: -13.5358, lng: -71.9388, time: "09:00" };
    demoDays[0].endAnchor = { title: "Hotel Monasterio", lat: -13.5155, lng: -71.9774, time: "18:00", service: { id: "h1", name: "Hotel Monasterio", category: "STAY", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80" } as any };
    demoDays[0].events = [
      { id: uuidv4(), type: 'NOTE', startTime: '08:30', title: 'Arrival Briefing', content: 'Welcome to Cusco! Please take it easy today due to the altitude (3,400m). Drink plenty of coca tea.' },
      { id: uuidv4(), type: 'TRANSPORT', method: 'CAR', startTime: '09:00', title: 'VIP Airport Pickup', from: 'Airport', to: 'Hotel Monasterio', fromLat: -13.5358, fromLng: -71.9388, toLat: -13.5155, toLng: -71.9774, details: 'SUV with English-speaking driver', priceUsd: 45 },
      { id: uuidv4(), type: 'STAY', startTime: '10:00', title: 'Check-in: Hotel Monasterio', lat: -13.5155, lng: -71.9774, checkIn: '10:00', priceUsd: 350, service: { id: "h1", name: "Hotel Monasterio", category: "STAY", description: "A 16th-century monastery transformed into a luxury hotel.", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80" } as any },
      { id: uuidv4(), type: 'MEAL', startTime: '13:00', title: 'Lunch at Chicha', lat: -13.5173, lng: -71.9806, notes: 'Reservation under Jenkins. Try the Alpaca.', priceUsd: 65, service: { id: "m1", name: "Chicha por Gaston Acurio", category: "DINING", description: "Renowned Peruvian chef's take on regional Cusco cuisine.", imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80" } as any },
      { id: uuidv4(), type: 'EXPERIENCE', startTime: '15:00', title: 'Cusco City Tour & Sacsayhuaman', lat: -13.5097, lng: -71.9817, durationMins: 180, priceUsd: 120, service: { id: "e1", name: "Sacsayhuaman Guided Tour", category: "CULTURE", description: "Explore the colossal stone walls of the Incan fortress above Cusco.", imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=500&q=80" } as any },
      { id: uuidv4(), type: 'NOTE', startTime: '18:00', title: 'Evening Free Time', content: 'Evening free to explore Plaza de Armas. Enjoy the vibrant atmosphere.' }
    ]

    // Day 2: Sacred Valley Descent
    demoDays[1].title = "Sacred Valley Descent"
    demoDays[1].sleepTown = "Urubamba"
    demoDays[1].startAnchor = { title: "Hotel Monasterio", lat: -13.5155, lng: -71.9774, time: "08:00" };
    demoDays[1].endAnchor = { title: "Tambo del Inka", lat: -13.2983, lng: -72.1158, time: "17:30", service: { id: "h2", name: "Tambo del Inka", category: "STAY", imageUrl: "https://images.unsplash.com/photo-1542314831-c6a420325142?w=500&q=80" } as any };
    demoDays[1].events = [
      { id: uuidv4(), type: 'TRANSPORT', method: 'CAR', startTime: '08:00', title: 'Private Transfer - Sacred Valley', from: 'Cusco', to: 'Pisac', fromLat: -13.5155, fromLng: -71.9774, toLat: -13.4225, toLng: -71.8492, pickupTime: '08:00', details: 'Full day transport included' },
      { id: uuidv4(), type: 'EXPERIENCE', startTime: '09:30', title: 'Pisac Ruins & Market', lat: -13.4225, lng: -71.8492, durationMins: 150, priceUsd: 40, service: { id: "e2", name: "Pisac Archaeological Park", category: "CULTURE", description: "Incredible terraces and Incan ruins overlooking the Sacred Valley.", imageUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=500&q=80" } as any },
      { id: uuidv4(), type: 'MEAL', startTime: '13:00', title: 'Lunch at Hacienda Huayoccari', lat: -13.3444, lng: -72.0528, notes: 'Included in package. Beautiful hacienda with private collection.', priceUsd: 45, service: { id: "m2", name: "Hacienda Huayoccari", category: "DINING", description: "Traditional Peruvian lunch amidst a vast collection of colonial art.", imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80" } as any },
      { id: uuidv4(), type: 'TRANSPORT', method: 'CAR', startTime: '14:30', title: 'Drive to Ollantaytambo', from: 'Huayoccari', to: 'Ollantaytambo', fromLat: -13.3444, fromLng: -72.0528, toLat: -13.2583, toLng: -72.2633 },
      { id: uuidv4(), type: 'EXPERIENCE', startTime: '15:00', title: 'Ollantaytambo Fortress', lat: -13.2583, lng: -72.2633, durationMins: 90, priceUsd: 30, service: { id: "e3", name: "Ollantaytambo Fortress", category: "CULTURE", description: "Massive Incan fortress that served as the last stronghold against the Spanish.", imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=500&q=80" } as any },
      { id: uuidv4(), type: 'STAY', startTime: '17:00', title: 'Check-in: Tambo del Inka', lat: -13.2983, lng: -72.1158, checkIn: '17:00', priceUsd: 450, service: { id: "h2", name: "Tambo del Inka", category: "STAY", description: "Luxury resort nestled in the heart of the Sacred Valley with private train station.", imageUrl: "https://images.unsplash.com/photo-1542314831-c6a420325142?w=500&q=80" } as any }
    ]

    // Day 3: The Citadel (Machu Picchu)
    demoDays[2].title = "The Citadel: Machu Picchu"
    demoDays[2].sleepTown = "Cusco"
    demoDays[2].startAnchor = { title: "Ollantaytambo Station", lat: -13.2606, lng: -72.2656, time: "07:00" };
    demoDays[2].endAnchor = { title: "Hotel Monasterio", lat: -13.5155, lng: -71.9774, time: "20:00", service: { id: "h1", name: "Hotel Monasterio", category: "STAY", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80" } as any };
    demoDays[2].events = [
      { id: uuidv4(), type: 'TRANSPORT', method: 'TRAIN', startTime: '07:00', title: 'Vistadome Train to Aguas Calientes', from: 'Ollantaytambo Station', to: 'Aguas Calientes', fromLat: -13.2606, fromLng: -72.2656, toLat: -13.1547, toLng: -72.5256, details: 'Vistadome Observatory Car C, Seats 14-17', priceUsd: 115 },
      { id: uuidv4(), type: 'TRANSPORT', method: 'PUBLIC', startTime: '08:30', title: 'Consettur Bus to Entrance', from: 'Aguas Calientes', to: 'Machu Picchu Entrance', details: 'Tickets provided by guide', priceUsd: 24 },
      { id: uuidv4(), type: 'EXPERIENCE', startTime: '09:00', title: 'Machu Picchu Guided Tour', lat: -13.1631, lng: -72.5450, durationMins: 180, priceUsd: 160, service: { id: "e4", name: "Machu Picchu Citadel", category: "WONDER", description: "One of the New Seven Wonders of the World. A mystical ancient city in the clouds.", imageUrl: "https://images.unsplash.com/photo-1526392060635-9d6019884377?w=500&q=80" } as any },
      { id: uuidv4(), type: 'MEAL', startTime: '13:30', title: 'Lunch at Sanctuary Lodge', lat: -13.1547, lng: -72.5256, notes: 'Buffet lunch included. Relax after the tour.', priceUsd: 55, service: { id: "m3", name: "Tinkuy Buffet Restaurant", category: "DINING", description: "The only dining option adjacent to the ancient citadel of Machu Picchu.", imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80" } as any },
      { id: uuidv4(), type: 'TRANSPORT', method: 'TRAIN', startTime: '15:20', title: 'Return Train to Poroy', from: 'Aguas Calientes', to: 'Poroy Station', details: 'Vistadome return', priceUsd: 115 },
      { id: uuidv4(), type: 'TRANSPORT', method: 'CAR', startTime: '19:00', title: 'Transfer to Cusco Hotel', from: 'Poroy', to: 'Hotel Monasterio' },
      { id: uuidv4(), type: 'NOTE', startTime: '20:00', title: 'Farewell', content: 'End of services. Safe travels!' }
    ]

    setCurrentTrip({
      title: "The Jenkins Family Expedition",
      startDate: new Date(sd),
      endDate: new Date(ed),
      paxCount: 4,
      days: demoDays,
      status: 'DRAFT',
      clientNotes: "Welcome to the Sacred Valley! We've prepared a comprehensive itinerary blending culture, history, and comfort.",
      internalNotes: "VIP Clients. Ensure champagne in room on arrival at Monasterio."
    })
    
    setActiveDayNumber(2)
    setViewState('workspace')
  }

  return (
    <div className="w-full min-h-[calc(100vh-56px)] flex items-center justify-center p-6 bg-[#FAF9F6] relative overflow-hidden">
      
      {/* Decorative blurred shapes in background */}
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-rose-100/60 rounded-full blur-[120px] pointer-events-none mix-blend-multiply -translate-x-1/2 -translate-y-1/4" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-amber-50/60 rounded-full blur-[120px] pointer-events-none mix-blend-multiply translate-x-1/4 translate-y-1/4" />

      {/* Main Elevated Card */}
      <div className="w-full max-w-4xl bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden animate-in fade-in zoom-in-95 duration-500 z-10">
        <div className="p-12 md:p-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-serif text-slate-900 mb-4 tracking-tight">Design a Journey</h1>
            <p className="text-xl text-slate-500 font-light">Set the core parameters before entering the workspace.</p>
          </div>

          <div className="space-y-10 max-w-3xl mx-auto">
            
            {/* Trip Title */}
            <div className="group relative bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-rose-200 transition-colors focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors group-focus-within:text-rose-600">
                <MapPin className="w-4 h-4" /> Itinerary Title
              </label>
              <input 
                type="text" 
                placeholder="e.g. The Jenkins Family Adventure"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-serif text-slate-900 outline-none transition-colors placeholder:text-slate-300"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Dates */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-rose-200 transition-colors focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10">
                <div className="relative border-r border-slate-200 pr-4">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors group-focus-within:text-rose-600">
                    <Calendar className="w-4 h-4" /> Start
                  </label>
                  <input
                    type="date"
                    min={minStartDate}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-transparent text-xl font-medium text-slate-900 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
                <div className="relative pl-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors group-focus-within:text-rose-600">
                    <Calendar className="w-4 h-4" /> End
                  </label>
                  <input
                    type="date"
                    min={minEndDate}
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-transparent text-xl font-medium text-slate-900 outline-none cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>

              {/* Travelers (Pax) */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-rose-200 transition-colors focus-within:border-rose-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-rose-500/10 flex flex-col justify-between">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2 transition-colors group-focus-within:text-rose-600">
                    <Users className="w-4 h-4" /> Travelers
                  </label>
                  <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-1">
                     <button 
                       onClick={() => setPaxCount(Math.max(1, paxCount - 1))}
                       className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-30"
                       disabled={paxCount <= 1}
                     >
                       <Minus className="w-5 h-5" />
                     </button>
                     <span className="text-xl font-semibold text-slate-900 w-8 text-center">{paxCount}</span>
                     <button 
                       onClick={() => setPaxCount(paxCount + 1)}
                       className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                     >
                       <Plus className="w-5 h-5" />
                     </button>
                  </div>
              </div>

            </div>

            {/* Actions */}
            <div className="pt-8 flex flex-col sm:flex-row gap-4 border-t border-slate-100">
              <button
                onClick={handleStartBuilding}
                disabled={!isFormValid}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-5 rounded-2xl font-bold text-lg disabled:opacity-50 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:shadow-slate-900/20 active:scale-[0.98]"
              >
                Start Building <ChevronRight className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleMagicAutoFill}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 text-slate-600 border border-slate-200 px-8 py-5 rounded-2xl font-bold text-lg hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-[0.98]"
              >
                <Sparkles className="w-5 h-5 text-amber-500" /> Magic Auto-Fill
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

