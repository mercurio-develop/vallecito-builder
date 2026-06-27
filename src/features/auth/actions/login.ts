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

  // Auto-seed testing user in production database if it doesn't exist yet
  const testEmail = "testing-user@vallecito.co"
  let testUser = await prisma.user.findUnique({ where: { email: testEmail } })
  if (!testUser) {
    try {
      const passwordHash = await new Argon2id().hash("admin123")
      let agency = await prisma.agency.findFirst()
      if (!agency) {
        agency = await prisma.agency.create({
          data: {
            name: "Vallecito Travel",
            slug: "vallecito-travel",
            email: "contact@vallecitotravel.com",
          }
        })
      }
      await prisma.user.create({
        data: {
          email: testEmail,
          passwordHash,
          name: "Testing User",
          agencyId: agency.id,
          role: "AGENCY_OWNER"
        }
      })
    } catch (e) {
      console.error("Failed to auto-seed testing user dynamically:", e)
    }
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

