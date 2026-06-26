import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils/geo';

export const findLocalExperiences = tool({
  description: 'Finds local experiences (e.g., textiles, markets, dining, wellness) near a specific location, calculates the travel time/distance from the user\'s current location, and returns top recommendations.',
  parameters: z.object({
    intent: z.string().describe('The user\'s intent, what they want to do or buy (e.g., "buy textiles", "eat traditional food", "get a massage").'),
    targetLocation: z.string().describe('The town or location the user wants to search in (e.g., "pisac", "urubamba", "maras", "ollantaytambo", "chinchero").'),
    userLocation: z.string().optional().describe('The user\'s current location. If not provided, defaults to the targetLocation.'),
  }),
  // @ts-ignore
  execute: async ({ intent, targetLocation, userLocation }) => {
    // Basic mapping of user strings to town coordinates
    const townCoords: Record<string, { lat: number, lng: number }> = {
      "urubamba": { lat: -13.3047, lng: -72.1167 },
      "cusco": { lat: -13.5226, lng: -71.9673 },
      "pisac": { lat: -13.4225, lng: -71.8488 },
      "ollantaytambo": { lat: -13.2588, lng: -72.2633 },
      "maras": { lat: -13.3323, lng: -72.1554 },
      "chinchero": { lat: -13.3908, lng: -72.0494 }
    };

    const targetLocSlug = targetLocation.toLowerCase().trim();
    const userLocSlug = (userLocation || targetLocation).toLowerCase().trim();

    const tCoords = townCoords[targetLocSlug] || townCoords["urubamba"];
    const uCoords = townCoords[userLocSlug] || tCoords;

    const distanceKm = calculateDistance(uCoords.lat, uCoords.lng, tCoords.lat, tCoords.lng);
    const timeMins = Math.max(5, Math.round(distanceKm * 1.2)); // ~50km/h avg speed
    const taxiCost = Math.max(5, Math.round(distanceKm * 1.5));

    // Try to find matching businesses
    const intentLower = intent.toLowerCase();
    let categoryFilter = undefined;
    if (intentLower.includes("textile") || intentLower.includes("market") || intentLower.includes("art")) {
      categoryFilter = "Culture";
    } else if (intentLower.includes("food") || intentLower.includes("eat") || intentLower.includes("restaurant")) {
      categoryFilter = "Dining";
    } else if (intentLower.includes("massage") || intentLower.includes("spa") || intentLower.includes("wellness")) {
      categoryFilter = "Wellness";
    }

    const whereClause: Record<string, unknown> = {
      locationSlug: targetLocSlug,
    };
    if (categoryFilter) {
      whereClause.category = categoryFilter;
    } else {
      whereClause.OR = [
        { name: { contains: intentLower } },
        { category: { contains: intentLower } }
      ];
    }

    let businesses = await prisma.business.findMany({
      where: whereClause,
      orderBy: { rating: 'desc' },
      take: 3,
    });

    let exactLocationFound = true;
    if (businesses.length === 0) {
      exactLocationFound = false;
      delete whereClause.locationSlug;
      businesses = await prisma.business.findMany({
        where: whereClause,
        orderBy: { rating: 'desc' },
        take: 3,
      });
    }

    return {
      targetLocation: targetLocation,
      userLocation: userLocSlug,
      exactLocationFound,
      distanceKm: distanceKm.toFixed(1),
      estimatedTimeMinutes: timeMins,
      estimatedTaxiCostUSD: taxiCost,
      experiences: businesses,
    };
  }
});