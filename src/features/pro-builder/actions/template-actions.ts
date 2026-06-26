"use server"

import { prisma } from "@/lib/prisma"
import { UniversalTrip } from "@/lib/types/trip"

export async function saveTripAsTemplate(trip: UniversalTrip, title: string, tags: string) {
  try {
    // Generate a unique share token just in case it's needed
    const shareToken = Math.random().toString(36).substring(2, 15);

    const savedTrip = await prisma.trip.create({
      data: {
        tripTitle: title,
        startDate: trip.startDate || new Date(),
        endDate: trip.endDate || new Date(),
        paxCount: trip.paxCount || 1,
        baseCampStrategy: "TEMPLATE",
        status: "TEMPLATE",
        isVerifiedTemplate: true,
        templateVibeTags: tags,
        shareToken,
        days: {
          create: trip.days.map((day) => {
            // Strip out large cyclic objects if necessary, or just stringify the events and anchors
            const eventsJson = JSON.stringify({
              events: day.events,
              startAnchor: day.startAnchor,
              endAnchor: day.endAnchor,
              isComplete: day.isComplete
            });
            
            return {
              dayNumber: day.dayNumber,
              date: day.date || new Date(),
              sleepTown: day.sleepTown || "Cusco",
              dayTheme: day.title || "Template Day",
              eventsJson: eventsJson
            }
          })
        }
      }
    });

    return { success: true, tripId: savedTrip.id };
  } catch (error: any) {
    console.error("Failed to save template:", error);
    return { success: false, error: error.message };
  }
}
