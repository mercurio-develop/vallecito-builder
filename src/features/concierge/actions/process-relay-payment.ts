"use server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY env var is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

export async function createRelayPaymentIntent({
  totalCostUSD,
  relayId,
  touristName,
  touristPhone,
}: {
  totalCostUSD: number;
  relayId: string;
  touristName?: string;
  touristPhone?: string;
}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCostUSD * 100,
      currency: "usd",
      metadata: { type: "chrono-relay", relayId },
    }, {
      idempotencyKey: `relay-${relayId}`,
    });

    await prisma.rideBooking.create({
      data: {
        pickupLocation: `Relay ${relayId}`,
        dropoffLocation: "Multi-stop relay",
        priceUsd: totalCostUSD,
        stripeIntentId: paymentIntent.id,
        status: "HOLD_SECURED",
        touristName: touristName || "Guest",
        touristPhone: touristPhone || "",
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error: any) {
    console.error("Stripe error:", error);
    return { error: error.message };
  }
}
