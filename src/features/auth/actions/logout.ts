"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { lucia } from "@/features/auth/lib/lucia"
import { getSession } from "@/features/auth/queries/get-session"
import { loginPath } from "@/paths"

export async function logout() {
  const { session } = await getSession()

  if (session) {
    await lucia.invalidateSession(session.id)
  }

  const blankCookie = lucia.createBlankSessionCookie()
  const cookieStore = await cookies()
  cookieStore.set(blankCookie.name, blankCookie.value, blankCookie.attributes)

  redirect(loginPath())
}
