import { fetchBusinesses } from "@/features/business/actions/fetch-businesses"
import { PlacesList } from "@/features/dashboard/components/places-list"
import { getSession } from "@/features/auth/queries/get-session"

export const revalidate = 0 // always fetch fresh on page load

export default async function DashboardPlacesPage() {
  const { user } = await getSession()
  const data = await fetchBusinesses({
    limit: 1000,
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-slate-900">Places Library</h1>
        <p className="text-slate-500 mt-2">
          Manage your registered hotels, restaurants, outdoor checkpoints, viewfinders, and custom stops.
        </p>
      </div>

      <PlacesList initialPlaces={data.allBusinesses || []} currentUser={user} />
    </div>
  )
}
