"use server"

import { prisma } from "@/lib/prisma"
import { revalidateBusinesses } from "./fetch-businesses"
import { getSession } from "@/features/auth/queries/get-session"

export async function deleteBusinessAction(id: string) {
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
    // User can delete if they are SUPER_ADMIN or own the business (same agencyId).
    const isSuperAdmin = user.role === "SUPER_ADMIN"
    const isOwner = business.agencyId && business.agencyId === user.agencyId

    if (!isSuperAdmin && !isOwner) {
      return { success: false, error: "You do not have permission to delete this place." }
    }

    const deleted = await prisma.business.delete({
      where: { id }
    })

    await revalidateBusinesses()

    return { success: true, business: deleted }
  } catch (error: any) {
    console.error("Failed to delete business:", error)
    return { success: false, error: error.message || "Failed to delete business" }
  }
}
