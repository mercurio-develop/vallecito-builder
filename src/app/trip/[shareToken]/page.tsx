import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { Metadata } from "next"
import { TripDashboard } from "@/features/trip/TripDashboard"

async function fetchTripByToken(token: string) {
  if (!token) return null
  return await prisma.trip.findUnique({
    where: { shareToken: token },
    include: {
      business: true,
      travelers: true,
      days: {
        orderBy: { dayNumber: 'asc' },
        include: { tourPackage: true }
      }
    }
  })
}

export async function generateMetadata({ params }: { params: Promise<{ shareToken: string }> }): Promise<Metadata> {
  const { shareToken } = await params
  const trip = await fetchTripByToken(shareToken)

  if (!trip) {
    return { title: 'Trip Not Found | Vallecito' }
  }

  const title = `Your Vallecito Itinerary: ${trip.tripTitle}`
  const description = `View your custom organized trip for ${trip.paxCount} travelers spanning ${trip.days.length} days.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/images/og-default.jpg",
          width: 1200,
          height: 630,
          alt: title,
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/images/og-default.jpg"],
    },
  }
}

export default async function MagicLinkPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = await params
  const trip = await fetchTripByToken(shareToken)

  if (!trip) return notFound()

  return <TripDashboard trip={trip as any} />
}