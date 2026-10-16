"use client"

import { useEffect, useRef, useState } from "react"
import { CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { XenditComponents } from "xendit-components-web"

interface XenditEmbedProps {
  componentsSdkKey: string
  /** true bila pelanggan kembali dari redirect channel (mis. e-wallet). */
  resume?: boolean
  onSuccess: () => void
  onExpiredOrCanceled: () => void
  onFatalError: (message: string) => void
  /** Gagal submit yang masih bisa dicoba lagi (bukan fatal). */
  onSubmissionError: (message: string) => void
  onSwitchMethod: () => void
}

/**
 * Xendit Components: SDK klien resmi yang merender pemilih channel + form
 * (termasuk field kartu yang PCI-compliant di iframe Xendit) langsung di
 * halaman kita. Channel redirect (e-wallet) tetap dipandu SDK ini, dan kembali
 * ke `return_url` kita dengan `resume: true`.
 *
 * SDK diimpor secara dinamis di dalam effect supaya tidak dievaluasi saat SSR
 * (paketnya menyentuh DOM/EventTarget).
 */
export function XenditEmbed({
  componentsSdkKey,
  resume = false,
  onSuccess,
  onExpiredOrCanceled,
  onFatalError,
  onSubmissionError,
  onSwitchMethod,
}: XenditEmbedProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sdkRef = useRef<XenditComponents | null>(null)

  const [initializing, setInitializing] = useState(true)
  const [ready, setReady] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const cb = useRef({
    onSuccess,
    onExpiredOrCanceled,
    onFatalError,
    onSubmissionError,
  })
  useEffect(() => {
    cb.current = {
      onSuccess,
      onExpiredOrCanceled,
      onFatalError,
      onSubmissionError,
    }
  })

  useEffect(() => {
    let disposed = false
    let picker: HTMLElement | null = null

    async function init() {
      try {
        const mod = await import("xendit-components-web")
        if (disposed) return

        const sdk = new mod.XenditComponents({ componentsSdkKey, resume })
        sdkRef.current = sdk

        sdk.addEventListener("init", () => {
          if (!disposed) setInitializing(false)
        })
        sdk.addEventListener("submission-ready", () => {
          if (!disposed) setReady(true)
        })
        sdk.addEventListener("submission-not-ready", () => {
          if (!disposed) setReady(false)
        })
        sdk.addEventListener("submission-begin", () => {
          if (!disposed) setSubmitting(true)
        })
        sdk.addEventListener("submission-end", (event) => {
          if (disposed) return
          setSubmitting(false)
          // submission-end juga muncul saat sukses; hanya tampilkan pesan bila
          // Xendit menyertakan pesan kesalahan untuk pengguna.
          const message = event.userErrorMessage?.join(" ")
          if (message) cb.current.onSubmissionError(message)
        })
        sdk.addEventListener("session-complete", () => {
          if (!disposed) cb.current.onSuccess()
        })
        sdk.addEventListener("session-expired-or-canceled", () => {
          if (!disposed) cb.current.onExpiredOrCanceled()
        })
        sdk.addEventListener("fatal-error", (event) => {
          if (!disposed)
            cb.current.onFatalError(
              event.userErrorMessage?.join(" ") ??
                "Terjadi kesalahan saat memuat pembayaran."
            )
        })

        picker = sdk.createChannelPickerComponent()
        containerRef.current?.appendChild(picker)
      } catch (error) {
        if (disposed) return
        setInitializing(false)
        cb.current.onFatalError(
          error instanceof Error
            ? error.message
            : "Gagal memuat metode pembayaran."
        )
      }
    }

    init()

    return () => {
      disposed = true
      if (sdkRef.current && picker) {
        try {
          sdkRef.current.destroyComponent(picker)
        } catch {
          // abaikan: komponen mungkin sudah dilepas.
        }
      }
      sdkRef.current = null
    }
  }, [componentsSdkKey, resume])

  function submit() {
    sdkRef.current?.submit()
  }

  return (
    <div className="grid gap-3">
      <div ref={containerRef} className="min-h-[320px] w-full" />

      {initializing ? (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Spinner />
          Menyiapkan metode pembayaran…
        </div>
      ) : null}

      <Button
        size="lg"
        className="h-11 w-full"
        onClick={submit}
        disabled={!ready || submitting || initializing}
      >
        {submitting ? <Spinner /> : <CreditCard className="size-4" />}
        Bayar Sekarang
      </Button>

      <Button
        variant="outline"
        className="h-11 w-full"
        onClick={onSwitchMethod}
        disabled={submitting}
      >
        Pilih metode lain
      </Button>
    </div>
  )
}
