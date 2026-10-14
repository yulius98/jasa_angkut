"use client"

import { useCallback, useEffect, useState } from "react"
import {
  APIProvider,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps"
import { Crosshair, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useMapsAuthFailure } from "@/components/map/use-maps-auth-failure"

// Pusat peta default: Jakarta. Hanya dipakai sebelum pengguna memilih titik.
const DEFAULT_CENTER = { lat: -6.2, lng: 106.816666 }

export interface LatLng {
  lat: number
  lng: number
}

interface LocationPickerProps {
  apiKey: string
  value: LatLng | null
  onChange: (value: LatLng) => void
  onAddressChange?: (address: string) => void
}

function Recenter({ position }: { position: LatLng | null }) {
  const map = useMap()
  const lat = position?.lat
  const lng = position?.lng
  useEffect(() => {
    if (map && lat != null && lng != null) map.panTo({ lat, lng })
  }, [map, lat, lng])
  return null
}

function toNumberInput(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function LocationPicker({
  apiKey,
  value,
  onChange,
  onAddressChange,
}: LocationPickerProps) {
  const [locating, setLocating] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const mapsAuthFailed = useMapsAuthFailure()
  const mapAvailable = Boolean(apiKey) && !mapsAuthFailed

  const reverseGeocode = useCallback(
    (position: LatLng) => {
      if (!onAddressChange || typeof google === "undefined") return
      const instance = new google.maps.Geocoder()
      instance.geocode(
        { location: position },
        (results, status) => {
          if (status === "OK" && results?.[0]) {
            onAddressChange(results[0].formatted_address)
            setGeocodeError(null)
          } else {
            setGeocodeError(
              "Alamat tidak dapat dibaca otomatis. Silakan isi manual."
            )
          }
        }
      )
    },
    [onAddressChange]
  )

  const handleMapClick = useCallback(
    (event: { detail: { latLng: { lat: number; lng: number } | null } }) => {
      const latLng = event.detail.latLng
      if (!latLng) return
      const position = { lat: latLng.lat, lng: latLng.lng }
      onChange(position)
      reverseGeocode(position)
    },
    [onChange, reverseGeocode]
  )

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeocodeError("Perangkat tidak mendukung lokasi.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const position = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }
        onChange(position)
        reverseGeocode(position)
        setLocating(false)
      },
      () => {
        setGeocodeError("Tidak dapat mengakses lokasi. Cek izin lokasi.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }, [onChange, reverseGeocode])

  const updateLat = useCallback(
    (raw: string) => {
      const lat = toNumberInput(raw)
      if (lat == null) return
      onChange({ lat, lng: value?.lng ?? DEFAULT_CENTER.lng })
    },
    [onChange, value?.lng]
  )

  const updateLng = useCallback(
    (raw: string) => {
      const lng = toNumberInput(raw)
      if (lng == null) return
      onChange({ lat: value?.lat ?? DEFAULT_CENTER.lat, lng })
    },
    [onChange, value?.lat]
  )

  return (
    <div className="grid gap-2">
      {mapAvailable ? (
        <div className="relative overflow-hidden rounded-xl border">
          <APIProvider apiKey={apiKey}>
            <Map
              className="h-52 w-full"
              defaultCenter={value ?? DEFAULT_CENTER}
              defaultZoom={value ? 15 : 12}
              gestureHandling="greedy"
              disableDefaultUI
              onClick={handleMapClick}
            >
              {value ? <Marker position={value} /> : null}
              <Recenter position={value} />
            </Map>
          </APIProvider>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-3">
            <p className="text-center text-xs text-muted-foreground">
              {value
                ? "Titik terpilih. Ketuk peta untuk memindahkan."
                : "Ketuk peta untuk memilih titik"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-2 rounded-xl border border-dashed bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">
            {mapsAuthFailed
              ? "Peta Google Maps tidak dapat dimuat karena API key ditolak. Atur koordinat manual atau gunakan lokasi saat ini."
              : "Peta belum dikonfigurasi. Atur koordinat manual atau gunakan lokasi saat ini."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="-6.20000"
              value={value ? String(value.lat) : ""}
              onChange={(e) => updateLat(e.target.value)}
              aria-label="Latitude"
            />
            <Input
              type="number"
              step="any"
              inputMode="decimal"
              placeholder="106.81666"
              value={value ? String(value.lng) : ""}
              onChange={(e) => updateLng(e.target.value)}
              aria-label="Longitude"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
          Gunakan lokasi saya
        </Button>
        {value ? (
          <span className="text-xs text-muted-foreground tabular-nums">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        ) : null}
      </div>

      {geocodeError ? (
        <p className="text-xs text-destructive">{geocodeError}</p>
      ) : null}
      {mapAvailable && onAddressChange ? (
        <p className="text-xs text-muted-foreground">
          Ketuk peta untuk memilih titik; alamat akan terisi otomatis.
        </p>
      ) : null}
    </div>
  )
}