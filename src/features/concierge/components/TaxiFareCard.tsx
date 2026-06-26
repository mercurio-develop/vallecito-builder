import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car, MapPin, Clock, DollarSign, CreditCard, CheckCircle2, Navigation, Map, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTrip } from "@/lib/store/trip-context";
import type { OptimizedPlan } from '@/lib/ai/schemas/planner-schema';

interface TaxiFareCardProps {
  data: {
    destinationName: string;
    originGuessed: string;
    originLat?: number;
    originLng?: number;
    destLat?: number;
    destLng?: number;
    distanceKm: string | number;
    estimatedCostUSD: number;
    estimatedTimeMinutes: number;
    taxi?: {
      name: string;
      whatsapp: string | null;
      rating: number | null;
    };
  }
}

export function TaxiFareCard({ data }: TaxiFareCardProps) {
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const { setActiveItinerary, setPanelMode } = useTrip();

  const handlePay = () => {
    setIsPaying(true);
    // Simulate Stripe / Apple Pay processing delay
    setTimeout(() => {
      setIsPaying(false);
      setIsPaid(true);
      // Here you would trigger the backend WhatsApp alert to the driver
    }, 1500);
  };

  const handleOpenPlanner = () => {
    const plan: OptimizedPlan = {
      title: `Transfer: ${data.originGuessed} to ${data.destinationName}`,
      totalCost: data.estimatedCostUSD,
      startAnchor: {
        title: data.originGuessed,
        locationStr: data.originGuessed,
        type: 'GENERIC_TOWN',
        time: "10:00",
        lat: data.originLat,
        lng: data.originLng,
      },
      endAnchor: {
        title: data.destinationName,
        locationStr: data.destinationName,
        type: 'GENERIC_TOWN',
        time: "11:00",
        lat: data.destLat,
        lng: data.destLng,
      },
      waypoints: [],
      transitEdges: [
        {
          fromLocation: data.originGuessed,
          toLocation: data.destinationName,
          defaultDriver: {
            name: data.taxi?.name || "Private Driver",
            priceUsd: data.estimatedCostUSD,
            whatsapp: data.taxi?.whatsapp || undefined
          }
        }
      ],
      needsAccommodationUpsell: false,
    };
    
    setActiveItinerary(plan);
    setPanelMode('itinerary');
  };

  return (
    <div className="w-full my-4 bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden font-sans">
      <div className="bg-slate-900 p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="relative z-10 flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold tracking-[0.2em] text-rose-400 uppercase block mb-1">Transport Plan</span>
            <h3 className="text-xl font-serif font-bold text-white leading-tight">Private Transfer</h3>
          </div>
          <span className="bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white tracking-wider">
            Premium
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
          
          <div className="relative">
            <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-white border-2 border-slate-300 rounded-full" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pickup</p>
            <p className="text-base font-bold text-slate-900">{data.originGuessed}</p>
          </div>

          <div className="relative">
            <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-white border-2 border-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
            <div className="absolute -left-[23px] top-2.5 w-1 h-1 bg-rose-500 rounded-full" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Dropoff</p>
            <p className="text-base font-bold text-slate-900">{data.destinationName}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
            <Navigation className="w-4 h-4 text-slate-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-700">{data.distanceKm} km</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-slate-100">
            <Clock className="w-4 h-4 text-slate-400 mb-1.5" />
            <span className="text-xs font-bold text-slate-700">~{data.estimatedTimeMinutes} min</span>
          </div>
          <div className="bg-rose-50 rounded-2xl p-3 flex flex-col items-center justify-center border border-rose-100">
            <DollarSign className="w-4 h-4 text-rose-500 mb-1.5" />
            <span className="text-sm font-bold text-rose-700">${data.estimatedCostUSD}</span>
          </div>
        </div>

        {data.taxi && (
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
            <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center text-slate-400 shrink-0">
              <Car className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{data.taxi.name}</p>
              <p className="text-xs font-semibold text-slate-500">Verified Driver • ★ {data.taxi.rating || 5.0}</p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleOpenPlanner}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl py-6 font-bold shadow-sm transition-all flex items-center justify-center gap-2 group"
          >
            <Map className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
            View Route in Day Planner
            <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:translate-x-1 transition-transform" />
          </Button>

          {!isPaid ? (
            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 font-bold shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Pay ${data.estimatedCostUSD}.00 with Apple Pay
                </>
              )}
            </Button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl py-4 flex flex-col items-center justify-center gap-2"
            >
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-5 h-5" /> Ride Confirmed!
              </div>
              <p className="text-xs text-center px-4 font-medium">
                Payment successful. We've dispatched {data.taxi?.name || "a driver"} to your location. They will contact you shortly.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

