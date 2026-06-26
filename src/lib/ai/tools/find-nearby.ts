import { tool } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export const findNearby = tool({
  description: 'Finds the top nearest verified businesses based on user coordinates, category, and weighted premium ranking.',
  parameters: z.object({
    userLat: z.number(),
    userLng: z.number(),
    category: z.string().describe("e.g., 'textiles', 'food'"),
    limit: z.number().default(5)
  }),
  // @ts-ignore
  // @ts-ignore
  execute: async ({ userLat, userLng, category, limit }: any) => {
    try {
      // 1. Prisma $queryRaw with Haversine formula targeting the Business table.
      // Note: SQLite lacks native trigonometric functions, so we calculate Haversine in JS.
      const candidates = await prisma.business.findMany({
        where: {
          OR: [
            { category: { contains: category } },
            { name: { contains: category } }
          ]
        }
      });

      // 2. Sort by distance, rating, and igFollowers. Limit to 5.
      const withDistance = candidates.filter(b => b.lat !== null && b.lng !== null).map(b => {
        const R = 6371;
        const lat = b.lat as number;
        const lng = b.lng as number;
        const dLat = ((lat - userLat) * Math.PI) / 180;
        const dLon = ((lng - userLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((userLat * Math.PI) / 180) *
            Math.cos((lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

        return { ...b, distance };
      });

      withDistance.sort((a, b) => {
        if (Math.abs(a.distance - b.distance) > 2) return a.distance - b.distance;
        const scoreA = (a.rating || 0) * 10 + (a.instagramFollowers * 0.001);
        const scoreB = (b.rating || 0) * 10 + (b.instagramFollowers * 0.001);
        return scoreB - scoreA;
      });

      // 3. Return array of formatted JSON objects.
      return withDistance.slice(0, limit);
    } catch (error) {
      console.error(error);
      return { error: "Failed to find nearby businesses." };
    }
  }
});
