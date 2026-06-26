"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, MapPin, Clock, Mountain, Activity, Loader2, Users } from "lucide-react"
import { getBusinessById } from "@/features/business/actions/fetch-businesses"

interface PackagePreviewModalProps {
  packageId: string | null
  onClose: () => void
}

export function PackagePreviewModal({ packageId, onClose }: PackagePreviewModalProps) {
  const [pkg, setPkg] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!packageId) {
       
      setPkg(null)
      return
    }
    
    setLoading(true)
    // Fetch full package details
    getBusinessById(packageId)
      .then(data => {
        if (!data) throw new Error('Not found');
        setPkg(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [packageId])

  if (!packageId || !mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-serif font-bold text-slate-900 capitalize">{pkg ? (pkg.category ? pkg.category.toLowerCase().replace('_', ' ') : 'Experience') : 'Details'} Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-white p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-rose-500" />
              <p>Loading details...</p>
            </div>
          ) : !pkg ? (
            <div className="text-center py-12 text-slate-500">
              Experience not found.
            </div>
          ) : (
            <div className="space-y-6">
              {pkg.heroImage && (
                <div className="w-full h-48 rounded-2xl overflow-hidden relative bg-slate-100">
                  <img 
                    src={pkg.heroImage} 
                    alt={pkg.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=600&auto=format&fit=crop";
                      e.currentTarget.onerror = null;
                    }}
                  />
                </div>
              )}
              
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 mb-2">
                  {pkg.sector && <span>{pkg.sector.replace('_', ' ')}</span>}
                </div>
                <h3 className="text-2xl font-serif font-bold text-slate-900 leading-tight">{pkg.title}</h3>
                {pkg.tagline && <p className="text-lg text-slate-500 font-serif mt-1 italic">{pkg.tagline}</p>}
              </div>

              {(() => {
                const tagsStr = (pkg.tags || '').toLowerCase();
                const catStr = (pkg.category || '').toUpperCase();
                const isFoodOrStay = 
                  ['MEAL', 'DINING', 'RESTAURANT', 'FOOD', 'STAY', 'HOTEL', 'LODGE', 'TRANSPORT', 'TAXI'].includes(catStr) ||
                  tagsStr.includes('food') || tagsStr.includes('restaurant') || tagsStr.includes('dining') || tagsStr.includes('stay') || tagsStr.includes('hotel') || tagsStr.includes('lodge') || tagsStr.includes('transport') || tagsStr.includes('taxi');
                const isExperienceCat = ['EXPERIENCE', 'TOURPACKAGE', 'PACKAGE', 'ADVENTURE', 'WELLNESS', 'CULTURE', 'TEXTILES', 'TOURIST_TICKET', 'TOURIST TICKET'].includes(catStr);
                
                return (!isFoodOrStay && (isExperienceCat || pkg.pace || pkg.difficulty)) && (
                  <div className="flex flex-wrap gap-4 py-4 border-y border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <span className="text-sm font-semibold text-slate-700">{pkg.durationStr || 'Half Day'}</span>
                    </div>
                    {pkg.difficulty && (
                      <div className="flex items-center gap-2">
                        <Mountain className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{pkg.difficulty}</span>
                      </div>
                    )}
                    {pkg.pace && (
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700">{pkg.pace} Pace</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h4 className="font-bold text-slate-900 mb-2 capitalize">About this {pkg.category ? pkg.category.toLowerCase().replace('_', ' ') : 'Experience'}</h4>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{pkg.description}</p>
              </div>
              
              {pkg.tags && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {pkg.tags.split(',').map((tag: string) => (
                      <span key={tag} className="px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100/50 text-xs font-semibold rounded-lg shadow-sm">
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
