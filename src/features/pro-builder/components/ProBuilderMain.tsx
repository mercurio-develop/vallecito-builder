"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTrip } from "@/lib/store/trip-context"
import { usePreferences } from "@/lib/store/preferences-context"
import { BuilderWizard } from "./BuilderWizard"
import { BuilderWorkspace } from "./BuilderWorkspace"
import { CheckoutDetailsForm } from "./CheckoutDetailsForm"
import { saveTripAsTemplate } from "@/features/pro-builder/actions/template-actions"
import { DiscoverPanel } from "@/features/explore/components/DiscoverPanel"
import { ExploreSearch } from "@/features/explore/components/explore-search"
import { MapPin, Calendar, Users, Briefcase, ChevronLeft, ChevronRight, ListCollapse, Utensils, Car, Moon, AlignLeft, Receipt, UserCircle2, ChevronDown, ChevronUp, X, Search, Plus } from "lucide-react"
import dynamic from "next/dynamic"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { PlaceForm } from "@/features/dashboard/components/place-form"

const ExploreMap = dynamic(() => import("@/features/explore/components/explore-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 animate-pulse" />
})

export function ProBuilderMain({ initialLibrary = [] }: { initialLibrary?: any[] }) {
  const { viewState, currentTrip, setCurrentTrip, panelMode, setPanelMode, activeDayNumber, setActiveDayNumber, setViewState, isWorkspaceCollapsed, setIsWorkspaceCollapsed, setSelectedId, selectedId, createDay } = useTrip()
  const { isChatOpen } = usePreferences()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [leftTab, setLeftTab] = useState<'discover' | 'itinerary'>('itinerary')
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [showCreatePlace, setShowCreatePlace] = useState(false)
  
  const [workspaceWidth, setWorkspaceWidth] = useState(500)
  const [isResizing, setIsResizing] = useState(false)

  const handleSaveTemplate = async () => {
    if (!currentTrip || currentTrip.days.length === 0) return;
    const title = window.prompt("Enter a name for this template:", currentTrip.title || "Custom Itinerary");
    if (!title) return;
    
    const tags = window.prompt("Enter tags (comma separated, e.g. 'Adventure, Family'):", "Custom");
    
    setIsSavingTemplate(true);
    try {
      const res = await saveTripAsTemplate(currentTrip as any, title, tags || "");
      if (res.success) {
        alert("Template saved successfully! It will appear in your Library under Templates.");
      } else {
        alert("Failed to save template: " + res.error);
      }
    } catch (e) {
      alert("Error saving template.");
    } finally {
      setIsSavingTemplate(false);
    }
  }

  const [mapClickTarget, setMapClickTarget] = useState<string | null>(null)

  useEffect(() => {
    if (!mapClickTarget) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMapClickTarget(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mapClickTarget])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = document.body.clientWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWorkspaceWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);
  
  const isDrawerOpen = searchParams.get("filter") === "open"
  const setIsDrawerOpen = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (open) params.set("filter", "open")
    else params.delete("filter")
    router.push(`?${params.toString()}`, { scroll: false })
  }
  
  const q = searchParams.get("q") || ""
  const loc = searchParams.get("loc") || ""
  const cat = searchParams.get("cat") || ""
  const rad = searchParams.get("rad") ? Number(searchParams.get("rad")) : undefined
  const lat = searchParams.get("lat") || undefined
  const lng = searchParams.get("lng") || undefined
  const sort = searchParams.get("sort") || "recommended"

  // Compute category counts dynamically for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    initialLibrary.forEach(b => {
      if (b.category) {
        const catUpper = b.category.toUpperCase();
        counts[catUpper] = (counts[catUpper] || 0) + 1;
      }
    });
    return counts;
  }, [initialLibrary]);

  // Client-side filtering and sorting instead of making network requests
  const businesses = useMemo(() => {
    let filtered = [...initialLibrary];

    // 1. Search Query Filter
    if (q) {
      const queryLower = q.toLowerCase();
      filtered = filtered.filter(b => 
        (b.name && b.name.toLowerCase().includes(queryLower)) || 
        (b.description && b.description.toLowerCase().includes(queryLower)) ||
        (b.category && b.category.toLowerCase().includes(queryLower)) ||
        (b.tags && b.tags.toLowerCase().includes(queryLower))
      );
    }

    // 2. Category Filter
    if (cat) {
      const cats = cat.split(',').map(c => c.trim().toLowerCase());
      filtered = filtered.filter(b => b.category && cats.includes(b.category.toLowerCase()));
    }

    // 3. Location Filter (with optional GPS Radius support)
    if (rad && lat && lng) {
      const uLat = parseFloat(lat);
      const uLng = parseFloat(lng);
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c;
      };

      filtered = filtered.filter(b => {
        if (b.lat == null || b.lng == null) return false;
        const dist = calculateDistance(uLat, uLng, b.lat, b.lng);
        return dist <= rad;
      });
    } else if (loc) {
      filtered = filtered.filter(b => 
        (b.locationSlug && b.locationSlug.toLowerCase() === loc.toLowerCase()) ||
        (b.sector && b.sector.toLowerCase() === loc.toLowerCase())
      );
    }

    // 4. Sort
    filtered.sort((a, b) => {
      if (sort === "rating_desc") {
        return (b.rating || 0) - (a.rating || 0);
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    return filtered;
  }, [initialLibrary, q, cat, loc, rad, lat, lng, sort]);

  const loading = false; // Network loading is now instant

  useEffect(() => {
    if (panelMode === 'categories') {
      setLeftTab('discover')
    }
  }, [panelMode])

  useEffect(() => {
    if (leftTab === 'discover') {
      setPanelMode('categories')
    } else {
      setPanelMode('builder')
    }
  }, [leftTab, setPanelMode])

  const handleLibrarySelect = (id: string | null) => {
    if (!id) {
      setSelectedId(null);
      return;
    }
    const item = initialLibrary?.find(b => b.id === id);
    if (item?.isTripTemplate) {
      if (window.confirm("Loading this template will replace your current itinerary. Continue?")) {
        const newDays = item.daysData.map((d: any) => {
          let parsedEvents = [];
          let parsedStart = undefined;
          let parsedEnd = undefined;
          let parsedComplete = false;
          try {
            const parsed = JSON.parse(d.eventsJson);
            parsedEvents = parsed.events || [];
            parsedStart = parsed.startAnchor;
            parsedEnd = parsed.endAnchor;
            parsedComplete = parsed.isComplete;
          } catch (e) {}

          return {
            dayNumber: d.dayNumber,
            date: new Date(d.date),
            sleepTown: d.sleepTown,
            title: d.dayTheme,
            isComplete: parsedComplete,
            startAnchor: parsedStart,
            endAnchor: parsedEnd,
            events: parsedEvents,
          }
        });
        setCurrentTrip({ 
          ...currentTrip, 
          title: currentTrip?.title || item.name || "Template Trip",
          days: newDays 
        } as any);
        setLeftTab('itinerary');
      }
    } else {
      setSelectedId(id);
    }
  }

  // Fix white gap: Trigger Mapbox resize when sidebars toggle
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 310); // slightly longer than the 300ms transition
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed, isWorkspaceCollapsed]);

  const mapEntities = useMemo(() => {
    const entities: any[] = [];
    
    // 1. Add current trip events
    if (currentTrip) {
      currentTrip.days.forEach((d: any) => {
        if (d.events.length > 0 || d.dayNumber === activeDayNumber) {
          if (d.startAnchor?.lat && d.startAnchor?.lng) {
            const id = `startAnchor-${d.dayNumber}`;
            if (!entities.find((e: any) => e.id === id)) entities.push({ id, title: d.startAnchor.title, lat: d.startAnchor.lat, lng: d.startAnchor.lng, type: 'ANCHOR', service: d.startAnchor.service, isItineraryItem: true });
          }
          d.events.filter((e: any) => e.type !== 'NOTE' && e.type !== 'TRANSPORT').forEach((e: any) => entities.push({ ...e, isItineraryItem: true }));
          if (d.endAnchor?.lat && d.endAnchor?.lng) {
            const id = `endAnchor-${d.dayNumber}`;
            if (!entities.find((e: any) => e.id === id)) entities.push({ id, title: d.endAnchor.title, lat: d.endAnchor.lat, lng: d.endAnchor.lng, type: 'ANCHOR', service: d.endAnchor.service, isItineraryItem: true });
          }
        }
      });
    }

    // 2. Add library businesses (if on discover tab)
    if (leftTab === 'discover' && businesses.length > 0) {
      businesses.forEach((b: any) => {
        const existing = entities.find((e: any) => e.id === b.id);
        if (existing) {
          existing.isLibraryItem = true;
        } else {
          entities.push({ ...b, isLibraryItem: true });
        }
      });
    }

    return entities.map((e: any) => {
      let evtLat = e.lat;
      let evtLng = e.lng;
      if (e.type === 'TRANSPORT') {
        evtLat = (e as any).fromLat;
        evtLng = (e as any).fromLng;
      } else if (e.type === 'MEAL') {
        evtLat = (e as any).locationLat || e.lat;
        evtLng = (e as any).locationLng || e.lng;
      }

      return {
        ...(e.service || {}),
        ...e,
        id: e.id,
        name: e.name || e.title || e.service?.name,
        lat: evtLat,
        lng: evtLng,
        category: e.type === 'ANCHOR' ? 'STAY' : (e.category || e.service?.category || e.type),
        imageUrl: e.imageUrl || e.service?.imageUrl,
        description: e.description || e.notes || e.content || e.service?.description,
        rating: e.rating || e.service?.rating,
        priceTier: e.priceTier || e.service?.priceTier,
        isClaimed: e.isClaimed || e.service?.isClaimed,
        menuUrl: e.menuUrl || e.service?.menuUrl,
      };
    }).filter(e => e.lat != null && e.lng != null);
  }, [leftTab, businesses, currentTrip, activeDayNumber]);

  if (viewState === 'wizard') return <BuilderWizard />
  if (viewState === 'checkout') return <CheckoutDetailsForm />

  const activeDay = currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)

  // Helper to get small icons for event types
  const getSmallIcon = (type: string) => {
    switch (type) {
      case 'EXPERIENCE': return <MapPin className="w-3 h-3 text-emerald-600" />
      case 'TRANSPORT': return <Car className="w-3 h-3 text-blue-600" />
      case 'MEAL': return <Utensils className="w-3 h-3 text-amber-600" />
      case 'STAY': return <Moon className="w-3 h-3 text-purple-600" />
      case 'ANCHOR': return <MapPin className="w-3 h-3 text-slate-500" />
      default: return <AlignLeft className="w-3 h-3 text-slate-500" />
    }
  }

  return (
    <div className="h-[calc(100vh-56px)] w-full flex overflow-hidden bg-[#FAF9F6] font-sans relative text-slate-900">
      {/* Left Panel - Tabbed Discover & Timeline */}
      <div className={`shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-16' : 'w-[420px]'} bg-[#FAF9F6] h-full flex flex-col z-20 shadow-xl border-r border-slate-100 relative`}>
        {/* Left Rail Toggle */}
        <div className="absolute top-6 -right-5 z-30">
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-10 h-10 bg-white border border-slate-200 shadow-md hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-full transition-all flex items-center justify-center"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        {/* Content Container */}
        <div className={`flex-1 flex flex-col transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 overflow-hidden'}`}>
          
          <div className="px-6 pt-6 pb-2">
             <h2 className="text-2xl font-serif font-bold text-slate-900 mb-4">Pro Planner</h2>
          </div>

          {/* Sidebar Tabs */}
          <div className="px-6 pt-2 pb-2 shrink-0">
             <div className="bg-slate-100 p-1 rounded-2xl flex w-full">
                <button 
                  onClick={() => setLeftTab('itinerary')} 
                  className={cn(
                    "flex-1 flex justify-center items-center gap-2 py-2 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                    leftTab === 'itinerary' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <ListCollapse className="w-3.5 h-3.5" /> Days
                </button>
                <button 
                  onClick={() => setLeftTab('discover')} 
                  className={cn(
                    "flex-1 flex justify-center items-center gap-2 py-2 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                    leftTab === 'discover' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Search className="w-3.5 h-3.5" /> Library
                </button>
             </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {leftTab === 'discover' ? (
              <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="shrink-0 p-6 bg-white border-b border-slate-50 flex flex-col gap-3">
                  <ExploreSearch 
                    initialQuery={q} 
                    isDrawerOpen={isDrawerOpen}
                    setIsDrawerOpen={setIsDrawerOpen}
                    categoryCounts={categoryCounts}
                    isProBuilder={true}
                  />
                  <button
                    onClick={() => setShowCreatePlace(true)}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> Register New Place
                  </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative">
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Consulting Library...</p>
                      </div>
                    </div>
                  )}
                  <DiscoverPanel 
                    businesses={businesses} 
                    selectedId={selectedId} 
                    setSelectedId={handleLibrarySelect} 
                    onReset={() => setLeftTab('itinerary')}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-hide bg-slate-50/50 animate-in fade-in slide-in-from-left-4 duration-300">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Itinerary Timeline</h3>
                {currentTrip?.days.map((day: any) => {
                  const isActive = day.dayNumber === activeDayNumber
                  const timelineItems: { id: string, title: string, time: string, type: string }[] = [];
                  if (day.startAnchor) {
                    timelineItems.push({ id: `startAnchor-${day.dayNumber}`, title: day.startAnchor.title || "Starting Point", time: day.startAnchor.time || "09:00", type: 'ANCHOR' });
                  }
                  day.events.forEach((e: any) => timelineItems.push({ id: e.id, title: e.title, time: e.startTime, type: e.type }));
                  if (day.endAnchor) {
                    timelineItems.push({ id: `endAnchor-${day.dayNumber}`, title: day.endAnchor.title || "End of Day", time: day.endAnchor.time || "18:00", type: 'ANCHOR' });
                  }

                  return (
                    <div key={day.dayNumber} className={`rounded-3xl transition-all duration-300 overflow-hidden border ${isActive ? 'bg-white border-slate-200 shadow-md ring-1 ring-slate-900/5' : 'bg-white border-transparent shadow-sm hover:shadow hover:border-slate-200'}`}>
                      <button
                        onClick={() => setActiveDayNumber(day.dayNumber)}
                        className="w-full text-left p-6 flex justify-between items-start"
                      >
                        <div>
                          <h3 className={`font-bold text-xl mb-1 font-serif ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>Day {day.dayNumber}</h3>
                          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">{day.date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        </div>
                        {(!isActive) && day.events.length > 0 && (
                          <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                            {day.events.slice(0, 4).map((e: any, idx: number) => (
                              <div key={`${e.id}-${idx}`} className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center" title={e.title}>
                                {getSmallIcon(e.type)}
                              </div>
                            ))}
                            {day.events.length > 4 && (
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                                +{day.events.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                      {isActive && (
                        <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-300">
                          {timelineItems.length === 0 ? (
                            <p className="text-sm text-slate-500 font-medium bg-slate-50 p-5 rounded-2xl text-center border border-slate-200 border-dashed">No events scheduled.</p>
                          ) : (
                            <div className="flex flex-col gap-4 relative before:absolute before:inset-0 before:left-3 before:h-full before:w-px before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent pt-2">
                              {timelineItems.map((e: any, i: number) => (
                                <div 
                                  key={`${e.id}-${i}`} 
                                  className="relative flex items-center justify-between group pl-8 cursor-pointer hover:bg-slate-50 py-1 -ml-2 pl-10 rounded-r-xl transition-colors"
                                  onClick={(ev) => { 
                                    ev.stopPropagation(); 
                                    setSelectedId(e.id);
                                    const element = document.getElementById(`event-${e.id}`);
                                    if (element) {
                                      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }}
                                >
                                  <div className={`absolute left-[17px] w-2 h-2 rounded-full z-10 transition-colors ring-4 ring-white ${selectedId === e.id ? 'bg-slate-900 ring-rose-500/20' : 'bg-slate-300 group-hover:bg-slate-900'}`} />
                                  <span className={`text-[15px] font-medium truncate pr-4 transition-colors ${selectedId === e.id ? 'text-slate-900 font-bold' : 'text-slate-700 group-hover:text-slate-900'}`}>{e.title}</span>
                                  <span className={`text-xs font-bold font-mono shrink-0 transition-colors ${selectedId === e.id ? 'text-rose-600' : 'text-slate-400 group-hover:text-slate-600'}`}>{e.time}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
                
                <button
                  onClick={createDay}
                  className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Day
                </button>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-transparent border-t border-slate-100 shrink-0 flex flex-col gap-3">
            <button
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50"
            >
              {isSavingTemplate ? "Saving..." : "Save as Template"}
            </button>
            <button
              onClick={() => setViewState('checkout')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white px-6 py-4 rounded-2xl font-bold text-base transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Center Panel - Map (Always working) */}
      <div className="flex-1 relative z-10 bg-slate-100 overflow-hidden flex flex-col">
        <ExploreMap
          businesses={mapEntities as any}
          selectedId={selectedId}
          onSelectBusiness={setSelectedId}
          mapClickMode={mapClickTarget}
          onMapAnchorPick={(lat, lng) => {
            if (!mapClickTarget || !currentTrip || !activeDayNumber) return
            const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber)
            if (!activeDay) return

            if (mapClickTarget === 'start' || mapClickTarget === 'end') {
              const key = mapClickTarget === 'start' ? 'startAnchor' : 'endAnchor'
              const newDays = currentTrip.days.map((d: any) =>
                d.dayNumber === activeDayNumber
                  ? { ...d, [key]: { ...activeDay[key], title: 'Custom Location', lat, lng } }
                  : d
              )
              setCurrentTrip({ ...currentTrip, days: newDays })
            } else if (mapClickTarget.startsWith('event-')) {
              const eventId = mapClickTarget.replace('event-', '')
              const newEvents = activeDay.events.map((evt: any) =>
                evt.id === eventId ? { ...evt, lat, lng } : evt
              )
              const newDays = currentTrip.days.map((d: any) =>
                d.dayNumber === activeDayNumber ? { ...d, events: newEvents } : d
              )
              setCurrentTrip({ ...currentTrip, days: newDays })
            }
            setMapClickTarget(null)
          }}
        />
      </div>

      {/* Right Panel - Builder Workspace (Day details) */}
      <div 
        style={{ width: isWorkspaceCollapsed ? 64 : workspaceWidth }}
        className={cn(
          "shrink-0 z-20 bg-[#FAF9F6] shadow-[-10px_0_20px_rgba(0,0,0,0.03)] relative flex flex-col border-l border-slate-200",
          isResizing ? "transition-none" : "transition-all duration-300 ease-in-out"
        )}
      >
        {/* Resize Handle */}
        {!isWorkspaceCollapsed && (
          <div 
            onMouseDown={() => setIsResizing(true)}
            className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-slate-200/50 active:bg-slate-300/50 transition-colors z-40"
          />
        )}

        <div className="absolute top-6 -left-5 z-30">
          <button 
            onClick={() => setIsWorkspaceCollapsed(!isWorkspaceCollapsed)}
            className="w-10 h-10 bg-white border border-slate-200 shadow-md hover:bg-slate-50 text-slate-500 hover:text-slate-900 rounded-full transition-all flex items-center justify-center"
          >
            {isWorkspaceCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto transition-opacity duration-300 ${isWorkspaceCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <BuilderWorkspace
            variant="pro"
            selectedId={selectedId}
            onSelectEvent={setSelectedId}
            onPinOnMap={(target) => setMapClickTarget(target)}
            libraryBusinesses={businesses.filter((b: any) => b.lat && b.lng).map((b: any) => ({
              name: b.name,
              lat: b.lat,
              lng: b.lng,
              id: b.id,
              category: b.category,
              service: b,
            }))}
          />
        </div>
      </div>

      {showCreatePlace && (
        <PlaceForm 
          onClose={() => setShowCreatePlace(false)}
          onSuccess={() => {
            setShowCreatePlace(false)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}
