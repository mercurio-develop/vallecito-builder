"use client";

import { useTrip } from "@/lib/store/trip-context";
import { Check, Loader2, MapPin, Car, Moon, ArrowLeft, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import posthog from 'posthog-js';

export function BookingProgressView() {
  const { activeItinerary, entityStatuses, bookingStatus, resetBooking } = useTrip();

  if (!activeItinerary) return null;

  const handleFinalize = () => {
    posthog.capture('orchestration_finalized', {
        itinerary_title: activeItinerary.title,
        total_cost: activeItinerary.totalCost,
        waypoints_count: activeItinerary.waypoints.length
    });
  };

  const steps = [
    { id: 'start', title: "Start", location: activeItinerary.startAnchor.title, type: 'anchor' },
    ...activeItinerary.waypoints.flatMap((wp: any, i: number) => [
      { id: `transit-${i}`, title: "Transport", location: activeItinerary.transitEdges[i]?.toLocation, type: 'transit', statusId: `transit-${i}` },
      { id: wp.id, title: wp.category, location: wp.title, type: 'waypoint', statusId: wp.id }
    ]),
    { 
        id: `transit-final`, 
        title: "Return", 
        location: activeItinerary.transitEdges[activeItinerary.transitEdges.length - 1]?.defaultDriver.name || "Return Taxi", 
        type: 'transit', 
        statusId: `transit-${activeItinerary.transitEdges.length - 1}` 
    },
    { id: 'end', title: "End", location: activeItinerary.endAnchor.title, type: 'anchor' }
  ];

  const isChecking = bookingStatus === 'checking_experiences' || bookingStatus === 'checking_transport';
  const isConfirmed = bookingStatus === 'confirmed' || bookingStatus === 'payment_required';

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
        <button onClick={resetBooking} className="text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-900">Securing your Day</h3>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">Orchestration in progress</p>
        </div>
        <div className="w-5" /> {/* Spacer */}
      </div>

      {/* Progress Stepper */}
      <div className="flex-1 overflow-y-auto p-6 space-y-0 relative">
        {/* Continuous Line */}
        <div className="absolute left-[39px] top-10 bottom-10 w-0.5 bg-slate-100" />

        {steps.map((step, idx) => {
          const statusId = 'statusId' in step ? step.statusId : undefined;
          const status = statusId ? entityStatuses[statusId] : 'confirmed';

          return (            <div key={`${step.id}-${idx}`} className="relative flex gap-6 pb-8 last:pb-0">
              {/* Icon / Status Indicator */}
              <div className="relative z-10 flex items-center justify-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  status === 'confirmed' ? "bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : 
                  status === 'checking' ? "bg-white border-rose-500" :
                  status === 'unavailable' ? "bg-rose-100 border-rose-500" :
                  "bg-white border-slate-200"
                )}>
                  {status === 'confirmed' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : status === 'checking' ? (
                    <Loader2 className="w-4 h-4 text-rose-600 animate-spin" />
                  ) : step.type === 'transit' ? (
                    <Car className={cn("w-4 h-4", status === 'pending' ? "text-slate-300" : "text-slate-600")} />
                  ) : step.id === 'end' ? (
                    <Moon className={cn("w-4 h-4", status === 'pending' ? "text-slate-300" : "text-slate-600")} />
                  ) : (
                    <MapPin className={cn("w-4 h-4", status === 'pending' ? "text-slate-300" : "text-slate-600")} />
                  )}
                </div>
              </div>

              {/* Content */}
              <div className={cn(
                "flex-1 flex flex-col transition-opacity duration-500",
                status === 'pending' ? "opacity-40" : "opacity-100"
              )}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{step.title}</span>
                <h4 className="text-sm font-bold text-slate-900">{step.location}</h4>
                {status === 'checking' && <p className="text-[10px] text-rose-600 font-medium animate-pulse mt-0.5">Checking availability...</p>}
                {status === 'confirmed' && <p className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5 fill-current" /> Secured</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer / Summary */}
      <div className="p-6 bg-slate-900 text-white rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-700">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Total Expedition</p>
            <p className="text-3xl font-bold">${activeItinerary.totalCost}</p>
          </div>
          {isConfirmed && (
            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30">
              READY TO BOOK
            </div>
          )}
        </div>

        <Button 
          disabled={!isConfirmed}
          onClick={handleFinalize}
          className={cn(
            "w-full py-6 rounded-2xl font-bold text-lg transition-all",
            isConfirmed ? "bg-rose-600 hover:bg-rose-500 text-white shadow-xl hover:scale-[1.02]" : "bg-slate-800 text-slate-500 cursor-not-allowed"
          )}
        >
          {isChecking ? "Confirming All Stops..." : "Secure My Day"}
        </Button>
        <p className="text-[10px] text-slate-500 text-center mt-4 px-4">
          By clicking secure, we'll finalize all reservations and notify your drivers.
        </p>
      </div>
    </div>
  );
}
