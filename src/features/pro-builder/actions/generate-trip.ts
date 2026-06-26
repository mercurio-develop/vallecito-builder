"use server"

import { DraftTrip } from "../types"
import { prisma } from "@/lib/prisma"

export async function generateProTrip(draft: DraftTrip) {
  // 1. Validate data
  if (!draft.title || !draft.startDate || draft.days.length === 0) {
    throw new Error("Invalid draft trip data")
  }

  // 2. Generate a share token
  const shareToken = "tx_" + (await import('crypto')).randomBytes(8).toString('hex')

  const startDate = new Date(draft.startDate);
  const endDate = draft.endDate ? new Date(draft.endDate) : new Date(startDate.getTime() + (draft.days.length - 1) * 24 * 60 * 60 * 1000);

  // 3. Map to Prisma models and save
  try {
    const trip = await prisma.trip.create({
      data: {
        tripTitle: draft.title,
        startDate,
        endDate,
        paxCount: draft.paxCount || 1,
        baseCampStrategy: "FLEXIBLE", 
        shareToken,
        status: "PROPOSED",
        travelers: {
          create: draft.travelers?.map((t, idx) => ({
            isLeadGuest: idx === 0,
            firstName: t.firstName || `Traveler ${idx + 1}`,
            lastName: t.lastName || '',
            passportNumber: t.passportNumber || '',
            nationality: t.nationality || '',
            dateOfBirth: t.dateOfBirth ? new Date(t.dateOfBirth) : new Date('1990-01-01'),
            whatsappNumber: t.whatsappNumber || null,
            dietaryRestrictions: t.dietaryRestrictions || null,
            medicalNotes: t.medicalNotes || null,
          })) || []
        },
        days: {
          create: draft.days.map((day, idx) => ({
            dayNumber: day.dayNumber || idx + 1,
            date: day.date ? new Date(day.date) : new Date(startDate.getTime() + idx * 24 * 60 * 60 * 1000),
            sleepTown: day.endAnchor?.locationStr || 'Unknown',
            dayTheme: day.guideNotes?.slice(0, 50) || 'Exploration', // Rough fallback
            guideNotes: day.guideNotes || null,
            startTime: day.startAnchor?.time || "08:00 AM",
            meetingPoint: day.startAnchor?.locationStr || null,
            eventsJson: JSON.stringify(day.events || []),
            isAgencyLocked: true,
            isCustomized: true,
          }))
        }
      }
    });

    return {
      success: true,
      shareToken: trip.shareToken,
      message: "Trip generated successfully"
    }
  } catch (error) {
    console.error("Failed to generate pro trip:", error);
    throw new Error("Failed to save trip to database");
  }
}
