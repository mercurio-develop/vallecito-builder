import { tool, jsonSchema } from 'ai';
import { z } from 'zod';
import { universalSearch } from '@/features/business/queries/universal-search';
import { Redis } from '@upstash/redis';
import { calculateDistance } from '@/lib/utils/geo';

const DB_CATEGORY_MAP: Array<[string[], string]> = [
  [['dining','restaurant','food','eat','lunch','dinner','breakfast','coffee','cafe','ceviche','pizza','vegan','vegetarian','bar','drink','menu','gastro','comida','almuerzo','cena','eats','meal','supper','bistro'],
   'Dining'],
  [['hotel','stay','hostel','lodge','accommodation','sleep','airbnb','lodging','room','alojamiento','boutique','resort','inn'],
   'Stays'],
  [['massage','spa','wellness','therapy','healer','healing','retreat','yoga','meditation'],
   'Wellness'],
  [['taxi','transfer','driver','transport','car','shuttle','van','pickup','colectivo'],
   'Transport'],
  [['hike','trek','adventure','atv','quad','climbing','zipline','rafting','canopy','active','sports','outdoors'],
   'Adventure'],
  [['market','culture','ruins','craft','artisan','archeolog','village','history','historical','museum','local','community'],
   'Culture'],
  [['textiles','weaving','weaver','tejido'],
   'Textiles'],
  [['tour','agency','guide','excursion','package'],
   'Agency'],
];

const GENERIC_CATEGORY_WORDS = new Set([
  'restaurant','dining','food','eat','place','cafe','bar','stay','hotel','hostel',
  'accommodation','lodging','wellness','spa','massage','taxi','transport','tour','agency'
]);

// Strip conversational stopwords so "Find a Restaurant" → "restaurant" before DB search
const STOPWORDS = new Set([
  'find','get','need','want','looking','for','me','a','an','the','some','good',
  'nearby','closest','best','near','my','us','i','we','plan','show','book','can',
  'you','please','help','where','what','is','are','there','any','place','places',
  'options','recommendations','recommendation','ideas','suggestions','suggestion',
  'things','do','go','visit','explore'
]);

function normalizeQuery(q: string): string {
  const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1 && !STOPWORDS.has(w));
  return words.join(' ').trim() || q.toLowerCase();
}

export const searchDatabase = tool({
  description: 'Search database for businesses, activities, food, services. Use for simple "what is in X" queries. Supports Spatial RAG by calculating real-world distances if coordinates are provided.',
  parameters: jsonSchema({
    type: 'object',
    properties: {
      query: { type: 'string', description: "The type of business, e.g. coffee, textiles, taxi. Can also be a category like DINING or STAY." },
      category: { type: 'string', description: "The category to search for, e.g. DINING, STAYS, WELLNESS, TRANSPORT, ADVENTURE, CULTURE, TEXTILES, AGENCY" },
      location: { type: 'string', description: "The specific town to search in, e.g. pisac, urubamba" },
      userLat: { type: 'number' },
      userLng: { type: 'number' }
    },
    required: []
  }),
  // @ts-ignore
  execute: async ({ query, category, location, userLat, userLng }: any) => {
    let safeQuery = normalizeQuery((query || category || '').trim());
    let dbCategory: string | undefined = undefined;
    
    // Determine exact DB category intent
    for (const [keywords, cat] of DB_CATEGORY_MAP) {
      for (const kw of keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(safeQuery)) {
          dbCategory = cat;
          break;
        }
      }
      if (dbCategory) break;
    }

    // Remove generic category words so they don't force a strict text match
    let remainingQuery = safeQuery.split(/\s+/).filter(w => !GENERIC_CATEGORY_WORDS.has(w)).join(' ').trim();

    const cacheKey = `vallecito:search:v6:${remainingQuery}:${location ?? 'any'}:${dbCategory ?? 'any'}`;
    
    const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
      ? Redis.fromEnv()
      : null;

    let results: Record<string, unknown>[] = [];
    try {
      if (redis) {
        const cached = await redis.get<Record<string, unknown>[]>(cacheKey);
        if (cached) results = cached;
      }
    } catch (e) {
      console.warn("KV Cache read failed:", e);
    }

    if (!results) {
      try {
        results = await universalSearch({ 
          query: remainingQuery, 
          category: dbCategory,
          location, 
          limit: 15 
        });
      } catch (e) {
        console.error("universalSearch failed:", e);
        results = [];
      }

      if (results.length > 0 && redis) {
        try {
          await redis.set(cacheKey, results, { ex: 86400 });
        } catch (e) {
          console.warn("KV Cache write failed:", e);
        }
      }
    }

    // Spatial RAG Enhancement: Inject distances and sort by proximity + rating
    if (userLat && userLng) {
      const withDistance = results.map((b: any) => {
        let distanceKm = null;
        if (b.lat && b.lng) {
          distanceKm = calculateDistance(userLat, userLng, b.lat as number, b.lng as number);
        }
        return { ...b, distanceKm };
      });

      withDistance.sort((a: { distanceKm?: number | null; isAsociado?: boolean; rating?: number | null }, b: { distanceKm?: number | null; isAsociado?: boolean; rating?: number | null }) => {
        // If one has distance and other doesn't, prioritize the one with distance
        if (a.distanceKm !== null && b.distanceKm === null) return -1;
        if (a.distanceKm === null && b.distanceKm !== null) return 1;
        
        // If both have distance, blend distance, rating, and Asociado status into a score
        if (a.distanceKm !== null && a.distanceKm !== undefined && b.distanceKm !== null && b.distanceKm !== undefined) {
          const scoreA = (a.rating || 0) * 2 - a.distanceKm + (a.isAsociado ? 10 : 0);
          const scoreB = (b.rating || 0) * 2 - b.distanceKm + (b.isAsociado ? 10 : 0);
          return scoreB - scoreA;
        }
        
        // Fallback to Asociado then rating
        if (a.isAsociado !== b.isAsociado) return a.isAsociado ? -1 : 1;
        return (b.rating || 0) - (a.rating || 0);
      });

      return withDistance.slice(0, 10).map((b: Record<string, unknown>) => ({
        id: b.id,
        name: b.name,
        category: b.category,
        rating: b.rating,
        isAsociado: b.isAsociado,
        priceTier: b.priceTier,
        distanceKm: b.distanceKm ? Number(b.distanceKm).toFixed(1) + ' km away' : 'Distance unknown',
        whatsapp: b.whatsapp,
        tagline: b.tagline,
        imageUrl: b.imageUrl,
        slug: b.slug,
        recommendationNote: b.isAsociado ? "Vallecito Preferred Partner - Highly Recommended" : undefined
      }));
    }
    
    // Return compressed view to save LLM tokens if no coords
    return results.slice(0, 10).map((b: Record<string, unknown>) => ({
      id: b.id,
      name: b.name,
      category: b.category,
      rating: b.rating,
      isAsociado: b.isAsociado,
      priceTier: b.priceTier,
      whatsapp: b.whatsapp,
      locationSlug: b.locationSlug,
      tagline: b.tagline,
      imageUrl: b.imageUrl,
      slug: b.slug,
      recommendationNote: b.isAsociado ? "Vallecito Preferred Partner - Highly Recommended" : undefined
    }));
  }
});
