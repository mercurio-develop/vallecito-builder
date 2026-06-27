if (typeof globalThis !== 'undefined' && globalThis.performance && globalThis.performance.measure) {
  const originalMeasure = globalThis.performance.measure;
  // @ts-ignore
  globalThis.performance.measure = function(...args: any[]) {
    try {
      // @ts-ignore
      return originalMeasure.apply(this, args);
    } catch (e) {
      return null as any;
    }
  };
}

import { Suspense } from "react"
import { BuilderProvider } from "@/features/pro-builder/store/builder-context"
import { ProBuilderMain } from "@/features/pro-builder/components/ProBuilderMain"
import { fetchBusinesses } from "@/features/business/actions/fetch-businesses"
import { getSession } from "@/features/auth/queries/get-session"
import { redirect } from "next/navigation"
import { loginPath } from "@/paths"

export default async function AgencyTripBuilderPage() {
  const { user } = await getSession()

  if (!user) {
    redirect(loginPath())
  }

  const initialData = await fetchBusinesses({ 
    limit: 1000
  });

  return (
    <BuilderProvider>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" /></div>}>
        <ProBuilderMain initialLibrary={initialData.allBusinesses} />
      </Suspense>
    </BuilderProvider>
  )
}

