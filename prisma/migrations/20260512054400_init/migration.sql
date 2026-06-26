-- CreateEnum
CREATE TYPE "TravelerArchetype" AS ENUM ('LIVING_CULTURE', 'GASTRONOMIC', 'LUXURY_WELLNESS', 'SPIRITUAL', 'MOUNTAIN_EXPLORER');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('DRAFT', 'PROPOSED', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'TEMPLATE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'AGENCY_OWNER', 'AGENCY_STAFF');

-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'DINING',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL DEFAULT '',
    "heroImages" TEXT NOT NULL DEFAULT '[]',
    "whatsapp" TEXT,
    "isClaimed" BOOLEAN NOT NULL DEFAULT false,
    "isAsociado" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "locationSlug" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "contactEmail" TEXT NOT NULL DEFAULT '',
    "socialLinks" TEXT NOT NULL DEFAULT '{}',
    "instagramHandle" TEXT,
    "instagramFollowers" INTEGER NOT NULL DEFAULT 0,
    "priceTier" TEXT NOT NULL DEFAULT '$$',
    "marginTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "whatsappClicksCount" INTEGER NOT NULL DEFAULT 0,
    "aiRecommendationsCount" INTEGER NOT NULL DEFAULT 0,
    "vehicleType" TEXT,
    "capacity" INTEGER,
    "serviceZones" TEXT NOT NULL DEFAULT '[]',
    "guideName" TEXT,
    "seoMetaTitle" TEXT,
    "seoMetaDesc" TEXT,
    "specialties" TEXT NOT NULL DEFAULT '[]',
    "themeConfig" TEXT NOT NULL DEFAULT '{}',
    "featuresJson" TEXT NOT NULL DEFAULT '[]',
    "qrCodeUrl" TEXT,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TourPackage" (
    "id" TEXT NOT NULL,
    "businessId" TEXT,
    "title" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "sector" TEXT NOT NULL,
    "pace" TEXT NOT NULL DEFAULT 'BALANCED',
    "description" TEXT NOT NULL,
    "basePriceUsd" DOUBLE PRECISION NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'MODERATE',
    "maxAltitude" TEXT NOT NULL DEFAULT '',
    "durationDays" INTEGER NOT NULL DEFAULT 1,
    "durationStr" TEXT NOT NULL DEFAULT '',
    "elevation" TEXT NOT NULL DEFAULT '',
    "bestSeason" TEXT NOT NULL DEFAULT '',
    "packageType" TEXT NOT NULL DEFAULT 'SINGLE_DAY',
    "tags" TEXT NOT NULL DEFAULT '',
    "included" TEXT NOT NULL DEFAULT '[]',
    "notIncluded" TEXT NOT NULL DEFAULT '[]',
    "highlights" TEXT NOT NULL DEFAULT '[]',
    "requirements" TEXT NOT NULL DEFAULT '[]',
    "itineraryJson" TEXT NOT NULL DEFAULT '[]',
    "galleryJson" TEXT NOT NULL DEFAULT '[]',
    "heroImage" TEXT,

    CONSTRAINT "TourPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#f43f5e',
    "tagline" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL,
    "whatsapp" TEXT,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "role" "UserRole" NOT NULL DEFAULT 'AGENCY_STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "businessId" TEXT,
    "tripTitle" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "paxCount" INTEGER NOT NULL DEFAULT 1,
    "baseCampStrategy" TEXT NOT NULL,
    "archetype" "TravelerArchetype",
    "intensity" INTEGER,
    "shareToken" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "agencyId" TEXT,
    "acceptedAt" TIMESTAMP(3),
    "clientMessage" TEXT,
    "internalNotes" TEXT,
    "totalPriceUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isVerifiedTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateVibeTags" TEXT,
    "clonedFromId" TEXT,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traveler" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "isLeadGuest" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "whatsappNumber" TEXT,
    "dietaryRestrictions" TEXT,
    "medicalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Traveler_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDay" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "sleepTown" TEXT NOT NULL,
    "tourPackageId" TEXT,
    "dayTheme" TEXT NOT NULL,
    "guideNotes" TEXT,
    "startTime" TEXT NOT NULL DEFAULT '08:00 AM',
    "meetingPoint" TEXT,
    "eventsJson" TEXT NOT NULL DEFAULT '[]',
    "isAgencyLocked" BOOLEAN NOT NULL DEFAULT true,
    "isCustomized" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "TripDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Business_slug_key" ON "Business"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Agency_email_key" ON "Agency"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_shareToken_key" ON "Trip"("shareToken");

-- AddForeignKey
ALTER TABLE "TourPackage" ADD CONSTRAINT "TourPackage_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traveler" ADD CONSTRAINT "Traveler_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDay" ADD CONSTRAINT "TripDay_tourPackageId_fkey" FOREIGN KEY ("tourPackageId") REFERENCES "TourPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDay" ADD CONSTRAINT "TripDay_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
