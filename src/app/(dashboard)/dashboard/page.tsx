import { getSession } from "@/features/auth/queries/get-session"
import { redirect } from "next/navigation"
import { loginPath, dashboardTripsPath } from "@/paths"

export default async function DashboardIndexPage() {
  const { user } = await getSession()

  if (!user) {
    redirect(loginPath())
  }

  // Redirect to the default dashboard view (trips)
  redirect(dashboardTripsPath())
}
