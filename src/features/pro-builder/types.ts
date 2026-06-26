export type EventType = 'EXPERIENCE' | 'TRANSPORT' | 'MEAL' | 'NOTE';

export interface BaseEvent {
  id: string; // unique generated ID for dragging/deleting
  type: EventType;
  startTime: string; // e.g., "10:00"
}

export interface ExperienceEvent extends BaseEvent {
  type: 'EXPERIENCE';
  packageId: string;
  title: string; // cached title for display
}

export interface TransportEvent extends BaseEvent {
  type: 'TRANSPORT';
  method: 'CAR' | 'TRAIN' | 'FLIGHT' | 'WALK';
  from: string;
  fromLat?: number;
  fromLng?: number;
  to: string;
  toLat?: number;
  toLng?: number;
  details?: string; // flight number, driver name
}

export interface MealEvent extends BaseEvent {
  type: 'MEAL';
  name: string; // Restaurant name or type of meal
  location?: string;
  locationLat?: number;
  locationLng?: number;
  notes?: string;
}

export interface NoteEvent extends BaseEvent {
  type: 'NOTE';
  content: string; // Free text markdown/string
}

export type TimelineEvent = ExperienceEvent | TransportEvent | MealEvent | NoteEvent;

export type DraftDay = {
  dayNumber: number;
  date: string;
  startAnchor: {
    title: string;
    locationStr: string;
    lat?: number;
    lng?: number;
    time: string;
  };
  endAnchor: {
    title: string;
    locationStr: string;
    lat?: number;
    lng?: number;
    time: string;
  };
  guideNotes: string;
  events: TimelineEvent[]; // Replaces packageIds
};

export type FullTraveler = {
  isLeadGuest: boolean;
  firstName: string;
  lastName: string;
  email: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  whatsappNumber: string;
  dietaryRestrictions: string;
  medicalNotes: string;
};

export type DraftTrip = {
  title: string;
  startDate: string;
  endDate: string;
  paxCount: number;
  days: DraftDay[];
  travelers: FullTraveler[];
  clientNotes: string;
  internalNotes: string;
};
