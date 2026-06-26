"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { agencyPath, therapistPath } from "@/paths"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { SafeImageWrapper } from "@/components/ui/safe-image"
import { Star, Zap, Plus, Phone, Users, MapPin, Briefcase, MoreHorizontal, ExternalLink, MessageCircle, Calendar, Utensils, Repeat, Landmark, Ticket } from "lucide-react"
import { trackWhatsappClick } from "@/features/explore/actions/track-click"
import { trackBusinessView } from "@/features/explore/actions/track-view"
import { submitLead } from "@/features/leads/actions/submit-lead"
import { generateShadowLead } from "@/features/leads/actions/shadow-lead"
import { useTrip } from "@/lib/store/trip-context"
import { cn } from "@/lib/utils"
import type { Business } from "@prisma/client"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  'DINING': "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=600&auto=format&fit=crop",
  'STAYS': "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=600&auto=format&fit=crop",
  'WELLNESS': "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop",
  'CULTURE': "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=600&auto=format&fit=crop",
  'BOLETO': "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=600&auto=format&fit=crop",
  'DEFAULT': "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=600&auto=format&fit=crop"
};

interface BusinessCardProps {
  business: Business
  isHighlighted?: boolean
  onSelect?: () => void
  orientation?: "vertical" | "horizontal"
  onImageLoad?: () => void
  hideActions?: boolean
}

export function BusinessCard({ 
  business, 
  isHighlighted, 
  onSelect, 
  orientation = "vertical",
  onImageLoad,
  hideActions
}: BusinessCardProps) {
  const [touristName, setTouristName] = useState("")
  const [touristPhone, setTouristPhone] = useState("")
  const [date, setDate] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasReportedLoad, setHasReportedLoad] = useState(false)
  const { activeItinerary, panelMode, insertWaypoint } = useTrip()
  const router = useRouter()
  
  const isHorizontal = orientation === "horizontal"
  const isClaimed = business.isClaimed || false
  const hasProfile = (business.category === 'AGENCY' || business.category === 'WELLNESS') && !!business.tagline

  const handleBookNow = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!business.whatsapp) return
    await trackWhatsappClick(business.id)
    
    let contextNote = "inquire about your services";
    if (business.category === 'DINING') contextNote = "ask about your menu or a meal";
    else if (business.category === 'STAYS' || business.category === 'STAY') contextNote = "inquire about a room";
    else if (business.category === 'WELLNESS') contextNote = "ask about a session";

    const msg = encodeURIComponent(
      `Hello ${business.name}! 👋 I saw your profile on VALLECITO and I'd like to ${contextNote}. When do you have availability?`
    )
    window.open(`https://wa.me/51${business.whatsapp.replace(/\\D/g, '')}?text=${msg}`, "_blank")
  }

  const handleConsult = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!touristName || !date) return

    try {
      const res = await generateShadowLead(business.id, touristName, date)
      await submitLead({
        businessId: business.id,
        touristName,
        touristEmail: "inquiry@vallecito.app", // Platform placeholder
        touristPhone: touristPhone || undefined,
        date: new Date(date),
      })
      if (res.success) {
        if (res.url) {
          window.open(res.url, "_blank")
        } else if (res.delivered) {
          alert(`Inquiry sent to ${business.name}! They will contact you shortly.`)
        }
        setIsOpen(false)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const handleCardClick = () => {
    if (onSelect) {
      onSelect()
      trackBusinessView(business.id)
    }
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/json", JSON.stringify(business));
      }}
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer transition-all duration-300 relative bg-white border border-slate-200/60 shadow-md hover:shadow-xl rounded-2xl md:rounded-3xl",
        isHighlighted ? "opacity-100 scale-[1.02] ring-2 ring-rose-500/20" : "opacity-95 md:hover:opacity-100",
        isHorizontal ? "flex flex-row items-start gap-3 sm:gap-4 p-2.5 sm:p-3" : "flex flex-col gap-3 h-full p-3 sm:p-4"
      )}
    >
      {/* Top Right Action Menu */}
      {false && (
        <div 
          className="absolute top-3 right-3 z-30 flex items-center justify-center" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button 
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 border border-slate-200 shadow-md text-slate-600 hover:text-rose-600 hover:scale-110 transition-all cursor-pointer backdrop-blur-sm"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            } />
            <DropdownMenuContent>
              {hasProfile && (
                <DropdownMenuItem onClick={() => router.push(business.category === 'AGENCY' ? agencyPath(business.slug) : therapistPath(business.slug))}>
                  <ExternalLink className="w-4 h-4 mr-2" /> View Profile
                </DropdownMenuItem>
              )}
              {business.whatsapp && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleBookNow(e as any); }}>
                  <MessageCircle className="w-4 h-4 mr-2" /> Contact
                </DropdownMenuItem>
              )}
              {!isClaimed && !business.isAsociado && (
                <DropdownMenuItem onClick={() => setIsOpen(true)}>
                  <Zap className="w-4 h-4 mr-2" /> Check Availability
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Image Container */}
      <div className={cn(
        "relative overflow-hidden transition-all duration-300 bg-slate-100",
        isHorizontal ? "w-12 sm:w-16 lg:w-20 aspect-square shrink-0 rounded-xl" : "w-full aspect-[4/3] sm:aspect-[4/3] rounded-2xl",
        isHighlighted ? "shadow-[0_0_0_3px_#E11D48] shadow-rose-600/50" : "shadow-sm md:group-hover:shadow-md"
      )}>
        {(() => {
          const fallbackImage = CATEGORY_IMAGE_FALLBACKS[business.category?.toUpperCase() || ''] || CATEGORY_IMAGE_FALLBACKS['DEFAULT'];
          const displayImage = business.imageUrl || fallbackImage;
          
          return (
            <>
              <SafeImageWrapper
                src={displayImage}
                fallbackSrc={fallbackImage}
                alt={business.name}
                imgClassName="w-full h-full object-cover md:group-hover:scale-105 transition-transform duration-700 ease-out"
                wrapperClassName="w-full h-full"
                onLoad={() => {
                  if (onImageLoad && !hasReportedLoad) {
                    setHasReportedLoad(true);
                    onImageLoad();
                  }
                }}
              />
              {/* Magazine-style overlays to normalize image appearance */}
              <div className="absolute inset-0 bg-black/10 transition-opacity duration-500 md:group-hover:bg-black/0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 opacity-60 md:group-hover:opacity-80 transition-opacity duration-500" />
            </>
          );
        })()}
        
        {/* Top Badges */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10 pointer-events-none">
          {business.vehicleType && (
             <span className="bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-bold text-white shadow-sm uppercase tracking-wider">
               {business.vehicleType}
             </span>
          )}
          
          {isClaimed && (
            <span className="bg-white/90 text-slate-900 px-2 py-1 rounded-md text-[10px] font-bold shadow-sm backdrop-blur-md flex items-center gap-1 ml-auto">
              <Zap className="w-3 h-3 fill-rose-600 text-rose-600" />
              <span className={isHorizontal ? "hidden sm:inline" : ""}>Verified</span>
            </span>
          )}
        </div>
      </div>

      {/* Info Container */}
      <div className={cn(
        "flex flex-col min-w-0",
        isHorizontal ? "flex-1 py-0.5 justify-between" : "flex-1 gap-1 justify-between"
      )}>
        <div className="flex flex-col gap-0.5">
          <div className={cn(
            "flex justify-between gap-2",
            isHorizontal ? "items-center" : "items-start"
          )}>
            <div className={cn("flex-1", isHorizontal ? "line-clamp-1" : "line-clamp-1")}>
              {hasProfile ? (
                <Link 
                  href={business.category === 'AGENCY' ? agencyPath(business.slug) : therapistPath(business.slug)} 
                  className={cn(
                    "font-bold text-slate-900 leading-tight hover:text-rose-600 transition-colors",
                    isHorizontal ? "text-[12px] sm:text-[14px] lg:text-base" : "text-[13px] sm:text-[14px] lg:text-[15px]"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {business.name}
                </Link>
              ) : (
                <h3 className={cn(
                  "font-bold text-slate-900 leading-tight",
                  isHorizontal ? "text-[12px] sm:text-[14px] lg:text-base" : "text-[13px] sm:text-[14px] lg:text-[15px]"
                )}>
                  {business.name}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-white/80 px-1.5 py-0.5 rounded-lg border border-slate-50">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="font-bold text-[11px] text-slate-900">{business.rating || "New"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
             <span className={cn(
               "text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border flex items-center gap-1",
               business.category?.toUpperCase() === 'DINING'
                 ? "bg-amber-50 text-amber-700 border-amber-200/50"
                 : business.category?.toUpperCase() === 'CULTURE'
                 ? "bg-purple-50 text-purple-700 border-purple-200/50"
                 : business.category?.toUpperCase() === 'BOLETO'
                 ? "bg-sky-50 text-sky-700 border-sky-200/50"
                 : "bg-rose-50 text-rose-600 border-rose-100/50"
             )}>
               {business.category?.toUpperCase() === 'DINING' && <Utensils className="w-2.5 h-2.5" />}
               {business.category?.toUpperCase() === 'CULTURE' && <Landmark className="w-2.5 h-2.5" />}
               {business.category?.toUpperCase() === 'BOLETO' && <Ticket className="w-2.5 h-2.5" />}
               {business.category}
             </span>
             {business.locationSlug && (
               <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                 <MapPin className="w-2.5 h-2.5" />
                 {business.locationSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
               </span>
             )}
             {business.priceTier && <span className="text-emerald-600 text-[10px] font-bold ml-1">{business.priceTier}</span>}
          </div>
          
          {/* Zagat Description */}
          {business.description && (
            <div className="mt-1" onClick={(e) => {
              if (business.description && business.description.length > 100) {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }
            }}>
              <p className={cn(
                "text-slate-500 text-[11px] italic leading-relaxed transition-all",
                !isExpanded && (isHorizontal ? "line-clamp-1" : "line-clamp-3")
              )}>
                &ldquo;{business.description}&rdquo;
              </p>
              {business.description.length > 100 && (
                <button 
                  type="button" 
                  className="text-[10px] text-rose-600 font-semibold mt-0.5 hover:text-rose-700 transition-colors"
                >
                  {isExpanded ? "Show less" : "Read more"}
                </button>
              )}
            </div>
          )}

          {/* Boleto Badge */}
          {business.category?.toUpperCase() === 'BOLETO' && (
            <div className="mt-1.5 flex" onClick={e => e.stopPropagation()}>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsBoletoModalOpen(true); }}
                className="flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/50 px-2 py-1 rounded-md transition-colors"
              >
                🎟️ Requires Boleto Turístico
              </button>
              <Dialog open={isBoletoModalOpen} onOpenChange={setIsBoletoModalOpen}>
                <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border border-gray-200" onClick={(e) => e.stopPropagation()}>
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-serif tracking-tight text-slate-900 flex items-center gap-2">
                      🎟️ Cusco Tourist Ticket (BTC)
                    </DialogTitle>
                  </DialogHeader>
                  <div className="text-sm text-slate-600 space-y-4">
                    <p>
                      This site requires the <strong>Boleto Turístico del Cusco (BTC)</strong>. It is a unified ticket managed by the government that grants access to up to 16 major archaeological sites and museums in Cusco and the Sacred Valley.
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-900 mb-2">Options:</h4>
                      <ul className="space-y-2 list-disc pl-4 marker:text-slate-400">
                        <li><strong>Full Ticket (130 Soles):</strong> Valid for 10 days. Includes all 16 sites across Cusco, Sacred Valley, and South Valley.</li>
                        <li><strong>Partial Ticket (70 Soles):</strong> Valid for 1-2 days for a specific circuit (e.g., just Sacred Valley ruins).</li>
                      </ul>
                    </div>
                    <p className="text-xs text-slate-500">
                      <em>Note: The ticket cannot be purchased online in advance. It must be bought in person at the COSITUC office (Av. El Sol 103, Cusco) or at the entrance of the first site you visit.</em>
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={() => setIsBoletoModalOpen(false)} className="bg-slate-900 text-white rounded-xl px-6">Got it</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Action Row */}
        {!hideActions && (
          <div className={cn(isHorizontal ? "mt-2" : "mt-2", "flex gap-2")}>
              <>
                <Button
                  onClick={(e) => { e.stopPropagation(); insertWaypoint(business); }}
                  className={cn(
                    "flex-1 bg-white text-slate-900 border border-slate-200 hover:border-slate-900 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5",
                    isHorizontal ? "h-8 text-[10px] uppercase tracking-tighter" : "py-2.5 text-xs uppercase tracking-tighter"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  {isHorizontal ? "Add" : "Add to Day"}
                </Button>
                {isClaimed || business.category === 'TRANSPORT' || business.whatsapp ? (
                  <Button
                    onClick={handleBookNow}
                    className={cn(
                      "flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all",
                      isHorizontal ? "h-8 text-[10px] uppercase tracking-tighter" : "py-2.5 text-sm"
                    )}
                  >
                    Contact
                  </Button>
                ) : (
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger render={
                      <Button 
                        onClick={(e) => e.stopPropagation()} 
                        className={cn(
                          "flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all",
                          isHorizontal ? "h-8 text-[10px] uppercase tracking-tighter" : "py-2.5 text-sm"
                        )}
                      >
                        Contact
                      </Button>
                    } />
                    <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border border-gray-200" onClick={(e) => e.stopPropagation()}>
                      <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-serif tracking-tight text-slate-900">Contact {business.name}</DialogTitle>
                        <DialogDescription className="text-sm text-slate-500 mt-1">
                          Send an inquiry to {business.name} to check for availability and pricing.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-5 py-4">
                        <div className="grid gap-2.5">
                          <Label htmlFor="name" className="text-slate-700 font-medium">Your Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g. Sarah Jenkins"
                            value={touristName}
                            onChange={(e) => setTouristName(e.target.value)}
                            className="rounded-xl border-gray-200 bg-gray-50 text-slate-900 focus-visible:ring-rose-600 px-4 py-6 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="grid gap-2.5">
                          <Label htmlFor="phone" className="text-slate-700 font-medium">WhatsApp Number (optional)</Label>
                          <Input
                            id="phone"
                            placeholder="e.g. +51 987 654 321"
                            value={touristPhone}
                            onChange={(e) => setTouristPhone(e.target.value)}
                            className="rounded-xl border-gray-200 bg-gray-50 text-slate-900 focus-visible:ring-rose-600 px-4 py-6 placeholder:text-gray-400"
                          />
                        </div>
                        <div className="grid gap-2.5">
                          <Label htmlFor="date" className="text-slate-700 font-medium">Estimated Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="rounded-xl border-gray-200 bg-gray-50 text-slate-900 focus-visible:ring-rose-600 px-4 py-6"
                          />
                        </div>
                      </div>
                      <Button onClick={handleConsult} className="w-full bg-rose-600 hover:bg-rose-700 text-white py-6 rounded-xl font-bold shadow-lg mt-2 transition-transform hover:scale-[1.02]">
                        Send Inquiry
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
              </>
          </div>
        )}
      </div>
    </div>
  )
}

