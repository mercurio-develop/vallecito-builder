"use client"
import { TripDay, Traveler } from "@prisma/client";
import { TimelineEvent, FullTrip } from "@/lib/types/trip";

import { useRef, useEffect, useMemo, useState } from "react"
import Map, { Marker, NavigationControl, Source, Layer } from "react-map-gl/mapbox"
import type { MapRef } from "react-map-gl/mapbox"
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, Bed, Navigation, Utensils, Mountain, Clock } from "lucide-react"

// Fallback coordinates for Sacred Valley towns
const TOWN_COORDS: Record<string, [number, number]> = {
  "Palacio del Inka": [-71.9839, -13.5186],
  "Tambo del Inka": [-72.1158, -13.3040],
  "Pisac Ruins": [-71.8465, -13.4150],
  "Cusco": [-71.9675, -13.5226],
  "Urubamba": [-72.1167, -13.3047],
  "Ollantaytambo": [-72.2633, -13.2583],
  "Pisac": [-71.8483, -13.4217],
  "Machu Picchu": [-72.5450, -13.1631],
  "Aguas Calientes": [-72.5250, -13.1547]
}

function getCoordsForLocation(locationStr: string | null | undefined): [number, number] {
  if (!locationStr) return TOWN_COORDS["Urubamba"]
  const match = Object.entries(TOWN_COORDS).find(([town]) => locationStr.toLowerCase().includes(town.toLowerCase()))
  return match ? match[1] : TOWN_COORDS["Urubamba"]
}

interface TouristMapProps {
  trip: FullTrip
  activeDayNum: number
  selectedEventId?: string | null
  onEventSelect?: (id: string | null) => void
}

export default function TouristMap({ trip, activeDayNum, selectedEventId, onEventSelect }: TouristMapProps) {
  const mapRef = useRef<MapRef>(null)
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const [mapMode, setMapMode] = useState<"satellite" | "planning">("planning")

  const mapStyle = mapMode === "satellite" 
    ? "mapbox://styles/mapbox/satellite-streets-v12"
    : "mapbox://styles/mapbox/outdoors-v12"

  const activeDay = trip.days.find((d: any) => d.dayNumber === activeDayNum) || trip.days[0]
  
  // Parse events
  const events = useMemo(() => {
    try {
      return JSON.parse(activeDay?.eventsJson || "[]")
    } catch (e) {
      return []
    }
  }, [activeDay])

  // Extract all points for the day
  const { startCoords, sleepCoords, routeCoords, markers } = useMemo(() => {
    let coords: [number, number][] = []
    const ms: Array<{ coords: [number, number], type: string, id: string }> = []
    
    events.forEach((evt: TimelineEvent) => {
      if (evt.type === 'TRANSPORT') {
        const fCoords = (evt.fromLng && evt.fromLat) ? [evt.fromLng, evt.fromLat] as [number, number] : getCoordsForLocation(evt.from);
        const tCoords = (evt.toLng && evt.toLat) ? [evt.toLng, evt.toLat] as [number, number] : getCoordsForLocation(evt.to);
        coords.push(fCoords);
        coords.push(tCoords);
      } else if (evt.type === 'EXPERIENCE') {
        const pt = (evt.lng && evt.lat) ? [evt.lng, evt.lat] as [number, number] : getCoordsForLocation(evt.title);
        coords.push(pt)
        
        const isOverlapping = ms.some(m => Math.abs(m.coords[0] - pt[0]) < 0.0001 && Math.abs(m.coords[1] - pt[1]) < 0.0001);
        const markerPt: [number, number] = isOverlapping ? [pt[0] + 0.001, pt[1] - 0.001] : pt;
        ms.push({ coords: markerPt, type: 'EXPERIENCE', id: evt.id })
      } else if (evt.type === 'MEAL') {
        const pt = (evt.lng && evt.lat) ? [evt.lng, evt.lat] as [number, number] : getCoordsForLocation(evt.title);
        coords.push(pt)
        
        const isOverlapping = ms.some(m => Math.abs(m.coords[0] - pt[0]) < 0.0001 && Math.abs(m.coords[1] - pt[1]) < 0.0001);
        const markerPt: [number, number] = isOverlapping ? [pt[0] - 0.001, pt[1] + 0.001] : pt;
        ms.push({ coords: markerPt, type: 'MEAL', id: evt.id })
      } else if (evt.type === 'STAY') {
        const pt = (evt.lng && evt.lat) ? [evt.lng, evt.lat] as [number, number] : getCoordsForLocation(evt.title);
        coords.push(pt)
        
        const isOverlapping = ms.some(m => Math.abs(m.coords[0] - pt[0]) < 0.0001 && Math.abs(m.coords[1] - pt[1]) < 0.0001);
        const markerPt: [number, number] = isOverlapping ? [pt[0] + 0.0015, pt[1] + 0.0015] : pt;
        ms.push({ coords: markerPt, type: 'STAY', id: evt.id })
      }
    })
    
    if (coords.length === 0) {
      const start = getCoordsForLocation(activeDay?.meetingPoint || activeDay?.dayTheme)
      const sleep = getCoordsForLocation(activeDay?.sleepTown)
      coords = [start, sleep]
    }
    
    const startCoords = coords[0];
    let sleepCoords = coords[coords.length - 1];

    // If start and sleep locations overlap, offset the sleep marker slightly so both are visible
    if (Math.abs(startCoords[0] - sleepCoords[0]) < 0.0001 && Math.abs(startCoords[1] - sleepCoords[1]) < 0.0001) {
      sleepCoords = [sleepCoords[0] + 0.0015, sleepCoords[1] - 0.0015];
    }
    
    return { startCoords, sleepCoords, routeCoords: coords, markers: ms }
  }, [activeDay, events])

  const [routeGeojson, setRouteGeojson] = useState<GeoJSON.Feature<GeoJSON.LineString> | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  useEffect(() => {
    async function fetchDirections() {
      if (!routeCoords || routeCoords.length < 2 || !mapboxToken) {
        setRouteGeojson(null);
        setRouteDuration(null);
        return;
      }

      // Deduplicate coordinates to save waypoints and ensure we stay under the 25 limit for driving
      const uniqueCoords = routeCoords.filter((coord, i) => {
        if (i === 0) return true;
        const prev = routeCoords[i - 1];
        return Math.abs(coord[0] - prev[0]) > 0.0001 || Math.abs(coord[1] - prev[1]) > 0.0001;
      }).slice(0, 25);

      if (uniqueCoords.length < 2) {
        setRouteGeojson(null);
        setRouteDuration(null);
        return;
      }

      const coordsStr = uniqueCoords.map(c => `${c[0]},${c[1]}`).join(';');
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${mapboxToken}`;

      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeojson({
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          });
          setRouteDuration(route.duration);
        } else {
          throw new Error("No route found");
        }
      } catch (err) {
        console.error("Failed to fetch directions", err);
        // Fallback to straight lines
        setRouteGeojson({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: uniqueCoords
          }
        });
        setRouteDuration(null);
      }
    }
    fetchDirections();
  }, [routeCoords, mapboxToken]);

  // Fly to active day bounds
  useEffect(() => {
    if (!mapRef.current || routeCoords.length === 0) return

    let minLng = routeCoords[0][0]
    let maxLng = routeCoords[0][0]
    let minLat = routeCoords[0][1]
    let maxLat = routeCoords[0][1]
    
    for (const [lng, lat] of routeCoords) {
      if (lng < minLng) minLng = lng
      if (lng > maxLng) maxLng = lng
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    
    // Check if points are exactly the same
    if (minLng === maxLng && minLat === maxLat) {
      mapRef.current.flyTo({ center: [minLng, minLat], zoom: 12, pitch: 0, duration: 2000 })
      return
    }

    // Add padding
    minLng -= 0.05; maxLng += 0.05
    minLat -= 0.05; maxLat += 0.05

    mapRef.current.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: 100, duration: 2000, pitch: 0 }
    )
  }, [routeCoords])

  // Fly to selected event
  useEffect(() => {
    if (!mapRef.current || !selectedEventId) return
    
    if (selectedEventId === 'start') {
      mapRef.current.flyTo({ center: startCoords, zoom: 15, pitch: mapMode === "satellite" ? 60 : 0, duration: 1500 })
      return
    }
    
    if (selectedEventId === 'end') {
      mapRef.current.flyTo({ center: sleepCoords, zoom: 15, pitch: mapMode === "satellite" ? 60 : 0, duration: 1500 })
      return
    }

    const marker = markers.find(m => m.id === selectedEventId)
    if (marker) {
      mapRef.current.flyTo({ center: marker.coords, zoom: 15, pitch: mapMode === "satellite" ? 60 : 0, duration: 1500 })
    } else {
      const evt = events.find((e: any) => e.id === selectedEventId);
      if (evt && evt.type === 'TRANSPORT') {
        const startLng = (evt as any).fromLng;
        const startLat = (evt as any).fromLat;
        const endLng = (evt as any).toLng;
        const endLat = (evt as any).toLat;
        if (startLng && startLat && endLng && endLat) {
          const minLng = Math.min(startLng, endLng);
          const maxLng = Math.max(startLng, endLng);
          const minLat = Math.min(startLat, endLat);
          const maxLat = Math.max(startLat, endLat);
          
          const lngPad = Math.abs(maxLng - minLng) * 0.2 || 0.05;
          const latPad = Math.abs(maxLat - minLat) * 0.2 || 0.05;

          mapRef.current.fitBounds(
            [[minLng - lngPad, minLat - latPad], [maxLng + lngPad, maxLat + latPad]],
            { padding: 80, duration: 1200 }
          );
        }
      }
    }
  }, [selectedEventId, markers, events, startCoords, sleepCoords, mapMode])

  if (!mapboxToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white/40">
        <p>Mapbox Token Missing</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative bg-slate-100">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: startCoords[0],
          latitude: startCoords[1],
          zoom: 11,
          pitch: mapMode === "satellite" ? 60 : 0
        }}
        mapStyle={mapStyle}
        mapboxAccessToken={mapboxToken}
        terrain={mapMode === "satellite" ? { source: "mapbox-dem", exaggeration: 1.5 } : undefined}
      >
        <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
        {mapMode === "satellite" && <Layer id="sky" type="sky" paint={{ "sky-type": "atmosphere", "sky-atmosphere-sun": [0.0, 0.0], "sky-atmosphere-sun-intensity": 15 }} />}
        
        {/* Route Line */}
        {routeGeojson && (
          <Source id="day-route" type="geojson" data={routeGeojson}>
            <Layer 
              id="route-line-glow" 
              type="line" 
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.4, "line-blur": 4 }} 
            />
            <Layer 
              id="route-line" 
              type="line" 
              layout={{ "line-join": "round", "line-cap": "round" }}
              paint={{ "line-color": "#f43f5e", "line-width": 3, "line-dasharray": [2, 2] }} 
            />
          </Source>
        )}

        {/* Dynamic Markers */}
        {markers.map((m) => (
          <Marker key={m.id} longitude={m.coords[0]} latitude={m.coords[1]} anchor="bottom">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                onEventSelect?.(selectedEventId === m.id ? null : m.id);
              }}
              className={`relative flex flex-col items-center group transition-transform hover:-translate-y-1 cursor-pointer z-10 ${selectedEventId === m.id ? 'scale-110' : ''}`}
            >
              <div className="absolute bottom-0 w-4 h-1 bg-black/40 blur-[2px] rounded-full" />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10 ${m.type === 'MEAL' ? 'bg-amber-500' : m.type === 'STAY' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                {m.type === 'MEAL' ? <Utensils className="w-4 h-4 text-white" /> : m.type === 'STAY' ? <Bed className="w-4 h-4 text-white" /> : <Mountain className="w-4 h-4 text-white" />}
              </div>
              <div className={`w-1.5 h-1.5 -mt-1 rotate-45 border-r-2 border-b-2 border-white z-10 ${m.type === 'MEAL' ? 'bg-amber-500' : m.type === 'STAY' ? 'bg-indigo-600' : 'bg-emerald-500'}`} />
            </div>
          </Marker>
        ))}

        {/* Start Anchor */}
        <Marker longitude={startCoords[0]} latitude={startCoords[1]} anchor="bottom">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onEventSelect?.(selectedEventId === 'start' ? null : 'start');
            }} 
            className="relative flex flex-col items-center group transition-transform hover:-translate-y-1 cursor-pointer z-20"
          >
            <div className="absolute bottom-0 w-6 h-2 bg-black/30 blur-[3px] rounded-full" />
            <div className={`text-white px-3 py-1.5 rounded-full shadow-xl border-2 flex items-center gap-1.5 z-10 transition-colors ${selectedEventId === 'start' ? 'bg-rose-600 border-white scale-110' : 'bg-slate-900 border-white'}`}>
              <Navigation className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-wide">START</span>
            </div>
            <div className={`w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white z-10 transition-colors ${selectedEventId === 'start' ? 'bg-rose-600' : 'bg-slate-900'}`} />
          </div>
        </Marker>

        {/* End Anchor (Rest) */}
        <Marker longitude={sleepCoords[0]} latitude={sleepCoords[1]} anchor="bottom">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onEventSelect?.(selectedEventId === 'end' ? null : 'end');
            }} 
            className="relative flex flex-col items-center group transition-transform hover:-translate-y-1 cursor-pointer z-20"
          >
            <div className="absolute bottom-0 w-6 h-2 bg-black/30 blur-[3px] rounded-full" />
            <div className={`text-white px-3 py-1.5 rounded-full shadow-xl border-2 flex items-center gap-1.5 z-10 transition-colors ${selectedEventId === 'end' ? 'bg-rose-600 border-white scale-110' : 'bg-indigo-600 border-white'}`}>
              <Bed className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold tracking-wide">REST</span>
            </div>
            <div className={`w-2.5 h-2.5 rotate-45 -mt-1.5 border-r-2 border-b-2 border-white z-10 transition-colors ${selectedEventId === 'end' ? 'bg-rose-600' : 'bg-indigo-600'}`} />
          </div>
        </Marker>

        <NavigationControl position="top-right" showCompass={false} />
      </Map>
      
      {/* Route Duration Badge */}
      {routeDuration !== null && routeGeojson && (
        <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Drive Time</span>
            <span className="text-sm font-bold text-slate-700">
              {Math.floor(routeDuration / 3600) > 0 ? `${Math.floor(routeDuration / 3600)}h ` : ''}
              {Math.floor((routeDuration % 3600) / 60)}m
            </span>
          </div>
        </div>
      )}

      <div className="absolute top-4 right-14 z-20 flex bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
        <button onClick={() => setMapMode("planning")} className={`px-3 py-1.5 text-xs font-semibold ${mapMode === "planning" ? "bg-blue-50 text-blue-600" : "text-slate-500 hover:bg-slate-50"}`}>2D</button>
        <button onClick={() => setMapMode("satellite")} className={`px-3 py-1.5 text-xs font-semibold ${mapMode === "satellite" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50"}`}>3D</button>
      </div>

      {/* Overlay gradient for readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/20 to-transparent" />
    </div>
  )
}
