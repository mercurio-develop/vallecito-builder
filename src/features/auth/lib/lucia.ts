import { Lucia } from "lucia"
import { PrismaAdapter } from "@lucia-auth/adapter-prisma"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@prisma/client"

const adapter = new PrismaAdapter(prisma.session, prisma.user)

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes(attrs) {
    return {
      email: attrs.email,
      name: attrs.name,
      role: attrs.role,
      agencyId: attrs.agencyId,
    }
  },
})

declare module "lucia" {
  interface Register {
    Lucia: typeof lucia
    DatabaseUserAttributes: {
      email: string
      name: string
      role: UserRole
      agencyId: string | null
    }
  }
}
