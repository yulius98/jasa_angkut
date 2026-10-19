"use client"

import { useState } from "react"
import { MailCheck, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface ResetLinkSent {
  sent: boolean
  expiresHours: number
  devResetUrl?: string
}

/**
 * Modal "Lupa password" yang dipasang di halaman login. Validasi ALAMAT EMAIL
 * di backend: hanya email yang terdaftar yang diterima (respons email TIDAK
 * terdaftar ditampilkan langsung di sini sebagai error). Setelah berhasil
 * mengirim link, modal beralih ke tanda sukses; link hanya berlaku
 * `expiresHours` jam (dibaca dari kebijakan admin).
 */
export function ForgotPasswordDialog() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<ResetLinkSent | null>(null)

  function openChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset seluruh isi modal saat ditutup supaya modal selalu bersih saat
      // dibuka lagi.
      setEmail("")
      setError(null)
      setDone(null)
      setSending(false)
    }
  }

  async function send(event: React.FormEvent) {
    event.preventDefault()
    const value = email.trim().toLowerCase()
    if (!value) {
      setError("Email wajib diisi.")
      return
    }
    if (!EMAIL_RE.test(value)) {
      setError("Format email tidak valid.")
      return
    }
    setError(null)
    setSending(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      const data = (await res.json().catch(() => null)) as {
        message?: string
        sent?: boolean
        expiresHours?: number
        devResetUrl?: string
      } | null
      if (!res.ok) {
        setError(data?.message ?? "Gagal mengirim email. Silakan coba lagi.")
        return
      }
      setDone({
        sent: data?.sent ?? true,
        expiresHours: data?.expiresHours ?? 24,
        devResetUrl: data?.devResetUrl,
      })
      setEmail("")
    } catch {
      setError("Tidak dapat terhubung ke server.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger
        render={
          <Button type="button" variant="link" className="h-auto p-0">
            Lupa password?
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        {done ? (
          <>
            <DialogHeader>
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
                <MailCheck className="size-6" />
              </span>
              <DialogTitle className="text-center">
                {done.sent ? "Link terkirim" : "Email belum terkirim"}
              </DialogTitle>
              <DialogDescription className="text-center">
                {done.sent
                  ? `Buka email kamu dan klik tautan "Ganti Password". Tautan hanya berlaku ${done.expiresHours} jam dan hanya bisa dipakai sekali. Kalau tidak sampai beberapa menit, periksa folder spam.`
                  : "Sistem belum memiliki SMTP terpasang sehingga email tidak bisa terkirim."}
              </DialogDescription>
            </DialogHeader>
            {done.devResetUrl ? (
              <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="font-semibold">Mode pengembangan</p>
                <p className="mt-1">
                  SMTP belum diatur, jadi email tidak terkirim. Gunakan tautan
                  berikut untuk menguji{" "}
                  <a
                    className="break-all font-mono underline"
                    href={done.devResetUrl}
                  >
                    {done.devResetUrl}
                  </a>
                </p>
              </div>
            ) : null}
            <DialogFooter className="sm:justify-center">
              <Button type="button" onClick={() => openChange(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Lupa password</DialogTitle>
              <DialogDescription>
                Masukkan email yang terdaftar untuk tautan penyetelan ulang
                password akan dikirim ke email tersebut.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={send} className="grid gap-4">
              <Field>
                <FieldLabel htmlFor="forgot-password-email">Email</FieldLabel>
                <Input
                  id="forgot-password-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  disabled={sending}
                />
                {error ? (
                  <FieldError>{error}</FieldError>
                ) : (
                  <FieldDescription>
                    Hanya email terdaftar yang dapat menerima tautan.
                  </FieldDescription>
                )}
              </Field>
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={sending}
                  onClick={() => openChange(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={sending}>
                  {sending ? <Spinner /> : <Send className="size-4" />}
                  Kirim tautan
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
