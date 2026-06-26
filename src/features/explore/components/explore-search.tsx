"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useMemo, useEffect, useRef } from "react"
import { Search, X, Filter, Navigation, MapPin, ChevronDown } from "lucide-react"
import posthog from 'posthog-js'
import { motion, AnimatePresence } from "framer-motion"
import { CATEGORIES, LOCATIONS, SORT_OPTIONS, RADIUS_MARKS, getCategoryColor } from "../constants"
import { cn } from "@/lib/utils"

interface ExploreSearchProps {
  initialQuery: string
  isDrawerOpen: boolean // Re-using this prop name for internal consistency in ExploreView
  setIsDrawerOpen: (v: boolean) => void
  categoryCounts?: Record<string, number>
  isProBuilder?: boolean
}

export function ExploreSearch({ 
  initialQuery,
  isDrawerOpen: showFilters,
  setIsDrawerOpen: setShowFilters,
  categoryCounts = {},
  isProBuilder = false
}: ExploreSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const currentLoc = searchParams.get("loc") || ""
  const currentCatStr = searchParams.get("cat") || ""
  const isRadEnabled = searchParams.has("rad")
  const currentRad = searchParams.has("rad") ? parseFloat(searchParams.get("rad")!) : 5
  const currentLat = searchParams.get("lat") || ""
  const currentLng = searchParams.get("lng") || ""
  const currentSort = searchParams.get("sort") || "recommended"
  
  const [localRad, setLocalRad] = useState(currentRad)
  const [showCategories, setShowCategories] = useState(false)
  const [showLocations, setShowLocations] = useState(false)

  const currentCats = useMemo(() => {
    return currentCatStr ? currentCatStr.split(',').filter(Boolean) : []
  }, [currentCatStr])

  const totalCount = useMemo(() => {
    return Object.values(categoryCounts).reduce((acc, curr) => acc + curr, 0)
  }, [categoryCounts])

  useEffect(() => {
    setValue(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    setLocalRad(currentRad)
  }, [currentRad])

  const navigateFilters = (loc?: string, cats?: string[], q?: string, rad?: number, lat?: string, lng?: string, sort?: string) => {
    const params = new URLSearchParams()
    if (q) params.set("q", q)
    if (loc) params.set("loc", loc)
    if (cats && cats.length > 0) params.set("cat", cats.join(','))
    if (rad !== undefined) params.set("rad", rad.toString())
    if (lat && lng) {
      params.set("lat", lat)
      params.set("lng", lng)
    }
    if (sort && sort !== "recommended") params.set("sort", sort)
    if (showFilters) params.set("filter", "open")
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const handleSearchChange = (newVal: string) => {
    setValue(newVal)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (newVal.trim()) {
        posthog.capture('search_performed', {
          query: newVal.trim(),
          location: currentLoc,
          categories: currentCats
        });
      }
      navigateFilters(currentLoc, currentCats, newVal.trim(), isRadEnabled ? currentRad : undefined, currentLat, currentLng, currentSort)
    }, 500)
  }

  const handleCategoryToggle = (catValue: string) => {
    let nextCats = [...currentCats]
    if (nextCats.includes(catValue)) {
      nextCats = nextCats.filter(c => c !== catValue)
    } else {
      nextCats.push(catValue)
    }
    navigateFilters(currentLoc, nextCats, value.trim(), isRadEnabled ? currentRad : undefined, currentLat, currentLng, currentSort)
  }

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value)
    const newRad = RADIUS_MARKS[index]
    setLocalRad(newRad)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    
    debounceRef.current = setTimeout(() => {
      navigateFilters(currentLoc, currentCats, value.trim(), newRad, currentLat, currentLng, currentSort)
    }, 800)
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.")
      return
    }
    
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false)
        const lat = position.coords.latitude.toString()
        const lng = position.coords.longitude.toString()
        navigateFilters(currentLoc, currentCats, value.trim(), currentRad, lat, lng, currentSort)
      },
      (error) => {
        setIsGettingLocation(false)
        console.error("Error getting location", error)
        alert("Unable to get your location. Please check your browser permissions.")
      }
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Toggle Row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors z-10" />
          <input 
            type="text" 
            placeholder="Search Sacred Valley..." 
            value={value}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-100/80 border border-slate-200 text-slate-900 text-sm font-semibold pl-10 pr-10 py-3.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all placeholder:text-slate-500 placeholder:font-medium shadow-sm"
          />
          {value && (
            <button 
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full text-slate-600 transition-colors z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "shrink-0 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider px-4 py-3.5 rounded-2xl border transition-all",
            showFilters 
              ? "bg-slate-900 text-white border-slate-900 shadow-md" 
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
          )}
        >
          {showFilters ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
          <span className="hidden sm:inline">Filters</span>
        </button>
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-y-auto max-h-[50vh] pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          >
            <div className="flex flex-col gap-5 pt-2 pb-4 font-sans">
              {/* Header with Clear All */}
              {(currentLoc || currentCats.length > 0 || currentSort !== "recommended") && (
                <div className="flex items-center justify-end border-b border-slate-100 pb-2">
                  <button 
                    onClick={() => navigateFilters("", [], value.trim(), undefined, undefined, undefined, "recommended")}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-bold uppercase tracking-wider transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              )}

              {/* Location - Accordioned */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowLocations(!showLocations)}
                  className="flex items-center justify-between w-full p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] transition-colors">Town / Sector</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-300", showLocations ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                  {showLocations && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-wrap gap-2 pb-1">
                        <button
                          onClick={() => navigateFilters("", currentCats, value.trim(), isRadEnabled ? currentRad : undefined, undefined, undefined, currentSort)}
                          className={cn(
                            "px-3.5 py-2 rounded-full border transition-all",
                            currentLoc === "" 
                              ? "bg-slate-900 text-white border-slate-900 font-extrabold uppercase tracking-wider shadow-sm text-[11px]" 
                              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 text-[12px] font-bold"
                          )}
                        >
                          Anywhere
                        </button>
                        {LOCATIONS.map((loc: any) => (
                          <button
                            key={loc.value}
                            onClick={() => navigateFilters(loc.value, currentCats, value.trim(), isRadEnabled ? currentRad : undefined, undefined, undefined, currentSort)}
                            className={cn(
                              "px-3.5 py-2 rounded-full border transition-all",
                              currentLoc === loc.value 
                                ? "bg-slate-900 text-white border-slate-900 font-extrabold uppercase tracking-wider shadow-sm text-[11px]" 
                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 text-[12px] font-bold"
                            )}
                          >
                            {loc.label}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Categories - Accordioned with brand colors */}
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center justify-between w-full p-2 -ml-2 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] transition-colors">Categories</span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-300", showCategories ? "rotate-180" : "")} />
                </button>
                <AnimatePresence>
                  {showCategories && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 pb-1">
                        <button
                          onClick={() => navigateFilters(currentLoc, [], value.trim(), isRadEnabled ? currentRad : undefined, currentLat, currentLng, currentSort)}
                          className={cn(
                            "relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all",
                            currentCats.length === 0 
                              ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          <MapPin className={cn("w-3.5 h-3.5", currentCats.length === 0 ? "text-rose-400" : "text-slate-400")} />
                          <span className={cn("whitespace-nowrap", currentCats.length === 0 ? "text-[10px] font-black uppercase tracking-[0.15em] text-white/90" : "text-[9px] font-semibold tracking-tight")}>All</span>
                        </button>
                        {CATEGORIES.filter(cat => 
                          (isProBuilder || cat.value !== "Template") && 
                          (currentCats.includes(cat.value) || (categoryCounts[cat.value.toUpperCase()] || 0) > 0)
                        ).map((cat) => {
                          const Icon = cat.icon
                          const isActive = currentCats.includes(cat.value)
                          const count = categoryCounts[cat.value.toUpperCase()] || 0
                          const catColor = getCategoryColor(cat.value)
                          return (
                            <button
                              key={cat.value}
                              onClick={() => handleCategoryToggle(cat.value)}
                              className={cn(
                                "relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all",
                                isActive
                                  ? "border-slate-900 bg-slate-900 text-white shadow-md" 
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              <Icon 
                                className="w-3.5 h-3.5" 
                                style={{ color: isActive ? '#fff' : catColor }} 
                              />
                              <span className={cn("whitespace-nowrap", isActive ? "text-[10px] font-black uppercase tracking-[0.15em] text-white/90" : "text-[9px] font-semibold tracking-tight")}>{cat.label}</span>
                              {count > 0 && !isActive && (
                                <span className="absolute top-1.5 right-1.5 text-[9px] font-black text-slate-300">
                                  {count}
                                </span>
                              )}
                              {count > 0 && isActive && (
                                <span className="absolute top-1.5 right-1.5 text-[9px] font-black text-white/50">
                                  {count}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Radius - Accordioned slider */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em]">Radius Search</span>
                    <button
                      onClick={() => navigateFilters(currentLoc, currentCats, value.trim(), isRadEnabled ? undefined : localRad, currentLat, currentLng, currentSort)}
                      className={cn(
                        "w-8 h-4 rounded-full transition-colors relative",
                        isRadEnabled ? 'bg-rose-500' : 'bg-slate-200'
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform",
                        isRadEnabled ? 'translate-x-4' : 'translate-x-0'
                      )} />
                    </button>
                  </div>
                  {isRadEnabled && (
                    <button 
                      onClick={handleUseMyLocation}
                      disabled={isGettingLocation}
                      className="text-[10px] text-rose-500 hover:text-rose-600 font-black uppercase tracking-widest transition-colors disabled:opacity-30 flex items-center gap-1"
                    >
                      <Navigation className="w-2.5 h-2.5" />
                      {isGettingLocation ? "Locating..." : (currentLat ? "Using GPS" : "My Location")}
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {isRadEnabled && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 bg-slate-50 px-3 py-2 rounded-xl border border-transparent transition-all">
                        <input 
                          type="range" 
                          min="0" 
                          max={RADIUS_MARKS.length - 1} 
                          step="1"
                          value={RADIUS_MARKS.indexOf(localRad) !== -1 ? RADIUS_MARKS.indexOf(localRad) : RADIUS_MARKS.indexOf(5)}
                          onChange={handleRadiusChange}
                          className="flex-1 accent-rose-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[11px] font-black text-slate-900 w-8 text-right">{localRad}km</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Results CTA */}
              <div className="mt-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  View Results
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

