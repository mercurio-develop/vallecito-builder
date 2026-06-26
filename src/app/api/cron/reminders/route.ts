import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";

export async function GET(request: Request) {
  // Ensure the request is authorized by Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // Find all trips that start tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(tomorrow.getDate() + 1);

    const upcomingTrips = await prisma.trip.findMany({
      where: {
        startDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow
        },
        status: "CONFIRMED"
      },
      include: {
        travelers: true
      }
    });

    console.log(`Found ${upcomingTrips.length} trips starting tomorrow.`);

    // Trigger Resend to send the reminder email
    for (const trip of upcomingTrips) {
      const leadTraveler = trip.travelers.find(t => t.isLeadGuest) || trip.travelers[0];
      if (leadTraveler) {
        await sendReminderEmail(trip, leadTraveler);
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: upcomingTrips.length 
    });
  } catch (error) {
    console.error("Failed to process cron reminders:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
