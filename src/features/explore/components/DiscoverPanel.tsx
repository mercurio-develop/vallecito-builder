"use client"

import { useState, useEffect, useRef } from "react"
import { Search, LayoutGrid, List, ChevronDown, Check, Loader2, X, MapPin, Bed, ExternalLink } from "lucide-react"
import { useInView } from "react-intersection-observer"
import { BusinessCard } from "@/features/explore/components/business-card"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { Business } from "@prisma/client"
import { cn } from "@/lib/utils"
import { SORT_OPTIONS, LOCATIONS, getCategoryData, getKlookDestinationHotelLink } from "@/features/explore/constants"

interface DiscoverPanelProps {
  businesses: Business[]
  selectedId?: string | null
  setSelectedId: (id: string | null) => void
  onReset: () => void
  hasMore?: boolean
  isLoadingMore?: boolean
  onLoadMore?: () => void
}

export function DiscoverPanel({ businesses, selectedId, setSelectedId, onReset, hasMore, isLoadingMore, onLoadMore }: DiscoverPanelProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const currentSort = searchParams.get("sort") || "recommended"
  const q = searchParams.get("q") || ""
  const loc = searchParams.get("loc") || ""
  const cats = (searchParams.get("cat") || "").split(",").filter(Boolean)
  const rad = searchParams.get("rad") || ""

  const [isSortOpen, setIsSortOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  
  const { ref, inView } = useInView({ threshold: 0 })

  const removeFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === "cat" && value) {
      const newCats = cats.filter(c => c !== value)
      if (newCats.length > 0) {
        params.set("cat", newCats.join(","))
      } else {
        params.delete("cat")
      }
    } else {
      params.delete(key)
      if (key === "loc") {
        params.delete("rad")
        params.delete("lat")
        params.delete("lng")
      }
    }
    router.push(`?${params.toString()}`, { scroll: false })
  }

  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && onLoadMore) {
      onLoadMore()
    }
  }, [inView, hasMore, isLoadingMore, onLoadMore])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "recommended") {
      params.delete("sort")
    } else {
      params.set("sort", value)
    }
    router.push(`?${params.toString()}`, { scroll: false })
    setIsSortOpen(false)
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6 bg-gray-50/50 relative">
      {businesses.length > 0 && (
        <div className="flex flex-col gap-3 w-full z-10 mb-4 animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-3 md:gap-0">
            <div className="text-sm font-bold text-slate-800 order-2 md:order-1">{businesses.length} Places</div>
            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-2 shrink-0 order-1 md:order-2">
              <div ref={sortRef} className="relative z-20">
                <button 
                  onClick={() => setIsSortOpen(!isSortOpen)}
                  className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg shadow-sm px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest"
                >
                  <span>Sort: {SORT_OPTIONS.find((o) => o.value === currentSort)?.label || "Recommended"}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isSortOpen && "rotate-180")} />
                </button>
                
                {isSortOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-100 shadow-xl rounded-xl py-1 overflow-hidden">
                    {SORT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleSortChange(option.value)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 text-sm font-medium transition-colors flex items-center justify-between",
                          currentSort === option.value ? "text-rose-600 bg-rose-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                         )}
                      >
                        {option.label}
                        {currentSort === option.value && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm p-1">
                <button onClick={() => setViewMode("list")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")}>
                  <List className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode("grid")} className={cn("p-1.5 rounded-md transition-colors", viewMode === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600")}>
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {(q || loc || cats.length > 0 || rad) && (
            <div className="flex flex-wrap items-center gap-2 w-full animate-in fade-in duration-300">
              {q && (
                <button onClick={() => removeFilter("q")} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest transition-colors bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm">
                  <span>&quot;{q}&quot;</span>
                  <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
                </button>
              )}
              {loc && (
                <button onClick={() => removeFilter("loc")} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest transition-colors bg-indigo-50 text-indigo-700 border-indigo-200/50 hover:bg-indigo-100 shadow-sm">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{LOCATIONS.find(l => l.value === loc)?.label || loc}</span>
                  <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
                </button>
              )}
              {cats.map(c => {
                const catData = getCategoryData(c);
                const CatIcon = catData.icon;
                return (
                  <button 
                    key={c} 
                    onClick={() => removeFilter("cat", c)} 
                    className={cn(
                      "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm",
                      catData.theme,
                      "hover:bg-opacity-80"
                    )}
                  >
                    <CatIcon className="w-3.5 h-3.5" />
                    <span>{catData.label}</span>
                    <X className="w-3.5 h-3.5 ml-0.5 opacity-60 hover:opacity-100" />
                  </button>
                );
              })}
              {rad && (
                <button onClick={() => removeFilter("rad")} className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest transition-colors bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm">
                  <span>{rad}km Radius</span>
                  <X className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {businesses.length === 0 ? (
        isLoadingMore ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in duration-500">
            <Loader2 className="w-8 h-8 text-rose-600 animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium tracking-wide">Loading places...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-rose-100 rounded-full blur-2xl opacity-50 scale-150 animate-pulse" />
              <div className="relative bg-white p-6 rounded-full shadow-sm border border-slate-50">
                <Search className="w-10 h-10 text-slate-300" strokeWidth={1.5} />
              </div>
            </div>
            <h3 className="text-2xl font-serif tracking-tight text-slate-900 mb-3">No places in this area</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
              Try panning or zooming out the map to find more places, or clear your filters to see the whole Valley.
            </p>
            <button 
              onClick={() => {
                router.push('?', { scroll: false })
                onReset()
              }}
              className="bg-slate-900 text-white px-8 py-3 rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all hover:scale-105 active:scale-95"
            >
              Reset all filters
            </button>
          </div>
        )
      ) : (
        <>
          {loc && getKlookDestinationHotelLink(loc) && (
            <div className="mb-6 bg-gradient-to-r from-rose-50/50 to-amber-50/50 border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="bg-rose-50 p-3 rounded-xl text-rose-600 shrink-0 border border-rose-100/50">
                  <Bed className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-[15px] leading-tight">
                    Find Hotels in {LOCATIONS.find(l => l.value === loc)?.label || loc}
                  </h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-lg leading-relaxed font-medium">
                    Browse hand-picked boutique stays, guest houses, and premium hotels with exclusive rates on Klook.
                  </p>
                </div>
              </div>
              <a
                href={getKlookDestinationHotelLink(loc) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all shrink-0 w-full sm:w-auto"
              >
                <span>View Stays</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          )}

          <div className={cn("pb-20", viewMode === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" : "flex flex-col gap-4")}>
            {businesses.map(e => (
              <BusinessCard 
                key={e.id} 
                business={e} 
                isHighlighted={selectedId === e.id} 
                onSelect={() => setSelectedId(e.id)} 
                orientation={viewMode === "list" ? "horizontal" : "vertical"}
              />
            ))}
            {hasMore && (
              <div ref={ref} className="w-full py-8 flex justify-center items-center col-span-full">
                {isLoadingMore && <Loader2 className="w-6 h-6 text-rose-600 animate-spin" />}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

