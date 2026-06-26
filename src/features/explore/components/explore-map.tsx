"use client"

import { useEffect, useRef, useMemo, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Map, { Marker, Popup, Source, Layer, NavigationControl, GeolocateControl } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import 'mapbox-gl/dist/mapbox-gl.css'
import { Star, Zap, Layers, Navigation, Utensils, Sprout, Mountain as MountainIcon, Bed, Landmark, Ticket, MapPin, Plane, Car, Clipboard, Scissors, User, Sparkles } from "lucide-react"
import type { Business } from "@prisma/client"
import { useTrip } from "@/lib/store/trip-context"
import { usePreferences } from "@/lib/store/preferences-context"
import { cn } from "@/lib/utils"
import { BusinessCard } from "./business-card"

const getCategoryStyle = (category: string | undefined | null) => {
  if (!category) return { bg: "#8E8E93", icon: MapPin };
  
  const cat = category.toUpperCase();
  switch (cat) {
    case 'DINING':
    case 'MEAL':
      return { bg: "#FF9500", icon: Utensils }; // Apple Orange
    case 'WELLNESS':
      return { bg: "#34C759", icon: Sprout };   // Apple Green
    case 'ADVENTURE':
      return { bg: "#5856D6", icon: MountainIcon }; // Apple Indigo
    case 'STAYS':
    case 'STAY':
      return { bg: "#007AFF", icon: Bed };      // Apple Blue
    case 'CULTURE':
      return { bg: "#AF52DE", icon: Landmark }; // Apple Purple
    case 'SPIRITUAL':
      return { bg: "#BF5AF2", icon: Sparkles }; // Apple Purple/Pinkish
    case 'BOLETO':
      return { bg: "#FF2D55", icon: Ticket };   // Apple Red
    case 'TRANSPORT':
      return { bg: "#5AC8FA", icon: Car };      // Apple Light Blue
    case 'AGENCY':
    case 'EXPERIENCE':
      return { bg: "#FFCC00", icon: Star };     // Apple Yellow
    case 'TEXTILES':
      return { bg: "#E91E63", icon: Scissors }; // Pink
    case 'GUIDE':
      return { bg: "#FF5722", icon: User };     // Deep Orange
    case 'NOTE':
      return { bg: "#8E8E93", icon: Clipboard }; // Apple Gray
    default:
      return { bg: "#8E8E93", icon: MapPin };
  }
}


interface ExploreMapProps {
  businesses: Business[]
  selectedId: string | null
  onSelectBusiness: (id: string) => void
  mapClickMode?: string | null
  onMapAnchorPick?: (lat: number, lng: number) => void
}

export default function ExploreMap({ businesses, selectedId, onSelectBusiness, mapClickMode, onMapAnchorPick }: ExploreMapProps) {
  const mapRef = useRef<MapRef>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [popupBusiness, setPopupBusiness] = useState<Business | (Partial<Business> & { title?: string, priceTier?: string, rating?: number, description?: string, menuUrl?: string }) | null>(null)
  const [mapMode, setMapMode] = useState<"satellite" | "planning">("planning")
  const { 
    activeItinerary, 
    panelMode: strictPanelMode, 
    setStartAnchorLocation, 
    insertWaypoint, 
    routeData,
    currentTrip,
    setCurrentTrip,
    activeDayNumber,
    setActiveDayNumber,
    isWorkspaceCollapsed
  } = useTrip()
  const panelMode = strictPanelMode as string;
  const { isChatOpen } = usePreferences()

  // FlyTo when start anchor location changes
  const startLat = panelMode === 'builder'
    ? currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)?.startAnchor?.lat
    : activeItinerary?.startAnchor?.lat
  const startLng = panelMode === 'builder'
    ? currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)?.startAnchor?.lng
    : activeItinerary?.startAnchor?.lng
  useEffect(() => {
    if (startLat && startLng && mapRef.current) {
      mapRef.current.flyTo({ center: [startLng, startLat], zoom: 13, duration: 900, essential: true })
    }
  }, [startLat, startLng])

  // FlyTo when end anchor location changes
  const endLat = panelMode === 'builder'
    ? currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)?.endAnchor?.lat
    : activeItinerary?.endAnchor?.lat
  const endLng = panelMode === 'builder'
    ? currentTrip?.days.find((d: any) => d.dayNumber === activeDayNumber)?.endAnchor?.lng
    : activeItinerary?.endAnchor?.lng
  useEffect(() => {
    if (endLat && endLng && mapRef.current) {
      mapRef.current.flyTo({ center: [endLng, endLat], zoom: 13, duration: 900, essential: true })
    }
  }, [endLat, endLng])

  // Calculate dynamic right offset for map controls
  // If chat is open, shift left by the chat width (450px)
  const isProBuilder = pathname?.startsWith('/pro')
  const controlsRightOffset = (isChatOpen && panelMode !== 'builder' && !isProBuilder) ? "466px" : "16px"

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const mapStyle = mapMode === "satellite" 
    ? "mapbox://styles/mapbox/satellite-streets-v12"
    : "mapbox://styles/mapbox/light-v11"

  // Multi-day routes for Pro Builder
  const [multiDayRoutes, setMultiDayRoutes] = useState<{[dayNumber: number]: GeoJSON.Feature<GeoJSON.LineString>}>({});

  const completedDays = useMemo(() => {
    if ((panelMode !== "builder" && panelMode !== "categories") || !currentTrip) return [];
    const daysToRender = currentTrip.days.filter((d: any) => (d.events && d.events.length > 0) || d.dayNumber === activeDayNumber);
    return daysToRender.map((d: any) => {
      const pts: [number, number][] = [];
      if (d.startAnchor?.lat && d.startAnchor?.lng) pts.push([d.startAnchor.lng, d.startAnchor.lat]);
      for (const evt of d.events || []) {
        if (evt.type === 'TRANSPORT') {
          if ((evt as any).fromLat && (evt as any).fromLng) pts.push([(evt as any).fromLng, (evt as any).fromLat]);
          if ((evt as any).toLat && (evt as any).toLng) pts.push([(evt as any).toLng, (evt as any).toLat]);
        } else {
           if (evt.lat && evt.lng) pts.push([evt.lng, evt.lat]);
        }
      }
      if (d.endAnchor?.lat && d.endAnchor?.lng) pts.push([d.endAnchor.lng, d.endAnchor.lat]);
      return { dayNumber: d.dayNumber, isComplete: !!d.isComplete, isActive: d.dayNumber === activeDayNumber, waypoints: pts };
    });
  }, [currentTrip, activeDayNumber, panelMode]);

  useEffect(() => {
    console.log("ExploreMap: mapboxToken is", mapboxToken ? "present" : "missing", "completedDays length:", completedDays.length);
    if (!mapboxToken || completedDays.length === 0) return;

    const fetchRoutes = async () => {
      const newRoutes: {[dayNumber: number]: GeoJSON.Feature<GeoJSON.LineString>} = {};

      await Promise.all(completedDays.map(async (day: any) => {
        console.log("Checking route for day", day.dayNumber, "waypoints:", day.waypoints);
        if (day.waypoints.length < 2) return;

        const coordsStr = day.waypoints.map((p: any) => `${p[0]},${p[1]}`).join(';');
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${mapboxToken}`;

        try {
          console.log(`Fetching mapbox route for day ${day.dayNumber}:`, url);
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            console.log(`Mapbox route SUCCESS for day ${day.dayNumber}`, data.routes[0].duration);
            newRoutes[day.dayNumber] = {
              type: 'Feature',
              properties: { 
                dayNumber: day.dayNumber, 
                isActive: day.isActive, 
                isComplete: day.isComplete,
                duration: data.routes[0].duration,
                distance: data.routes[0].distance
              },
              geometry: data.routes[0].geometry
            };
          } else {
            console.warn(`Mapbox route FAILED (no routes) for day ${day.dayNumber}`, data);
            // Fallback to straight line
            newRoutes[day.dayNumber] = {
              type: 'Feature',
              properties: { dayNumber: day.dayNumber, isActive: day.isActive, isComplete: day.isComplete },
              geometry: { type: 'LineString', coordinates: day.waypoints }
            };
          }
        } catch (e) {
          console.error("Failed to fetch route for day", day.dayNumber, e);
          newRoutes[day.dayNumber] = {
            type: 'Feature',
            properties: { dayNumber: day.dayNumber, isActive: day.isActive, isComplete: day.isComplete },
            geometry: { type: 'LineString', coordinates: day.waypoints }
          };
        }
      }));

      setMultiDayRoutes(newRoutes);
    };

    fetchRoutes();
  }, [completedDays, mapboxToken]);
  const waypoints = useMemo(() => {
    if (panelMode !== "itinerary" && panelMode !== "builder") return [];
    
    const pts: [number, number][] = [];
    
    if (panelMode === "itinerary" && activeItinerary) {
      const start = activeItinerary.startAnchor;
      const end = activeItinerary.endAnchor;
      if (start?.lat && start?.lng) pts.push([start.lng, start.lat]);
      for (const waypoint of activeItinerary.waypoints || []) {
        if (waypoint.lat && waypoint.lng) pts.push([waypoint.lng, waypoint.lat]);
      }
      if (end?.lat && end?.lng) pts.push([end.lng, end.lat]);
    } else if (panelMode === "builder" && currentTrip && activeDayNumber) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
      if (activeDay) {
        const start = activeDay.startAnchor;
        const end = activeDay.endAnchor;
        if (start?.lat && start?.lng) pts.push([start.lng, start.lat]);
        for (const evt of activeDay.events || []) {
          if (evt.type === 'TRANSPORT') {
            if ((evt as any).fromLat && (evt as any).fromLng) pts.push([(evt as any).fromLng, (evt as any).fromLat]);
            if ((evt as any).toLat && (evt as any).toLng) pts.push([(evt as any).toLng, (evt as any).toLat]);
          } else {
             if (evt.lat && evt.lng) pts.push([evt.lng, evt.lat]);
          }
        }
        if (end?.lat && end?.lng) pts.push([end.lng, end.lat]);
      }
    }
    return pts;
  }, [activeItinerary, currentTrip, activeDayNumber, panelMode]);

  const directWaypoints = useMemo(() => {
    if (panelMode !== "itinerary" && panelMode !== "builder" && panelMode !== "categories") return [];
    const pts: [number, number][] = [];

    if (panelMode === "itinerary" && activeItinerary) {
      const start = activeItinerary.startAnchor;
      const end = activeItinerary.endAnchor;
      if (start?.lat && start?.lng) pts.push([start.lng, start.lat]);
      if (end?.lat && end?.lng) pts.push([end.lng, end.lat]);
    } else if ((panelMode === "builder" || panelMode === "categories") && currentTrip && activeDayNumber) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);      if (activeDay) {
        const start = activeDay.startAnchor;
        const end = activeDay.endAnchor;
        if (start?.lat && start?.lng) pts.push([start.lng, start.lat]);
        if (end?.lat && end?.lng) pts.push([end.lng, end.lat]);
      }
    }
    return pts;
  }, [activeItinerary, currentTrip, activeDayNumber, panelMode]);

  const itineraryRoute = useMemo(() => {
    if (!routeData?.geometry) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: routeData.geometry
    } as GeoJSON.Feature<GeoJSON.LineString>;
  }, [routeData]);

  const directRoute = useMemo(() => {
    if (directWaypoints.length < 2) return null;
    return {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: directWaypoints }
    } as GeoJSON.Feature<GeoJSON.LineString>;
  }, [directWaypoints]);

  // Itinerary waypoint markers
  const itineraryMarkers = useMemo(() => {
    if (panelMode === "itinerary" && activeItinerary) {
      return activeItinerary.waypoints
        .filter((w: any) => w.lat !== undefined && w.lng !== undefined)
        .map((w: any, idx: number) => ({ pick: w, idx }));
    }
    
    if (panelMode === "builder" && currentTrip && activeDayNumber) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
      if (activeDay) {
        return (activeDay.events || [])
          .filter((evt: any) => evt.type !== 'NOTE' && evt.type !== 'TRANSPORT' && (evt.lat !== undefined || (evt as any).locationLat !== undefined || (evt as any).service?.lat !== undefined))
          .map((evt: any, idx: number) => {
            const lat = evt.lat ?? (evt as any).locationLat ?? (evt as any).service?.lat;
            const lng = evt.lng ?? (evt as any).locationLng ?? (evt as any).service?.lng;
            // Reconstruct a business-like object for the marker
            const pick = {
              id: evt.id,
              name: evt.title,
              category: (evt as any).service?.category || evt.type,
              lat,
              lng,
              ...((evt as any).service || {})
            };
            return { pick, idx };
          });
      }
    }
    return [];
  }, [activeItinerary, currentTrip, activeDayNumber, panelMode]);

  // Fly to selected business or itinerary point
  useEffect(() => {
    if (!selectedId) { setPopupBusiness(null); return; }

    const isItineraryId = selectedId === 'itin-start' || selectedId === 'itin-arrival';
    const pitch = isItineraryId ? 0 : (mapMode === "satellite" ? 60 : 0);
    
    let startAnchor: any = null;
    let endAnchor: any = null;
    
    if (panelMode === "itinerary" && activeItinerary) {
      startAnchor = activeItinerary.startAnchor;
      endAnchor = activeItinerary.endAnchor;
    } else if (panelMode === "builder" && currentTrip && activeDayNumber) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
      startAnchor = activeDay?.startAnchor;
      endAnchor = activeDay?.endAnchor;
    }

    if (selectedId === 'itin-start' && startAnchor?.lat && startAnchor?.lng) {
      mapRef.current?.flyTo({ center: [startAnchor.lng as number, startAnchor.lat as number], zoom: 15, pitch, duration: 1200, essential: true });
      setPopupBusiness(null);
      return;
    }

    if (selectedId === 'itin-arrival' && endAnchor?.lat && endAnchor?.lng) {
      mapRef.current?.flyTo({ center: [endAnchor.lng as number, endAnchor.lat as number], zoom: 15, pitch, duration: 1200, essential: true });
      setPopupBusiness(null);
      return;
    }

    let targetLat: number | null = null;
    let targetLng: number | null = null;
    let targetBusiness: Business | null = null;

    // 1. Direct Business Match
    const b = businesses.find(b => b.id === selectedId);
    if (b && b.lat !== null && b.lng !== null) {
      targetLat = b.lat;
      targetLng = b.lng;
      targetBusiness = b;
    } 
    
    // 2. Active Itinerary (Micro-Day) Match
    if (!targetLat && activeItinerary) {
      for (const wp of activeItinerary.waypoints) {
        if (wp.id === selectedId && wp.lat !== undefined && wp.lng !== undefined) {
          targetLat = wp.lat;
          targetLng = wp.lng;
          break;
        }
        if (wp.alternatives) {
          const alt = wp.alternatives.find((a: any) => a.id === selectedId);
          if (alt && alt.lat !== undefined && alt.lng !== undefined) {
            targetLat = alt.lat;
            targetLng = alt.lng;
            break;
          }
        }
      }
    } 
    
    // 3. Pro Builder (Multi-Day) Match
    if (!targetLat && panelMode === "builder" && currentTrip && activeDayNumber) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
      if (activeDay) {
        for (const evt of activeDay.events || []) {
          if (evt.id === selectedId) {
            if (evt.type === 'NOTE') {
              // Note events have no spatial location, do nothing
              return;
            } else if (evt.type === 'TRANSPORT') {
              // Transport events are lines, not points. Fit bounds to start/end and clear popup.
              const startLng = (evt as any).fromLng;
              const startLat = (evt as any).fromLat;
              const endLng = (evt as any).toLng;
              const endLat = (evt as any).toLat;
              if (startLng && startLat && endLng && endLat) {
                const minLng = Math.min(startLng, endLng);
                const maxLng = Math.max(startLng, endLng);
                const minLat = Math.min(startLat, endLat);
                const maxLat = Math.max(startLat, endLat);
                
                // Add padding
                const lngPad = Math.abs(maxLng - minLng) * 0.2 || 0.05;
                const latPad = Math.abs(maxLat - minLat) * 0.2 || 0.05;

                mapRef.current?.fitBounds(
                  [[minLng - lngPad, minLat - latPad], [maxLng + lngPad, maxLat + latPad]],
                  { padding: 80, duration: 1200 }
                );
              }
              setPopupBusiness(null);
              return;
            } else if (evt.type === 'MEAL' && ((evt as any).locationLat !== undefined || evt.lat !== undefined)) {
              targetLat = (evt as any).locationLat || evt.lat;
              targetLng = (evt as any).locationLng || evt.lng;
            } else if (evt.lat !== undefined && evt.lng !== undefined) {
              targetLat = evt.lat;
              targetLng = evt.lng;
            } else if ((evt as any).businessId) {
              const b = businesses.find(b => b.id === (evt as any).businessId);
              if (b && b.lat !== null && b.lng !== null) {
                targetLat = b.lat;
                targetLng = b.lng;
                targetBusiness = b;
              }
            }
            // Populate popup from event's service object or event data
            if (!targetBusiness) {
              const svc = (evt as any).service;
              if (svc) {
                const lat = svc.lat ?? targetLat;
                const lng = svc.lng ?? targetLng;
                targetBusiness = { ...svc, lat, lng } as any;
              } else if (targetLat !== null && targetLng !== null) {
                targetBusiness = {
                  id: evt.id,
                  name: evt.title,
                  lat: targetLat,
                  lng: targetLng,
                  category: (evt as any).category || evt.type,
                  description: (evt as any).notes || (evt as any).details || undefined,
                  rating: (evt as any).rating || undefined,
                  priceTier: undefined,
                } as any;
              }
            }
            break;
          }
          if ((evt as any).alternatives) {
            const alt = (evt as any).alternatives.find((a: any) => a.id === selectedId);
            if (alt && alt.lat !== undefined && alt.lng !== undefined) {
              targetLat = alt.lat;
              targetLng = alt.lng;
              break;
            }
          }
        }
      }
    }

    // 4. Mock Hotel Fallback (Basecamp Carousel)
    if (!targetLat && selectedId?.startsWith('hotel-')) {
      const mockCoords: Record<string, [number, number]> = {
        'hotel-1': [-13.3135, -72.1158],
        'hotel-2': [-13.3100, -72.0800],
        'hotel-3': [-13.3150, -72.1200]
      };
      if (mockCoords[selectedId]) {
        targetLng = mockCoords[selectedId][1];
        targetLat = mockCoords[selectedId][0];
      }
    }

    if (targetLat !== null && targetLng !== null) {
      mapRef.current?.flyTo({ center: [targetLng, targetLat], zoom: 15, pitch: (mapMode === "satellite" ? 60 : 0), duration: 1200, essential: true });
      setPopupBusiness(targetBusiness);
    } else {
      setPopupBusiness(null);
    }
  }, [selectedId, businesses, activeItinerary, mapMode, currentTrip, activeDayNumber, panelMode]);

  // Fit bounds to route ONLY when itineraryRoute is newly generated
  // Disabled as per MVP Crucible to preserve viewport unless explicitly routed
  useEffect(() => {
    // We keep this empty so we don't automatically recenter the map on tab change or route generation.
  }, []);

  // Fly to active day start when day changes
  useEffect(() => {
    if (!mapRef.current || !activeDayNumber || !currentTrip || selectedId) return;

    const day = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
    if (day?.startAnchor?.lat && day?.startAnchor?.lng) {
      mapRef.current.flyTo({
        center: [day.startAnchor.lng, day.startAnchor.lat],
        zoom: 13,
        pitch: (mapMode === "satellite" ? 45 : 0),
        duration: 1500
      });
    }
  }, [activeDayNumber, currentTrip, mapMode, selectedId]);

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0F172A] text-white/40 p-6 text-center">
        <p className="font-medium">Map token missing.</p>
        <p className="text-sm mt-1">Set NEXT_PUBLIC_MAPBOX_TOKEN in .env</p>
      </div>
    );
  }

  const validBusinesses = businesses.filter(b => b.lat != null && b.lng != null && !isNaN(b.lat) && !isNaN(b.lng)) as (Business & { lat: number, lng: number })[];

  const businessSignature = validBusinesses.map(b => b.id).join(',');
  const [prevSignature, setPrevSignature] = useState<string | null>(null);

  useEffect(() => {
    if (validBusinesses.length === 0 || !mapRef.current) return;
    
    if (businessSignature !== prevSignature) {
      setPrevSignature(businessSignature);
      
      // Skip fitBounds if we already have a selected item to fly to, to avoid animation conflicts
      if (selectedId && validBusinesses.some(b => b.id === selectedId)) {
        return;
      }

      let minLng = validBusinesses[0].lng;
      let maxLng = validBusinesses[0].lng;
      let minLat = validBusinesses[0].lat;
      let maxLat = validBusinesses[0].lat;

      const boundsItems = validBusinesses.slice(0, 20);
      for (const b of boundsItems) {
        if (b.lng < minLng) minLng = b.lng;
        if (b.lng > maxLng) maxLng = b.lng;
        if (b.lat < minLat) minLat = b.lat;
        if (b.lat > maxLat) maxLat = b.lat;
      }

      if (minLng !== maxLng || minLat !== maxLat) {
        mapRef.current.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 80, duration: 1200, maxZoom: 15 }
        );
      } else {
        mapRef.current.flyTo({
          center: [minLng, minLat],
          zoom: 14,
          duration: 1200
        });
      }
    }
  }, [validBusinesses, businessSignature, prevSignature]);

  const center = validBusinesses.length > 0
    ? [validBusinesses.reduce((s, b) => s + b.lng, 0) / validBusinesses.length, validBusinesses.reduce((s, b) => s + b.lat, 0) / validBusinesses.length]
    : [-72.1167, -13.3047];

  return (
    <div className="relative w-full h-full group">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: center[0], latitude: center[1], zoom: 11, pitch: 0, bearing: 0 }}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
        terrain={mapMode === "satellite" ? { source: "mapbox-dem", exaggeration: 1.5 } : undefined}
        cursor={mapClickMode ? 'crosshair' : undefined}
        onClick={(e) => {
          if (mapClickMode && onMapAnchorPick) {
            onMapAnchorPick(e.lngLat.lat, e.lngLat.lng)
          } else {
            setPopupBusiness(null)
          }
        }}
      >
        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
        {mapMode === "satellite" && <Layer id="sky" type="sky" paint={{ "sky-type": "atmosphere", "sky-atmosphere-sun": [0.0, 0.0], "sky-atmosphere-sun-intensity": 15 }} />}

        {/* Direct baseline route line (Main Route) */}
        {directRoute && panelMode === "itinerary" && (
          <Source id="direct-route" type="geojson" data={directRoute}>
            <Layer id="direct-route-line" type="line" layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#8E8E93", "line-width": 2, "line-opacity": 0.5, "line-dasharray": [2, 2] }} />
          </Source>
        )}

        {/* Alternative Detour route line */}
        {itineraryRoute && panelMode === "itinerary" && (
          <Source id="itinerary-route" type="geojson" data={itineraryRoute}>
            <Layer id="route-glow" type="line" layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#ffffff", "line-width": 12, "line-opacity": 0.4, "line-blur": 6 }} />
            <Layer id="route-line" type="line" layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#007AFF", "line-width": 4, "line-opacity": 0.95 }} />
          </Source>
        )}

        {/* Multi-day builder routes */}
        {(panelMode === "builder" || panelMode === "categories") && Object.values(multiDayRoutes).map(route => {
          const isAct = route.properties?.isActive;
          const isComp = route.properties?.isComplete;
          const dayNum = route.properties?.dayNumber as number;
          const colors = ["#007AFF", "#FF9500", "#34C759", "#AF52DE", "#FF2D55", "#5AC8FA"];
          const color = colors[(dayNum - 1) % colors.length];
          const opacity = isAct ? 1 : (isComp ? 0.7 : 0.3);
          
          return (
            <Source key={`route-${dayNum}`} id={`route-${dayNum}`} type="geojson" data={route}>
              {/* White glow effect matching explore map */}
              <Layer id={`route-glow-${dayNum}`} type="line" layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{ "line-color": "#ffffff", "line-width": isAct ? 14 : 10, "line-opacity": opacity * 0.5, "line-blur": 6 }} />
              {/* Main line */}
              <Layer id={`route-line-${dayNum}`} type="line" layout={{ "line-join": "round", "line-cap": "round" }}
                paint={{ "line-color": color, "line-width": isAct ? 5 : 3, "line-opacity": opacity, "line-dasharray": isAct ? [1, 2] : [1] }}
              />
            </Source>
          );
        })}

        {/* Start Marker */}
        {(() => {
          let start;
          if (panelMode === "itinerary" && activeItinerary) {
            start = activeItinerary.startAnchor;
          } else if ((panelMode === "builder" || panelMode === "categories") && currentTrip && activeDayNumber) {
            const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
            start = activeDay?.startAnchor;
          }
          if (!start?.lat || !start?.lng) return null;
          return (
            <Marker
              longitude={start.lng}
              latitude={start.lat}
              anchor="bottom"
              draggable={!(start as any).service}
              onDragEnd={(e) => {
                if (panelMode === 'itinerary') {
                  setStartAnchorLocation(e.lngLat.lat, e.lngLat.lng)
                } else if (panelMode === 'builder' && currentTrip && activeDayNumber) {
                  const newDays = currentTrip.days.map((d: any) =>
                    d.dayNumber === activeDayNumber
                      ? { ...d, startAnchor: { ...d.startAnchor, lat: e.lngLat.lat, lng: e.lngLat.lng } }
                      : d
                  )
                  setCurrentTrip({ ...currentTrip, days: newDays })
                }
              }}
            >
              <div
                className={cn("group/start flex flex-col items-center", !(start as any).service ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")}
                title="Start location"
                onClick={e => {
                  e.stopPropagation()
                  mapRef.current?.flyTo({ center: [start.lng as number, start.lat as number], zoom: 14, pitch: 0, duration: 1200, essential: true })
                }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 blur-[3px] rounded-full" />
                <div className="relative flex flex-col items-center z-10 transition-transform group-hover/start:-translate-y-1">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded-full shadow-xl border-[2.5px] border-white flex items-center gap-1.5">
                    {(start as any).type === 'AIRPORT' ? <Plane className="w-3.5 h-3.5" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-bold tracking-wide">{(start as any).type === 'AIRPORT' ? 'CUZ' : 'START'}</span>
                  </div>
                  {(start as any).title && (
                    <div className="mt-0.5 bg-white/95 backdrop-blur-sm text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm max-w-[110px] truncate text-center border border-slate-100">
                      {(start as any).title}
                    </div>
                  )}
                  <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 -mt-1.5 border-r-[2.5px] border-b-[2.5px] border-white" />
                </div>
              </div>
            </Marker>
          );
        })()}

        {/* Arrival Marker */}
        {(() => {
          let end;
          if (panelMode === "itinerary" && activeItinerary) {
            end = activeItinerary.endAnchor;
          } else if ((panelMode === "builder" || panelMode === "categories") && currentTrip && activeDayNumber) {
            const activeDay = currentTrip.days.find((d: any) => d.dayNumber === activeDayNumber);
            end = activeDay?.endAnchor;
          }
          if (!end?.lat || !end?.lng) return null;
          return (
            <Marker
              longitude={end.lng}
              latitude={end.lat}
              anchor="bottom"
              draggable={!(end as any).service}
              onDragEnd={(e) => {
                if (currentTrip && activeDayNumber) {
                  const newDays = currentTrip.days.map((d: any) =>
                    d.dayNumber === activeDayNumber
                      ? { ...d, endAnchor: { ...d.endAnchor, lat: e.lngLat.lat, lng: e.lngLat.lng } }
                      : d
                  )
                  setCurrentTrip({ ...currentTrip, days: newDays })
                }
              }}
            >
              <div
                className={cn("group/end flex flex-col items-center", !(end as any).service ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")}
                title="End location"
                onClick={e => {
                  e.stopPropagation()
                  mapRef.current?.flyTo({ center: [end.lng as number, end.lat as number], zoom: 14, pitch: 0, duration: 1200, essential: true })
                }}
              >
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-black/20 blur-[3px] rounded-full" />
                <div className="relative flex flex-col items-center z-10 transition-transform group-hover/end:-translate-y-1">
                  <div className="bg-rose-600 text-white px-3 py-1.5 rounded-full shadow-xl border-[2.5px] border-white flex items-center gap-1.5">
                    {(end as any).type === 'HOTEL' ? <Bed className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    <span className="text-[11px] font-bold tracking-wide">{(end as any).type === 'HOTEL' ? 'BED' : 'END'}</span>
                  </div>
                  {(end as any).title && (
                    <div className="mt-0.5 bg-white/95 backdrop-blur-sm text-slate-800 text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm max-w-[110px] truncate text-center border border-slate-100">
                      {(end as any).title}
                    </div>
                  )}
                  <div className="w-2.5 h-2.5 bg-rose-600 rotate-45 -mt-1.5 border-r-[2.5px] border-b-[2.5px] border-white" />
                </div>
              </div>
            </Marker>
          );
        })()}

        {/* Itinerary waypoint markers */}
        {itineraryMarkers.map(({ pick, idx }: { pick: any, idx: number }) => {
          const style = getCategoryStyle(pick.category);
          const isSelected = selectedId === pick.id;
          const Icon = style.icon;

          return (
            <Marker key={`itin-${idx}`} longitude={pick.lng as number} latitude={pick.lat as number} anchor="bottom"
              onClick={e => { e.originalEvent.stopPropagation(); setPopupBusiness(pick); onSelectBusiness(pick.id); }}
            >
              <div
                className="cursor-pointer transition-all duration-300 relative flex flex-col items-center"
                style={{ transform: isSelected ? "scale(1.25)" : "scale(1)", zIndex: isSelected ? 50 : 10 }}
              >
                {/* Number Badge */}
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center border-2 border-white z-20 shadow-md">
                  {idx + 1}
                </div>

                {/* Apple-style shadow blob */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-[2px] rounded-full" />

                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-[2.5px] border-white transition-all ${isSelected ? "ring-[3px] ring-white/50" : ""}`}
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {/* Pointer tip */}
                <div className="w-1.5 h-1.5 -mt-1 rotate-45 border-r-[2.5px] border-b-[2.5px] border-white" style={{ backgroundColor: style.bg }} />
              </div>
            </Marker>
          )
        })}
        {/* Regular business markers — hidden in itinerary mode */}
        {(panelMode !== "itinerary") && validBusinesses.map((business, index) => {
          const style = getCategoryStyle(business.category);
          const isSelected = selectedId === business.id;
          const Icon = style.icon;

          return (
            <Marker
              key={`${business.id}-${index}`}
              longitude={business.lng}
              latitude={business.lat}
              anchor="bottom"
              onClick={e => { e.originalEvent.stopPropagation(); setPopupBusiness(business); onSelectBusiness(business.id); }}
            >
              <div
                className={cn(
                  "cursor-pointer transition-all duration-300 relative flex flex-col items-center animate-in zoom-in fade-in slide-in-from-bottom-4",
                  isSelected ? "scale-125 z-50" : "scale-100 z-10",
                  (panelMode === "categories" && (business as any).isItineraryItem && !(business as any).isLibraryItem) ? "opacity-50 grayscale hover:opacity-100 hover:grayscale-0" : ""
                )}
                style={{ animationDuration: `${300 + (index % 10) * 50}ms` }}
              >
                {/* Apple-style shadow blob */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 blur-[2px] rounded-full" />
                
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-[2.5px] border-white transition-all ${isSelected ? "ring-[3px] ring-white/50" : ""}`}
                  style={{ backgroundColor: style.bg }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                {/* Pointer tip */}
                <div className="w-1.5 h-1.5 -mt-1 rotate-45 border-r-[2.5px] border-b-[2.5px] border-white" style={{ backgroundColor: style.bg }} />
              </div>
            </Marker>
          );
        })}

        {popupBusiness && (popupBusiness as any).lng != null && (popupBusiness as any).lat != null && !isNaN((popupBusiness as any).lng) && !isNaN((popupBusiness as any).lat) && (
          <Popup
            anchor="bottom" longitude={(popupBusiness as any).lng as number} latitude={(popupBusiness as any).lat as number}
            onClose={() => setPopupBusiness(null)} maxWidth="280px"
            closeButton={false} closeOnClick={false} className="z-50" offset={32}
          >
            {(popupBusiness as any).category === 'NOTE' ? (
              <div className="w-48 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Waypoint</span>
                </div>
                <p className="text-sm font-medium leading-snug">
                  {(popupBusiness as any).name || (popupBusiness as any).title}
                </p>
              </div>
            ) : (
              <div className="w-[280px] p-2 bg-white rounded-2xl shadow-xl border border-white/20" onClick={e => e.stopPropagation()}>
                <BusinessCard business={popupBusiness as Business} orientation="vertical" hideActions={panelMode === "itinerary"} />
              </div>
            )}
          </Popup>
        )}

        <NavigationControl 
          position="bottom-right" 
          showCompass={false} 
          style={{ position: 'absolute', right: controlsRightOffset, bottom: '80px', transition: 'right 0.3s ease-in-out' }} 
        />
        <GeolocateControl 
          position="bottom-right" 
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
          showUserHeading={true}
          style={{ position: 'absolute', right: controlsRightOffset, bottom: '20px', transition: 'right 0.3s ease-in-out' }}
        />
      </Map>

      {/* Multi-Day Legend (Builder Mode) */}
      {panelMode === "builder" && completedDays.length > 0 && (
        <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/50 w-48 pointer-events-auto">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Itinerary Trace</h4>
          <div className="space-y-2.5">
            {completedDays.map((day: any) => {
              const DAY_COLORS = ["#007AFF", "#FF9500", "#34C759", "#AF52DE", "#FF2D55", "#5856D6"];
              const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
              return (
                <button 
                  key={day.dayNumber} 
                  onClick={() => setActiveDayNumber(day.dayNumber)}
                  className={`w-full flex items-center justify-between gap-3 text-left transition-all hover:translate-x-1 ${day.isActive ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-100'}`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-3.5 h-3.5 rounded-full shadow-inner transition-all ${day.isActive ? 'ring-2 ring-offset-2 ring-slate-900/10' : ''}`} 
                      style={{ backgroundColor: color }} 
                    />
                    <span className={`text-sm transition-colors ${day.isActive ? 'text-slate-900 font-bold' : 'text-slate-600 font-medium'}`}>
                      Day {day.dayNumber}
                    </span>
                  </div>
                  {day.isActive && <div className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Floating Style Switcher - Apple Style */}
      <div 
        className="absolute top-4 z-20 flex flex-col gap-2 transition-all duration-300"
        style={{ right: controlsRightOffset }}
      >
        <button
          onClick={() => setMapMode(mapMode === "satellite" ? "planning" : "satellite")}
          className="w-10 h-10 bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 rounded-full shadow-lg border border-white/50 flex items-center justify-center transition-all active:scale-95"
          title={mapMode === "satellite" ? "Switch to Map" : "Switch to Satellite"}
        >
          {mapMode === "satellite" ? <Layers className="w-4 h-4" /> : <Navigation className="w-4 h-4 text-rose-600" />}
        </button>
      </div>

      <div className="absolute bottom-1 left-2 z-10 text-[9px] text-slate-400/40 pointer-events-none uppercase tracking-tighter">
        Vallecito OS × Apple Maps Style
      </div>

      {mapClickMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 bg-slate-900/90 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-xl backdrop-blur-sm pointer-events-none select-none">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
          Click map to set {mapClickMode === 'start' ? 'Starting Point' : mapClickMode === 'end' ? 'End of Day' : 'Stop Location'} — ESC to cancel
        </div>
      )}
    </div>
  );
}
