"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { updatePasswordResetSettings } from "@/lib/actions/auth-settings"

interface PasswordResetSettingsProps {
  value: number
  /** false bila SMTP belum diatur di Backend/.env (email tidak terkirim). */
  mailConfigured: boolean
}

const MIN_HOURS = 1
const MAX_HOURS = 720

/**
 * Kartu pengaturan "Lupa password" di menu Konfigurasi app admin: mengatur
 * masa berlaku link reset password (jam). Nilai tersimpan di
 * SystemSetting.PASSWORD_RESET_TOKEN_HOURS di backend dan dibaca setiap kali
 * user meminta link baru.
 */
export function PasswordResetSettings({
  value,
  mailConfigured,
}: PasswordResetSettingsProps) {
  const [hours, setHours] = useState(String(value))
  const [pending, startTransition] = useTransition()

  const parsed = Number(hours)
  const dirty = Number.isFinite(parsed) && Math.round(parsed) !== value
  const invalid =
    !Number.isFinite(parsed) ||
    parsed < MIN_HOURS ||
    parsed > MAX_HOURS ||
    !/^\d+$/.test(hours.trim())

  function handleSave() {
    if (invalid) return
    startTransition(async () => {
      try {
        const saved = await updatePasswordResetSettings(parsed)
        setHours(String(saved.ttlHours))
        toast.success(
          `Link reset password sekarang berlaku ${saved.ttlHours} jam.`
        )
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Gagal menyimpan pengaturan"
        )
      }
    })
  }

  return (
    <div className="grid gap-3">
      <div className="grid max-w-xs items-center gap-2">
        <label htmlFor="password-reset-ttl" className="text-sm font-medium">
          Masa berlaku link (jam)
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="password-reset-ttl"
            type="number"
            inputMode="numeric"
            min={MIN_HOURS}
            max={MAX_HOURS}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            disabled={pending}
            aria-invalid={invalid}
            className="w-28"
          />
          <span className="text-sm text-muted-foreground">jam</span>
        </div>
        {invalid ? (
          <p className="text-xs text-destructive">
            Isi bilangan bulat {MIN_HOURS}–{MAX_HOURS} jam (720 = 30 hari).
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Default 24 jam (1 hari). Berlaku untuk link berikutnya yang diminta.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {mailConfigured
          ? "EMAIL aktif: tautan dikirim dari SMTP yang dikonfigurasikan di Backend/.env."
          : "EMAIL belum aktif: SMTP belum diatur (SMTP_HOST kosong), tautan reset hanya dicatat di log backend. Isi SMTP_* di Backend/.env untuk mengirimkan email."}
      </p>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={pending || !dirty || invalid}>
          {pending ? (
            <>
              <Spinner />
              Menyimpan...
            </>
          ) : (
            "Simpan"
          )}
        </Button>
      </div>
    </div>
  )
}
