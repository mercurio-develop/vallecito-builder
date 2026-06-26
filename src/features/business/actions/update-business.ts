"use server"

import { prisma } from "@/lib/prisma"
import { revalidateBusinesses } from "./fetch-businesses"
import { getSession } from "@/features/auth/queries/get-session"

export async function updateBusinessAction(
  id: string,
  data: {
    name?: string
    category?: string
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
  }
) {
  try {
    const { user } = await getSession()
    if (!user) {
      return { success: false, error: "Unauthorized" }
    }

    if (!id) {
      return { success: false, error: "ID is required" }
    }

    const business = await prisma.business.findUnique({
      where: { id }
    })

    if (!business) {
      return { success: false, error: "Place not found" }
    }

    // Permission Check:
    // User can edit if they are SUPER_ADMIN or own the business (same agencyId).
    const isSuperAdmin = user.role === "SUPER_ADMIN"
    const isOwner = business.agencyId && business.agencyId === user.agencyId

    if (!isSuperAdmin && !isOwner) {
      return { success: false, error: "You do not have permission to edit this place." }
    }

    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.category !== undefined) updateData.category = data.category
    if (data.lat !== undefined) updateData.lat = data.lat
    if (data.lng !== undefined) updateData.lng = data.lng
    if (data.description !== undefined) updateData.description = data.description
    if (data.tagline !== undefined) updateData.tagline = data.tagline
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl
    if (data.heroImages !== undefined) updateData.heroImages = JSON.stringify(data.heroImages)
    if (data.whatsapp !== undefined) updateData.whatsapp = data.whatsapp || null
    if (data.contactEmail !== undefined) updateData.contactEmail = data.contactEmail
    if (data.priceTier !== undefined) updateData.priceTier = data.priceTier
    if (data.locationSlug !== undefined) updateData.locationSlug = data.locationSlug
    if (data.isShared !== undefined) updateData.isShared = data.isShared

    const updated = await prisma.business.update({
      where: { id },
      data: updateData
    })

    await revalidateBusinesses()

    return { success: true, business: updated }
  } catch (error: any) {
    console.error("Failed to update business:", error)
    return { success: false, error: error.message || "Failed to update business" }
  }
}
