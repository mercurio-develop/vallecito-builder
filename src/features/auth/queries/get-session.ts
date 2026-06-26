import { lucia } from "@/features/auth/lib/lucia"
import { cookies } from "next/headers"
import { cache } from "react"

export const getSession = cache(async () => {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(lucia.sessionCookieName)?.value ?? null
  if (!sessionId) {
    return { user: null, session: null }
  }

  try {
    const result = await lucia.validateSession(sessionId)
    // Next.js throws when setting cookies during page rendering, so wrap in try/catch
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id)
        cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie()
        cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes)
      }
    } catch {}
    
    return result
  } catch (error) {
    console.error("Error in getSession:", error)
    return { user: null, session: null }
  }
})

