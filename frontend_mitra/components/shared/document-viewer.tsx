"use client"

import { useState } from "react"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface DocumentViewerProps {
  label: string
  src: string
}

export function DocumentViewer({ label, src }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  function reset() {
    setLoading(true)
    setError(false)
  }

  return (
    <Dialog onOpenChange={(open) => (open ? reset() : undefined)}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Eye />
            {label}
          </Button>
        }
      />
      <DialogContent
        className="sm:max-w-2xl"
        showCloseButton
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="grid min-h-64 place-items-center">
          {loading && !error ? <Spinner /> : null}
          {error ? (
            <p className="text-sm text-muted-foreground">
              Dokumen tidak dapat dimuat.
            </p>
          ) : null}
          {/* Dokumen distream via endpoint ber-cookie; next/image tidak dipakai karena
              endpoint memerlukan cookie sesi & tanpa loader kustom. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={label}
            className={
              loading || error
                ? "hidden"
                : "max-h-[70vh] w-auto rounded-lg object-contain"
            }
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false)
              setError(true)
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}