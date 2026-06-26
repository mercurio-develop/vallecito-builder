"use server"

import { prisma } from "@/lib/prisma"
import { revalidateBusinesses } from "./fetch-businesses"
import { getSession } from "@/features/auth/queries/get-session"

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

export async function createBusinessAction(data: {
  name: string
  category: string
  lat?: number
  lng?: number
  description?: string
  tagline?: string
  imageUrl?: string
  heroImages?: string[]
  whatsapp?: string
  contactEmail?: string
  priceTier?: string
  locationSlug?: string
  isShared?: boolean
}) {
  try {
    const { user } = await getSession()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    if (!data.name) {
      return { success: false, error: "Name is required" }
    }

    let slug = slugify(data.name)
    if (!slug) {
      slug = "place-" + Math.random().toString(36).substring(2, 8)
    }

    // Check slug collision
    const existing = await prisma.business.findUnique({
      where: { slug }
    })
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    const created = await prisma.business.create({
      data: {
        slug,
        name: data.name,
        category: data.category || "EXPERIENCE",
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        description: data.description || "",
        tagline: data.tagline || "",
        imageUrl: data.imageUrl || "",
        heroImages: data.heroImages ? JSON.stringify(data.heroImages) : "[]",
        whatsapp: data.whatsapp || null,
        contactEmail: data.contactEmail || "",
        priceTier: data.priceTier || "$$",
        locationSlug: data.locationSlug || "cusco",
        agencyId: user.agencyId || null,
        isShared: data.isShared !== undefined ? data.isShared : true,
      }
    })

    await revalidateBusinesses()

    return { success: true, business: created }
  } catch (error: any) {
    console.error("Failed to create business:", error)
    return { success: false, error: error.message || "Failed to create business" }
  }
}
