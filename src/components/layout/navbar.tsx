"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Compass, Home, Map, Sparkles, Route, Settings2, MessageSquareText } from "lucide-react"
import { homePath, builderPath, dashboardTripsPath } from "@/paths"
import { usePreferences } from "@/lib/store/preferences-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const pathname = usePathname()
  const { isChatOpen, setIsChatOpen, travelVibe, setTravelVibe, travelIntensity, setTravelIntensity } = usePreferences()
  const [isPrefsOpen, setIsPrefsOpen] = useState(false)

  const navItems = [
    { href: homePath(), label: "Home", icon: Home },
    { href: builderPath(), label: "Builder", icon: Compass },
    { href: dashboardTripsPath(), label: "Dashboard", icon: Map },
  ]

  const isProfilePage = pathname?.match(/^\/services\/(agencies|healers)\/[^\/]+$/)
  
  if (isProfilePage) return null

  return (
    <nav className="fixed top-0 w-full z-[100] bg-white/90 backdrop-blur-xl border-b border-gray-200 h-14 flex items-center justify-center transition-all shadow-sm">
      <div className="w-full max-w-5xl px-4 md:px-6 flex items-center justify-between">
        
        {/* Brand/Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Sparkles className="w-4 h-4 text-rose-600" />
          <span className="text-slate-900 font-bold text-sm tracking-wide">
            Vallecito
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs font-semibold tracking-wide transition-colors ${
                  isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        {/* Mobile Links */}
        <div className="flex md:hidden items-center gap-5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  isActive ? "text-rose-600" : "text-slate-400 hover:text-slate-900"
                }`}
              >
                <item.icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
              </Link>
            )
          })}
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {pathname === "/explore" && (
            <>
              <button 
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-[11px] transition-all border ${isChatOpen ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white border-transparent shadow-lg animate-pulse hover:animate-none hover:scale-105'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Concierge</span>
              </button>

              <Dialog open={isPrefsOpen} onOpenChange={setIsPrefsOpen}>
                <DialogTrigger render={
                  <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors" title="Travel Preferences">
                    <Settings2 className="w-4 h-4" />
                  </button>
                } />
                <DialogContent className="sm:max-w-md p-6 rounded-3xl bg-white border border-gray-200">
                  <DialogHeader className="mb-4">
                    <DialogTitle className="text-2xl font-serif tracking-tight text-slate-900">Travel Preferences</DialogTitle>
                    <DialogDescription className="text-sm text-slate-500 mt-1">
                      Set your vibe and intensity to get highly personalized recommendations from the Concierge.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="flex flex-col gap-6 py-2">
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Travel Vibe</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'LIVING_CULTURE', label: 'Living Culture', icon: '🏛️', theme: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', active: 'bg-orange-600 text-white border-orange-600 shadow-md' },
                          { id: 'GASTRONOMIC', label: 'Gastronomic', icon: '🍷', theme: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', active: 'bg-rose-600 text-white border-rose-600 shadow-md' },
                          { id: 'LUXURY_WELLNESS', label: 'Luxury Wellness', icon: '🌿', theme: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', active: 'bg-emerald-600 text-white border-emerald-600 shadow-md' },
                          { id: 'SPIRITUAL', label: 'Spiritual', icon: '🧿', theme: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100', active: 'bg-purple-600 text-white border-purple-600 shadow-md' },
                          { id: 'MOUNTAIN_EXPLORER', label: 'Mountain Explorer', icon: '⛰️', theme: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', active: 'bg-blue-600 text-white border-blue-600 shadow-md' }
                        ].map(a => (
                          <button
                            key={a.id}
                            onClick={() => setTravelVibe(travelVibe === a.id ? null : a.id)}
                            className={`px-4 py-2 text-[13px] font-bold rounded-full transition-all border flex items-center gap-1.5 ${travelVibe === a.id ? a.active : a.theme}`}
                          >
                            <span>{a.icon}</span> {a.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Intensity Level</span>
                      <div className="flex gap-2 w-full">
                        {[
                          { id: 1, label: 'Level 1', desc: 'Accessible', theme: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100', active: 'bg-green-600 text-white border-green-600 shadow-md' },
                          { id: 2, label: 'Level 2', desc: 'Immersive', theme: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', active: 'bg-amber-600 text-white border-amber-600 shadow-md' },
                          { id: 3, label: 'Level 3', desc: 'The Edge', theme: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100', active: 'bg-red-600 text-white border-red-600 shadow-md' }
                        ].map(i => (
                          <button
                            key={i.id}
                            onClick={() => setTravelIntensity(travelIntensity === i.id ? null : i.id)}
                            className={`flex-1 py-3 px-2 flex flex-col items-center justify-center text-center rounded-xl transition-all border ${travelIntensity === i.id ? i.active : i.theme}`}
                          >
                            <span className="font-bold text-sm">{i.label}</span>
                            <span className={`text-[10px] mt-0.5 ${travelIntensity === i.id ? 'text-white/80' : 'opacity-70'}`}>{i.desc}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 text-center px-4">
                        Level 1 is relaxed and safe. Level 3 is extreme and off-the-beaten-path.
                      </p>
                    </div>
                  </div>
                  
                  <Button onClick={() => setIsPrefsOpen(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-xl font-bold shadow-lg mt-4 transition-transform hover:scale-[1.02]">
                    Save Preferences
                  </Button>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
