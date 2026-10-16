"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { loadSnapScript, type SnapResult } from "@/lib/payments/snap"

const SNAP_CONTAINER_ID = "midtrans-snap-container"

interface MidtransEmbedProps {
  snapToken: string
  clientKey: string
  snapJsUrl: string
  onSuccess: (result: SnapResult) => void
  onPending: (result: SnapResult) => void
  onError: (message: string) => void
  /** Dipanggil saat pelanggan menutup Snap sendiri atau memilih metode lain. */
  onClose: () => void
}

/**
 * Menampilkan UI Snap Midtrans secara inline (embedded) di dalam halaman kita,
 * jadi pelanggan tidak pernah keluar dari app untuk memilih channel
 * (VA, e-wallet, kartu, retail). Snap menyelesaikan 3DS/instruksi di dalam
 * container yang sama.
 */
export function MidtransEmbed({
  snapToken,
  clientKey,
  snapJsUrl,
  onSuccess,
  onPending,
  onError,
  onClose,
}: MidtransEmbedProps) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Simpan callback di ref supaya effect tidak perlu jalan ulang saat parent
  // merender ulang (identitas fungsi berubah tiap render). Ref diperbarui di
  // dalam effect, bukan saat render.
  const cb = useRef({ onSuccess, onPending, onError, onClose })
  useEffect(() => {
    cb.current = { onSuccess, onPending, onError, onClose }
  })

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        await loadSnapScript(snapJsUrl, clientKey)
        if (cancelled || !window.snap) return

        window.snap.embed(snapToken, {
          embedId: SNAP_CONTAINER_ID,
          language: "id",
          onSuccess: (result) => cb.current.onSuccess(result),
          onPending: (result) => cb.current.onPending(result),
          onError: (result) =>
            cb.current.onError(
              result?.status_message ?? "Pembayaran gagal diproses."
            ),
          onClose: () => cb.current.onClose(),
        })
        setState("ready")
      } catch (error) {
        if (cancelled) return
        setState("error")
        setErrorMessage(
          error instanceof Error ? error.message : "Gagal memuat pembayaran."
        )
      }
    }

    setup()

    return () => {
      cancelled = true
      try {
        window.snap?.hide()
      } catch {
        // abaikan: Snap mungkin belum terinisialisasi.
      }
    }
  }, [snapToken, clientKey, snapJsUrl])

  return (
    <div className="grid gap-3">
      {state === "loading" ? (
        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Spinner />
          Menyiapkan pembayaran…
        </div>
      ) : null}

      {state === "error" ? (
        <div className="grid gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <span>{errorMessage ?? "Gagal memuat pembayaran."}</span>
        </div>
      ) : null}

      <div id={SNAP_CONTAINER_ID} className="min-h-[420px] w-full" />

      <Button variant="outline" className="h-11 w-full" onClick={onClose}>
        <CreditCard className="size-4" />
        Pilih metode lain
      </Button>
    </div>
  )
}
