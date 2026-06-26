"use client"

import Link from "next/link"
import { format } from "date-fns"
import { MoreHorizontal, FileText, Send, Copy, MessageCircle, Image as ImageIcon } from "lucide-react"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TripListProps {
  initialTrips: any[]
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PROPOSED: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ACTIVE: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-slate-100 text-slate-700",
  TEMPLATE: "bg-purple-50 text-purple-700 border-purple-200",
  ARCHIVED: "bg-slate-100 text-slate-500"
}

export function TripList({ initialTrips }: TripListProps) {
  if (!initialTrips || initialTrips.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No trips yet</h3>
        <p className="text-slate-500 mb-6">Create your first itinerary using the Pro Builder.</p>
        <Button nativeButton={false} className="bg-rose-600 hover:bg-rose-700 text-white" render={<Link href="/builder" />}>
          Open Pro Builder
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Trip Title</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Dates</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Total (USD)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialTrips.map((trip) => (
              <tr key={trip.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">
                  <Link href={`/trip/${trip.shareToken}`} className="hover:text-rose-600 transition-colors">
                    {trip.tripTitle}
                  </Link>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {trip.travelers?.[0] ? `${trip.travelers[0].firstName} ${trip.travelers[0].lastName}` : 'No client assigned'}
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {format(new Date(trip.startDate), "MMM d")} - {format(new Date(trip.endDate), "MMM d, yyyy")}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`font-normal ${statusColors[trip.status] || statusColors.DRAFT}`}>
                      {trip.status}
                    </Badge>
                    {trip.clientMessage && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full" title={trip.clientMessage}>
                        <MessageCircle className="w-3 h-3" />
                        Feedback
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  ${trip.totalPriceUsd?.toFixed(2) || "0.00"}
                </td>
                <td className="px-6 py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem render={<Link href={`/trip/${trip.shareToken}`} />}>
                        <FileText className="mr-2 h-4 w-4" />
                        View Itinerary
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Send Lookbook
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Client
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
