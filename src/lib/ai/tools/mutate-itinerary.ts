import { tool, jsonSchema } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { COORDS_MAP } from '@/lib/constants';

/**
 * Tool for specific, granular modifications to an active itinerary.
 * Supports: 
 * - Swapping an existing stop for a specific business
 * - Updating start or end locations
 * - Changing the time of an event or anchor
 */
export const mutateItinerary = tool({
  description: 'Performs granular mutations on the active itinerary, such as swapping a stop for a new business, updating start/end locations, or changing times.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['SWAP_STOP', 'SET_START', 'SET_END', 'UPDATE_TIME'], description: 'The specific mutation to perform' },
      targetId: { type: 'string', description: 'The ID of the event to swap or update (required for SWAP_STOP and UPDATE_TIME)' },
      businessId: { type: 'string', description: 'The ID of the new business to inject (for SWAP_STOP, SET_START, SET_END)' },
      locationStr: { type: 'string', description: 'A free-text location name (for SET_START, SET_END if no businessId)' },
      time: { type: 'string', description: 'The new time in HH:MM format' },
    },
    required: ['action']
  }),
  // @ts-ignore
  execute: async ({ action, targetId, businessId, locationStr, time }: any) => {
    let business: any = null;
    let isPackage = false;
    
    if (businessId) {
      business = await prisma.business.findUnique({ where: { id: businessId } });
      if (!business) {
        const pkg = await prisma.tourPackage.findUnique({ where: { id: businessId }, include: { business: true } });
        if (pkg) {
           isPackage = true;
           business = {
             id: pkg.id,
             name: pkg.title,
             category: pkg.tags.toLowerCase().includes('stay') || pkg.tags.toLowerCase().includes('hotel') ? "STAY" : "EXPERIENCE",
             lat: pkg.business?.lat || null,
             lng: pkg.business?.lng || null,
             rating: pkg.business?.rating || 5.0,
             imageUrl: pkg.heroImage || pkg.business?.imageUrl || "",
             description: pkg.description,
             priceTier: pkg.basePriceUsd > 150 ? "$$$" : pkg.basePriceUsd > 75 ? "$$" : "$",
             isPackage: true
           };
        }
      }
    } else if (locationStr) {
       // Try to find a business by name if a string is provided for anchors
       business = await prisma.business.findFirst({
         where: { name: { contains: locationStr, mode: 'insensitive' } }
       });
       
       if (!business) {
          const pkg = await prisma.tourPackage.findFirst({
            where: { title: { contains: locationStr, mode: 'insensitive' } },
            include: { business: true }
          });
          if (pkg) {
             isPackage = true;
             business = {
               id: pkg.id,
               name: pkg.title,
               category: pkg.tags.toLowerCase().includes('stay') || pkg.tags.toLowerCase().includes('hotel') ? "STAY" : "EXPERIENCE",
               lat: pkg.business?.lat || null,
               lng: pkg.business?.lng || null,
               rating: pkg.business?.rating || 5.0,
               imageUrl: pkg.heroImage || pkg.business?.imageUrl || "",
               description: pkg.description,
               priceTier: pkg.basePriceUsd > 150 ? "$$$" : pkg.basePriceUsd > 75 ? "$$" : "$",
               isPackage: true
             };
          }
       }
       
       if (!business && locationStr.toLowerCase().includes('monasterio')) {
          business = { id: 'h1', name: "Hotel Monasterio", type: "STAY", category: "STAY", description: "A 16th-century monastery transformed into a luxury hotel.", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80", lat: -13.5152, lng: -71.9774, rating: 5.0, priceTier: "$$$" };
       }
    }

    return {
      success: true,
      action,
      targetId,
      time,
      resolvedBusiness: business ? {
        id: business.id,
        name: business.name,
        category: business.category,
        lat: business.lat,
        lng: business.lng,
        imageUrl: business.imageUrl,
        description: business.description,
        rating: business.rating,
        priceTier: business.priceTier,
        isPackage: business.isPackage
      } : null,
      resolvedLocation: locationStr || (business ? business.name : null),
      coords: business ? { lat: business.lat, lng: business.lng } : (locationStr && COORDS_MAP[locationStr.toLowerCase()] ? COORDS_MAP[locationStr.toLowerCase()] : null)
    };
  }
} as any);
