import { tool } from 'ai';
import { z } from 'zod';
import { calculateDistance } from '@/lib/utils/geo';
import { prisma } from '@/lib/prisma';

export const estimateTaxiFare = tool({
  description: 'Estimates the taxi fare and travel time from the user\'s current location to a destination business in the Sacred Valley. Use this when the user asks for a taxi, transport, or how to get there.',
  parameters: z.object({
    origin: z.string().optional().default("").describe('The user\'s current location (e.g. Urubamba, Cusco, Pisac, Ollantaytambo). If unknown, default to empty string.'),
    destinationId: z.string().optional().describe('The ID of the business the user wants to go to (if known).'),
    destinationName: z.string().optional().default("").describe('The exact name of the destination business or town.'),
  }),
  // @ts-ignore
  execute: async ({ origin, destinationId, destinationName }) => {
     let dest;
     const dName = destinationName || "";
     
     const coordsMap: Record<string, { lat: number, lng: number }> = {
       "urubamba": { lat: -13.3047, lng: -72.1167 },
       "huaycho": { lat: -13.3100, lng: -72.0900 },
       "cusco": { lat: -13.5226, lng: -71.9673 },
       "airport": { lat: -13.5353, lng: -71.9388 }, // Alejandro Velasco Astete Airport
       "aeropuerto": { lat: -13.5353, lng: -71.9388 },
       "pisac": { lat: -13.4225, lng: -71.8488 },
       "ollantaytambo": { lat: -13.2588, lng: -72.2633 },
       "maras": { lat: -13.3323, lng: -72.1554 },
       "chinchero": { lat: -13.3908, lng: -72.0494 },
       "calca": { lat: -13.3333, lng: -71.9667 },
       "taray": { lat: -13.4300, lng: -71.8600 },
     };

     // Check if dName matches a known town first — avoids a DB business with the same
     // word in its name but wrong/null coordinates overriding the town coords.
     const dNameLower = dName.toLowerCase();
     const townMatch = Object.entries(coordsMap).find(([k]) => dNameLower.includes(k));

     if (destinationId) {
       dest = await prisma.business.findUnique({ where: { id: destinationId } });
     } else if (dName && !townMatch) {
       // Only do DB lookup when it's clearly a business name, not a town
       const cleanName = dName.trim().split(" ")[0];
       const found = await prisma.business.findFirst({ where: { name: { contains: cleanName } } });
       // Only use DB result if it has valid coordinates
       if (found?.lat && found?.lng) dest = found;
     }

     let dLat = -13.3047; // Default to Urubamba if nothing resolves
     let dLng = -72.1167;
     let finalDestinationName = dest?.name || dName || "Destination";

     if (dest?.lat && dest?.lng) {
       dLat = dest.lat;
       dLng = dest.lng;
     } else if (townMatch) {
       [, { lat: dLat, lng: dLng }] = townMatch;
       finalDestinationName = townMatch[0].charAt(0).toUpperCase() + townMatch[0].slice(1);
     } else if (!dName && !destinationId) {
       return { error: "Destination not found. Please clarify the name of the place." };
     }
     
     let originMatched = false;
     let oLat = -13.3047; // default to Urubamba
     let oLng = -72.1167;
     const originLower = (origin || "").toLowerCase();
     for (const [key, coords] of Object.entries(coordsMap)) {
       if (originLower.includes(key)) {
         oLat = coords.lat;
         oLng = coords.lng;
         originMatched = true;
         break;
       }
     }
     
     const dist = calculateDistance(oLat, oLng, dLat, dLng);
     const cost = Math.max(5, Math.round(dist * 1.5));
     const timeMins = Math.max(5, Math.round(dist * 1.2));
     
     const recommendedTaxi = await prisma.business.findFirst({
       where: {
         name: { contains: "taxi" },
         whatsapp: { not: null },
       },
       orderBy: { rating: "desc" }
     });
     
     return {
       destinationName: finalDestinationName,
       originGuessed: originMatched ? origin : "Urubamba (Default)",
       originLat: oLat,
       originLng: oLng,
       destLat: dLat,
       destLng: dLng,
       distanceKm: dist.toFixed(1),
       estimatedCostUSD: cost,
       estimatedTimeMinutes: timeMins,
       taxi: recommendedTaxi ? {
         name: recommendedTaxi.name,
         whatsapp: recommendedTaxi.whatsapp,
         rating: recommendedTaxi.rating
       } : undefined
     };
  }
});

