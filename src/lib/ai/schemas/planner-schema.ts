import { z } from 'zod';

export const microDaySchema = z.object({
  title: z.string().optional(),
  totalCost: z.number().optional(),
  constraints: z.string().optional(),
  startAnchor: z.object({
    title: z.string(),
    locationStr: z.string(),
    time: z.string().optional(),
    type: z.enum(['AIRPORT', 'HOTEL', 'GENERIC_TOWN']),
    lat: z.number().optional(),
    lng: z.number().optional(),
    service: z.any().optional(),
  }),
  endAnchor: z.object({
    title: z.string(),
    locationStr: z.string(),
    time: z.string().optional(),
    type: z.enum(['HOTEL', 'GENERIC_TOWN']),
    lat: z.number().optional(),
    lng: z.number().optional(),
    service: z.any().optional(),
  }),
  waypoints: z.array(
    z.object({
      id: z.string(),
      category: z.string(),
      title: z.string(),
      locationStr: z.string(),
      durationMins: z.number().optional(),
      priceUsd: z.number().optional(),
      lat: z.number().optional(),
      lng: z.number().optional(),
      rating: z.number().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      alternatives: z.array(z.any()).optional(),
      service: z.any().optional(),
    })
  ),
  transitEdges: z.array(
    z.object({
      fromLocation: z.string(),
      toLocation: z.string(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      defaultDriver: z.object({
        id: z.string().optional(),
        name: z.string(),
        vehicle: z.string().optional(),
        priceUsd: z.number().optional(),
        whatsapp: z.string().optional(),
      }),
      alternativeDrivers: z.array(
        z.object({
          id: z.string().optional(),
          name: z.string(),
          vehicle: z.string().optional(),
          priceUsd: z.number().optional(),
          whatsapp: z.string().optional(),
        })
      ).optional(),
    })
  ),
  needsAccommodationUpsell: z.boolean(),
});

export type OptimizedPlan = z.infer<typeof microDaySchema>;

export const macroTripSchema = z.object({
  tripTitle: z.string().describe("A cinematic, luxury title for the overall journey."),
  narrativeArc: z.string().describe("A 2-sentence summary of the trip's emotional, physical, and altitude progression"),
  totalDays: z.number(),
  baseCampStrategy: z.string().describe("Explanation of where they will sleep to avoid altitude sickness (e.g., '2 Nights Urubamba, 1 Night Aguas Calientes, 1 Night Cusco')."),
  days: z.array(z.object({
    dayNumber: z.number(),
    date: z.string(),
    sleepTown: z.string().describe("The exact town they sleep in this night."),
    basecampHotelId: z.string().optional().describe("The ID of the selected basecamp hotel if already chosen."),
    suggestedTourSector: z.enum(['EAST_VALLEY', 'URUBAMBA', 'MACHU_PICCHU', 'CUSCO_CITY', 'ANY', 'OTHER']),
    tourPackageId: z.string().optional().describe("The ID of the curated TourPackage selected for this day."),
    tourPackageTitle: z.string().optional().describe("The title of the curated TourPackage selected for this day."),
    documentaryChapterTitle: z.string().describe("A one-sentence pitch of the day's vibe."),
    expertOpportunity: z.string().optional().describe("Suggest a specific local expert.")
  }))
});
