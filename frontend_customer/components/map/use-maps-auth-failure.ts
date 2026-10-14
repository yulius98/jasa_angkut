"use client"

import { useEffect, useState } from "react"

interface GoogleAuthWindow extends Window {
  gm_authFailure?: () => void
}

// Status auth bersifat global untuk sesi browser: sekali API key ditolak,
// semua peta berikutnya juga akan ditolak (script Google hanya dimuat sekali).
let authFailed = false
const listeners = new Set<() => void>()

function notify() {
  authFailed = true
  for (const listener of listeners) listener()
}

function ensureHandler() {
  const g = window as GoogleAuthWindow
  // Google Maps memanggil `window.gm_authFailure` saat API key ditolak
  // (mis. ApiTargetBlockedMapError / RefererNotAllowedMapError /
  // BillingNotEnabledMapError).
  if (!g.gm_authFailure) g.gm_authFailure = notify
}

/**
 * `true` bila Google Maps melaporkan kegagalan autentikasi API key. Dipakai
 * untuk beralih ke fallback (input koordinat manual) alih-alih menampilkan
 * peta yang rusak/bertanda air.
 */
export function useMapsAuthFailure(): boolean {
  const [failed, setFailed] = useState(authFailed)

  useEffect(() => {
    ensureHandler()
    const listener = () => setFailed(true)
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return failed
}
