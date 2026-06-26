import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Map, Clock, DollarSign } from "lucide-react";

interface BoletoData {
  title: string;
  days: number;
  foreignPrice: string;
  nationalPrice: string;
  description: string;
  mapUrl: string;
  places: string[];
}

export function BoletoInfoCard({ data, message }: { data: BoletoData, message: string }) {
  if (!data) return null;

  return (
    <Card className="w-full max-w-[320px] bg-white border-rose-100 shadow-sm overflow-hidden mb-4">
      {message && (
        <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 text-sm text-slate-700">
          {message}
        </div>
      )}
      <CardHeader className="bg-gradient-to-r from-rose-50 to-white pb-3 pt-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900 leading-tight">
              {data.title}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              Boleto Turístico del Cusco
            </CardDescription>
          </div>
          <div className="bg-rose-100 p-1.5 rounded-md shrink-0">
            <Info className="w-4 h-4 text-rose-600" />
          </div>
        </div>
      </CardHeader>
      
      {data.mapUrl && (
        <div className="relative h-40 w-full bg-slate-100 border-y border-slate-100">
          <img 
            src={data.mapUrl} 
            alt={data.title + " Map"} 
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              e.currentTarget.src = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=600&auto=format&fit=crop";
              e.currentTarget.onerror = null;
            }}
          />
        </div>
      )}

      <CardContent className="pt-4 pb-4 px-4 space-y-4">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-slate-500 gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Validity</span>
            </div>
            <span className="font-medium text-slate-900">{data.days} Day{data.days > 1 ? 's' : ''}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-slate-500 gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Foreigner</span>
            </div>
            <span className="font-medium text-slate-900">{data.foreignPrice}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-rose-500" />
            Included Sites
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {data.places.map(p => (
              <Badge key={p} variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-normal border-0">
                {p}
              </Badge>
            ))}
          </div>
        </div>
        
        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 italic">
          Tip: Buy the ticket directly at the first ruin you visit, no advance reservation needed.
        </p>
      </CardContent>
    </Card>
  );
}
