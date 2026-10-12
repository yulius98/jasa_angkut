"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { safeNextPath } from "@/lib/auth"

const PHONE_RE = /^(\+62|62|0)8[1-9]\d{7,11}$/

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loginHref = next
    ? `/login?next=${encodeURIComponent(next)}`
    : "/login"

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const normalizedPhone = phone.replace(/[\s-]/g, "")
    if (!PHONE_RE.test(normalizedPhone)) {
      setError("Nomor HP tidak valid. Contoh: 081234567890")
      return
    }
    if (password.length < 8) {
      setError("Password minimal 8 karakter")
      return
    }
    if (password !== confirm) {
      setError("Konfirmasi password tidak sama")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: normalizedPhone,
          password,
        }),
      })
      const data = (await res.json().catch(() => null)) as {
        message?: string
      } | null
      if (!res.ok) {
        setError(data?.message ?? "Pendaftaran gagal")
        return
      }
      router.replace(safeNextPath(next))
      router.refresh()
    } catch {
      setError("Tidak dapat terhubung ke server.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <Field>
        <FieldLabel htmlFor="name">Nama lengkap</FieldLabel>
        <Input
          id="name"
          autoComplete="name"
          placeholder="Nama kamu"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="phone">Nomor HP</FieldLabel>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={loading}
        />
        <FieldDescription>Contoh: 081234567890</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="confirm">Konfirmasi password</FieldLabel>
        <Input
          id="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={loading}
        />
      </Field>

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? <Spinner /> : null}
        Daftar
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href={loginHref} className="font-medium text-primary">
          Masuk
        </Link>
      </p>
    </form>
  )
}
