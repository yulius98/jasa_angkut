import { CheckCircle2, XCircle } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { RefreshConfigButton } from "@/components/config/refresh-config-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatDateTime } from "@/lib/format"
import { getBackendHealth, getPublicConfig } from "@/lib/server-config"

export const dynamic = "force-dynamic"

function maskSecret(value: string): string {
  if (!value) return ""
  if (value.length <= 10) return "••••••"
  return `${value.slice(0, 6)}••••${value.slice(-4)}`
}

function formatUptime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)
  const parts: string[] = []
  if (days) parts.push(`${days} hari`)
  if (hours) parts.push(`${hours} jam`)
  parts.push(`${minutes} menit`)
  return parts.join(" ")
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[11rem_1fr] items-baseline gap-2 border-b py-1.5 last:border-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">{children}</dd>
    </div>
  )
}

export default async function ConfigPage() {
  const [config, health] = await Promise.all([
    getPublicConfig(),
    getBackendHealth(),
  ])

  const mapsConfigured = Boolean(config.googleMapsApiKey)

  return (
    <>
      <PageHeader
        title="Konfigurasi"
        description="Konfigurasi publik yang dibagikan ke app pelanggan, mitra, dan admin."
      >
        <RefreshConfigButton />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Identitas & dukungan</CardTitle>
            <CardDescription>
              Dibaca dari <code className="font-mono">Backend/.env</code> dan
              disajikan lewat <code className="font-mono">GET /config/public</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid">
              <Row label="Nama aplikasi">{config.appName || "—"}</Row>
              <Row label="WhatsApp dukungan">
                {config.supportWhatsapp ? (
                  <a
                    href={`https://wa.me/${config.supportWhatsapp.replace(/\D/g, "")}`}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {config.supportWhatsapp}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Belum diatur</span>
                )}
              </Row>
              <Row label="Email dukungan">
                {config.supportEmail ? (
                  <a
                    href={`mailto:${config.supportEmail}`}
                    className="text-primary hover:underline"
                  >
                    {config.supportEmail}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Belum diatur</span>
                )}
              </Row>
              <Row label="Versi minimum app">
                {config.minAppVersion || (
                  <span className="text-muted-foreground">Belum diatur</span>
                )}
              </Row>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Google Maps</CardTitle>
            <CardDescription>
              Dipakai ketiga frontend untuk peta &amp; geocoding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid">
              <Row label="Status">
                {mapsConfigured ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    Terkonfigurasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-destructive">
                    <XCircle className="size-4" />
                    Belum dikonfigurasi
                  </span>
                )}
              </Row>
              <Row label="API key">
                {mapsConfigured ? (
                  <span className="font-mono text-xs">
                    {maskSecret(config.googleMapsApiKey)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Row>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Status backend</CardTitle>
            <CardDescription>
              Dari <code className="font-mono">GET /config/health</code>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {health ? (
              <dl className="grid gap-x-6 sm:grid-cols-2">
                <Row label="Status">
                  <span className="inline-flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                    {health.status}
                  </span>
                </Row>
                <Row label="Versi">{health.version}</Row>
                <Row label="Uptime">{formatUptime(health.uptimeSeconds)}</Row>
                <Row label="Waktu server">
                  {formatDateTime(health.timestamp)}
                </Row>
              </dl>
            ) : (
              <p className="inline-flex items-center gap-2 text-sm text-destructive">
                <XCircle className="size-4" />
                Backend tidak dapat dihubungi.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
