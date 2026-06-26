"use server"

import { Argon2id } from "oslo/password"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { lucia } from "@/features/auth/lib/lucia"
import { prisma } from "@/lib/prisma"
import { dashboardTripsPath } from "@/paths"

export async function register(_: unknown, formData: FormData) {
  const name = formData.get("name")?.toString().trim()
  const agencyName = formData.get("agencyName")?.toString().trim()
  const email = formData.get("email")?.toString().trim().toLowerCase()
  const password = formData.get("password")?.toString()

  if (!name || !agencyName || !email || !password) {
    return { error: "All fields required" }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "An account with this email already exists" }
  }

  const slug = agencyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  const passwordHash = await new Argon2id().hash(password)

  const agency = await prisma.agency.create({
    data: {
      name: agencyName,
      slug: `${slug}-${Date.now()}`,
      email,
    },
  })

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      agencyId: agency.id,
      role: "AGENCY_OWNER",
    },
  })

  const session = await lucia.createSession(user.id, {})
  const sessionCookie = lucia.createSessionCookie(session.id)
  const cookieStore = await cookies()
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)

  redirect(dashboardTripsPath())
}
