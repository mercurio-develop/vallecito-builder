"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import type { OptimizedPlan } from '@/lib/ai/schemas/planner-schema';
import type { Business } from "@prisma/client";
import type { UniversalTrip, TimelineEvent, TripDay } from '@/lib/types/trip';
import posthog from 'posthog-js';
import { usePreferences } from '@/features/pro-builder/store/preferences-context';

import { COORDS_MAP, DEFAULT_COORDS } from "@/lib/constants";

type PanelMode = "categories" | "itinerary" | "macro" | "builder" | "route";
type ViewState = "wizard" | "workspace" | "checkout";

interface TripContextType {
  activeItinerary: OptimizedPlan | null;
  setActiveItinerary: (i: OptimizedPlan | null) => void;
  macroTrip: any | null;
  setMacroTrip: (trip: any | null) => void;
  currentTrip: UniversalTrip | null;
  setCurrentTrip: (trip: UniversalTrip | null) => void;
  panelMode: PanelMode;
  setPanelMode: (mode: PanelMode) => void;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeDayNumber: number | null;
  setActiveDayNumber: (day: number | null) => void;
  isEditMode: boolean;
  setIsEditMode: (edit: boolean) => void;
  leftWidth: number;
  setLeftWidth: (w: number) => void;
  addEvent: (dayNumber: number, event: TimelineEvent) => void;
  removeEvent: (dayNumber: number, eventId: string) => void;
  updateEvent: (dayNumber: number, eventId: string, updates: Partial<TimelineEvent>) => void;
  insertWaypoint: (service: Business) => boolean;
  removeWaypoint: (index: number) => void;
  moveWaypoint: (fromIndex: number, toIndex: number) => void;
  swapDriverAlternative: (edgeIndex: number, altIndex: number) => void;
  truncateAfterWaypoint: (index: number) => void;
  setStartAnchorLocation: (lat: number, lng: number, title?: string) => void;
  updateEndAnchorLocation: (lat: number, lng: number, title?: string) => void;
  createDay: () => void;
  aiPromptToTrigger: string | null;
  setAiPromptToTrigger: (prompt: string | null) => void;
  bookingStatus: 'idle' | 'checking_experiences' | 'checking_transport' | 'payment_required' | 'confirmed' | 'failed';
  entityStatuses: Record<string, 'pending' | 'checking' | 'confirmed' | 'unavailable'>;
  startBookingOrchestration: () => Promise<void>;
  resetBooking: () => void;
  isWorkspaceCollapsed: boolean;
  setIsWorkspaceCollapsed: (collapsed: boolean) => void;
  exchangeTargetIndex: number | null;
  setExchangeTargetIndex: (index: number | null) => void;
  routeData?: any;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const { setIsChatOpen } = usePreferences();
  const [activeItinerary, setActiveItinerary] = useState<OptimizedPlan | null>(null);
  const [macroTrip, setMacroTrip] = useState<any | null>(null);
  const [currentTrip, setCurrentTrip] = useState<UniversalTrip | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("categories");
  const [viewState, setViewState] = useState<ViewState>("wizard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDayNumber, setActiveDayNumber] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const [isWorkspaceCollapsed, setIsWorkspaceCollapsed] = useState(false);
  const [exchangeTargetIndex, setExchangeTargetIndex] = useState<number | null>(null);
  const [aiPromptToTrigger, setAiPromptToTrigger] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'checking_experiences' | 'checking_transport' | 'payment_required' | 'confirmed' | 'failed'>('idle');
  const [entityStatuses, setEntityStatuses] = useState<Record<string, 'pending' | 'checking' | 'confirmed' | 'unavailable'>>({});
  const [hasRequestedFeedback, setHasRequestedFeedback] = useState(false);
  const [routeData, setRouteData] = useState<any | null>(null);

  useEffect(() => {
    if (!currentTrip || activeDayNumber === null) {
      setRouteData(null);
      return;
    }

    const activeDay = currentTrip.days.find(d => d.dayNumber === activeDayNumber);
    if (!activeDay) {
      setRouteData(null);
      return;
    }

    const pts: [number, number][] = [];
    const start = activeDay.startAnchor || activeItinerary?.startAnchor;
    if (start?.lat && start?.lng) pts.push([start.lng, start.lat]);
    
    // Add all events with lat/lng, including mapped waypoints from activeItinerary
    const eventsToMap = activeDay.events.length > 0 ? activeDay.events : (activeItinerary?.waypoints || []);
    
    for (const evt of eventsToMap) {
      const lat = evt.lat ?? (evt as any).locationLat ?? (evt as any).service?.lat;
      const lng = evt.lng ?? (evt as any).locationLng ?? (evt as any).service?.lng;
      if (lat && lng) pts.push([lng, lat]);
    }
    
    const end = activeDay.endAnchor || activeItinerary?.endAnchor;
    if (end?.lat && end?.lng) pts.push([end.lng, end.lat]);

    if (pts.length < 2) {
      setRouteData(null);
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Mapbox token missing");
      return;
    }

    // Use driving profile by default
    const coordsStr = pts.map(p => `${p[0]},${p[1]}`).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${token}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes[0]) {
          setRouteData({
            geometry: data.routes[0].geometry,
            legs: data.routes[0].legs,
            profile: "driving"
          });
        }
      })
      .catch(err => console.error("Mapbox routing error:", err));
  }, [currentTrip, activeDayNumber, activeItinerary]);

  useEffect(() => {
    if (bookingStatus === 'payment_required' && !hasRequestedFeedback) {
      setAiPromptToTrigger("[INTERNAL] The day is secured and ready for payment. Proactively ask the user for feedback on their experience with Vallecito so far and if there's anything to improve.");
      setHasRequestedFeedback(true);
    }
  }, [bookingStatus, hasRequestedFeedback]);

  useEffect(() => {
    if (activeItinerary && !hasRequestedFeedback) {
        const timer = setTimeout(() => {
            setAiPromptToTrigger("[INTERNAL] The user has a plan shaping up. Ask them how they are finding the tool so far and if I can be more helpful in any way.");
            setHasRequestedFeedback(true);
        }, 10 * 60 * 1000);
        return () => clearTimeout(timer);
    }
  }, [activeItinerary, hasRequestedFeedback]);

  useEffect(() => {
    if (!activeItinerary) return;
    const dayNum = activeDayNumber || 1;

    const mappedEvents = activeItinerary.waypoints.map(w => ({
      id: w.id,
      type: (w.category?.toUpperCase() === 'STAY' || w.category?.toUpperCase() === 'STAYS')
        ? 'STAY' as const
        : w.category?.toUpperCase() === 'DINING'
          ? 'MEAL' as const
          : 'EXPERIENCE' as const,
      startTime: (w as any).startTime || '10:00',
      title: w.title,
      lat: w.lat,
      lng: w.lng,
      priceUsd: w.priceUsd,
    }));

    if (activeDayNumber === null) {
      setActiveDayNumber(dayNum);
    }

    setCurrentTrip(prev => {
      if (!prev) {
        return {
          title: activeItinerary.title || 'AI Planned Trip',
          startDate: new Date(),
          endDate: new Date(),
          paxCount: 1,
          status: 'DRAFT',
          days: [{ dayNumber: dayNum, date: new Date(), events: mappedEvents }],
        };
      }
      const hasDay = prev.days.some(d => d.dayNumber === dayNum);
      return {
        ...prev,
        days: hasDay
          ? prev.days.map(d =>
              d.dayNumber === dayNum ? { ...d, events: mappedEvents } : d
            )
          : [...prev.days, { dayNumber: dayNum, date: new Date(), events: mappedEvents }],
      };
    });
  }, [activeItinerary, activeDayNumber]);

  const addEvent = useCallback((dayNumber: number, event: TimelineEvent) => {
    setCurrentTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== dayNumber) return day;
          return {
            ...day,
            events: [...day.events, event].sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
          };
        })
      };
    });
  }, []);

  const removeEvent = useCallback((dayNumber: number, eventId: string) => {
    setCurrentTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== dayNumber) return day;
          return {
            ...day,
            events: day.events.filter(e => e.id !== eventId)
          };
        })
      };
    });
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      const newWaypoints = [...prev.waypoints];
      newWaypoints.splice(index, 1);

      const newTransitEdges = [...prev.transitEdges];
      newTransitEdges.splice(index, 1);

      if (newTransitEdges[index]) {
          const prevLoc = index === 0 ? prev.startAnchor.locationStr : newWaypoints[index-1].locationStr;
          newTransitEdges[index] = {
              ...newTransitEdges[index],
              fromLocation: prevLoc
          };
      }

      return {
        ...prev,
        waypoints: newWaypoints,
        transitEdges: newTransitEdges,
        totalCost: newWaypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + newTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
      };
    });
  }, []);

  const moveWaypoint = useCallback((fromIndex: number, toIndex: number) => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      const newWaypoints = [...prev.waypoints];
      const [moved] = newWaypoints.splice(fromIndex, 1);
      newWaypoints.splice(toIndex, 0, moved);

      const nodes = [
        { locationStr: prev.startAnchor.locationStr },
        ...newWaypoints.map(w => ({ locationStr: w.locationStr })),
        { locationStr: prev.endAnchor.locationStr }
      ];

      const newTransitEdges = nodes.slice(0, -1).map((node, i) => {
        const existing = prev.transitEdges.find(e => e.fromLocation === node.locationStr && e.toLocation === nodes[i+1].locationStr);
        if (existing) return existing;

        return {
          fromLocation: node.locationStr,
          toLocation: nodes[i+1].locationStr,
          defaultDriver: { name: 'Sacred Valley Transfers', priceUsd: 15 },
          alternativeDrivers: []
        };
      });

      return {
        ...prev,
        waypoints: newWaypoints,
        transitEdges: newTransitEdges,
        totalCost: newWaypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + newTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
      };
    });
  }, []);

  const swapDriverAlternative = useCallback((edgeIndex: number, altIndex: number) => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      const newTransitEdges = [...prev.transitEdges];
      const edge = newTransitEdges[edgeIndex];
      if (!edge || !edge.alternativeDrivers) return prev;

      const newAlt = edge.alternativeDrivers[altIndex];
      const oldDefault = edge.defaultDriver;

      const newAlts = [...edge.alternativeDrivers];
      newAlts.splice(altIndex, 1);
      newAlts.push(oldDefault);

      newTransitEdges[edgeIndex] = {
        ...edge,
        defaultDriver: newAlt,
        alternativeDrivers: newAlts
      };

      return {
        ...prev,
        transitEdges: newTransitEdges,
        totalCost: prev.waypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + newTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
      };
    });
  }, []);

  const truncateAfterWaypoint = useCallback((index: number) => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      const newWaypoints = prev.waypoints.slice(0, index + 1);
      const newTransitEdges = prev.transitEdges.slice(0, index + 1);

      const lastWp = newWaypoints[newWaypoints.length - 1];

      return {
        ...prev,
        waypoints: newWaypoints,
        transitEdges: newTransitEdges,
        endAnchor: {
          ...prev.endAnchor,
          title: lastWp.title,
          locationStr: lastWp.locationStr,
          lat: lastWp.lat,
          lng: lastWp.lng
        },
        totalCost: newWaypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + newTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
      };
    });
  }, []);

  const setStartAnchorLocation = useCallback((lat: number, lng: number, title: string = "Current Location") => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        startAnchor: {
          ...prev.startAnchor,
          lat,
          lng,
          locationStr: title,
          title: title
        }
      };
    });
  }, []);

  const updateEndAnchorLocation = useCallback((lat: number, lng: number, title: string = "Custom End Location") => {
    setActiveItinerary(prev => {
      if (!prev) return null;
      return {
        ...prev,
        endAnchor: {
          ...prev.endAnchor,
          lat,
          lng,
          locationStr: title,
          title: title
        }
      };
    });
  }, []);

  const createDay = useCallback(() => {
    setCurrentTrip(prev => {
      if (!prev) return null;
      const nextDayNumber = prev.days.length + 1;

      const newDay: TripDay = {
        dayNumber: nextDayNumber,
        date: new Date(prev.startDate.getTime() + (nextDayNumber - 1) * 24 * 60 * 60 * 1000),
        events: []
      };

      setTimeout(() => setActiveDayNumber(nextDayNumber), 0);

      return {
        ...prev,
        days: [...prev.days, newDay]
      };
    });
  }, [setActiveDayNumber]);

  const resetBooking = useCallback(() => {
    setBookingStatus('idle');
    setEntityStatuses({});
  }, []);

  const startBookingOrchestration = useCallback(async () => {
    if (!activeItinerary) return;

    posthog.capture('orchestration_started', {
        itinerary_title: activeItinerary.title,
        waypoints_count: activeItinerary.waypoints.length,
        total_cost: activeItinerary.totalCost
    });

    setBookingStatus('checking_experiences');
    const initialStatuses: Record<string, 'pending' | 'checking' | 'confirmed' | 'unavailable'> = {};
    activeItinerary.waypoints.forEach(w => {
      initialStatuses[w.id] = 'pending';
    });
    activeItinerary.transitEdges.forEach((e, i) => {
      initialStatuses[`transit-${i}`] = 'pending';
    });
    setEntityStatuses(initialStatuses);

    for (const wp of activeItinerary.waypoints) {
      setEntityStatuses(prev => ({ ...prev, [wp.id]: 'checking' }));
      await new Promise(resolve => setTimeout(resolve, 1500));
      setEntityStatuses(prev => ({ ...prev, [wp.id]: 'confirmed' }));
    }

    setBookingStatus('checking_transport');
    for (let i = 0; i < activeItinerary.transitEdges.length; i++) {
      const edgeId = `transit-${i}`;
      setEntityStatuses(prev => ({ ...prev, [edgeId]: 'checking' }));
      await new Promise(resolve => setTimeout(resolve, 1200));
      setEntityStatuses(prev => ({ ...prev, [edgeId]: 'confirmed' }));
    }

    setBookingStatus('payment_required');
  }, [activeItinerary]);

  const updateEvent = useCallback((dayNumber: number, eventId: string, updates: Partial<TimelineEvent>) => {
    setCurrentTrip(prev => {
      if (!prev) return null;
      return {
        ...prev,
        days: prev.days.map(day => {
          if (day.dayNumber !== dayNumber) return day;
          return {
            ...day,
            events: day.events.map(e => e.id === eventId ? { ...e, ...updates } as TimelineEvent : e)
              .sort((a, b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"))
          };
        })
      };
    });
  }, []);

  const insertWaypoint = useCallback((service: Business): boolean => {
    const dayNum = activeDayNumber || 1;
    const isTransport = service.category?.toUpperCase() === 'TRANSPORT';
    const isStay = service.category?.toUpperCase() === 'LODGING' || service.category?.toUpperCase() === 'STAYS';
    const isMeal = service.category?.toUpperCase() === 'DINING';

    if (exchangeTargetIndex !== null) {
      if (exchangeTargetIndex === -1) {
        if (activeItinerary) {
          const startLocName = service.locationSlug
            ? service.locationSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : service.name;
          setActiveItinerary({
            ...activeItinerary,
            startAnchor: {
              ...activeItinerary.startAnchor,
              title: service.name,
              locationStr: startLocName,
              lat: service.lat || undefined,
              lng: service.lng || undefined,
              service: service,
            },
          });
        }
        if (currentTrip) {
          const newDays = currentTrip.days.map((d: any) =>
            d.dayNumber === dayNum
              ? { ...d, startAnchor: { ...d.startAnchor, title: service.name, lat: service.lat || undefined, lng: service.lng || undefined, service } }
              : d
          );
          setCurrentTrip({ ...currentTrip, days: newDays });
        }
        setExchangeTargetIndex(null);
        setPanelMode(currentTrip && !activeItinerary ? 'builder' : (panelMode === 'categories' ? 'itinerary' : panelMode));
        return false;
      }
      if (exchangeTargetIndex === -2) {
        if (activeItinerary) {
          const endLocName = service.locationSlug
            ? service.locationSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            : service.name;
          setActiveItinerary({
            ...activeItinerary,
            endAnchor: {
              ...activeItinerary.endAnchor,
              title: service.name,
              locationStr: endLocName,
              lat: service.lat || undefined,
              lng: service.lng || undefined,
              service: service,
            },
          });
        }
        if (currentTrip) {
          const newDays = currentTrip.days.map((d: any) =>
            d.dayNumber === dayNum
              ? { ...d, endAnchor: { ...d.endAnchor, title: service.name, lat: service.lat || undefined, lng: service.lng || undefined, service } }
              : d
          );
          setCurrentTrip({ ...currentTrip, days: newDays });
        }
        setExchangeTargetIndex(null);
        setPanelMode(currentTrip && !activeItinerary ? 'builder' : (panelMode === 'categories' ? 'itinerary' : panelMode));
        return false;
      }

      if (exchangeTargetIndex >= 0) {
        if (activeItinerary) {
            const newWp = {
                id: crypto.randomUUID(),
                category: service.category,
                title: service.name,
                locationStr: service.name,
                durationMins: 120,
                priceUsd: 0,
                lat: service.lat || undefined,
                lng: service.lng || undefined,
                rating: service.rating || undefined,
                service: service
            };

            const updatedWaypoints = [...activeItinerary.waypoints];
            updatedWaypoints[exchangeTargetIndex] = newWp;

            const updatedTransitEdges = [...activeItinerary.transitEdges];
            if (exchangeTargetIndex < updatedTransitEdges.length) {
                 updatedTransitEdges[exchangeTargetIndex].toLocation = service.name;
            }
            if (exchangeTargetIndex + 1 < updatedTransitEdges.length) {
                 updatedTransitEdges[exchangeTargetIndex + 1].fromLocation = service.name;
            }

            setActiveItinerary({
                ...activeItinerary,
                waypoints: updatedWaypoints,
                transitEdges: updatedTransitEdges,
                totalCost: updatedWaypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + updatedTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
            });
        }

        if (currentTrip) {
          const activeDay = currentTrip.days.find(d => d.dayNumber === dayNum);
          if (activeDay && activeDay.events[exchangeTargetIndex]) {
            const targetEvent = activeDay.events[exchangeTargetIndex];

            let newType: "EXPERIENCE" | "MEAL" | "STAY" | "TRANSPORT" | "NOTE" = 'EXPERIENCE';
            if (isTransport) newType = 'TRANSPORT';
            else if (isStay) newType = 'STAY';
            else if (isMeal) newType = 'MEAL';

            updateEvent(dayNum, targetEvent.id, {
              title: service.name,
              type: newType,
              lat: service.lat || undefined,
              lng: service.lng || undefined,
              service: service as any
            });
          }
        }

        setExchangeTargetIndex(null);
        setPanelMode("itinerary");
        return false;
      }
      setExchangeTargetIndex(null);
    }

    let calculatedStartTime = '10:00';
    if (currentTrip && dayNum) {
      const activeDay = currentTrip.days.find((d: any) => d.dayNumber === dayNum);
      if (activeDay && activeDay.events && activeDay.events.length > 0) {
        const lastEvent = activeDay.events[activeDay.events.length - 1];
        if (lastEvent.startTime) {
          const [hours, minutes] = lastEvent.startTime.split(':').map(Number);
          const nextHours = Math.min(23, hours + 2);
          calculatedStartTime = `${nextHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }
      }
    }

    let newEvent: TimelineEvent;

    if (isTransport) {
      newEvent = {
        id: service.id,
        type: 'TRANSPORT',
        method: 'CAR',
        from: 'Current Location',
        to: service.name,
        startTime: calculatedStartTime,
        title: service.name,
        service: service
      };
    } else if (isStay) {
      newEvent = {
        id: service.id,
        type: 'STAY',
        startTime: calculatedStartTime,
        title: service.name,
        lat: service.lat || undefined,
        lng: service.lng || undefined,
        service: service
      };
    } else if (isMeal) {
      newEvent = {
        id: service.id,
        type: 'MEAL',
        startTime: calculatedStartTime,
        title: service.name,
        lat: service.lat || undefined,
        lng: service.lng || undefined,
        service: service
      };
    } else {
      newEvent = {
        id: service.id,
        type: 'EXPERIENCE',
        startTime: calculatedStartTime,
        title: service.name,
        lat: service.lat || undefined,
        lng: service.lng || undefined,
        service: service
      };
    }

    if (activeItinerary) {
        const newWp = {
            id: service.id,
            category: service.category,
            title: service.name,
            locationStr: service.name,
            durationMins: 120,
            priceUsd: 0,
            lat: service.lat || undefined,
            lng: service.lng || undefined,
            rating: service.rating || undefined,
            service: service
        };

        const updatedWaypoints = [...activeItinerary.waypoints, newWp];
        const prevLoc = activeItinerary.waypoints.length > 0
            ? activeItinerary.waypoints[activeItinerary.waypoints.length - 1].locationStr
            : activeItinerary.startAnchor.locationStr;

        const newEdge = {
            fromLocation: prevLoc,
            toLocation: service.name,
            defaultDriver: { name: 'Sacred Valley Transfers', priceUsd: 15 },
            alternativeDrivers: []
        };

        const updatedTransitEdges = [...activeItinerary.transitEdges];
        if (updatedTransitEdges.length > activeItinerary.waypoints.length) {
            const returnEdge = updatedTransitEdges.pop()!;
            updatedTransitEdges.push(newEdge);
            updatedTransitEdges.push({
                ...returnEdge,
                fromLocation: service.name
            });
        } else {
            updatedTransitEdges.push(newEdge);
        }

        setActiveItinerary({
            ...activeItinerary,
            waypoints: updatedWaypoints,
            transitEdges: updatedTransitEdges,
            totalCost: updatedWaypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + updatedTransitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
        });

        posthog.capture('waypoint_added', {
            business_id: service.id,
            business_name: service.name,
            category: service.category,
            itinerary_depth: updatedWaypoints.length
        });
    } else {
        const newItin: OptimizedPlan = {
            title: "New Expedition",
            startAnchor: {
                title: "Urubamba",
                locationStr: "Urubamba",
                type: 'GENERIC_TOWN',
                lat: COORDS_MAP.urubamba.lat,
                lng: COORDS_MAP.urubamba.lng,
                time: "09:00"
            },
            endAnchor: {
                title: "Urubamba",
                locationStr: "Urubamba",
                type: 'GENERIC_TOWN',
                lat: COORDS_MAP.urubamba.lat,
                lng: COORDS_MAP.urubamba.lng,
                time: "18:00"
            },
            waypoints: [{
                id: newEvent.id,
                category: service.category,
                title: service.name,
                locationStr: service.name,
                durationMins: 120,
                priceUsd: 0,
                lat: service.lat || undefined,
                lng: service.lng || undefined,
                rating: service.rating || undefined
            }],
            transitEdges: [
                {
                    fromLocation: "Urubamba",
                    toLocation: service.name,
                    defaultDriver: { name: 'Sacred Valley Transfers', priceUsd: 15 },
                    alternativeDrivers: []
                },
                {
                    fromLocation: service.name,
                    toLocation: "Urubamba",
                    defaultDriver: { name: 'Return Transfer', priceUsd: 15 },
                    alternativeDrivers: []
                }
            ],
            needsAccommodationUpsell: true,
            totalCost: 30
        };
        setActiveItinerary(newItin);
    }

    if (!currentTrip) {
        const initialTrip: UniversalTrip = {
            title: "My Expedition",
            startDate: new Date(),
            endDate: new Date(),
            paxCount: 1,
            status: 'DRAFT',
            days: [{
                dayNumber: 1,
                date: new Date(),
                events: [newEvent]
            }]
        };
        setCurrentTrip(initialTrip);
        setActiveDayNumber(1);
    } else {
        addEvent(dayNum, newEvent);
    }

    const isDefaultItin = !activeItinerary || (activeItinerary.startAnchor.title === "Urubamba" && activeItinerary.endAnchor.title === "Urubamba");

    if (isDefaultItin) {
      setAiPromptToTrigger(`[INTERNAL] User added ${service.name} to their day. Acknowledge this and proactively ask where they will start and end their day (Cusco, Pisac, etc.) to establish a route and coordinate transport.`);
    } else {
      setAiPromptToTrigger(`[INTERNAL] User added ${service.name} to their itinerary. Acknowledge this and ask if they need help adjusting their transport stops.`);
    }

    setIsChatOpen(true);
    setPanelMode('itinerary');

    return false;
    }, [activeDayNumber, addEvent, activeItinerary, currentTrip, setIsChatOpen, setActiveItinerary, setPanelMode, panelMode, exchangeTargetIndex, setExchangeTargetIndex, setCurrentTrip, setAiPromptToTrigger]);

  const value = React.useMemo(() => ({
      activeItinerary,
      setActiveItinerary,
      macroTrip,
      setMacroTrip,
      currentTrip,
      setCurrentTrip,
      panelMode,
      setPanelMode,
      viewState,
      setViewState,
      selectedId,
      setSelectedId,
      activeDayNumber,
      setActiveDayNumber,
      isEditMode,
      setIsEditMode,
      leftWidth,
      setLeftWidth,
      addEvent,
      removeEvent,
      removeWaypoint,
      moveWaypoint,
      swapDriverAlternative,
      truncateAfterWaypoint,
      setStartAnchorLocation,
      updateEndAnchorLocation,
      createDay,
      updateEvent,
      insertWaypoint,
      isWorkspaceCollapsed,
      setIsWorkspaceCollapsed,
      exchangeTargetIndex,
      setExchangeTargetIndex,
      aiPromptToTrigger,
      setAiPromptToTrigger,
      bookingStatus,
      entityStatuses,
      startBookingOrchestration,
      resetBooking,
      routeData
  }), [
      activeItinerary, macroTrip, currentTrip, panelMode, viewState, selectedId,
      activeDayNumber, isEditMode, leftWidth, isWorkspaceCollapsed, exchangeTargetIndex,
      aiPromptToTrigger, bookingStatus, entityStatuses, routeData, addEvent, removeEvent,
      removeWaypoint, moveWaypoint, swapDriverAlternative, truncateAfterWaypoint,
      setStartAnchorLocation, updateEndAnchorLocation, createDay, updateEvent,
      insertWaypoint, startBookingOrchestration, resetBooking
  ]);

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip(): TripContextType {
  const trip = useContext(TripContext);

  if (trip === undefined) {
    throw new Error('useTrip must be used within a TripProvider');
  }

  return trip;
}
