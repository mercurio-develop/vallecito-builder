import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils/geo';

export const buildSpatialItinerary = tool({
  description:
    'Generates multi-stop alternative itineraries by pairing a morning activity with an afternoon meal. Filters the database for the highest-rated places and calculates the geographic distance between them.',
  parameters: z.object({
    morningIntent: z.string().optional().default("").describe('Search keyword for morning'),
    afternoonIntent: z.string().optional().default("").describe('Search keyword for afternoon'),
  }),
  // @ts-ignore
  // @ts-ignore
  execute: async ({ morningIntent, afternoonIntent }: any) => {
    const mIntent = morningIntent || "";

    const morningItems = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: mIntent } },
          { category: { contains: mIntent } },
        ],
      },
      orderBy: { rating: 'desc' },
      take: 5,
    });

    const afternoonItems = await prisma.business.findMany({
      where: {
        OR: [
          { name: { contains: afternoonIntent } },
          { category: { contains: afternoonIntent } },
        ],
      },
      orderBy: { rating: 'desc' },
      take: 5,
    });

    const validPlans = [];

    for (const morning of morningItems) {
      for (const afternoon of afternoonItems) {
        if (!morning.lat || !morning.lng || !afternoon.lat || !afternoon.lng || morning.rating === null || afternoon.rating === null) continue;

        const distance = calculateDistance(morning.lat, morning.lng, afternoon.lat, afternoon.lng);

        if (distance < 25) {
          validPlans.push({
            planId: Math.random().toString(36).substring(7),
            totalDistanceKm: distance.toFixed(1),
            combinedRating: (morning.rating + afternoon.rating) / 2,
            morning,
            afternoon,
          });
        }
      }
    }

    validPlans.sort((a, b) => {
      if (b.combinedRating !== a.combinedRating) {
        return b.combinedRating - a.combinedRating;
      }
      return parseFloat(a.totalDistanceKm) - parseFloat(b.totalDistanceKm);
    });

    return validPlans.slice(0, 3);
  },
});
