import { redirect } from "next/navigation"
import { getSession } from "@/features/auth/queries/get-session"
import { dashboardTripsPath } from "@/paths"
import { LoginForm } from "@/features/auth/components/LoginForm"

export default async function LoginPage() {
  const { user } = await getSession()
  if (user) {
    redirect(dashboardTripsPath())
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-serif text-slate-900 mb-6 text-center">Sign In</h1>
        <LoginForm />
      </div>
    </div>
  )
}
