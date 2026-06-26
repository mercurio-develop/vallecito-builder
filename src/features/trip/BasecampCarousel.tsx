"use client"

import { useState } from "react"
import { Moon, Star, ShieldCheck, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

import { useItinerary } from "@/lib/store/itinerary-context"

interface Basecamp {
  id: string
  name: string
  image: string
  rating: number
  price: number
  tags: string[]
  lat: number
  lng: number
  locationSlug: string
}

export function BasecampCarousel({ locationTown }: { locationTown: string }) {
  const { setStartAnchorLocation, setExchangeTargetIndex, setPanelMode, setSelectedId, selectedId } = useItinerary()

  // Placeholder mock data for hotels
  const mockHotels: Basecamp[] = [
    {
      id: "hotel-1",
      name: "Tambo del Inka Resort",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
      rating: 4.9,
      price: 450,
      tags: ["Riverside", "Spa", "Private Train"],
      lat: -13.3135,
      lng: -72.1158,
      locationSlug: "urubamba"
    },
    {
      id: "hotel-2",
      name: "Explora Sacred Valley",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800",
      rating: 4.8,
      price: 600,
      tags: ["All-Inclusive", "Remote", "Luxury"],
      lat: -13.3100,
      lng: -72.0800,
      locationSlug: "urubamba"
    },
    {
      id: "hotel-3",
      name: "Inkaterra Hacienda Urubamba",
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
      rating: 4.9,
      price: 520,
      tags: ["Eco-Luxury", "Farm-to-Table", "Views"],
      lat: -13.3150,
      lng: -72.1200,
      locationSlug: "urubamba"
    }
  ]

  const filteredHotels = mockHotels.filter(h => h.locationSlug.toLowerCase() === locationTown.toLowerCase())

  if (filteredHotels.length === 0) {
    return (
      <div className="w-full text-center py-6">
        <Moon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-900 mb-1">No verified basecamps in {locationTown}</h4>
        <p className="text-xs text-slate-500 mb-4">We are still onboarding partners in this area.</p>
        <button 
          onClick={() => {
            setExchangeTargetIndex(-2)
            setPanelMode("categories")
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
        >
          Change Destination
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Moon className="w-4 h-4 text-rose-500" />
          Verified Basecamps in {locationTown}
        </h4>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Nearby options</span>
      </div>
      
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide snap-x -mx-1 px-1">
        {filteredHotels.map((hotel) => (
          <div 
            key={hotel.id}
            className="flex-none w-[260px] snap-start group cursor-pointer"
            onClick={() => setSelectedId(hotel.id)}
          >
            <div className={cn(
              "bg-white border rounded-2xl overflow-hidden transition-all duration-300",
              selectedId === hotel.id ? "border-rose-500 shadow-xl ring-1 ring-rose-500/20" : "border-gray-200 hover:border-rose-400 hover:shadow-lg"
            )}>
              {/* Image Placeholder */}
              <div className="h-32 bg-slate-100 relative overflow-hidden">
                <img 
                  src={hotel.image} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=600&auto=format&fit=crop";
                    e.currentTarget.onerror = null;
                  }}
                />
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" /> Verified
                </div>
              </div>
              
              <div className="p-4">
                <h5 className="text-slate-900 font-serif font-bold text-sm mb-1 line-clamp-1">{hotel.name}</h5>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                    <Star className="w-3 h-3 fill-current" /> {hotel.rating}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    from <span className="text-slate-900 font-bold">${hotel.price}</span>/night
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {hotel.tags.map(tag => (
                    <span key={tag} className="text-[8px] bg-slate-50 text-slate-500 border border-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button 
                  onClick={() => setStartAnchorLocation(hotel.lat, hotel.lng)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                >
                  🛎️ Select Basecamp
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
