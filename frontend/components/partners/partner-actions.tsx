"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { ReasonDialog } from "@/components/shared/reason-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { PartnerStatus } from "@/types"

type Action = "approve" | "reject" | "suspend"

const SUMMARY: Record<Action, { title: string; done: string; needReason: boolean }> = {
  approve: { title: "Setujui mitra ini?", done: "Mitra disetujui", needReason: false },
  reject: { title: "Tolak mitra ini?", done: "Mitra ditolak", needReason: true },
  suspend: { title: "Suspend mitra ini?", done: "Mitra disuspend", needReason: true },
}

export function PartnerActions({
  id,
  status,
}: {
  id: string
  status: PartnerStatus
}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<Action | null>(null)
  const [pending, setPending] = useState<Action | null>(null)

  async function run(action: Action, reason?: string) {
    setPending(action)
    try {
      const res = await fetch(`/api/admin/partners/${id}/${action}`, {
        method: "PATCH",
        ...(reason
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            }
          : {}),
      })
      const data = (await res.json().catch(() => null)) as {
        message?: string
      } | null
      if (!res.ok) {
        toast.error(data?.message ?? `Aksi ${action} gagal.`)
        return false
      }
      toast.success(SUMMARY[action].done)
      router.refresh()
      return true
    } catch {
      toast.error("Tidak dapat terhubung ke server.")
      return false
    } finally {
      setPending(null)
    }
  }

  const confirm = SUMMARY[dialog ?? "approve"]

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" ? (
        <>
          <Button
            onClick={() => setDialog("approve")}
            disabled={pending !== null}
          >
            {pending === "approve" ? <Spinner /> : null}
            Setujui
          </Button>
          <Button
            variant="outline"
            onClick={() => setDialog("reject")}
            disabled={pending !== null}
          >
            Tolak
          </Button>
        </>
      ) : null}

      {status === "APPROVED" ? (
        <Button
          variant="destructive"
          onClick={() => setDialog("suspend")}
          disabled={pending !== null}
        >
          Suspend
        </Button>
      ) : null}

      <ConfirmDialog
        open={dialog === "approve"}
        onOpenChange={(open) => !open && setDialog(null)}
        title={confirm.title}
        description="Pastikan dokumen identitas dan kendaraan sudah diperiksa dan sesuai."
        confirmLabel="Setujui"
        loading={pending === "approve"}
        onConfirm={async () => {
          if (await run("approve")) setDialog(null)
        }}
      />

      {dialog === "reject" || dialog === "suspend" ? (
        <ReasonDialog
          open={dialog !== null}
          onOpenChange={(open) => !open && setDialog(null)}
          title={confirm.title}
          description="Alasan ini akan disimpan pada data mitra."
          confirmLabel={dialog === "reject" ? "Tolak & kirim" : "Suspend & kirim"}
          destructive
          loading={pending !== null}
          onConfirm={async (reason) => {
            const action = dialog
            if (!action) return
            if (await run(action, reason)) setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}