import { redirect } from "next/navigation"
import { getSession } from "@/features/auth/queries/get-session"
import { dashboardTripsPath } from "@/paths"
import { RegisterForm } from "@/features/auth/components/RegisterForm"

export default async function RegisterPage() {
  const { user } = await getSession()
  if (user) {
    redirect(dashboardTripsPath())
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-2xl font-serif text-slate-900 mb-6 text-center">Create Account</h1>
        <RegisterForm />
      </div>
    </div>
  )
}
