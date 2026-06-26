"use client"

import { useState } from "react"
import { useTrip } from "@/lib/store/trip-context"
import { useRouter } from "next/navigation"
import { User, FileText, Lock, ChevronLeft, Sparkles, Loader2, Info, ChevronDown } from "lucide-react"
import { generateProTrip } from "../actions/generate-trip"
import type { FullTraveler } from "../types"

export function CheckoutDetailsForm() {
  const { currentTrip, setCurrentTrip, setViewState } = useTrip()
  const router = useRouter()
  
  const trip = currentTrip || { title: "", days: [], clientNotes: "", internalNotes: "", paxCount: 1 } as any;

  const [travelers, setTravelers] = useState<FullTraveler[]>(
    Array.from({ length: trip.paxCount || 1 }).map((_, i) => ({
      isLeadGuest: i === 0,
      firstName: "",
      lastName: "",
      email: "", // Keeps UI compatibility though omitted in Prisma currently
      passportNumber: "",
      nationality: "",
      dateOfBirth: "",
      whatsappNumber: "",
      dietaryRestrictions: "",
      medicalNotes: ""
    }))
  )
  
  const [clientNotes, setClientNotes] = useState(trip.clientNotes || "")
  const [internalNotes, setInternalNotes] = useState(trip.internalNotes || "")
  const [isGenerating, setIsGenerating] = useState(false)

  // Basic validation: at least the primary contact needs a first name
  const isValid = travelers.length > 0 && travelers[0].firstName.trim() !== ""

  const updateTraveler = (index: number, field: keyof FullTraveler, value: string) => {
    const newTravelers = [...travelers]
    newTravelers[index] = { ...newTravelers[index], [field]: value }
    setTravelers(newTravelers)
  }

  const handleMagicAutoFill = () => {
    const filled = travelers.map((t, i) => ({
      ...t,
      firstName: i === 0 ? "Robert" : `Guest ${i + 1}`,
      lastName: i === 0 ? "Jenkins" : "Jenkins",
      email: i === 0 ? "robert.jenkins@example.com" : "",
      whatsappNumber: i === 0 ? "+1 555 019 2834" : "",
      passportNumber: `A${Math.floor(10000000 + Math.random() * 90000000)}`,
      nationality: "United States",
      dateOfBirth: "1985-06-15"
    }))
    setTravelers(filled)

    if (!clientNotes) {
      setClientNotes("Welcome to the Sacred Valley! We have prepared a wonderful itinerary for you. Drink plenty of coca tea upon arrival.")
    }
    if (!internalNotes) {
      setInternalNotes("VIP Clients. Ensure champagne in room on arrival at the hotel.")
    }
  }

  const handleGenerate = async () => {
    if (!currentTrip) return;
    setIsGenerating(true)
    
    setCurrentTrip({
      ...currentTrip,
      travelers,
      clientNotes,
      internalNotes
    })

    try {
      const payload: any = {
        ...currentTrip,
        startDate: currentTrip.startDate.toISOString(),
        endDate: currentTrip.endDate.toISOString(),
        days: currentTrip.days.map((d: any) => ({
          ...d,
          date: d.date.toISOString()
        })),
        travelers,
        clientNotes,
        internalNotes
      }
      const result = await generateProTrip(payload)

      if (result.success) {
        setCurrentTrip(null)
        setViewState('wizard')
        router.push(`/trip/${result.shareToken}`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to generate trip. Please try again.")
      setIsGenerating(false)
    }
  }

  return (
    <div className="w-full flex bg-slate-50 min-h-[600px] h-[calc(100vh-56px)]">
      
      {/* Left Sidebar: Itinerary Preview */}
      <div className="w-1/3 bg-slate-900 text-white flex flex-col border-r border-slate-800 hidden md:flex h-full">
        <div className="p-8 shrink-0 pb-0">
          <h2 className="text-3xl font-serif font-bold mb-2 leading-tight">Finalizing</h2>
          <p className="text-slate-400 mb-8">{trip.title}</p>
          
          <div className="space-y-4 mb-8">
             <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
               <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">Total Days</p>
               <p className="font-medium text-white">{trip.days.length} Days</p>
             </div>
             
             <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
               <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 mb-1">Total Events</p>
               <p className="font-medium text-white">
                 {trip.days.reduce((acc: number, day: any) => acc + day.events.length, 0)} Timeline Blocks
               </p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8 scrollbar-theme">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 sticky top-0 bg-slate-900 py-2 z-10">Itinerary Preview</h3>
          <div className="space-y-4">
            {trip.days.map((day: any, idx: number) => (
              <details key={day.dayNumber} open={idx === 0} className="group space-y-3 bg-slate-800/30 rounded-xl p-4 border border-slate-800">
                <summary className="flex justify-between items-center pb-2 cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none">
                  <div className="flex items-baseline gap-3">
                    <h4 className="font-serif font-bold text-lg text-white">Day {day.dayNumber}</h4>
                    <span className="text-xs text-slate-400">
                      {day.date && !isNaN(new Date(day.date).getTime()) 
                        ? new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
                        : ''}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="space-y-3 pt-2 border-t border-slate-700/50">
                  {day.startAnchor && (
                    <div className="flex gap-3 text-sm text-slate-300">
                      <span className="font-mono text-xs mt-0.5 shrink-0 text-slate-500">{day.startAnchor.time || "09:00"}</span>
                      <span className="truncate">{day.startAnchor.title || "Start Location"}</span>
                    </div>
                  )}
                  {day.events.map((evt: any) => (
                    <div key={evt.id} className="flex gap-3 text-sm text-slate-300">
                      <span className="font-mono text-xs mt-0.5 shrink-0 text-slate-500">{evt.startTime}</span>
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                  {day.endAnchor && (
                    <div className="flex gap-3 text-sm text-slate-300">
                      <span className="font-mono text-xs mt-0.5 shrink-0 text-slate-500">{day.endAnchor.time || "18:00"}</span>
                      <span className="truncate">{day.endAnchor.title || "End Location"}</span>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Right Area: Form */}
      <div className="flex-1 flex flex-col bg-white relative h-full overflow-hidden">
        {isGenerating && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
            <Loader2 className="w-10 h-10 text-rose-600 animate-spin mb-4" />
            <h3 className="text-2xl font-serif text-slate-900 mb-2">Publishing Itinerary...</h3>
            <p className="text-slate-500 text-sm">Generating magic link for your client...</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 scrollbar-theme">
          <div className="max-w-2xl mx-auto space-y-10 pb-10">
          
          <div className="mb-10 flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-serif text-slate-900 mb-2">Passenger Details</h2>
              <p className="text-lg text-slate-500 font-light">Please provide the details for the {travelers.length} {travelers.length === 1 ? 'traveler' : 'travelers'} on this trip.</p>
            </div>
            <button 
              onClick={handleMagicAutoFill}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Auto-Fill
            </button>
          </div>

          <div className="space-y-6">
            {travelers.map((traveler, idx) => (
              <details key={idx} open={idx === 0} className="group bg-white border border-slate-200 rounded-3xl p-6 shadow-sm transition-all">
                <summary className="flex items-center gap-2 mb-0 pb-0 group-open:mb-6 group-open:pb-4 group-open:border-b group-open:border-slate-100 cursor-pointer list-none [&::-webkit-details-marker]:hidden outline-none">
                  <div className="bg-slate-100 text-slate-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-serif font-bold text-slate-900">
                    {idx === 0 ? "Lead Passenger (Primary Contact)" : `Passenger ${idx + 1}`}
                  </h3>
                  <div className="ml-auto flex items-center gap-3">
                    {!traveler.firstName && <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded">Required</span>}
                    <ChevronDown className="w-5 h-5 text-slate-400 transition-transform group-open:rotate-180" />
                  </div>
                </summary>

                <div className="space-y-6 pt-2">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">
                        First Name
                      </label>
                      <input 
                        type="text" 
                        value={traveler.firstName}
                        onChange={e => updateTraveler(idx, "firstName", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-lg font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="John"
                      />
                    </div>
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">
                        Last Name
                      </label>
                      <input 
                        type="text" 
                        value={traveler.lastName}
                        onChange={e => updateTraveler(idx, "lastName", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-lg font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Contact Fields (More relevant for Lead Guest) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">Email Address</label>
                      <input 
                        type="email" 
                        value={traveler.email}
                        onChange={e => updateTraveler(idx, "email", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">WhatsApp / Phone</label>
                      <input 
                        type="tel" 
                        value={traveler.whatsappNumber}
                        onChange={e => updateTraveler(idx, "whatsappNumber", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="+1 555 123 4567"
                      />
                    </div>
                  </div>

                  {/* Travel Docs */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">
                        Passport No.
                      </label>
                      <input 
                        type="text" 
                        value={traveler.passportNumber}
                        onChange={e => updateTraveler(idx, "passportNumber", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors uppercase"
                        placeholder="P1234567"
                      />
                    </div>
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">
                        Nationality
                      </label>
                      <input 
                        type="text" 
                        value={traveler.nationality}
                        onChange={e => updateTraveler(idx, "nationality", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="USA"
                      />
                    </div>
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">
                        Date of Birth
                      </label>
                      <input 
                        type="date" 
                        value={traveler.dateOfBirth}
                        onChange={e => updateTraveler(idx, "dateOfBirth", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Health Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">Dietary Restrictions</label>
                      <input 
                        type="text" 
                        value={traveler.dietaryRestrictions}
                        onChange={e => updateTraveler(idx, "dietaryRestrictions", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="e.g. Vegetarian, Gluten-free"
                      />
                    </div>
                    <div className="group/field relative">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1 transition-colors group-focus-within/field:text-rose-600">Medical Notes</label>
                      <input 
                        type="text" 
                        value={traveler.medicalNotes}
                        onChange={e => updateTraveler(idx, "medicalNotes", e.target.value)}
                        className="w-full py-2.5 bg-transparent border-b-2 border-slate-200 text-base font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors"
                        placeholder="e.g. Asthma, Altitude Sickness"
                      />
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>

          <div className="pt-10 space-y-10">
             <div className="group relative">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2 transition-colors group-focus-within:text-rose-600">
                  <FileText className="w-3.5 h-3.5 inline-block mr-1" /> Client-Visible Notes
                </label>
                <textarea 
                  placeholder="e.g. Welcome to Peru! Please ensure your passports are valid for 6 months."
                  value={clientNotes}
                  onChange={e => setClientNotes(e.target.value)}
                  className="w-full py-3 bg-transparent border-b-2 border-slate-200 text-lg font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors h-20 resize-none"
                />
             </div>

             <div className="group relative">
                <label className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-2 transition-colors group-focus-within:text-rose-700">
                  <Lock className="w-3.5 h-3.5 inline-block mr-1" /> Internal Business Notes (Hidden)
                </label>
                <textarea 
                  placeholder="e.g. VIP client. Promised complimentary bottle of wine at Tambo del Inka."
                  value={internalNotes}
                  onChange={e => setInternalNotes(e.target.value)}
                  className="w-full py-3 bg-transparent border-b-2 border-rose-200 text-lg font-medium text-slate-900 focus:border-rose-600 outline-none transition-colors h-20 resize-none placeholder:text-rose-200"
                />
             </div>
          </div>
        </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setViewState('workspace')}
            className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-colors uppercase tracking-widest text-xs"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <button
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
            className="flex items-center gap-2 bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-lg disabled:opacity-50 hover:bg-slate-800 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-5 h-5 text-rose-400" /> Publish & Generate Link
          </button>
        </div>

      </div>
    </div>
  )
}
