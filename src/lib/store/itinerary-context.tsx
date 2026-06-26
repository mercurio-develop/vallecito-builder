// Canonical location: @/features/pro-builder/store/trip-context
// useItinerary is a legacy alias for useTrip
export { useTrip as useItinerary } from '@/features/pro-builder/store/trip-context'

export function ItineraryProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
