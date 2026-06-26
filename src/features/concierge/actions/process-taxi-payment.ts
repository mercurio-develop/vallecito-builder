"use server"

import Stripe from "stripe";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY env var is not set");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any,
});

const CreateIntentSchema = z.object({
  estimatedCostUSD: z.number(),
  origin: z.string(),
  destinationName: z.string(),
  touristName: z.string().optional(),
  touristPhone: z.string().optional(),
});

export async function createTaxiPaymentIntent(data: z.infer<typeof CreateIntentSchema>) {
  const result = CreateIntentSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid request payload." };
  }

  const { estimatedCostUSD, origin, destinationName, touristName, touristPhone } = result.data;

  try {
    // 1. Create the Stripe PaymentIntent with a manual capture hold
    const paymentIntent = await stripe.paymentIntents.create({
      amount: estimatedCostUSD * 100,
      currency: "usd",
      capture_method: "manual",
      metadata: {
        origin,
        destinationName,
        touristName: touristName || "Guest",
        touristPhone: touristPhone || "",
      },
    }, {
      idempotencyKey: `taxi-${origin}-${destinationName}-${estimatedCostUSD}`,
    });

    // 2. Save the RideBooking to the database in PENDING state (before UI confirms it)
    await prisma.rideBooking.create({
      data: {
        pickupLocation: origin,
        dropoffLocation: destinationName,
        priceUsd: estimatedCostUSD,
        stripeIntentId: paymentIntent.id,
        status: "HOLD_SECURED", // Maps to Hold secured enum
        touristName: touristName || "Guest",
        touristPhone: touristPhone || "",
      },
    });

    return { clientSecret: paymentIntent.client_secret };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return { error: "Failed to initialize payment." };
  }
}

export async function notifyGhostPhone(paymentIntentId: string) {
  try {
      // In a real app, you would retrieve the payment intent to verify status
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // It should be requires_capture because we used manual capture
      if (paymentIntent.status !== "requires_capture") {
          return { error: "Payment hold not successful." };
      }

      // We should also update the booking status to indicate we are finding a driver or dispatched
      await prisma.rideBooking.update({
        where: { stripeIntentId: paymentIntentId },
        data: { status: "IN_PROGRESS" }
      });

      const { origin, destinationName } = paymentIntent.metadata;

      // Mock webhook call to Ghost Phone microservice
      const webhookUrl = process.env.GHOST_PHONE_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn("GHOST_PHONE_WEBHOOK_URL not set — skipping driver dispatch");
        return { success: true };
      }
      
      const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              type: "TAXI_BOOKING_HOLD_SECURED",
              data: {
                  origin,
                  destinationName,
                  amountHeld: paymentIntent.amount / 100,
                  stripeIntentId: paymentIntent.id,
              }
          })
      });

      if (!response.ok) {
         console.warn("Ghost Phone webhook failed, but payment hold succeeded.");
      }

      return { success: true };

  } catch (error) {
      console.error("Error notifying Ghost Phone:", error);
      return { error: "Failed to notify driver." };
  }
}
