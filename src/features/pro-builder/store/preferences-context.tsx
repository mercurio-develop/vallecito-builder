"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PreferencesContextType {
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  travelVibe: string | null;
  setTravelVibe: (vibe: string | null) => void;
  travelIntensity: number | null;
  setTravelIntensity: (intensity: number | null) => void;
  targetDate: Date;
  setTargetDate: (date: Date) => void;
  isMapPicking: { active: boolean, target: 'start' | 'end' | null };
  setIsMapPicking: (val: { active: boolean, target: 'start' | 'end' | null }) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [travelVibe, setTravelVibe] = useState<string | null>(null);
  const [travelIntensity, setTravelIntensity] = useState<number | null>(null);
  const [targetDate, setTargetDate] = useState<Date>(new Date());
  const [isMapPicking, setIsMapPicking] = useState<{ active: boolean, target: 'start' | 'end' | null }>({ active: false, target: null });

  const value = React.useMemo(() => ({
    isChatOpen,
    setIsChatOpen,
    travelVibe,
    setTravelVibe,
    travelIntensity,
    setTravelIntensity,
    targetDate,
    setTargetDate,
    isMapPicking,
    setIsMapPicking
  }), [
    isChatOpen, travelVibe, travelIntensity, targetDate, isMapPicking
  ]);

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
