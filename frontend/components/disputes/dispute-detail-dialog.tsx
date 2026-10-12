"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/shared/status-badge"
import {
  formatDateTime,
  formatRupiah,
  ORDER_STATUS_META,
  disputeStatusMeta,
  shortenId,
} from "@/lib/format"
import type { DisputeListItem } from "@/types"

interface DisputeDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dispute: DisputeListItem
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

export function DisputeDetailDialog({
  open,
  onOpenChange,
  dispute,
}: DisputeDetailDialogProps) {
  const order = dispute.order

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detail Dispute
            <StatusBadge meta={disputeStatusMeta(dispute.status)} />
          </DialogTitle>
          <DialogDescription>
            Diajukan {formatDateTime(dispute.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="rounded-xl border p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium">Pesanan</span>
              <Button
                render={<Link href={`/orders/${dispute.orderId}`} />}
                variant="outline"
                size="sm"
                className="h-7"
                nativeButton={false}
              >
                Buka Pesanan
                <ExternalLink className="size-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="No. Order">
                <span className="tabular-nums">
                  {order?.orderNumber ?? shortenId(dispute.orderId)}
                </span>
              </Field>
              <Field label="Status Pesanan">
                {order ? (
                  <StatusBadge meta={ORDER_STATUS_META[order.status]} />
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Harga Final">
                <span className="tabular-nums">
                  {order?.finalPrice ? formatRupiah(order.finalPrice) : "—"}
                </span>
              </Field>
            </div>
          </div>

          <Field label="Alasan (dari pelanggan/mitra)">
            <p className="whitespace-pre-wrap rounded-lg bg-muted/50 p-3 text-sm">
              {dispute.reason}
            </p>
          </Field>

          {dispute.status !== "open" ? (
            <div className="grid gap-3 rounded-xl border p-3">
              <Field label="Hasil / Penyelesaian">
                <p className="whitespace-pre-wrap">
                  {dispute.resolution ?? "—"}
                </p>
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Diputuskan oleh">
                  <span className="tabular-nums">
                    {shortenId(dispute.resolvedBy)}
                  </span>
                </Field>
                <Field label="Waktu penyelesaian">
                  <span className="tabular-nums">
                    {formatDateTime(dispute.resolvedAt)}
                  </span>
                </Field>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Diajukan oleh">
              <span className="tabular-nums">{shortenId(dispute.raisedBy)}</span>
            </Field>
            <Field label="ID Dispute">
              <span className="tabular-nums">{shortenId(dispute.id)}</span>
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
