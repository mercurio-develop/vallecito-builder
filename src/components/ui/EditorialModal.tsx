import React from 'react'

interface EditorialModalProps {
  item: any
  onClose: () => void
  onAdd?: () => void
}

export function EditorialModal({ item, onClose, onAdd }: EditorialModalProps) {
  const name = item.name || item.title || 'Unknown Location';
  
  return (
    <div className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100 flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-xl font-bold font-sans text-gray-900 tracking-tight leading-tight">{name}</h2>
        <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wide">
          {item.priceEstimate || item.priceTier || '$$'} • {item.editorialCategory || item.category || 'Local Business'}
        </div>
      </div>

      {/* The Score Row (The Triad) */}
      <div className="flex border-y border-gray-200 py-3 mx-5 my-2 justify-between">
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Quality</span>
          <span className="font-serif text-2xl font-bold text-red-800 leading-none mt-1">{item.scoreQuality || 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Vibe</span>
          <span className="font-serif text-2xl font-bold text-red-800 leading-none mt-1">{item.scoreVibe || 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] uppercase tracking-widest text-gray-500">Service</span>
          <span className="font-serif text-2xl font-bold text-red-800 leading-none mt-1">{item.scoreService || 0}</span>
        </div>
      </div>

      {/* The Blurb */}
      <div className="px-5 py-3">
        <p className="font-serif leading-relaxed text-sm text-gray-800">
          {item.zagatSummary || item.editorialSummary || 'A beloved local establishment known for its authentic charm and quality offerings. Visitors frequently note its welcoming atmosphere.'}
        </p>
      </div>

      {/* Action Footer */}
      {onAdd && (
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onAdd}
            className="w-full bg-gray-900 text-white font-semibold py-2.5 rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
          >
            <span>📍</span> Add to Itinerary
          </button>
        </div>
      )}
    </div>
  )
}
