"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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
import type { GeocodeHit } from "@/types"

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
  /**
   * Alamat yang diketik pengguna. Saat teksnya berubah (bukan berasal dari
   * peta), komponen otomatis mencari koordinatnya lalu menjadikannya titik
   * terpilih.
   */
  searchAddress?: string
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
  searchAddress,
}: LocationPickerProps) {
  const [locating, setLocating] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  // Alamat terakhir yang berasal dari komponen ini (hasil reverse geocoding),
  // agar alamat yang terisi otomatis dari peta tidak memicu pencarian lagi.
  const internalAddressRef = useRef<string | null>(null)
  // Penanda urutan pencarian; hasil request lama yang datang belakangan
  // tidak boleh menimpa titik dari ketikan terbaru.
  const searchRequestRef = useRef(0)
  // ID pencarian yang sedang berjalan; null berarti tidak ada pencarian aktif.
  const [activeSearchId, setActiveSearchId] = useState<number | null>(null)
  const searching = activeSearchId !== null
  const mapsAuthFailed = useMapsAuthFailure()
  const mapAvailable = Boolean(apiKey) && !mapsAuthFailed

  const reverseGeocode = useCallback(
    async (position: LatLng) => {
      if (!onAddressChange) return
      const fallback = "Alamat tidak dapat dibaca otomatis. Silakan isi manual."
      try {
        const res = await fetch(
          `/api/proxy/geocode?lat=${position.lat}&lng=${position.lng}`
        )
        const data = (await res.json().catch(() => null)) as
          | { results?: GeocodeHit[]; message?: string }
          | null
        if (res.ok && data?.results?.length) {
          internalAddressRef.current = data.results[0].formattedAddress
          onAddressChange(data.results[0].formattedAddress)
          setGeocodeError(null)
        } else {
          setGeocodeError(data?.message ?? fallback)
        }
      } catch {
        setGeocodeError(fallback)
      }
    },
    [onAddressChange]
  )

  // Mencari koordinat dari alamat yang diketik pengguna (forward geocoding)
  // lalu menjadikannya titik terpilih. Dipanggil dari callback debounce,
  // bukan langsung dari body effect. Sengaja lewat proxy backend, bukan
  // Geocoder browser — API key tidak diizinkan untuk Geocoding API client.
  const geocodeAddress = useCallback(
    async (rawAddress: string, requestId: number) => {
      setActiveSearchId(requestId)
      try {
        const res = await fetch(
          `/api/proxy/geocode?address=${encodeURIComponent(rawAddress)}`
        )
        const data = (await res.json().catch(() => null)) as
          | { results?: GeocodeHit[]; message?: string }
          | null
        // Abaikan hasil telat dari ketikan yang sudah diganti pengguna.
        if (requestId !== searchRequestRef.current) return
        setActiveSearchId((cur) => (cur === requestId ? null : cur))
        if (!res.ok) {
          setGeocodeError(
            data?.message ??
              "Pencarian alamat gagal. Coba lagi atau pilih titik langsung di peta."
          )
          return
        }
        const hit = data?.results?.[0]
        if (!hit) {
          setGeocodeError(
            "Alamat tidak ditemukan. Periksa penulisan atau pilih titik langsung di peta."
          )
          return
        }
        internalAddressRef.current = hit.formattedAddress
        setGeocodeError(null)
        onChange({ lat: hit.lat, lng: hit.lng })
      } catch {
        if (requestId !== searchRequestRef.current) return
        setActiveSearchId((cur) => (cur === requestId ? null : cur))
        setGeocodeError(
          "Tidak dapat menghubungi pencarian lokasi. Coba lagi atau pilih titik langsung di peta."
        )
      }
    },
    [onChange]
  )

  // Debounce: tunggu pengguna berhenti mengetik sebelum memanggil Geocoder.
  useEffect(() => {
    const address = searchAddress?.trim() ?? ""
    if (
      mapAvailable &&
      address.length >= 4 &&
      // Lewati alamat yang barusan diisi otomatis oleh peta/geolokasi.
      address !== internalAddressRef.current
    ) {
      const requestId = ++searchRequestRef.current
      const timer = setTimeout(() => geocodeAddress(address, requestId), 800)
      return () => clearTimeout(timer)
    }
    // Alamat pendek, peta tidak tersedia, atau alamat asal peta: batalkan
    // pencarian berjalan agar balasan usang tidak menimpa titik terpilih.
    searchRequestRef.current += 1
  }, [searchAddress, mapAvailable, geocodeAddress])

  // Pembatalan pencarian dari ketikan: dipakai saat pengguna memilih titik
  // lewat peta atau geolokasi agar balasan usang tidak menimpa titiknya.
  const cancelAddressSearch = useCallback(() => {
    searchRequestRef.current += 1
    setActiveSearchId(null)
  }, [])

  const handleMapClick = useCallback(
    (event: { detail: { latLng: { lat: number; lng: number } | null } }) => {
      const latLng = event.detail.latLng
      if (!latLng) return
      cancelAddressSearch()
      const position = { lat: latLng.lat, lng: latLng.lng }
      onChange(position)
      reverseGeocode(position)
    },
    [onChange, reverseGeocode, cancelAddressSearch]
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
        cancelAddressSearch()
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
  }, [onChange, reverseGeocode, cancelAddressSearch])

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
              {searching
                ? "Mencari alamat di peta…"
                : value
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
          Ketuk peta untuk memilih titik; alamat akan terisi otomatis. Mengisi
          alamat di bawah juga akan mencari titiknya di peta secara otomatis.
        </p>
      ) : null}
    </div>
  )
}