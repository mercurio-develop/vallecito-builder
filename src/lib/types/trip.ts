import { Trip as PrismaTrip, TripDay as PrismaTripDay, Traveler as PrismaTraveler } from "@prisma/client"

export type FullTrip = PrismaTrip & {
  days: PrismaTripDay[];
  travelers: PrismaTraveler[];
}

import { Business, TourPackage } from "@prisma/client"

export type EntityType = 'BUSINESS' | 'TRANSPORT' | 'PACKAGE' | 'THERAPIST' | 'AGENCY';

export type EventType = 'EXPERIENCE' | 'TRANSPORT' | 'MEAL' | 'NOTE' | 'STAY';

export interface BaseEvent {
  id: string; 
  type: EventType;
  startTime: string; 
  durationMins?: number;
  lat?: number;
  lng?: number;
  title: string;
  priceUsd?: number;
  photos?: string[];
  description?: string;
  category?: string;
}

export interface ExperienceEvent extends BaseEvent {
  type: 'EXPERIENCE';
  packageId?: string;
  businessId?: string;
  service?: Business;
}

export interface TransportEvent extends BaseEvent {
  type: 'TRANSPORT';
  method: 'CAR' | 'TRAIN' | 'FLIGHT' | 'WALK' | 'PUBLIC';
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  details?: string;
  pickupTime?: string;
  transportId?: string;
  service?: Business;
}

export interface MealEvent extends BaseEvent {
  type: 'MEAL';
  businessId?: string;
  service?: Business;
  notes?: string;
}

export interface StayEvent extends BaseEvent {
  type: 'STAY';
  businessId?: string;
  service?: Business;
  checkIn?: string;
  checkOut?: string;
}

export interface NoteEvent extends BaseEvent {
  type: 'NOTE';
  content: string;
}

export type TimelineEvent = ExperienceEvent | TransportEvent | MealEvent | NoteEvent | StayEvent;

export interface TripDay {
  dayNumber: number;
  date: Date;
  title?: string;
  isComplete?: boolean;
  sleepTown?: string;
  startAnchor?: {
    title: string;
    locationStr?: string;
    type?: string;
    lat?: number;
    lng?: number;
    time: string;
    service?: Business;
  };
  endAnchor?: {
    title: string;
    locationStr?: string;
    type?: string;
    lat?: number;
    lng?: number;
    time: string;
    service?: Business;
  };
  events: TimelineEvent[];
}

export interface UniversalTrip {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  paxCount: number;
  days: TripDay[];
  travelers?: any[];
  status: 'DRAFT' | 'PROPOSED' | 'CONFIRMED';
  shareToken?: string;
  clientNotes?: string;
  internalNotes?: string;
}
