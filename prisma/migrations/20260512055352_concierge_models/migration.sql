-- CreateEnum
CREATE TYPE "RideStatus" AS ENUM ('HOLD_SECURED', 'DRIVER_ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('TOURIST', 'DRIVER', 'SYSTEM');

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatsappNumber" TEXT NOT NULL,
    "carModel" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideBooking" (
    "id" TEXT NOT NULL,
    "touristName" TEXT,
    "touristPhone" TEXT,
    "pickupLocation" TEXT NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "priceUsd" DOUBLE PRECISION NOT NULL,
    "stripeIntentId" TEXT,
    "status" "RideStatus" NOT NULL DEFAULT 'HOLD_SECURED',
    "scheduledFor" TIMESTAMP(3),
    "etaMinutes" INTEGER,
    "driverId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RideBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideMessage" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RideMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RideBooking_stripeIntentId_key" ON "RideBooking"("stripeIntentId");

-- AddForeignKey
ALTER TABLE "RideBooking" ADD CONSTRAINT "RideBooking_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideMessage" ADD CONSTRAINT "RideMessage_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "RideBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
