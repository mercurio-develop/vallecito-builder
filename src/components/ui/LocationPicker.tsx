"use client"
import { useState, useRef, useEffect } from "react"
import { MapPin, Navigation, Zap } from "lucide-react"

export const MOCK_LOCATIONS = [
  { name: "Hotel Monasterio, Cusco", lat: -13.5152, lng: -71.9774 },
  { name: "Tambo del Inka, Urubamba", lat: -13.3056, lng: -72.1158 },
  { name: "Palacio del Inka, Cusco", lat: -13.5197, lng: -71.9754 },
  { name: "MIL Centro, Moray", lat: -13.3297, lng: -72.1958 },
  { name: "Ollantaytambo Train Station", lat: -13.2625, lng: -72.2662 },
  { name: "Alejandro Velasco Astete Airport, Cusco", lat: -13.5358, lng: -71.9389 },
  { name: "Pisac Market", lat: -13.4225, lng: -71.8517 },
  { name: "Chinchero Main Square", lat: -13.3917, lng: -72.0494 },
  { name: "Maras Salt Mines", lat: -13.3000, lng: -72.1550 },
  { name: "Urubamba Main Square", lat: -13.3039, lng: -72.1164 },
  { name: "Cusco Main Square (Plaza de Armas)", lat: -13.5171, lng: -71.9785 },
]

export const QUICK_HUBS = [
  { name: "Cusco", lat: -13.5171, lng: -71.9785 },
  { name: "Urubamba", lat: -13.3039, lng: -72.1164 },
  { name: "Pisac", lat: -13.4225, lng: -71.8517 },
  { name: "Ollantaytambo", lat: -13.2625, lng: -72.2662 },
]

interface ExtraLocation {
  name: string;
  lat: number;
  lng: number;
  service?: any;
}

interface LocationPickerProps {
  value: string;
  onChange: (val: string, lat?: number, lng?: number, service?: any) => void;
  placeholder?: string;
  className?: string;
  hideQuickActions?: boolean;
  extraLocations?: ExtraLocation[];
}

export function LocationPicker({ value, onChange, placeholder, className, hideQuickActions, extraLocations = [] }: LocationPickerProps) {
  const [query, setQuery] = useState(value || "")
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value || "")
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleUseCurrentLocation = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange("Current Location", position.coords.latitude, position.coords.longitude)
          setQuery("Current Location")
          setIsOpen(false)
        },
        (error) => {
          console.error("Error getting location:", error instanceof GeolocationPositionError ? error.message : error)
          alert("Could not access your location. Please check your browser permissions.")
        }
      )
    } else {
      alert("Geolocation is not supported by your browser.")
    }
  }

  const q = query.toLowerCase()
  const filteredMock = MOCK_LOCATIONS.filter(l => l.name.toLowerCase().includes(q))
  const filteredExtra = extraLocations.filter(l =>
    l.name.toLowerCase().includes(q) && !filteredMock.some(m => m.name === l.name)
  )
  const hasResults = query !== "" && (filteredMock.length > 0 || filteredExtra.length > 0)

  return (
    <div ref={wrapperRef} className="relative w-full flex flex-col gap-2">
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onBlur={() => {
            setTimeout(() => {
              if (query !== value) {
                onChange(query)
              }
            }, 150)
          }}
          onFocus={() => setIsOpen(true)}
          className={className}
        />
        {isOpen && hasResults && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
            {filteredMock.map(loc => (
              <button
                key={loc.name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setQuery(loc.name)
                  onChange(loc.name, loc.lat, loc.lng)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 transition-colors"
              >
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate">{loc.name}</span>
              </button>
            ))}
            {filteredExtra.length > 0 && filteredMock.length > 0 && (
              <div className="px-4 py-1 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-50 mt-1 pt-2">Library</div>
            )}
            {filteredExtra.map(loc => (
              <button
                key={loc.name}
                onMouseDown={(e) => {
                  e.preventDefault()
                  setQuery(loc.name)
                  onChange(loc.name, loc.lat, loc.lng, loc.service)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700 transition-colors"
              >
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{loc.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!hideQuickActions && (
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              handleUseCurrentLocation(e)
            }}
            className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 px-2 py-1 rounded-md transition-colors"
          >
            <Navigation className="w-3 h-3" /> Current Location
          </button>

          {QUICK_HUBS.map(hub => (
            <button
              key={hub.name}
              onMouseDown={(e) => {
                e.preventDefault()
                setQuery(hub.name)
                onChange(hub.name, hub.lat, hub.lng)
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-1 rounded-md transition-colors"
            >
              {hub.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
