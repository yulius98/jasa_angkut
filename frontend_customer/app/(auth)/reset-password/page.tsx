import type { Metadata } from "next"

import { ResetPasswordForm, type ResetTokenStatus } from "@/components/auth/reset-password-form"
import { BACKEND_URL } from "@/lib/config"

export const metadata: Metadata = {
  title: "Ganti Password",
  description: "Ganti password akun Jasa Antar lewat tautan dari email.",
}

// Status token dicek di SERVER (bukan browser) supaya tidak tergantung CORS:
// halaman langsung hit backend dengan BACKEND_URL saat di-rendah. Bila
// backend tidak dapat dihubungi, tokenStatus null -> form menampilkan
// pesan gangguan.
async function checkResetToken(token: string): Promise<ResetTokenStatus | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/auth/password/reset-token-status?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      valid?: boolean
      reason?: ResetTokenStatus["reason"]
    }
    return { valid: data.valid ?? false, reason: data.reason ?? null }
  } catch {
    return null
  }
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  const cleanToken = typeof token === "string" ? token.trim() : ""
  const tokenStatus = cleanToken
    ? await checkResetToken(cleanToken)
    : { valid: false, reason: "INVALID" as const }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <ResetPasswordForm token={cleanToken} tokenStatus={tokenStatus} />
    </div>
  )
}
