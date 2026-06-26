"use client"
import { useState, useRef, useEffect } from "react"
import { Utensils, Check, Moon, Car } from "lucide-react"

type MinimizedPackage = {
  id: string
  title: string
  sector: string
  tags: string
  lat?: number
  lng?: number
  isPackage?: boolean
}

interface BusinessAutocompleteProps {
  title: string;
  businessId?: string;
  type: 'MEAL' | 'STAY' | 'TRANSPORT';
  onChange: (title: string, businessId?: string, lat?: number, lng?: number) => void;
}

export function BusinessAutocomplete({ title, businessId, type, onChange }: BusinessAutocompleteProps) {
  const [query, setQuery] = useState(title || "")
  const [isOpen, setIsOpen] = useState(false)
  const [businesses, setBusinesses] = useState<MinimizedPackage[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(title || "")
  }, [title])

  useEffect(() => {
    fetch('/api/experiences')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const filteredItems = data.filter(pkg => {
            if (pkg.isPackage) return false;
            if (type === 'MEAL') return pkg.tags.includes('food') || pkg.tags.includes('restaurant') || pkg.tags.includes('dining') || pkg.tags.includes('DINING');
            if (type === 'STAY') return pkg.tags.includes('stays') || pkg.tags.includes('hotel') || pkg.tags.includes('lodge') || pkg.tags.includes('STAYS');
            if (type === 'TRANSPORT') return pkg.tags.includes('transport') || pkg.tags.includes('taxi') || pkg.tags.includes('TRANSPORT');
            return false;
          })
          setBusinesses(filteredItems)
        }
      })
      .catch(console.error)
  }, [type])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filtered = businesses.filter(r => r.title.toLowerCase().includes(query.toLowerCase()) && query.length > 2)

  const config = {
    MEAL: {
      icon: Utensils,
      placeholder: "Restaurant Name or 'Close to...'",
      label: "Suggested Restaurants",
      focusClass: "focus:text-amber-600",
      borderClass: "border-amber-100",
      bgHeader: "bg-amber-50/50",
      textHeader: "text-amber-600",
      hoverClass: "hover:bg-amber-50 hover:border-amber-400",
      bgIcon: "bg-amber-100",
      textIcon: "text-amber-600"
    },
    STAY: {
      icon: Moon,
      placeholder: "Accommodation Name...",
      label: "Suggested Accommodations",
      focusClass: "focus:text-purple-600",
      borderClass: "border-purple-100",
      bgHeader: "bg-purple-50/50",
      textHeader: "text-purple-600",
      hoverClass: "hover:bg-purple-50 hover:border-purple-400",
      bgIcon: "bg-purple-100",
      textIcon: "text-purple-600"
    },
    TRANSPORT: {
      icon: Car,
      placeholder: "Transport Provider...",
      label: "Suggested Transport",
      focusClass: "focus:text-blue-600",
      borderClass: "border-blue-100",
      bgHeader: "bg-blue-50/50",
      textHeader: "text-blue-600",
      hoverClass: "hover:bg-blue-50 hover:border-blue-400",
      bgIcon: "bg-blue-100",
      textIcon: "text-blue-600"
    }
  }[type];

  const Icon = config.icon;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input 
        type="text" 
        value={query} 
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value, undefined, undefined, undefined)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        className={`w-full font-bold text-slate-900 font-serif text-xl outline-none transition-colors placeholder:text-slate-300 bg-transparent ${config.focusClass}`} 
        placeholder={config.placeholder} 
      />
      
      {isOpen && filtered.length > 0 && (
        <div className={`absolute z-50 mt-2 w-full bg-white border rounded-xl shadow-xl max-h-64 overflow-y-auto py-2 animate-in fade-in slide-in-from-top-2 ${config.borderClass}`}>
          <div className={`px-4 py-2 border-b mb-1 ${config.bgHeader} ${config.borderClass}/50`}>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${config.textHeader}`}>{config.label}</span>
          </div>
          {filtered.map(r => (
            <button
              key={r.id}
              onClick={() => {
                setQuery(r.title)
                onChange(r.title, r.id, r.lat, r.lng)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 border-transparent ${config.hoverClass}`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${config.bgIcon}`}>
                <Icon className={`w-4 h-4 ${config.textIcon}`} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-[15px]">{r.title}</span>
                <span className="text-xs text-slate-500 uppercase tracking-wide font-medium mt-0.5">{r.sector.replace('_', ' ')}</span>
              </div>
              {businessId === r.id && (
                <Check className="w-4 h-4 text-emerald-500 ml-auto mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}