import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils/geo';

export const searchDayTours = tool({
  description: 'Search the database for single-day tours, treks, and activities that can be done in one day. Supports Spatial RAG by calculating real-world distances from the user to the activity sector.',
  parameters: z.object({
    query: z.string().describe("The type of activity to search for, e.g., 'ruins', 'trekking', 'solo', 'mountain'"),
    userLat: z.number().optional().describe("User's current latitude for distance calculation"),
    userLng: z.number().optional().describe("User's current longitude for distance calculation"),
    sector: z.enum(["EAST_VALLEY", "URUBAMBA", "MACHU_PICCHU", "CUSCO_CITY", "LIMA", "OTHER"]).optional().describe("Optional sector to filter by"),
  }),
  // @ts-ignore
  execute: async ({ query, userLat, userLng, sector }) => {
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter((word: string) => word.length > 2);

    const whereClause: Record<string, unknown> = {
      durationDays: 1, // Only 1-day packages
    };

    if (sector) {
      whereClause.sector = sector;
    }

    if (queryWords.length > 0) {
      whereClause.AND = queryWords.map((word: string) => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { tags: { contains: word, mode: 'insensitive' } },
          { description: { contains: word, mode: 'insensitive' } },
          { sector: { contains: word, mode: 'insensitive' } },
        ],
      }));
    }

    const packages = await prisma.tourPackage.findMany({
      where: whereClause,
      include: {
        business: true,
      },
      take: 20,
    });

    // Basic mapping of sector to coordinates for fallback
    const sectorCoords: Record<string, { lat: number, lng: number }> = {
      "URUBAMBA": { lat: -13.3047, lng: -72.1167 },
      "CUSCO_CITY": { lat: -13.5226, lng: -71.9673 },
      "EAST_VALLEY": { lat: -13.4225, lng: -71.8488 }, // Pisac area
      "MACHU_PICCHU": { lat: -13.1631, lng: -72.5450 }
    };

    // Calculate distances and sort
    const withDistance = packages.map((pkg) => {
      let distanceKm = null;
      let lat = null;
      let lng = null;

      if (pkg.business && pkg.business.lat && pkg.business.lng) {
        lat = pkg.business.lat;
        lng = pkg.business.lng;
      } else if (pkg.sector && sectorCoords[pkg.sector]) {
        lat = sectorCoords[pkg.sector].lat;
        lng = sectorCoords[pkg.sector].lng;
      }

      if (userLat && userLng && lat && lng) {
        distanceKm = calculateDistance(userLat, userLng, lat, lng);
      }

      return { ...pkg, distanceKm };
    });

    if (userLat && userLng) {
      withDistance.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm === null) return -1;
        if (a.distanceKm === null && b.distanceKm !== null) return 1;
        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }
        return 0;
      });
    }

    return withDistance.slice(0, 5).map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      sector: pkg.sector,
      pace: pkg.pace,
      difficulty: pkg.difficulty,
      basePriceUsd: pkg.basePriceUsd,
      tags: pkg.tags,
      description: pkg.description,
      distanceKm: pkg.distanceKm ? pkg.distanceKm.toFixed(1) + ' km away' : 'Distance unknown',
      agencyName: pkg.business ? pkg.business.name : 'Self-Guided / Unknown',
      whatsapp: pkg.business ? pkg.business.whatsapp : null,
    }));
  }
});
