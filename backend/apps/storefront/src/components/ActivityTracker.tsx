"use client"
import { useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { trackActivity } from "@/lib/activity"

function TrackerInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname.startsWith("/product/") && !pathname.startsWith("/category/") && !pathname.startsWith("/shop") && !pathname.startsWith("/checkout") && !pathname.startsWith("/order/confirmed")) {
      trackActivity({
        event_type: "PAGE_VIEW",
        page_path: pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")
      })
    }
  }, [pathname, searchParams])

  return null
}

export default function ActivityTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  )
}
