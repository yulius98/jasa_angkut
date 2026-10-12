"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DisputeDetailDialog } from "@/components/disputes/dispute-detail-dialog"
import { ResolveDisputeDialog } from "@/components/disputes/resolve-dispute-dialog"
import { DisputeStatus, type DisputeListItem } from "@/types"

export function DisputeActions({ dispute }: { dispute: DisputeListItem }) {
  const [detailOpen, setDetailOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="h-7"
        onClick={() => setDetailOpen(true)}
      >
        Detail
      </Button>

      {dispute.status === DisputeStatus.OPEN ? (
        <Button
          size="sm"
          className="h-7"
          onClick={() => setResolveOpen(true)}
        >
          Resolve
        </Button>
      ) : null}

      <DisputeDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        dispute={dispute}
      />
      <ResolveDisputeDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        disputeId={dispute.id}
        orderNumber={dispute.order?.orderNumber}
      />
    </div>
  )
}
