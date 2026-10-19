"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Banknote,
  CheckCircle2,
  Clock,
  CreditCard,
  Info,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { MidtransEmbed } from "@/components/orders/midtrans-embed"
import { XenditEmbed } from "@/components/orders/xendit-embed"
import {
  createPaymentAction,
  getOrderPaymentAction,
} from "@/lib/actions/payments"
import { formatRupiah } from "@/lib/format"
import {
  PAYMENT_PROVIDER_META,
  type Payment,
  type PaymentMethodSettings,
} from "@/types"

interface PaymentCheckoutProps {
  orderId: string
  orderNumber: string
  amount: string
  paymentSettings: PaymentMethodSettings
  initialPayment: Payment | null
  /** true bila kembali ke halaman ini dari redirect channel Xendit. */
  resume: boolean
}

type Stage = "choose" | "processing" | "embedded" | "pending" | "success" | "failed"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const sessionKeyFor = (orderId: string) => `xendit-components-key:${orderId}`

export function PaymentCheckout({
  orderId,
  orderNumber,
  amount,
  paymentSettings,
  initialPayment,
  resume,
}: PaymentCheckoutProps) {
  const router = useRouter()

  const [stage, setStage] = useState<Stage>("choose")
  const [embedded, setEmbedded] = useState<"midtrans" | "xendit" | null>(null)
  const [snapToken, setSnapToken] = useState<string | null>(null)
  const [sdkKey, setSdkKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [successKind, setSuccessKind] = useState<"online" | "cash">("online")
  const [finalizing, setFinalizing] = useState(false)
  const [resumed, setResumed] = useState(false)

  const onlineEnabled = Boolean(paymentSettings.gateway)
  const cashEnabled = paymentSettings.cashEnabled
  const gateway = paymentSettings.gateway

  const alreadyPaid = initialPayment?.status === "PAID"

  // Lanjutkan sesi Xendit bila pelanggan kembali dari redirect channel
  // (mis. e-wallet). Kunci sesi disimpan di sessionStorage saat checkout
  // dimulai, karena backend sengaja tidak menyimpannya. Pembacaan storage
  // dilakukan di effect (bukan saat render) supaya tidak bentrok hidrasi;
  // perpindahan stage-nya dijadwalkan ke microtask.
  useEffect(() => {
    if (!resume || resumed) return
    let stored: string | null = null
    try {
      stored = window.sessionStorage.getItem(sessionKeyFor(orderId))
    } catch {
      stored = null
    }
    if (!stored) return
    const key = stored
    void Promise.resolve().then(() => {
      setSdkKey(key)
      setEmbedded("xendit")
      setResumed(true)
      setStage("embedded")
    })
  }, [resume, resumed, orderId])

  function redirectToOrder() {
    router.replace(`/orders/${orderId}`)
    router.refresh()
  }

  // Muat / buat ulang instruksi pembayaran online. Backend meng-upsert baris
  // pembayaran selama belum lunas, jadi menekan tombol ini berkali-kali aman.
  // Xendit Components memvalidasi origin browser secara runtime: origin
  // halaman HARUS sama dengan `components_configuration.origins` yang
  // terdaftar di session, dan Xendit hanya menerima HTTPS. Bila halaman ini
  // dibuka lewat http:// (mis. lupa memakai `pnpm dev:https`), gagal cepat di
  // sini dengan petunjuk membetulkan -- alih-alih error samar
  // "origin is not registered" dari SDK Xendit.
  function assertSecureOriginForOnline(): string | null {
    if (gateway !== "XENDIT") return null
    if (typeof window === "undefined") return null
    if (window.location.protocol === "https:") return null
    return (
      "Pembayaran online (Xendit) memerlukan halaman HTTPS. " +
      "Jalankan app ini dengan `pnpm dev:https` lalu buka " +
      `https://${window.location.host} -- halaman http://${window.location.host} ` +
      "tidak diizinkan pada sesi pembayaran ini."
    )
  }

  async function startOnline() {
    const originError = assertSecureOriginForOnline()
    if (originError) {
      setMessage(originError)
      setStage("failed")
      return
    }
    setMessage(null)
    setStage("processing")
    const result = await createPaymentAction(orderId, "VIRTUAL_ACCOUNT")
    if (!result.ok) {
      setMessage(result.message)
      setStage("failed")
      return
    }

    const data = result.data
    if (data.componentsSdkKey) {
      try {
        window.sessionStorage.setItem(sessionKeyFor(orderId), data.componentsSdkKey)
      } catch {
        // sessionStorage bisa diblokir; resume saja yang tidak jalan.
      }
      setSdkKey(data.componentsSdkKey)
      setEmbedded("xendit")
      setStage("embedded")
      return
    }
    if (data.snapToken) {
      setSnapToken(data.snapToken)
      setEmbedded("midtrans")
      setStage("embedded")
      return
    }
    setMessage("Gateway tidak mengembalikan instruksi pembayaran. Coba lagi.")
    setStage("failed")
  }

  async function startCash() {
    setMessage(null)
    setStage("processing")
    const result = await createPaymentAction(orderId, "CASH")
    if (!result.ok) {
      setMessage(result.message)
      setStage("failed")
      return
    }
    setSuccessKind("cash")
    setStage("success")
  }

  // Dipanggil saat gateway memastikan pembayaran berhasil. Kita beri jeda
  // singkat sambil menunggu webhook menandai PAID di backend, lalu pindah ke
  // halaman pesanan.
  async function handleOnlineSuccess() {
    setSuccessKind("online")
    setStage("success")
    setFinalizing(true)
    try {
      window.sessionStorage.removeItem(sessionKeyFor(orderId))
    } catch {
      // abaikan
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await getOrderPaymentAction(orderId)
      if (res.ok && res.data?.status === "PAID") break
      await sleep(1200)
    }
    redirectToOrder()
  }

  function handleFailure(text: string) {
    setMessage(text)
    setStage("failed")
  }

  function switchMethod() {
    setEmbedded(null)
    setSnapToken(null)
    setSdkKey(null)
    setMessage(null)
    setStage("choose")
  }

  async function checkStatus() {
    const res = await getOrderPaymentAction(orderId)
    if (res.ok && res.data?.status === "PAID") {
      setSuccessKind("online")
      setStage("success")
      return
    }
    toast.info("Pembayaran belum dikonfirmasi. Coba lagi sebentar lagi.")
  }

  if (alreadyPaid) {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <p className="text-base font-semibold">Pembayaran sudah lunas</p>
          <p className="text-sm text-muted-foreground">
            Pesanan {orderNumber} sudah dibayar.
          </p>
        </div>
        <Button className="h-11 w-full" onClick={redirectToOrder}>
          Lihat pesanan
        </Button>
      </Card>
    )
  }

  // ===== Sukses =====
  if (stage === "success") {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 className="size-12 text-emerald-600" />
          <p className="text-lg font-semibold">Pembayaran berhasil</p>
          <p className="text-sm text-muted-foreground">
            {successKind === "cash"
              ? "Pembayaran tunai dicatat. Bayar langsung ke mitra saat barang tiba."
              : `Terima kasih! Pembayaran ${formatRupiah(amount)} untuk pesanan ${orderNumber} sedang kami konfirmasi.`}
          </p>
        </div>
        <Button className="h-11 w-full" onClick={redirectToOrder} disabled={finalizing && successKind === "online"}>
          {finalizing && successKind === "online" ? <Spinner /> : null}
          Lihat pesanan
        </Button>
        {finalizing && successKind === "online" ? (
          <p className="text-center text-xs text-muted-foreground">
            Menyiapkan halaman pesanan…
          </p>
        ) : null}
      </Card>
    )
  }

  // ===== Menunggu penyelesaian (mis. VA/QR belum dibayar) =====
  if (stage === "pending") {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Clock className="size-10 text-amber-600" />
          <p className="text-base font-semibold">Menunggu pembayaran</p>
          <p className="text-sm text-muted-foreground">
            Selesaikan pembayaran sesuai instruksi. Halaman ini akan diperbarui
            otomatis setelah pembayaran diterima.
          </p>
        </div>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={checkStatus}
        >
          Cek status pembayaran
        </Button>
        <Button variant="ghost" className="h-11 w-full" onClick={switchMethod}>
          Ganti metode pembayaran
        </Button>
      </Card>
    )
  }

  // ===== Gagal =====
  if (stage === "failed") {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <Info className="size-10 text-destructive" />
          <p className="text-base font-semibold">Pembayaran belum berhasil</p>
          <p className="text-sm text-muted-foreground">
            {message ?? "Terjadi kendala saat memproses pembayaran."}
          </p>
        </div>
        {onlineEnabled ? (
          <Button className="h-11 w-full" onClick={startOnline}>
            <CreditCard className="size-4" />
            Coba lagi
          </Button>
        ) : null}
        {cashEnabled ? (
          <Button variant="outline" className="h-11 w-full" onClick={startCash}>
            <Banknote className="size-4" />
            Bayar tunai ke mitra
          </Button>
        ) : null}
        {!onlineEnabled && !cashEnabled ? null : (
          <Button variant="ghost" className="h-11 w-full" onClick={switchMethod}>
            Ganti metode pembayaran
          </Button>
        )}
      </Card>
    )
  }

  // ===== Memproses pembuatan instruksi =====
  if (stage === "processing") {
    return (
      <Card className="gap-4 p-5">
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Spinner />
          <p className="text-sm text-muted-foreground">
            Menyiapkan pembayaran…
          </p>
        </div>
      </Card>
    )
  }

  // ===== Embedded gateway =====
  if (stage === "embedded" && embedded === "midtrans" && snapToken) {
    return (
      <Card className="gap-4 p-4">
        <CheckoutHeading
          title="Pembayaran Online"
          subtitle={gateway ? PAYMENT_PROVIDER_META[gateway].label : undefined}
          amount={amount}
        />
        <MidtransEmbed
          snapToken={snapToken}
          clientKey={paymentSettings.midtransClientKey ?? ""}
          snapJsUrl={
            paymentSettings.midtransSnapJsUrl ??
            "https://app.sandbox.midtrans.com/snap/snap.js"
          }
          onSuccess={handleOnlineSuccess}
          onPending={() => setStage("pending")}
          onError={handleFailure}
          onClose={switchMethod}
        />
      </Card>
    )
  }

  if (stage === "embedded" && embedded === "xendit" && sdkKey) {
    return (
      <Card className="gap-4 p-4">
        <CheckoutHeading
          title="Pembayaran Online"
          subtitle={gateway ? PAYMENT_PROVIDER_META[gateway].label : undefined}
          amount={amount}
        />
        <XenditEmbed
          componentsSdkKey={sdkKey}
          resume={resume && resumed}
          onSuccess={handleOnlineSuccess}
          onExpiredOrCanceled={() =>
            handleFailure(
              "Sesi pembayaran berakhir atau dibatalkan. Silakan coba lagi."
            )
          }
          onFatalError={handleFailure}
          onSubmissionError={handleFailure}
          onSwitchMethod={switchMethod}
        />
      </Card>
    )
  }

  // ===== Pilih metode =====
  return (
    <Card className="gap-4 p-5">
      <CheckoutHeading
        title="Pembayaran"
        subtitle={`Pesanan ${orderNumber}`}
        amount={amount}
      />

      <div className="grid gap-2 border-t pt-4">
        {onlineEnabled ? (
          <Button size="lg" className="h-12 w-full" onClick={startOnline}>
            <CreditCard className="size-4" />
            Bayar Online
          </Button>
        ) : null}
        {cashEnabled ? (
          <Button
            variant="outline"
            size="lg"
            className="h-12 w-full"
            onClick={startCash}
          >
            <Banknote className="size-4" />
            Bayar Tunai ke Mitra
          </Button>
        ) : null}
        {!onlineEnabled && !cashEnabled ? (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Belum ada metode pembayaran yang tersedia. Hubungi dukungan.
          </p>
        ) : null}
      </div>

      {onlineEnabled ? (
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Wallet className="mt-0.5 size-3.5 shrink-0" />
          Pembayaran online dilakukan di dalam aplikasi: pilih metode (VA, QRIS,
          e-wallet, atau kartu), lalu selesaikan tanpa keluar dari halaman ini.
        </p>
      ) : null}
    </Card>
  )
}

function CheckoutHeading({
  title,
  subtitle,
  amount,
}: {
  title: string
  subtitle?: string
  amount: string
}) {
  return (
    <div className="grid gap-1">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle ? (
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-sm text-muted-foreground">Total dibayar</span>
        <span className="text-base font-semibold tabular-nums">
          {formatRupiah(amount)}
        </span>
      </div>
    </div>
  )
}
