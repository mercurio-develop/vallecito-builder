import { tool, jsonSchema } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateDistance } from '@/lib/utils/geo';
import { trackAiRecommendation } from '@/features/business/actions/track-ai';
import { COORDS_MAP } from '@/lib/constants';

function getCoords(location: string) {
  const lower = location.toLowerCase();
  for (const [key, coords] of Object.entries(COORDS_MAP)) {
    if (lower.includes(key)) return { ...coords };
  }
  return { ...COORDS_MAP.urubamba };
}

function score(rating: number, detourKm: number) {
  // Higher rating is better. Lower detour is better.
  return rating * 0.6 + Math.max(0, 20 - detourKm) * 0.4;
}

const DESIRE_MAP: Record<string, { category: string; icon: string; cost: number; keywords: string[] }> = {
  coffee:     { category: 'Dining',   icon: '☕', cost: 12, keywords: ['coffee', 'cafe', 'cafeteria', 'espresso'] },
  cafe:       { category: 'Dining',   icon: '☕', cost: 12, keywords: ['coffee', 'cafe', 'cafeteria'] },
  breakfast:  { category: 'Dining',   icon: '🥐', cost: 15, keywords: ['breakfast', 'desayuno', 'brunch'] },
  lunch:      { category: 'Dining',   icon: '🍽️', cost: 20, keywords: ['lunch', 'almuerzo', 'restaurant', 'food'] },
  dinner:     { category: 'Dining',   icon: '🍽️', cost: 25, keywords: ['dinner', 'cena', 'restaurant', 'food'] },
  food:       { category: 'Dining',   icon: '🍽️', cost: 20, keywords: ['food', 'comida', 'restaurant'] },
  dining:     { category: 'Dining',   icon: '🍽️', cost: 25, keywords: ['dining', 'restaurant', 'food'] },
  eats:       { category: 'Dining',   icon: '🍽️', cost: 20, keywords: ['eats', 'food'] },
  restaurant: { category: 'Dining',   icon: '🍽️', cost: 25, keywords: ['restaurant', 'comida', 'food'] },
  market:     { category: 'Culture',  icon: '🛍️', cost: 0,  keywords: ['market', 'mercado', 'artisan', 'craft'] },
  textiles:   { category: 'Culture',  icon: '🧶', cost: 0,  keywords: ['textiles', 'weaving', 'weaver', 'tejido', 'artisan'] },
  ruins:      { category: 'Culture',  icon: '🏺', cost: 10, keywords: ['ruins', 'ruinas', 'archeological', 'site', 'fortress'] },
  culture:    { category: 'Culture',  icon: '🏺', cost: 10, keywords: ['culture', 'cultura', 'tradition', 'village', 'native'] },
  history:    { category: 'Culture',  icon: '🏺', cost: 10, keywords: ['history', 'historical', 'museum'] },
  hike:       { category: 'Adventure', icon: '🥾', cost: 15, keywords: ['hike', 'trek', 'walk', 'mountain', 'trail'] },
  atv:        { category: 'Adventure', icon: '🏍️', cost: 40, keywords: ['atv', 'quad', 'motorcycle'] },
  adventure:  { category: 'Adventure', icon: '🥾', cost: 20, keywords: ['adventure', 'aventura', 'trek', 'climb'] },
  active:     { category: 'Adventure', icon: '🥾', cost: 20, keywords: ['active', 'sports', 'outdoors'] },
  massage:    { category: 'Wellness',  icon: '🧘', cost: 35, keywords: ['massage', 'masaje', 'spa', 'therapy', 'bodywork'] },
  spa:        { category: 'Wellness',  icon: '🧘', cost: 35, keywords: ['spa', 'wellness', 'relaxation', 'massage'] },
  relax:      { category: 'Wellness',  icon: '🌿', cost: 20, keywords: ['relax', 'peaceful', 'wellness', 'sanctuary', 'view'] },
  wellness:   { category: 'Wellness',  icon: '🧘', cost: 30, keywords: ['wellness', 'healing', 'ceremony', 'ritual'] },
};

function resolveDesire(desire: string) {
  const key = desire.toLowerCase();
  for (const [pattern, meta] of Object.entries(DESIRE_MAP)) {
    if (key.includes(pattern)) return meta;
  }
  
  // Smarter fallback: if the desire sounds like food, use Dining. Otherwise use Culture/Generic.
  const foodKeywords = ['eat', 'drink', 'pizza', 'vegan', 'bar', 'beer', 'wine', 'snack', 'restaurant', 'food', 'cafeteria', 'coffee', 'dining', 'meal', 'supper', 'bistro'];
  if (foodKeywords.some(fk => key.includes(fk))) {
    return { category: 'Dining', icon: '🍽️', cost: 20, keywords: [key] };
  }
  
  return { category: 'Culture', icon: '📍', cost: 0, keywords: [key] };
}

export const buildItinerary = tool({
  description: `Builds a complete, bookable day itinerary for a tourist in the Sacred Valley.
Queries the real database for best-rated places near each location, returns top 3 swappable alternatives per step.
USE THIS for any request involving: travel between towns, coffee/food/activities, accommodation, or planning a day.
CALL IT as soon as you have origin + destination. Ask for missing info conversationally first if needed.`,

  parameters: z.object({
    originLocation: z.string().describe('Tourist current location, e.g. "Pisac" or a specific hotel/business name'),
    destination:    z.string().describe('Final destination for the night, e.g. "Ollantaytambo" or a specific restaurant/business'),
    desires:        z.array(z.string()).describe('Stops the tourist wants, e.g. ["coffee", "market"]'),
    constraints:    z.string().optional().describe('Any constraints: "train at 6am", "vegetarian", "budget"'),
    userLat:        z.number().optional().describe('User\'s current latitude'),
    userLng:        z.number().optional().describe('User\'s current longitude'),
  }),

  // @ts-ignore
  execute: async ({ originLocation, destination, desires, constraints, userLat, userLng }: any) => {
    // RESOLVE ANCHORS TO BUSINESSES IF POSSIBLE
    const resolveAnchor = async (locStr: string) => {
       // If the string matches a known town directly, use the map coords — don't let a DB
       // business whose name happens to contain the town name override the anchor coords.
       const knownTownCoords = getCoords(locStr);
       const isKnownTown = Object.keys(COORDS_MAP).some(k => locStr.toLowerCase().includes(k));
       if (isKnownTown) {
         return { title: locStr, lat: knownTownCoords.lat, lng: knownTownCoords.lng };
       }

       const business = await prisma.business.findFirst({
         where: {
           OR: [
             { name: { contains: locStr, mode: 'insensitive' } },
             { slug: { equals: locStr.toLowerCase() } }
           ]
         }
       });
       if (business) return { title: business.name, lat: business.lat || undefined, lng: business.lng || undefined, service: business };
       
       const pkg = await prisma.tourPackage.findFirst({
         where: {
           OR: [
             { title: { contains: locStr, mode: 'insensitive' } }
           ]
         },
         include: { business: true }
       });
       if (pkg) {
         const mapped = {
           id: pkg.id,
           slug: `pkg-${pkg.id}`,
           name: pkg.title,
           category: pkg.tags.toLowerCase().includes('stay') || pkg.tags.toLowerCase().includes('hotel') ? "STAY" : "EXPERIENCE",
           lat: pkg.business?.lat || null,
           lng: pkg.business?.lng || null,
           rating: pkg.business?.rating || 5.0,
           reviewsCount: pkg.business?.reviewsCount || 10,
           imageUrl: pkg.heroImage || pkg.business?.imageUrl || "",
           description: pkg.description,
           priceTier: pkg.basePriceUsd > 150 ? "$$$" : pkg.basePriceUsd > 75 ? "$$" : "$",
           isPackage: true
         };
         return { title: pkg.title, lat: mapped.lat || undefined, lng: mapped.lng || undefined, service: mapped };
       }

       if (locStr.toLowerCase().includes('monasterio')) {
          const mapped = { id: 'h1', name: "Hotel Monasterio", type: "STAY", category: "STAY", description: "A 16th-century monastery transformed into a luxury hotel.", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&q=80", lat: -13.5152, lng: -71.9774, rating: 5.0, priceTier: "$$$" };
          return { title: "Hotel Monasterio", lat: mapped.lat, lng: mapped.lng, service: mapped };
       }
       
       const coords = getCoords(locStr);
       return { title: locStr, lat: coords.lat, lng: coords.lng };
    };

    const [startAnchor, endAnchor] = await Promise.all([
      resolveAnchor(originLocation),
      resolveAnchor(destination),
    ]);

    const originCoords = { lat: startAnchor.lat || COORDS_MAP.urubamba.lat, lng: startAnchor.lng || COORDS_MAP.urubamba.lng };
    const destCoords   = { lat: endAnchor.lat || COORDS_MAP.urubamba.lat, lng: endAnchor.lng || COORDS_MAP.urubamba.lng };
    
    // OVERRIDE WITH GPS IF USER IS IN SACRED VALLEY AND ASKS FOR "current location"
    if ((originLocation.toLowerCase().includes('current') || originLocation.toLowerCase().includes('here')) && userLat && userLng) {
       originCoords.lat = userLat;
       originCoords.lng = userLng;
       startAnchor.title = "Current Location";
       startAnchor.lat = userLat;
       startAnchor.lng = userLng;
    }

    // BOUNDED CORRIDOR ALGORITHM
    const VALLEY_ARRAY = ["cusco", "taray", "pisac", "calca", "urubamba", "ollantaytambo"];
    const PLATEAU_ARRAY = ["cusco", "poroy", "chinchero", "maras", "moray", "urubamba", "ollantaytambo"];
    const ALL_TOWNS = Array.from(new Set([...VALLEY_ARRAY, ...PLATEAU_ARRAY]));
    
    let corridor: string[] = [];
    
    const getCorridor = (arr: string[]) => {
      const oIdx = arr.findIndex(t => originLocation.toLowerCase().includes(t));
      const dIdx = arr.findIndex(t => destination.toLowerCase().includes(t));
      if (oIdx !== -1 && dIdx !== -1) {
        const start = Math.min(oIdx, dIdx);
        const end = Math.max(oIdx, dIdx);
        return arr.slice(start, end + 1);
      }
      return null;
    };

    const valleyCorridor = getCorridor(VALLEY_ARRAY);
    const plateauCorridor = getCorridor(PLATEAU_ARRAY);
    
    if (valleyCorridor) corridor.push(...valleyCorridor);
    if (plateauCorridor) corridor.push(...plateauCorridor);

    // Add any explicitly requested towns from desires
    const requestedTowns = ALL_TOWNS.filter(town => desires.some((d: string) => d.toLowerCase().includes(town)));
    corridor.push(...requestedTowns);
    corridor.push(originLocation.toLowerCase(), destination.toLowerCase());

    // Deduplicate
    corridor = Array.from(new Set(corridor));

    const waypoints = [];
    const recommendedIds = new Set<string>();
    const usedLocationSlugs = new Set<string>();
    const usedBusinessIds = new Set<string>();

    const baseTripDist = calculateDistance(originCoords.lat, originCoords.lng, destCoords.lat, destCoords.lng);

    // --- Fetch all desire candidates + taxi rows in parallel ---
    type DesireMeta = { desire: string; category: string; icon: string; cost: number; keywords: string[]; searchCorridor: string[] };
    const desireMetas: DesireMeta[] = desires.map((desire: string) => {
      const desireLower = desire.toLowerCase();
      const specificTown = ALL_TOWNS.find(t => desireLower.includes(t));
      return { desire, ...resolveDesire(desire), searchCorridor: specificTown ? [specificTown] : corridor };
    });

    const [allDesireCandidates, allTaxiRows] = await Promise.all([
      // Fetch candidates for all desires in parallel
      Promise.all(desireMetas.map(async ({ desire, category, keywords, searchCorridor }) => {
        const primary = await prisma.business.findMany({
          where: {
            locationSlug: { in: searchCorridor },
            AND: [
              { category: { equals: category } },
              { OR: [
                { category: { in: keywords } },
                { name: { contains: desire } },
                ...keywords.map(kw => ({ name: { contains: kw } })),
                ...keywords.map(kw => ({ category: { contains: kw } })),
              ]}
            ]
          },
          orderBy: { rating: 'desc' },
          take: 50,
        });
        if (primary.length > 0) return primary;
        // Fallback: broader match
        return prisma.business.findMany({
          where: {
            locationSlug: { in: searchCorridor },
            OR: [
              { category: { equals: category } },
              { category: { in: keywords } },
              { name: { contains: desire } },
              ...keywords.map(kw => ({ name: { contains: kw } })),
              ...keywords.map(kw => ({ category: { contains: kw } })),
            ],
          },
          orderBy: { rating: 'desc' },
          take: 50,
        });
      })),
      // Fetch all taxis once (hoisted out of transit-edge loop)
      prisma.business.findMany({ where: { category: 'TRANSPORT' } }),
    ]);

    // --- Activity steps (Nodes) — selection is sequential for dedup ---
    for (let di = 0; di < desires.length; di++) {
      const { desire, cost } = desireMetas[di];
      const finalCandidates = allDesireCandidates[di].filter(
        b => !usedBusinessIds.has(b.id)
      );

      const alts = finalCandidates
        .filter(b => b.lat !== null && b.lng !== null && b.rating !== null)
        .map(b => {
          const lat = b.lat as number;
          const lng = b.lng as number;
          
          const distFromOrigin = calculateDistance(originCoords.lat, originCoords.lng, lat, lng);
          const distToDest = calculateDistance(lat, lng, destCoords.lat, destCoords.lng);
          
          let detourKm = 0;
          if (baseTripDist === 0) {
             detourKm = distFromOrigin;
          } else {
             detourKm = (distFromOrigin + distToDest) - baseTripDist;
          }
          
          // Boost score if the town hasn't been used yet to encourage distribution
          const locationBoost = usedLocationSlugs.has(b.locationSlug) ? 0 : 0.5;
          
          return { b, dist: distFromOrigin, detourKm, s: score(b.rating! + locationBoost, detourKm) };
        })
        .sort((a, b) => b.s - a.s)
        .slice(0, 3)
        .map(({ b, dist }) => ({
          id: b.id,
          name: b.name,
          rating: b.rating!,
          lat: b.lat,
          lng: b.lng,
          whatsapp: b.whatsapp ?? undefined,
          distanceKm: dist.toFixed(1),
          category: b.category,
          cost,
          locationSlug: b.locationSlug,
        }));

      if (alts.length === 0) continue;

      const selected = alts[0];
      usedLocationSlugs.add(selected.locationSlug);
      usedBusinessIds.add(selected.id);
      
      const primaryLoc = selected.locationSlug ? (selected.locationSlug.charAt(0).toUpperCase() + selected.locationSlug.slice(1)) : originLocation;
      const actualLocation = primaryLoc.toLowerCase() !== originLocation.toLowerCase() ? primaryLoc : originLocation;

      alts.forEach(a => recommendedIds.add(a.id));

      const displayCategory = desire.charAt(0).toUpperCase() + desire.slice(1);

      waypoints.push({
        id: selected.id,
        category: displayCategory,
        title: selected.name,
        locationStr: actualLocation,
        durationMins: 90,
        priceUsd: cost,
        lat: selected.lat,
        lng: selected.lng,
        rating: selected.rating,
        alternatives: alts
      });
    }

    // Sort waypoints geographically (by distance from origin) to prevent zigzagging routes
    waypoints.sort((a, b) => {
      const distA = calculateDistance(originCoords.lat, originCoords.lng, a.lat!, a.lng!);
      const distB = calculateDistance(originCoords.lat, originCoords.lng, b.lat!, b.lng!);
      return distA - distB;
    });

    // --- Transit Edges ---
    const transitEdges = [];
    
    // Create edges connecting origin -> waypoints -> destination
    const nodes = [
      { locationStr: originLocation, coords: originCoords },
      ...waypoints.map(w => ({ locationStr: w.locationStr, coords: { lat: w.lat!, lng: w.lng! } })),
      { locationStr: destination, coords: destCoords }
    ];

    for (let i = 0; i < nodes.length - 1; i++) {
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];
      
      const transitKm = calculateDistance(fromNode.coords.lat, fromNode.coords.lng, toNode.coords.lat, toNode.coords.lng);
      const transitCost = Math.max(15, Math.round(transitKm * 1.8));

      const taxiRows = allTaxiRows;

      const oLower = fromNode.locationStr.toLowerCase();
      const dLower = toNode.locationStr.toLowerCase();

      const validTaxis = taxiRows.filter(t => {
        const zones = JSON.parse(t.serviceZones || "[]") as string[];
        return zones.some(z => oLower.includes(z) || dLower.includes(z));
      }).map(t => {
        const zones = JSON.parse(t.serviceZones || "[]") as string[];
        const coversBoth = zones.some(z => oLower.includes(z)) && zones.some(z => dLower.includes(z));
        return { ...t, coversBoth, zonesCount: zones.length, zones };
      }).sort((a, b) => {
        if (a.coversBoth && !b.coversBoth) return -1;
        if (!a.coversBoth && b.coversBoth) return 1;
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        if (ratingA !== ratingB) return ratingB - ratingA;
        return b.zonesCount - a.zonesCount;
      });

      const walkOption = {
        id: 'walk-' + fromNode.locationStr,
        name: 'Walk',
        priceUsd: 0,
        whatsapp: undefined,
      };

      if (validTaxis.length > 0) {
        validTaxis.slice(0, 3).forEach(t => recommendedIds.add(t.id));
        const alternatives = validTaxis.slice(1, 3).map(t => ({
          id: t.id,
          name: t.name,
          priceUsd: transitCost,
          whatsapp: t.whatsapp ?? undefined,
        }));
        
        // Add Moto Taxi option
        alternatives.push({
          id: 'moto-' + fromNode.locationStr,
          name: 'Moto Taxi (Torito)',
          priceUsd: Math.max(2, Math.round(transitKm * 0.5)),
          whatsapp: undefined,
        });

        // Add public transport option
        alternatives.push({
          id: 'colectivo-' + fromNode.locationStr,
          name: 'Public Business (Colectivo)',
          priceUsd: Math.max(1, Math.round(transitKm * 0.15)),
          whatsapp: undefined,
        });

        // Add Walk option
        alternatives.push(walkOption);

        const defaultDriver = transitKm < 1.5 ? walkOption : {
          id: validTaxis[0].id,
          name: validTaxis[0].name,
          priceUsd: transitCost,
          whatsapp: validTaxis[0].whatsapp ?? undefined,
        };

        const alternativeDrivers = transitKm < 1.5 ? [
          {
            id: validTaxis[0].id,
            name: validTaxis[0].name,
            priceUsd: transitCost,
            whatsapp: validTaxis[0].whatsapp ?? undefined,
          },
          ...alternatives.filter(a => a.id !== walkOption.id)
        ] : alternatives;

        transitEdges.push({
          fromLocation: fromNode.locationStr,
          toLocation: toNode.locationStr,
          defaultDriver,
          alternativeDrivers
        });
      } else {
        const fallbackAlternatives = [
          { id: 'sv-transfers-' + fromNode.locationStr, name: 'Sacred Valley Transfers', priceUsd: Math.max(10, transitCost - 5), whatsapp: undefined },
          { id: 'moto-' + fromNode.locationStr, name: 'Moto Taxi (Torito)', priceUsd: Math.max(2, Math.round(transitKm * 0.5)), whatsapp: undefined },
          { id: 'colectivo-' + fromNode.locationStr, name: 'Public Business (Colectivo)', priceUsd: Math.max(1, Math.round(transitKm * 0.15)), whatsapp: undefined },
          walkOption
        ];

        const defaultDriver = transitKm < 1.5 ? walkOption : {
          id: 'valle-safe-' + fromNode.locationStr,
          name: 'Valle Safe SUV',
          priceUsd: transitCost,
        };

        const alternativeDrivers = transitKm < 1.5 ? [
          { id: 'valle-safe-' + fromNode.locationStr, name: 'Valle Safe SUV', priceUsd: transitCost, whatsapp: undefined },
          ...fallbackAlternatives.filter(a => a.id !== walkOption.id)
        ] : fallbackAlternatives;

        transitEdges.push({
          fromLocation: fromNode.locationStr,
          toLocation: toNode.locationStr,
          defaultDriver,
          alternativeDrivers
        });
      }
    }

    // --- Time Awareness Engine ---
    let currentTimeMs = 8 * 60; // Start at 08:00 AM by default

    const formatTime = (mins: number) => {
      const h = Math.floor(mins / 60) % 24;
      const m = Math.floor(mins % 60);
      const isPM = h >= 12;
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`;
    };

    for (let i = 0; i < transitEdges.length; i++) {
      const edge = transitEdges[i] as any;
      const fromNode = nodes[i];
      const toNode = nodes[i + 1];
      const transitKm = calculateDistance(fromNode.coords.lat, fromNode.coords.lng, toNode.coords.lat, toNode.coords.lng);

      const isWalk = edge.defaultDriver.id?.startsWith('walk-');
      const speedKmh = isWalk ? 5 : 40;
      const transitMins = Math.max(10, Math.round((transitKm / speedKmh) * 60));

      edge.startTime = formatTime(currentTimeMs);
      currentTimeMs += transitMins;
      edge.endTime = formatTime(currentTimeMs);

      if (i < waypoints.length) {
        const wp = waypoints[i] as any;
        wp.startTime = formatTime(currentTimeMs);
        currentTimeMs += (wp.durationMins || 90);
        wp.endTime = formatTime(currentTimeMs);
      }
    }
    // Track AI Recommendations
    try {
      for (const id of Array.from(recommendedIds)) {
        trackAiRecommendation(id).catch(console.error);
      }
    } catch (e) {
      console.error("Failed to track AI recommendations:", e);
    }

    return {
      startAnchor: {
        ...startAnchor,
        locationStr: startAnchor.title,
        type: 'GENERIC_TOWN' as const,
        time: (transitEdges[0] as Record<string, unknown>)?.startTime || "09:00"
      },
      endAnchor: {
        ...endAnchor,
        locationStr: endAnchor.title,
        type: 'GENERIC_TOWN' as const,
        time: (transitEdges[transitEdges.length - 1] as Record<string, unknown>)?.endTime || "18:00"
      },
      needsAccommodationUpsell: true,
      waypoints,
      transitEdges,
      title: `${originLocation} → ${destination}`,
      constraints: constraints ?? '',
      totalCost: waypoints.reduce((sum, w) => sum + (w.priceUsd ?? 0), 0) + transitEdges.reduce((sum, e) => sum + (e.defaultDriver.priceUsd ?? 0), 0)
    };
  },
} as any);
