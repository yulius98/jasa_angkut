/**
 * Pemuat Snap.js Midtrans untuk mode embedded (`snap.embed`).
 *
 * Midtrans mengharuskan Snap.js dimuat dengan atribut `data-client-key`, dan
 * hanya sekali per halaman. Fungsi di sini menyuntikkan <script> sesuai
 * kebutuhan dan mengembalikan Promise yang selesai saat `window.snap` siap.
 *
 * Client key Midtrans memang publik (dipakai di browser), jadi aman dikirim
 * dari backend ke app pelanggan.
 */

export interface SnapResult {
  order_id?: string
  transaction_id?: string
  transaction_status?: string
  payment_type?: string
  status_code?: string
  status_message?: string
  fraud_status?: string
  [key: string]: unknown
}

export interface SnapCallbacks {
  onSuccess?: (result: SnapResult) => void
  onPending?: (result: SnapResult) => void
  onError?: (result: SnapResult) => void
  onClose?: () => void
}

export interface SnapEmbedOptions extends SnapCallbacks {
  /** id elemen tempat Snap dirender inline. */
  embedId: string
  language?: string
}

export interface SnapApi {
  embed: (token: string, options: SnapEmbedOptions) => void
  pay: (token: string, options: SnapCallbacks) => void
  hide: () => void
}

declare global {
  interface Window {
    snap?: SnapApi
  }
}

const SCRIPT_ID = "midtrans-snap-script"

/** Muat Snap.js sekali; resolve segera bila sudah tersedia. */
export function loadSnapScript(src: string, clientKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Snap.js hanya bisa dimuat di browser"))
      return
    }
    if (window.snap) {
      resolve()
      return
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener(
        "error",
        () => reject(new Error("Gagal memuat Snap.js")),
        { once: true }
      )
      return
    }

    const script = document.createElement("script")
    script.id = SCRIPT_ID
    script.src = src
    script.async = true
    script.setAttribute("data-client-key", clientKey)
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener(
      "error",
      () => reject(new Error("Gagal memuat Snap.js")),
      { once: true }
    )
    document.body.appendChild(script)
  })
}
