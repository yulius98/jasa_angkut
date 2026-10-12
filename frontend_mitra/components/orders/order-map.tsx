"use client"

import { useEffect, useMemo, useState } from "react"
import {
  APIProvider,
  Map,
  Marker,
  Polyline,
  type MapProps,
} from "@vis.gl/react-google-maps"
import { MapPinned } from "lucide-react"

import { cn } from "cn"
import { dayjs, toNumber } from "@/lib/format"
import { isActiveStatus } from "@/lib/orders"
import type { OrderStatus, TrackingPoint, TrackingSnapshot } from "@/types"

const POLL_INTERVAL_MS = 10_000

const PICKUP_COLOR = "#16a34a"
const DROPOFF_COLOR = "#dc2626"
const PARTNER_COLOR = "#2563eb"
const ROUTE_COLOR = "#0284c7"

export interface MapPoint {
  position: { lat: number; lng: number }
  address: string
}

interface OrderMapProps {
  apiKey: string
  orderId: string
  status: OrderStatus
  pickup: MapPoint
  dropoff: MapPoint
  initialLatest: TrackingPoint | null
  initialHistory: TrackingPoint[]
}

function dotIcon(color: string, scale: number): google.maps.Symbol {
  return {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
    scale,
  }
}

function toLatLng(point: TrackingPoint): { lat: number; lng: number } {
  return {
    lat: toNumber(point.latitude),
    lng: toNumber(point.longitude),
  }
}

export function OrderMap({
  apiKey,
  orderId,
  status,
  pickup,
  dropoff,
  initialLatest,
  initialHistory,
}: OrderMapProps) {
  const [latest, setLatest] = useState<TrackingPoint | null>(initialLatest)
  const [history, setHistory] = useState<TrackingPoint[]>(initialHistory)
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    initialLatest?.recordedAt ?? null
  )
  const [pollError, setPollError] = useState<string | null>(null)

  const isActive = isActiveStatus(status)

  // Polling hanya selama order berjalan; berhenti otomatis saat status final.
  useEffect(() => {
    if (!isActive) return

    let cancelled = false

    async function tick() {
      try {
        const res = await fetch(`/api/proxy/tracking/${orderId}`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("bad response")
        const snapshot = (await res.json()) as TrackingSnapshot
        if (cancelled) return
        setLatest(snapshot.latest)
        setHistory(snapshot.history)
        if (snapshot.latest) setUpdatedAt(snapshot.latest.recordedAt)
        setPollError(null)
      } catch {
        if (!cancelled) {
          setPollError("Gagal memperbarui lokasi. Mencoba lagi…")
        }
      }
    }

    const timer = setInterval(tick, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [isActive, orderId])

  const path = useMemo(() => history.map(toLatLng), [history])

  const bounds = useMemo<MapProps["defaultBounds"]>(() => {
    const north = Math.max(pickup.position.lat, dropoff.position.lat)
    const south = Math.min(pickup.position.lat, dropoff.position.lat)
    const east = Math.max(pickup.position.lng, dropoff.position.lng)
    const west = Math.min(pickup.position.lng, dropoff.position.lng)
    const padLat = Math.max((north - south) * 0.2, 0.004)
    const padLng = Math.max((east - west) * 0.2, 0.004)
    return {
      north: north + padLat,
      south: south - padLat,
      east: east + padLng,
      west: west - padLng,
      padding: 56,
    }
  }, [pickup.position, dropoff.position])

  const hasPoints = latest !== null || path.length > 0
  const latestPosition = latest ? toLatLng(latest) : null

  const legend = [
    { label: "Pickup", color: PICKUP_COLOR, kind: "dot" as const },
    { label: "Dropoff", color: DROPOFF_COLOR, kind: "dot" as const },
    { label: "Posisi mitra", color: PARTNER_COLOR, kind: "dot" as const },
    { label: "Rute histori", color: ROUTE_COLOR, kind: "line" as const },
  ]

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              isActive ? "animate-pulse bg-emerald-500" : "bg-muted-foreground/50"
            )}
          />
          {isActive
            ? "Penyegaran otomatis tiap 10 detik"
            : "Pelacakan tidak aktif untuk status ini"}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {updatedAt
            ? `Terakhir diperbarui ${dayjs(updatedAt).format("HH:mm:ss")}`
            : isActive
              ? "Menunggu lokasi mitra…"
              : "Tidak ada data lokasi"}
        </span>
      </div>

      {pollError ? (
        <p className="text-xs text-destructive">{pollError}</p>
      ) : null}

      {!apiKey ? (
        <div className="grid h-72 place-items-center rounded-lg border border-dashed bg-muted/30 p-6 text-center">
          <div className="grid max-w-sm gap-1.5">
            <MapPinned className="mx-auto size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Peta Google Maps belum dikonfigurasi
            </p>
            <p className="text-xs text-muted-foreground">
              Isi{" "}
              <code className="font-mono">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
              </code>{" "}
              di{" "}
              <code className="font-mono">frontend_mitra/.env.local</code>{" "}
              untuk menampilkan peta perjalanan.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative h-72 overflow-hidden rounded-lg border">
          <APIProvider apiKey={apiKey}>
            <Map
              className="h-full w-full"
              defaultBounds={bounds}
              defaultCenter={pickup.position}
              defaultZoom={13}
            >
              <Marker
                position={pickup.position}
                title={`Pickup: ${pickup.address}`}
                icon={dotIcon(PICKUP_COLOR, 8)}
              />
              <Marker
                position={dropoff.position}
                title={`Dropoff: ${dropoff.address}`}
                icon={dotIcon(DROPOFF_COLOR, 8)}
              />
              {latestPosition ? (
                <Marker
                  position={latestPosition}
                  title="Posisi terakhir mitra"
                  icon={dotIcon(PARTNER_COLOR, 9)}
                  zIndex={50}
                />
              ) : null}
              {path.length > 1 ? (
                <Polyline
                  path={path}
                  strokeColor={ROUTE_COLOR}
                  strokeOpacity={0.9}
                  strokeWeight={4}
                />
              ) : null}
            </Map>
          </APIProvider>

          {!hasPoints ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-background/60 p-4">
              <div className="grid gap-1 rounded-lg border bg-card px-4 py-3 text-center shadow-sm">
                <p className="text-sm font-medium">
                  Belum ada titik lokasi mitra
                </p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? "Titik akan muncul otomatis saat mitra mengirim posisi."
                    : "Pesanan ini tidak memiliki data lokasi."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {legend.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            {item.kind === "dot" ? (
              <span
                className="size-2.5 rounded-full ring-1 ring-border"
                style={{ backgroundColor: item.color }}
              />
            ) : (
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
            )}
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
