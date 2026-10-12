"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Navigation, NavigationOff, RadioTower, Square } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "cn"

const MIN_INTERVAL_MS = 8_000

/**
 * Mengirim lokasi GPS mitra ke backend secara berkala selama order berjalan.
 * Order pengiriman tidak boleh dikirim bila order sudah final.
 */
export function LocationTracker({
  orderId,
  active,
}: {
  orderId: string
  active: boolean
}) {
  const [watching, setWatching] = useState(false)
  const [lastSentAt, setLastSentAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const lastPostRef = useRef(0)

  const send = useCallback(
    async (coords: GeolocationCoordinates) => {
      try {
        const res = await fetch("/api/proxy/tracking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            ...(coords.speed !== null && Number.isFinite(coords.speed)
              ? { speedKmh: Math.max(0, coords.speed * 3.6) }
              : {}),
          }),
        })
        if (!res.ok) throw new Error("bad response")
        setLastSentAt(new Date().toISOString())
        setError(null)
      } catch {
        setError("Gagal mengirim lokasi. Mencoba lagi…")
      }
    },
    [orderId]
  )

  useEffect(() => {
    if (!watching) return

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now()
        if (now - lastPostRef.current < MIN_INTERVAL_MS) return
        lastPostRef.current = now
        void send(position.coords)
      },
      () => {
        setError(
          "Tidak bisa mengakses lokasi. Izinkan akses lokasi di pengaturan."
        )
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 }
    )

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [watching, send])

  if (!active) return null

  function toggle() {
    if (watching) {
      setWatching(false)
      toast.info("Berbagi lokasi dihentikan")
      return
    }
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Perangkat ini tidak mendukung layanan lokasi.")
      return
    }
    lastPostRef.current = 0
    setWatching(true)
    toast.info("Mulai membagikan lokasi")
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "grid size-10 place-items-center rounded-full",
              watching
                ? "bg-emerald-500/10 text-emerald-600"
                : "bg-muted text-muted-foreground"
            )}
          >
            {watching ? (
              <RadioTower className="size-5" />
            ) : (
              <NavigationOff className="size-5" />
            )}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {watching ? "Berbagi lokasi aktif" : "Bagikan lokasi perjalanan"}
            </p>
            <p className="text-xs text-muted-foreground">
              {lastSentAt
                ? `Terakhir terkirim ${new Date(lastSentAt).toLocaleTimeString(
                    "id-ID"
                  )}`
                : watching
                  ? "Menunggu sinyal GPS…"
                  : "Pelanggan bisa melacak posisimu saat fitur ini aktif."}
            </p>
          </div>
        </div>
        <Button
          variant={watching ? "outline" : "default"}
          onClick={toggle}
          className="gap-2"
        >
          {watching ? (
            <Square className="size-4 fill-current" />
          ) : (
            <Navigation className="size-4" />
          )}
          {watching ? "Hentikan" : "Mulai"}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </Card>
  )
}
