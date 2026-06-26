import { getAgencyTrips } from "@/features/dashboard/queries/get-agency-trips"
import { TripList } from "@/features/dashboard/components/trip-list"
import { Map, Clock, CheckCircle, MessageSquare } from "lucide-react"

export default async function DashboardTripsPage() {
  const trips = await getAgencyTrips()

  const activeCount = trips.filter(t => t.status === "ACTIVE").length
  const proposedCount = trips.filter(t => t.status === "PROPOSED").length
  const confirmedCount = trips.filter(t => t.status === "CONFIRMED").length
  const feedbackCount = trips.filter(t => !!t.clientMessage).length

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900">Trips</h1>
        <p className="text-slate-500 mt-2">Manage your agency's planned and active trips.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Map className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Active Trips</h3>
          </div>
          <p className="text-3xl font-serif text-slate-900">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Clock className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Pending Conf.</h3>
          </div>
          <p className="text-3xl font-serif text-slate-900">{proposedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <h3 className="font-semibold text-sm">Confirmed</h3>
          </div>
          <p className="text-3xl font-serif text-slate-900">{confirmedCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="font-semibold text-sm">New Feedback</h3>
          </div>
          <p className="text-3xl font-serif text-slate-900">{feedbackCount}</p>
        </div>
      </div>

      <TripList initialTrips={trips} />
    </div>
  )
}
