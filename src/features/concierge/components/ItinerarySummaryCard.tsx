"use client";

import { useTrip } from "@/lib/store/trip-context";
import type { OptimizedPlan } from "@/lib/ai/schemas/planner-schema";
import { ArrowRight, Navigation } from "lucide-react";

export function ItinerarySummaryCard({ itinerary }: { itinerary: OptimizedPlan }) {
  const { setActiveItinerary, setPanelMode } = useTrip();

  const handleOpenPlanner = () => {
    setActiveItinerary(itinerary);
    setPanelMode("itinerary");
  };

  const totalCost = itinerary.totalCost ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 w-full my-3">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
          <Navigation className="w-4 h-4 text-rose-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-widest text-rose-500 uppercase">Your Plan</p>
          <h3 className="text-sm font-semibold text-slate-900 leading-tight">{itinerary.title ?? `${itinerary.startAnchor.title} → ${itinerary.endAnchor.title}`}</h3>
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-1.5 mb-3">
        {itinerary.waypoints.slice(0, 3).map((waypoint, idx) => {
          return (
            <div key={idx} className="flex items-center gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
              <span className="text-base shrink-0">📍</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400 font-medium leading-none mb-0.5 truncate">{waypoint.category} in {waypoint.locationStr}</p>
                <p className="text-xs text-slate-800 font-semibold truncate">{waypoint.title}</p>
              </div>
              {waypoint.rating && (
                <span className="text-[11px] text-rose-600 font-bold shrink-0">★ {waypoint.rating.toFixed(1)}</span>
              )}
            </div>
          );
        })}
        {itinerary.waypoints.length > 3 && (
          <div className="text-center text-xs text-slate-400 py-1">
            + {itinerary.waypoints.length - 3} more stops
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
        <div>
          <p className="text-[10px] text-slate-400 font-medium">Estimated total</p>
          <p className="text-base font-bold text-slate-900">${totalCost}</p>
        </div>
        <button
          onClick={handleOpenPlanner}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          View in Day View <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {itinerary.constraints && (
        <p className="text-[10px] text-slate-400 mt-2 text-center">⚡ {itinerary.constraints}</p>
      )}
    </div>
  );
}
