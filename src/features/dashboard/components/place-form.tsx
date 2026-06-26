"use client"

import React, { useState, useEffect } from "react"
import { X, MapPin, Image as ImageIcon, Save, Loader2, Plus, Trash2 } from "lucide-react"
import { createBusinessAction } from "@/features/business/actions/create-business"
import { updateBusinessAction } from "@/features/business/actions/update-business"

interface PlaceFormProps {
  place?: any | null
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = [
  { value: "DINING", label: "Dining / Restaurant" },
  { value: "STAY", label: "Stay / Accommodation" },
  { value: "EXPERIENCE", label: "Experience / Activity" },
  { value: "ARCHEOLOGICAL_SITE", label: "Archeological Site" },
  { value: "TRANSPORT", label: "Transport / Transfer Stop" },
  { value: "VIEWPOINT", label: "Viewpoint / Scenic Lookout" },
  { value: "CAMPGROUND", label: "Campground / Campsite" },
  { value: "TRAILHEAD", label: "Trailhead / Start Point" },
  { value: "REST_STOP", label: "Rest Stop / Shelter" },
  { value: "WAYPOINT", label: "Waypoint / Marker" },
  { value: "WATER_SOURCE", label: "Water Source / Spring" },
]

export function PlaceForm({ place, onClose, onSuccess }: PlaceFormProps) {
  const isEdit = !!place
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("EXPERIENCE")
  const [lat, setLat] = useState("")
  const [lng, setLng] = useState("")
  const [description, setDescription] = useState("")
  const [tagline, setTagline] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [heroImages, setHeroImages] = useState<string[]>([])
  const [newHeroUrl, setNewHeroUrl] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [priceTier, setPriceTier] = useState("$$")
  const [locationSlug, setLocationSlug] = useState("cusco")
  const [isShared, setIsShared] = useState(true)

  useEffect(() => {
    if (place) {
      setName(place.name || "")
      setCategory(place.category || "EXPERIENCE")
      setLat(place.lat != null ? String(place.lat) : "")
      setLng(place.lng != null ? String(place.lng) : "")
      setDescription(place.description || "")
      setTagline(place.tagline || "")
      setImageUrl(place.imageUrl || "")
      setWhatsapp(place.whatsapp || "")
      setContactEmail(place.contactEmail || "")
      setPriceTier(place.priceTier || "$$")
      setLocationSlug(place.locationSlug || "cusco")
      setIsShared(place.isShared !== undefined ? place.isShared : true)

      try {
        const parsed = JSON.parse(place.heroImages || "[]")
        setHeroImages(Array.isArray(parsed) ? parsed : [])
      } catch (e) {
        setHeroImages([])
      }
    }
  }, [place])

  const handleAddHeroImage = () => {
    if (newHeroUrl.trim()) {
      setHeroImages([...heroImages, newHeroUrl.trim()])
      setNewHeroUrl("")
    }
  }

  const handleRemoveHeroImage = (index: number) => {
    setHeroImages(heroImages.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const payload = {
      name,
      category,
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
      description,
      tagline,
      imageUrl,
      heroImages,
      whatsapp: whatsapp || undefined,
      contactEmail,
      priceTier,
      locationSlug,
      isShared,
    }

    try {
      let res
      if (isEdit) {
        res = await updateBusinessAction(place.id, payload)
      } else {
        res = await createBusinessAction(payload)
      }

      if (res.success) {
        onSuccess()
      } else {
        setError(res.error || "An error occurred")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-serif font-bold text-slate-900">
              {isEdit ? "Edit Place Details" : "Register New Place"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add details for hotels, dining spots, viewpoints, or custom stops.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Place Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Salkantay Viewpoint"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium appearance-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Tier */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Price Tier</label>
              <select
                value={priceTier}
                onChange={(e) => setPriceTier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium appearance-none"
              >
                <option value="$">$ (Budget)</option>
                <option value="$$">$$ (Standard)</option>
                <option value="$$$">$$$ (Premium)</option>
                <option value="$$$$">$$$$ (Ultra Luxury)</option>
              </select>
            </div>

            {/* Latitude */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Latitude</label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="number"
                  step="any"
                  placeholder="-13.1631"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Longitude */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Longitude</label>
              <div className="relative flex items-center">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="number"
                  step="any"
                  placeholder="-72.5450"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-mono"
                />
              </div>
            </div>

            {/* Location Slug */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Location Hub Slug</label>
              <input
                type="text"
                placeholder="cusco, vallecito, ollantaytambo"
                value={locationSlug}
                onChange={(e) => setLocationSlug(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">WhatsApp Number</label>
              <input
                type="tel"
                placeholder="+51999888777"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Share toggle */}
            <div className="col-span-2 flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
              <input
                id="isShared"
                type="checkbox"
                checked={isShared}
                onChange={(e) => setIsShared(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-slate-950 focus:ring-slate-900 mt-1 cursor-pointer"
              />
              <div className="flex flex-col">
                <label htmlFor="isShared" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Share with other agencies
                </label>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  When enabled, this place will be visible in the search library and can be used in itineraries by all agencies. Disable to keep it private to your agency.
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tagline / Brief Hook</label>
              <input
                type="text"
                placeholder="e.g. Stunning panoramic viewfinder overlooking the glacier valley"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
              <textarea
                rows={3}
                placeholder="Detailed information about the stop, campsite, restaurant menu, or accommodation features..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium resize-none leading-relaxed"
              />
            </div>

            {/* Primary Cover Image */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Primary Cover Image URL</label>
              <div className="relative flex items-center">
                <ImageIcon className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. /images/salkantay.jpg or https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tip: Place local images in your <code>/public/images/</code> folder and refer to them as <code>/images/filename.jpg</code>.
              </p>
            </div>

            {/* Hero Gallery Images */}
            <div className="col-span-2 space-y-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Gallery Images (Hero Images)</label>
              <div className="flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="e.g. /images/viewpoint-detail.jpg"
                    value={newHeroUrl}
                    onChange={(e) => setNewHeroUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-400 focus:bg-white transition-all font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddHeroImage}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-5 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>

              {heroImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  {heroImages.map((url, index) => (
                    <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Gallery ${index}`} className="w-full h-full object-cover" onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=300&q=80" }} />
                      <button
                        type="button"
                        onClick={() => handleRemoveHeroImage(index)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? "Save Changes" : "Create Place"}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
