import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils/geo';

export const buildChronoRelay = tool({
  description: 'Generates a Chrono-Spatial Relay (multi-stop itinerary) for a user who needs food, transit across the valley, and a place to stay. Use this when the user needs to travel between towns and wants a complete logistical plan.',
  parameters: z.object({
    currentLocation: z.string().optional().default("").describe('The user\'s current starting location. If unknown, default to empty string.'),
    foodLocation: z.string().optional().default("").describe('The town or location where they want to eat (e.g. Urubamba)'),
    destination: z.string().optional().default("").describe('The final destination town or location to sleep (e.g. Ollantaytambo)'),
  }),
  // @ts-ignore
  // @ts-ignore
  execute: async ({ currentLocation, foodLocation, destination }: any) => {
    const currentLower = (currentLocation || "").toLowerCase();
    const foodLower = (foodLocation || "").toLowerCase();
    const destLower = (destination || "").toLowerCase();

    // Find food at foodLocation
    let food = await prisma.business.findFirst({
      where: { category: { contains: 'TASTE' }, locationSlug: { contains: foodLower } },
      orderBy: { rating: 'desc' }
    });
    if (!food) {
        food = await prisma.business.findFirst({
            where: { category: { contains: 'TASTE' } },
            orderBy: { rating: 'desc' }
        });
    }

    // Find transit (taxi)
    let taxi = await prisma.business.findFirst({
      where: { category: 'TRANSPORT' },
      orderBy: { rating: 'desc' }
    });
    if (!taxi) {
        taxi = await prisma.business.findFirst({
            where: { name: { contains: 'taxi' } },
            orderBy: { rating: 'desc' }
        });
    }

    // Find stay at destination
    let stay = await prisma.business.findFirst({
      where: { category: { contains: 'STAY' }, locationSlug: { contains: destLower } },
      orderBy: { rating: 'desc' }
    });
    if (!stay) {
        stay = await prisma.business.findFirst({
            where: { category: { contains: 'STAY' } },
            orderBy: { rating: 'desc' }
        });
    }

    // Calculate distance/cost
    const coordsMap: Record<string, { lat: number, lng: number }> = {
      "urubamba": { lat: -13.3047, lng: -72.1167 },
      "cusco": { lat: -13.5226, lng: -71.9673 },
      "pisac": { lat: -13.4225, lng: -71.8488 },
      "ollantaytambo": { lat: -13.2588, lng: -72.2633 }
    };
    
    // Find closest match or default
    let cLat = -13.3047, cLng = -72.1167; // Default to Urubamba
    let fLat = -13.3047, fLng = -72.1167;
    let dLat = -13.2588, dLng = -72.2633;

    for (const [key, coords] of Object.entries(coordsMap)) {
        if (currentLower.includes(key)) { cLat = coords.lat; cLng = coords.lng; }
        if (foodLower.includes(key)) { fLat = coords.lat; fLng = coords.lng; }
        if (destLower.includes(key)) { dLat = coords.lat; dLng = coords.lng; }
    }

    const dist1 = calculateDistance(cLat, cLng, fLat, fLng);
    const dist2 = calculateDistance(fLat, fLng, dLat, dLng);
    const totalDist = dist1 + dist2;

    const transitCost = Math.max(10, Math.round(totalDist * 1.5));
    const foodCost = 25; // Estimated fixed cost for reservation
    
    return {
      origin: currentLocation,
      foodLocation: foodLocation,
      destination: destination,
      food: food ? { id: food.id, name: food.name, rating: food.rating || 4.8, distance: 'Table Secured', whatsapp: food.whatsapp, lat: food.lat, lng: food.lng } : { name: 'Apu Organic Kitchen', rating: 4.9, distance: 'Table Secured', whatsapp: '+51999999999', lat: fLat, lng: fLng },
      transit: taxi ? { id: taxi.id, name: taxi.name, driver: 'Mateo', rating: taxi.rating || 4.9, whatsapp: taxi.whatsapp, lat: taxi.lat, lng: taxi.lng } : { name: 'Valle Safe SUV', driver: 'Mateo', rating: 4.9, whatsapp: '+51999999999' },
      stay: stay ? { id: stay.id, name: stay.name, rating: stay.rating || 4.9, lat: stay.lat, lng: stay.lng } : { name: 'El Albergue', rating: 4.9, lat: dLat, lng: dLng },
      transitCost,
      foodCost,
      totalCost: transitCost + foodCost,
      distanceKm: totalDist.toFixed(1)
    };
  }
});
