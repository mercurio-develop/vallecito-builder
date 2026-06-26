"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { DraftTrip, DraftDay, FullTraveler, TimelineEvent } from "../types"

interface BuilderContextType {
  draftTrip: DraftTrip
  setDraftTrip: React.Dispatch<React.SetStateAction<DraftTrip>>
  updateTripMeta: (meta: Partial<DraftTrip>) => void
  updateDay: (dayNumber: number, updates: Partial<DraftDay>) => void

  // Event Management
  addEventToDay: (dayNumber: number, event: TimelineEvent) => void
  removeEventFromDay: (dayNumber: number, eventId: string) => void
  updateEventInDay: (dayNumber: number, eventId: string, updates: Partial<TimelineEvent>) => void
  moveEvent: (dayNumber: number, eventId: string, direction: -1 | 1) => void

  // View State
  viewState: 'wizard' | 'workspace' | 'checkout'
  setViewState: (state: 'wizard' | 'workspace' | 'checkout') => void
  activeDayNumber: number | null
  setActiveDayNumber: (day: number | null) => void

  resetBuilder: () => void
}

const initialDraftTrip: DraftTrip = {
  title: "",
  startDate: "",
  endDate: "",
  paxCount: 1,
  days: [],
  travelers: [],
  clientNotes: "",
  internalNotes: "",
}
const BuilderContext = createContext<BuilderContextType | undefined>(undefined)

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [draftTrip, setDraftTrip] = useState<DraftTrip>(initialDraftTrip)
  const [viewState, setViewState] = useState<'wizard' | 'workspace' | 'checkout'>('wizard')
  const [activeDayNumber, setActiveDayNumber] = useState<number | null>(null)

  const updateTripMeta = (meta: Partial<DraftTrip>) => {
    setDraftTrip(prev => ({ ...prev, ...meta }))
  }

  const updateDay = (dayNumber: number, updates: Partial<DraftDay>) => {
    setDraftTrip(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber ? { ...day, ...updates } : day
      )
    }))
  }

  const addEventToDay = (dayNumber: number, event: TimelineEvent) => {
    setDraftTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day
        // Sort events by startTime after adding
        const newEvents = [...day.events, event].sort((a, b) => a.startTime.localeCompare(b.startTime))
        
        // Auto-complete preceding transport's end location
        if (event.type === 'MEAL' || event.type === 'EXPERIENCE') {
          const addedIndex = newEvents.findIndex(e => e.id === event.id)
          if (addedIndex > 0) {
            const prevEvent = newEvents[addedIndex - 1]
            if (prevEvent.type === 'TRANSPORT') {
              const locationStr = event.type === 'MEAL' ? (event.location || event.name) : event.title
              newEvents[addedIndex - 1] = {
                ...prevEvent,
                to: locationStr || prevEvent.to
              }
            }
          }
        }
        
        // Auto-complete new transport's start location based on preceding event
        if (event.type === 'TRANSPORT') {
          const addedIndex = newEvents.findIndex(e => e.id === event.id)
          if (addedIndex > 0) {
            const prevEvent = newEvents[addedIndex - 1]
            if (prevEvent.type === 'MEAL' || prevEvent.type === 'EXPERIENCE') {
              const locationStr = prevEvent.type === 'MEAL' ? (prevEvent.location || prevEvent.name) : prevEvent.title
              newEvents[addedIndex] = {
                ...event,
                from: locationStr || event.from
              }
            }
          }
        }
        
        return { ...day, events: newEvents }
      })
    }))
  }

  const removeEventFromDay = (dayNumber: number, eventId: string) => {
     setDraftTrip(prev => ({
      ...prev,
      days: prev.days.map(day => 
        day.dayNumber === dayNumber
          ? { ...day, events: day.events.filter(e => e.id !== eventId) }
          : day
      )
    }))
  }

  const updateEventInDay = (dayNumber: number, eventId: string, updates: Partial<TimelineEvent>) => {
    setDraftTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day
        
        const events = day.events.map(e => e.id === eventId ? { ...e, ...updates } as TimelineEvent : e)
        // Re-sort in case time changed
        events.sort((a, b) => a.startTime.localeCompare(b.startTime))

        // Re-run transport auto-complete for the whole day
        const updatedEvents = events.map((event, i) => {
          if (event.type === 'TRANSPORT') {
            const prevEvt = i > 0 ? events[i - 1] : null;
            let newFrom = event.from;
            if (prevEvt && (prevEvt.type === 'MEAL' || prevEvt.type === 'EXPERIENCE')) {
              newFrom = prevEvt.type === 'MEAL' ? (prevEvt.location || prevEvt.name) : prevEvt.title;
            }
            
            const nextEvt = i < events.length - 1 ? events[i + 1] : null;
            let newTo = event.to;
            if (nextEvt && (nextEvt.type === 'MEAL' || nextEvt.type === 'EXPERIENCE')) {
              newTo = nextEvt.type === 'MEAL' ? (nextEvt.location || nextEvt.name) : nextEvt.title;
            }
            
            return { ...event, from: newFrom || event.from, to: newTo || event.to };
          }
          return event;
        });

        return { ...day, events: updatedEvents }
      })
    }))
  }

  const moveEvent = (dayNumber: number, eventId: string, direction: -1 | 1) => {
    setDraftTrip(prev => ({
      ...prev,
      days: prev.days.map(day => {
        if (day.dayNumber !== dayNumber) return day
        
        const events = [...day.events];
        const index = events.findIndex(e => e.id === eventId);
        if (index < 0) return day;
        
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= events.length) return day;

        // Swap start times to naturally reorder them
        const tempTime = events[index].startTime;
        events[index].startTime = events[targetIndex].startTime;
        events[targetIndex].startTime = tempTime;

        events.sort((a, b) => a.startTime.localeCompare(b.startTime));

        // Re-run transport auto-complete for the whole day
        const updatedEvents = events.map((event, i) => {
          if (event.type === 'TRANSPORT') {
            const prevEvt = i > 0 ? events[i - 1] : null;
            let newFrom = event.from;
            if (prevEvt && (prevEvt.type === 'MEAL' || prevEvt.type === 'EXPERIENCE')) {
              newFrom = prevEvt.type === 'MEAL' ? (prevEvt.location || prevEvt.name) : prevEvt.title;
            }
            
            const nextEvt = i < events.length - 1 ? events[i + 1] : null;
            let newTo = event.to;
            if (nextEvt && (nextEvt.type === 'MEAL' || nextEvt.type === 'EXPERIENCE')) {
              newTo = nextEvt.type === 'MEAL' ? (nextEvt.location || nextEvt.name) : nextEvt.title;
            }
            
            return { ...event, from: newFrom || event.from, to: newTo || event.to };
          }
          return event;
        });

        return { ...day, events: updatedEvents };
      })
    }))
  }

  const resetBuilder = () => {
    setDraftTrip(initialDraftTrip)
    setViewState('wizard')
    setActiveDayNumber(null)
  }

  return (
    <BuilderContext.Provider value={{
      draftTrip,
      setDraftTrip,
      updateTripMeta,
      updateDay,
      addEventToDay,
      removeEventFromDay,
      updateEventInDay,
      moveEvent,
      viewState,
      setViewState,
      activeDayNumber,
      setActiveDayNumber,
      resetBuilder
    }}>
      {children}
    </BuilderContext.Provider>
  )
}

export function useBuilder() {
  const context = useContext(BuilderContext)
  if (context === undefined) {
    throw new Error("useBuilder must be used within a BuilderProvider")
  }
  return context
}
