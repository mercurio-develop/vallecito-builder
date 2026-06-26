import { prisma } from "@/lib/prisma"
import { getSession } from "@/features/auth/queries/get-session"

export async function getAgencyTrips() {
  const { user } = await getSession()
  
  if (!user || !user.agencyId) {
    return []
  }

  const trips = await prisma.trip.findMany({
    where: {
      agencyId: user.agencyId,
    },
    include: {
      travelers: true,
    },
    orderBy: {
      createdAt: "desc"
    }
  })

  return trips
}
