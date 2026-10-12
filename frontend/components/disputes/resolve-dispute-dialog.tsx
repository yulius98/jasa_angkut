"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { resolveDispute, type ResolveOutcome } from "@/lib/actions/disputes"
import { cn } from "cn"

const MAX_LENGTH = 1000
const MIN_LENGTH = 5

const OUTCOMES: {
  value: ResolveOutcome
  label: string
  description: string
  icon: typeof CheckCircle2
}[] = [
  {
    value: "resolved",
    label: "Selesai (resolved)",
    description: "Sengketa dinyatakan selesai / diterima.",
    icon: CheckCircle2,
  },
  {
    value: "rejected",
    label: "Ditolak (rejected)",
    description: "Sengketa ditolak / tidak berdasar.",
    icon: XCircle,
  },
]

interface ResolveDisputeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  disputeId: string
  orderNumber?: string | null
}

export function ResolveDisputeDialog({
  open,
  onOpenChange,
  disputeId,
  orderNumber,
}: ResolveDisputeDialogProps) {
  const router = useRouter()
  const [outcome, setOutcome] = useState<ResolveOutcome>("resolved")
  const [resolution, setResolution] = useState("")
  const [pending, startTransition] = useTransition()

  const trimmed = resolution.trim()
  const valid = trimmed.length >= MIN_LENGTH && trimmed.length <= MAX_LENGTH

  function handleOpenChange(next: boolean) {
    if (!next) {
      setOutcome("resolved")
      setResolution("")
    }
    onOpenChange(next)
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        await resolveDispute(disputeId, { outcome, resolution: trimmed })
        toast.success("Dispute berhasil diselesaikan")
        handleOpenChange(false)
        router.refresh()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Gagal menyelesaikan dispute"
        toast.error(message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Selesaikan Dispute</DialogTitle>
          <DialogDescription>
            {orderNumber
              ? `Sengketa untuk pesanan ${orderNumber}.`
              : "Tentukan hasil dan catatan penyelesaian sengketa."}{" "}
            Menyelesaikan dispute tidak otomatis mengubah status pesanan — keputusan
            lanjutan (refund/COMPLETED) dilakukan manual.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2" role="radiogroup" aria-label="Hasil dispute">
          {OUTCOMES.map((option) => {
            const isActive = outcome === option.value
            const Icon = option.icon
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isActive}
                onClick={() => setOutcome(option.value)}
                disabled={pending}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors outline-none",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}
              >
                <Icon
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    option.value === "resolved"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  )}
                />
                <span className="grid gap-0.5">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="dispute-resolution">Catatan penyelesaian</Label>
          <Textarea
            id="dispute-resolution"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Tuliskan hasil/kesimpulan penyelesaian (minimal 5 karakter)"
            disabled={pending}
            aria-invalid={trimmed.length > 0 && !valid}
          />
          <p className="text-xs text-muted-foreground">
            {trimmed.length}/{MAX_LENGTH} karakter &middot; minimal {MIN_LENGTH}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button
            variant={outcome === "rejected" ? "destructive" : "default"}
            onClick={handleSubmit}
            disabled={!valid || pending}
          >
            {pending ? <Spinner /> : null}
            Simpan Keputusan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
