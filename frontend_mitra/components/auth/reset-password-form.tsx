"use client"

import { useState } from "react"
import Link from "next/link"
import { KeyRound, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export type ResetTokenStatus = {
  valid: boolean
  reason: "INVALID" | "USED" | "EXPIRED" | null
}

interface ResetPasswordFormProps {
  token: string
  tokenStatus: ResetTokenStatus | null
}

function invalidReasonText(reason: ResetTokenStatus["reason"]): string {
  if (reason === "USED") {
    return "Tautan ini sudah pernah dipakai. Minta tautan baru dari halaman masuk bila perlu mengganti password lagi."
  }
  if (reason === "EXPIRED") {
    return "Tautan ini kedaluwarsa (masa berlakunya sudah lewat). Minta tautan baru dari halaman masuk."
  }
  return "Tautan tidak valid. Pastikan link di email terbuka utuh, atau minta tautan baru dari halaman masuk."
}

/**
 * Halaman "Ganti password" bertujuan untuk menerima link dari email lupa
 * password. Status token sudah diverifikasi di server (proses halaman
 * `reset-password`), jadi komponen ini hanya menampilkan pilihan: form untuk
 * password baru, atau kartu error supaya pengguna tahu langkah berikutnya.
 */
export function ResetPasswordForm({ token, tokenStatus }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  if (!tokenStatus) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
            <ShieldAlert />
          </span>
          <CardTitle>Tautan tidak dapat diperiksa</CardTitle>
          <CardDescription>
            Terjadi kendala saat memeriksa tautan. Coba buka kembali link pada
            email, atau hubungi dukungan.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Kembali ke halaman masuk
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!tokenStatus.valid) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950">
            <ShieldAlert />
          </span>
          <CardTitle>Tautan tidak berlaku</CardTitle>
          <CardDescription>{invalidReasonText(tokenStatus.reason)}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/login" />}>
            Ke halaman masuk
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
            <KeyRound />
          </span>
          <CardTitle>Password berhasil diubah</CardTitle>
          <CardDescription>{success}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button nativeButton={false} render={<Link href="/login" />}>
            Masuk dengan password baru
          </Button>
        </CardContent>
      </Card>
    )
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama dengan password baru.")
      return
    }
    setError(null)
    setSending(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = (await res.json().catch(() => null)) as {
        message?: string
      } | null
      if (!res.ok) {
        setError(data?.message ?? "Gagal mengubah password. Silakan coba lagi.")
        return
      }
      setSuccess(
        "Password kamu sudah diganti. Semua sesi di perangkat lain keluar otomatis."
      )
    } catch {
      setError("Tidak dapat terhubung ke server.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound />
        </span>
        <CardTitle>Ganti Password</CardTitle>
        <CardDescription>
          Buat password baru untuk akun kamu. Tautan ini hanya berlaku sekali
          pakai.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="reset-password">Password baru</FieldLabel>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={sending}
            />
            <FieldDescription>Minimal 8 karakter.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="reset-password-confirm">
              Ketik password baru lagi
            </FieldLabel>
            <Input
              id="reset-password-confirm"
              type="password"
              autoComplete="new-password"
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={sending}
            />
          </Field>
          {error ? <FieldError>{error}</FieldError> : null}
          <Button type="submit" size="lg" disabled={sending}>
            {sending ? <Spinner /> : null}
            Simpan password baru
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
