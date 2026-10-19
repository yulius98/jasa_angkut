"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { safeNextPath } from "@/lib/auth"

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = (await res.json().catch(() => null)) as {
        message?: string
      } | null
      if (!res.ok) {
        setError(data?.message ?? "Email atau password salah")
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
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="pr-10"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0"
            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>
      </Field>

      {error ? <FieldError>{error}</FieldError> : null}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? <Spinner /> : null}
        Masuk
      </Button>

      <div className="flex justify-center">
        <ForgotPasswordDialog />
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Aplikasi ini khusus akun mitra. Akun mitra dibuat oleh admin, atau
          kamu bisa mengajukan diri lewat aplikasi pelanggan.
        </span>
      </div>
    </form>
  )
}
