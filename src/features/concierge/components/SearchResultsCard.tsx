"use client";

import { useState } from "react";
import { Business } from "@prisma/client";

import { useTrip } from "@/lib/store/trip-context";
import { useRouter } from "next/navigation";
import { BusinessCard } from "@/features/explore/components/business-card";
import { PendingAvailability } from "@/features/concierge/components/PendingAvailability";
import { cn } from "@/lib/utils";

export function SearchResultsCard({ businesses }: { businesses: Business[] }) {
  const { setSelectedId } = useTrip();
  const router = useRouter();
  const [loadedImages, setLoadedImages] = useState(0);

  const isFallback = !Array.isArray(businesses) && (businesses as any)?.alternatives;
  const list = Array.isArray(businesses) ? businesses : ((businesses as any)?.alternatives || []);
  const requestedLocation = !Array.isArray(businesses) ? (businesses as any)?.requestedLocation : null;

  if (!list || !Array.isArray(list) || list.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
        <p className="text-xs text-slate-500">No matching places found.</p>
      </div>
    );
  }

  const handleSelect = (business: Business) => {
    if (business.category === 'Taxi' || (business as any).type === 'TRANSPORT') {
      router.push('/services/transport');
    } else if (business.category === 'Business' || (business as any).type === 'AGENCY') {
      router.push('/services/agencies');
    } else if (['Business', 'Guide', 'Therapy', 'Wellness'].includes(business.category) || (business as any).type === 'THERAPIST') {
      router.push('/services/healers');
    } else {
      setSelectedId(business.id);
    }
  };

  const isLoaded = loadedImages >= list.length;

  return (
    <>
      {!isLoaded && (
        <PendingAvailability message="Loading images..." />
      )}
      <div className={cn("my-3 -mx-4 sm:mx-0 transition-opacity duration-300", isLoaded ? "opacity-100" : "opacity-0 absolute pointer-events-none")}>
        <div className="flex items-center justify-between mb-2 px-4 sm:px-0">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">
              {isFallback ? "Nearby Alternatives" : "Top Recommendations"}
            </span>
            {isFallback && requestedLocation && (
              <span className="text-[9px] text-rose-500 font-bold uppercase mt-0.5">
                None found in {requestedLocation}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mr-2 sm:mr-0">{list.length} found</span>
        </div>
        
        <div className="flex overflow-x-auto gap-4 pb-4 px-4 sm:px-0 snap-x snap-mandatory scrollbar-hide">
          {list.map((business: Business, idx: number) => (
            <div key={business.id ?? idx} className="w-[280px] shrink-0 snap-start bg-white rounded-2xl shadow-sm border border-gray-100 p-3">
               <BusinessCard 
                 business={business} 
                 orientation="vertical" 
                 onSelect={() => handleSelect(business)} 
                 onImageLoad={() => setLoadedImages(prev => prev + 1)}
               />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
