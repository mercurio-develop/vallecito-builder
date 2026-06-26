"use client"

import React, { useState, useTransition } from "react"
import { Search, Plus, Edit2, Trash2, MapPin, Phone, Star, Building2, Eye, Compass, Tent, Compass as CompassIcon, GlassWater, Landmark } from "lucide-react"
import { PlaceForm } from "./place-form"
import { deleteBusinessAction } from "@/features/business/actions/delete-business"
import { useRouter } from "next/navigation"

interface PlacesListProps {
  initialPlaces: any[]
  currentUser?: any
}

const CATEGORY_ICONS: Record<string, any> = {
  DINING: GlassWater,
  STAY: Building2,
  EXPERIENCE: CompassIcon,
  TRANSPORT: MapPin,
  VIEWPOINT: Eye,
  CAMPGROUND: Tent,
  TRAILHEAD: Compass,
  REST_STOP: CompassIcon,
  WAYPOINT: MapPin,
  WATER_SOURCE: GlassWater,
  ARCHEOLOGICAL_SITE: Landmark,
}

const CATEGORY_COLORS: Record<string, string> = {
  DINING: "bg-amber-50 text-amber-700 border-amber-200/50",
  STAY: "bg-purple-50 text-purple-700 border-purple-200/50",
  EXPERIENCE: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
  TRANSPORT: "bg-blue-50 text-blue-700 border-blue-200/50",
  VIEWPOINT: "bg-sky-50 text-sky-700 border-sky-200/50",
  CAMPGROUND: "bg-rose-50 text-rose-700 border-rose-200/50",
  TRAILHEAD: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
  REST_STOP: "bg-orange-50 text-orange-700 border-orange-200/50",
  WAYPOINT: "bg-slate-50 text-slate-700 border-slate-200/50",
  WATER_SOURCE: "bg-cyan-50 text-cyan-700 border-cyan-200/50",
  ARCHEOLOGICAL_SITE: "bg-teal-50 text-teal-700 border-teal-200/50",
}

export function PlacesList({ initialPlaces = [], currentUser }: PlacesListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  
  // Modals state
  const [editingPlace, setEditingPlace] = useState<any | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Filter places client-side for ultra-fast UX
  const filteredPlaces = initialPlaces.filter((place) => {
    const matchesSearch = 
      place.name.toLowerCase().includes(search.toLowerCase()) ||
      (place.description && place.description.toLowerCase().includes(search.toLowerCase())) ||
      (place.tagline && place.tagline.toLowerCase().includes(search.toLowerCase()))
    
    const matchesCategory = selectedCategory === "ALL" || place.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      startTransition(async () => {
        const res = await deleteBusinessAction(id)
        if (res.success) {
          router.refresh()
        } else {
          alert(`Error deleting place: ${res.error}`)
        }
      })
    }
  }

  const handleSuccess = () => {
    setShowCreateModal(false)
    setEditingPlace(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-200">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search places..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-200 focus:bg-white transition-all"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            All Places
          </button>
          {["DINING", "STAY", "EXPERIENCE", "TRANSPORT", "VIEWPOINT", "CAMPGROUND", "ARCHEOLOGICAL_SITE"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {cat === "ARCHEOLOGICAL_SITE" 
                ? "Archeological Sites" 
                : cat.charAt(0) + cat.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Place
        </button>
      </div>

      {/* Grid of Places */}
      {filteredPlaces.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
          No places registered matching the filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaces.map((place) => {
            const Icon = CATEGORY_ICONS[place.category] || CompassIcon
            const colorClass = CATEGORY_COLORS[place.category] || "bg-slate-50 text-slate-700"

            return (
              <div 
                key={place.id}
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group"
              >
                {/* Image and Header */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={place.imageUrl || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80"}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    onError={(e) => { (e.target as any).src = "https://images.unsplash.com/photo-1594322436404-5a0526db4d13?w=600&q=80" }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 bg-white/95 shadow-sm ${colorClass}`}>
                      <Icon className="w-3 h-3" /> {place.category.replace("_", " ")}
                    </span>
                  </div>
                  {place.rating && (
                    <div className="absolute top-4 right-4 bg-white/95 px-2 py-1 rounded-lg shadow-sm border border-slate-100 flex items-center gap-0.5 text-xs font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" /> {place.rating}
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Ownership badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                      {!place.agencyId ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-slate-100 text-slate-700 border-slate-200 shadow-sm w-fit">
                          System Predefined
                        </span>
                      ) : currentUser?.agencyId && place.agencyId === currentUser.agencyId ? (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-sm w-fit">
                          Owner
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-blue-50 text-blue-700 border-blue-200/50 shadow-sm w-fit">
                          Shared by {place.agency?.name || "Another Agency"}
                        </span>
                      )}
                      {!place.isShared && place.agencyId && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm w-fit">
                          Private
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-lg text-slate-900 truncate leading-snug group-hover:text-rose-600 transition-colors">
                      {place.name}
                    </h3>
                    {place.tagline && (
                      <p className="text-xs text-slate-500 font-medium line-clamp-1 italic">
                        "{place.tagline}"
                      </p>
                    )}
                    {place.description && (
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {place.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 font-mono">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {place.lat != null && place.lng != null ? (
                        <span>
                          {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-300">No coordinates</span>
                      )}
                    </div>
                    {place.whatsapp && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Phone className="w-3 h-3" />
                        <span className="font-medium text-[10px]">{place.whatsapp}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Drawer */}
                  {(currentUser?.role === "SUPER_ADMIN" || (place.agencyId && place.agencyId === currentUser?.agencyId)) && (
                    <div className="mt-4 pt-3 flex gap-2 justify-end shrink-0">
                      <button
                        onClick={() => setEditingPlace(place)}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(place.id, place.name)}
                        disabled={isPending}
                        className="px-3 py-1.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* Create / Edit Modals */}
      {showCreateModal && (
        <PlaceForm
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editingPlace && (
        <PlaceForm
          place={editingPlace}
          onClose={() => setEditingPlace(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
