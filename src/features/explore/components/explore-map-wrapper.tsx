"use client"

import dynamic from "next/dynamic"
import type { Business } from "@prisma/client"

interface ExploreMapProps {
  businesses: Business[]
  selectedId: string | null
  onSelectBusiness: (id: string) => void
}

const DynamicMap = dynamic(() => import("./explore-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-[#09090B]">
      <p className="text-white/40 text-sm">Loading map…</p>
    </div>
  ),
})

export function ExploreMapWrapper(props: ExploreMapProps) {
  return <DynamicMap {...props} />
}
