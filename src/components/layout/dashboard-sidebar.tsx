"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Briefcase, 
  Users, 
  Map, 
  Settings, 
  Plus,
  MapPin
} from "lucide-react"
import { 
  dashboardTripsPath, 
  dashboardClientsPath, 
  dashboardTemplatesPath, 
  dashboardSettingsPath,
  dashboardPlacesPath
} from "@/paths"
import { Button } from "@/components/ui/button"

export function DashboardSidebar() {
  const pathname = usePathname()

  const navItems = [
    { name: "Trips", href: dashboardTripsPath(), icon: Map },
    { name: "Templates", href: dashboardTemplatesPath(), icon: Briefcase },
    { name: "Clients", href: dashboardClientsPath(), icon: Users },
    { name: "Places Library", href: dashboardPlacesPath(), icon: MapPin },
    { name: "Settings", href: dashboardSettingsPath(), icon: Settings },
  ]

  return (
    <div className="w-64 bg-white border-r border-slate-200 h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-serif text-xl text-slate-900 font-medium">Vallecito<span className="text-rose-600">.</span></h2>
      </div>
      
      <div className="p-4">
        <Button nativeButton={false} className="w-full justify-start bg-slate-900 hover:bg-slate-800 text-white shadow-sm" render={<Link href="/builder" />}>
          <Plus className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive 
                  ? "bg-rose-50 text-rose-700 font-medium" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`h-4 w-4 mr-3 ${isActive ? "text-rose-600" : "text-slate-400"}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
