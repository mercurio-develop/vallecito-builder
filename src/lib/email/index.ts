import { Resend } from "resend";
import type { Trip, Traveler } from "@prisma/client";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export async function sendTripConfirmationEmail(
  trip: Trip,
  leadTraveler: Traveler
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("No RESEND_API_KEY found, skipping email send.");
    return { success: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Vallecito Concierge <hello@vallecito.app>",
      to: [leadTraveler.email],
      subject: `Your Vallecito Itinerary is Confirmed: ${trip.tripTitle}`,
      html: `
        <h1>Your journey is confirmed!</h1>
        <p>Dear ${leadTraveler.firstName},</p>
        <p>We're thrilled to confirm your trip: <strong>${trip.tripTitle}</strong>.</p>
        <p>You can access your complete, interactive itinerary at any time using your secure link.</p>
        <p>If you have any questions, your AI concierge is available 24/7 directly on your itinerary page.</p>
        <br />
        <p>Safe travels,<br />The Vallecito Team</p>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return { success: false, error };
  }
}

export async function sendReminderEmail(
  trip: Trip,
  leadTraveler: Traveler
) {
  if (!process.env.RESEND_API_KEY) {
    console.log("No RESEND_API_KEY found, skipping email send.");
    return { success: true };
  }

  try {
    const data = await resend.emails.send({
      from: "Vallecito Concierge <hello@vallecito.app>",
      to: [leadTraveler.email],
      subject: `Reminder: Your Vallecito Trip starts tomorrow!`,
      html: `
        <h1>Get ready for your adventure!</h1>
        <p>Dear ${leadTraveler.firstName},</p>
        <p>Your trip, <strong>${trip.tripTitle}</strong>, begins tomorrow!</p>
        <p>Make sure to check your itinerary for meeting times and locations. Don't forget your Boleto Turístico if it's required for your activities!</p>
        <br />
        <p>Safe travels,<br />The Vallecito Team</p>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error sending reminder email:", error);
    return { success: false, error };
  }
}
