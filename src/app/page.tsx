import { redirect } from "next/navigation"
import { getSession } from "@/features/auth/queries/get-session"
import { loginPath, dashboardTripsPath } from "@/paths"

export default async function Home() {
  const { user } = await getSession()

  if (user) {
    redirect(dashboardTripsPath())
  } else {
    redirect(loginPath())
  }
}
