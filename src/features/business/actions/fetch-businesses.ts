"use server"

import { prisma } from "@/lib/prisma"
import { COORDS_MAP } from "@/lib/constants"
import { unstable_cache } from "next/cache"
import { revalidateTag } from "next/cache"
import { getSession } from "@/features/auth/queries/get-session"

export async function revalidateBusinesses() {
  // Call with type assertion to handle version variance in Next.js types
  ;(revalidateTag as (tag: string) => void)('businesses')
}

// Helper to interleave categories while maintaining relative rating sort
function interleaveCategories(sortedBusinesses: any[]) {
  const byCategory: Record<string, any[]> = {}
  sortedBusinesses.forEach((b) => {
    const cat = b.category || 'EXPERIENCE'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(b)
  })

  const interleaved = []
  const categories = Object.keys(byCategory)
  let hasMore = true

  while (hasMore) {
    hasMore = false
    for (const cat of categories) {
      if (byCategory[cat] && byCategory[cat].length > 0) {
        const item = byCategory[cat].shift()
        if (item) interleaved.push(item)
        hasMore = true
      }
    }
  }
  return interleaved
}

export interface FetchBusinessesParams {
  query?: string
  category?: string
  loc?: string
  radiusKm?: number
  userLat?: number
  userLng?: number
  sort?: string
  page?: number
  limit: number
}

// Helper for mapping price tier
const PRICE_TIER_VALUE: Record<string, number> = {
  "$": 1,
  "$$": 2,
  "$$$": 3,
  "$$$$": 4,
}

// Haversine formula
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c;
}

async function fetchBusinessesInternal({ query = "", category = "", loc = "", radiusKm, userLat, userLng, sort = "recommended", page = 0, limit = 20 }: FetchBusinessesParams) {
  const { user } = await getSession();

  let targetCategory = category
  const q = query.trim()
  let isHeuristicMatch = false

  // If there's a complex query and no strict category filter applied yet
  if (q && !targetCategory) {
    const qLower = q.toLowerCase();
    if (qLower.includes("ayahuasca") || qLower.includes("retreat") || qLower.includes("ashram") || qLower.includes("spiritual") || qLower.includes("san pedro") || qLower.includes("shaman")) {
      targetCategory = "Spiritual"; isHeuristicMatch = true;
    }
    else if (qLower.includes("massage") || qLower.includes("spa") || qLower.includes("wellness") || qLower.includes("recovery") || qLower.includes("yoga")) { 
      targetCategory = "Wellness"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("tour") || qLower.includes("trekking") || qLower.includes("expedition") || qLower.includes("travel") || qLower.includes("agency") || qLower.includes("agencia")) { 
      targetCategory = "Agency"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("atv") || qLower.includes("hiking") || qLower.includes("adventure") || qLower.includes("trail") || qLower.includes("llama")) { 
      targetCategory = "Adventure"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("picantería") || qLower.includes("restaurant") || qLower.includes("food") || qLower.includes("dining") || qLower.includes("eat") || qLower.includes("coffee") || qLower.includes("vegan") || qLower.includes("cafe")) { 
      targetCategory = "Dining"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("hotel") || qLower.includes("stays") || qLower.includes("sleep") || qLower.includes("boutique") || qLower.includes("lodging") || qLower.includes("hostel")) { 
      targetCategory = "Stays"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("textile") || qLower.includes("tejido") || qLower.includes("weaving") || qLower.includes("artesanía") || qLower.includes("artisan") || qLower.includes("tejedoras")) { 
      targetCategory = "Textiles"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("market") || qLower.includes("culture") || qLower.includes("art") || qLower.includes("textile") || qLower.includes("ruins")) { 
      targetCategory = "Culture"; isHeuristicMatch = true; 
    }
    else if (qLower.includes("transport") || qLower.includes("taxi") || qLower.includes("airport") || qLower.includes("driver") || qLower.includes("shuttle") || qLower.includes("transfer")) { 
      targetCategory = "Transport"; isHeuristicMatch = true; 
    }
  }

  const andConditions: any[] = [
    { category: { notIn: ['AGENCY', 'Agency', 'agency'] } }
  ]

  // Visibility/Permissions conditions
  const visibilityConditions: any[] = [
    { agencyId: null },
    { isShared: true }
  ]
  if (user?.agencyId) {
    visibilityConditions.push({ agencyId: user.agencyId })
  }
  andConditions.push({ OR: visibilityConditions })

  if (targetCategory) {
    const categories = targetCategory.split(',').map(c => c.trim()).filter(Boolean)
    if (categories.length > 0) {
      const expandedCategories = new Set<string>();
      for (const cat of categories) {
        if (cat.toUpperCase() === 'AGENCY') continue;
        expandedCategories.add(cat);
        expandedCategories.add(cat.toUpperCase());
        expandedCategories.add(cat.toLowerCase());
        expandedCategories.add(cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase());
        if (cat.toUpperCase() === 'BOLETO') {
          expandedCategories.add('Tourist Ticket');
          expandedCategories.add('TOURIST TICKET');
          expandedCategories.add('tourist ticket');
        }
      }
      if (expandedCategories.size > 0) {
        andConditions.push({ category: { in: Array.from(expandedCategories) } });
      }
    }
  }

  if (loc && radiusKm === undefined) {
    andConditions.push({ locationSlug: loc });
  }

  if (q && !isHeuristicMatch) {
    const titleCase = q.charAt(0).toUpperCase() + q.slice(1).toLowerCase();
    andConditions.push({
      OR: [
        { name: { contains: q } },
        { name: { contains: q.toLowerCase() } },
        { name: { contains: titleCase } },
        { name: { contains: q.toUpperCase() } },
        { category: { contains: q } },
        { description: { contains: q } },
        { description: { contains: q.toLowerCase() } },
        { description: { contains: titleCase } },
      ]
    });
  }

  const whereClause = { AND: andConditions }

  // Fetch with selective projection to keep builder fast
  let businesses: any[] = await prisma.business.findMany({
    where: whereClause,
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      lat: true,
      lng: true,
      rating: true,
      reviewsCount: true,
      imageUrl: true,
      whatsapp: true,
      isClaimed: true,
      isAsociado: true,
      isFeatured: true,
      locationSlug: true,
      tagline: true,
      description: true,
      priceTier: true,
      instagramFollowers: true,
      agencyId: true,
      isShared: true,
      agency: {
        select: {
          name: true
        }
      }
    }
  })

  // Distance Filter
  if (radiusKm !== undefined) {
    let centerLat = userLat;
    let centerLng = userLng;

    if (centerLat === undefined || centerLng === undefined) {
      if (loc && COORDS_MAP[loc]) {
        centerLat = COORDS_MAP[loc].lat;
        centerLng = COORDS_MAP[loc].lng;
      }
    }

    if (centerLat !== undefined && centerLng !== undefined) {
      businesses = businesses.filter(b => {
        if (b.lat === null || b.lng === null) return false;
        const dist = getDistanceKm(centerLat!, centerLng!, b.lat, b.lng);
        return dist <= radiusKm;
      });
    }
  }

  // Sort based on sort parameter
  businesses.sort((a, b) => {
    if (sort === "rating_desc") {
      const ratingA = a.rating || 0
      const ratingB = b.rating || 0
      if (ratingA !== ratingB) return ratingB - ratingA
      return b.reviewsCount - a.reviewsCount
    } else if (sort === "price_asc") {
      const priceA = PRICE_TIER_VALUE[a.priceTier] || 2
      const priceB = PRICE_TIER_VALUE[b.priceTier] || 2
      if (priceA !== priceB) return priceA - priceB
      return (b.rating || 0) - (a.rating || 0)
    } else if (sort === "price_desc") {
      const priceA = PRICE_TIER_VALUE[a.priceTier] || 2
      const priceB = PRICE_TIER_VALUE[b.priceTier] || 2
      if (priceA !== priceB) return priceB - priceA
      return (b.rating || 0) - (a.rating || 0)
    } else {
      const scoreA = (a.rating || 0) * Math.log10((a.reviewsCount || 0) + 10) + (a.isAsociado ? 50 : 0) + (a.isClaimed ? 2 : 0) + ((a.instagramFollowers || 0) * 0.001)
      const scoreB = (b.rating || 0) * Math.log10((b.reviewsCount || 0) + 10) + (b.isAsociado ? 50 : 0) + (b.isClaimed ? 2 : 0) + ((b.instagramFollowers || 0) * 0.001)
      return scoreB - scoreA
    }
  })

  // Interleave categories only if sort is recommended
  if (sort === "recommended") {
    businesses = interleaveCategories(businesses)
  }

  const startIndex = page * limit
  const paginatedBusinesses = businesses.slice(startIndex, startIndex + limit)

  // Calculate category counts based on current filters (EXCLUDING category filter)
  const countWhereClause = { ...whereClause }
  delete (countWhereClause as any).category

  const counts = await prisma.business.groupBy({
    by: ['category'],
    where: countWhereClause,
    _count: {
      _all: true
    }
  })

  const categoryCounts: Record<string, number> = {}
  counts.forEach(c => {
    categoryCounts[c.category.toUpperCase()] = c._count._all
  })

  return {
    businesses: paginatedBusinesses,
    allBusinesses: businesses,
    categoryCounts,
    hasMore: startIndex + limit < businesses.length
  }
}

export async function fetchBusinesses(params: FetchBusinessesParams) {
  const { user } = await getSession();
  const agencyId = user?.agencyId || "public";

  const cacheKey = [
    "businesses-query",
    agencyId,
    params.query || "",
    params.category || "",
    params.loc || "",
    String(params.radiusKm || ""),
    String(params.userLat || ""),
    String(params.userLng || ""),
    params.sort || "recommended",
    String(params.page || 0),
    String(params.limit || 20)
  ];

  const cachedFetch = unstable_cache(
    async () => fetchBusinessesInternal(params),
    cacheKey,
    {
      tags: ['businesses'],
      revalidate: 3600
    }
  );

  return cachedFetch();
}

export async function getBusinessById(id: string) {
  return await prisma.business.findUnique({
    where: { id },
    include: {
      agency: {
        select: {
          name: true
        }
      }
    }
  });
}
