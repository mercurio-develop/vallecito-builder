import { redirect } from "next/navigation"
import { getSession } from "@/features/auth/queries/get-session"
import { loginPath } from "@/paths"
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await getSession()

  if (!user) {
    redirect(loginPath())
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardSidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  )
}
