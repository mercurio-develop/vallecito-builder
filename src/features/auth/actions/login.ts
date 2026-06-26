"use server"

import { Argon2id } from "oslo/password"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { lucia } from "@/features/auth/lib/lucia"
import { prisma } from "@/lib/prisma"
import { dashboardTripsPath } from "@/paths"

export async function login(_: unknown, formData: FormData) {
  const email = formData.get("email")?.toString().trim().toLowerCase()
  const password = formData.get("password")?.toString()

  if (!email || !password) {
    return { error: "Email and password required" }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: "Invalid email or password" }
  }

  const validPassword = await new Argon2id().verify(user.passwordHash, password)

  if (!validPassword) {
    return { error: "Invalid email or password" }
  }

  const session = await lucia.createSession(user.id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)
  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  redirect(dashboardTripsPath())
}
