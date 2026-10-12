"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "cn"
import { rateOrderAction } from "@/lib/actions/ratings"
import { formatDateTime } from "@/lib/format"
import type { Rating } from "@/types"

interface RatingPanelProps {
  orderId: string
  partnerName: string | null
  rating: Rating | null
}

export function RatingPanel({ orderId, partnerName, rating }: RatingPanelProps) {
  const router = useRouter()
  const [score, setScore] = useState(5)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setError(null)
    const result = await rateOrderAction(orderId, score, comment.trim() || undefined)
    if (!result.ok) {
      setError(result.message)
      setSubmitting(false)
      toast.error(result.message)
      return
    }
    toast.success("Terima kasih atas penilaiannya")
    router.refresh()
  }

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Rating & ulasan</h2>
      </div>

      {rating ? (
        <div className="grid gap-2 border-t pt-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "size-5",
                  star <= rating.score
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted"
                )}
              />
            ))}
            <span className="ml-1 text-sm font-semibold">{rating.score}.0</span>
          </div>
          {rating.comment ? (
            <p className="text-sm text-muted-foreground">
              &ldquo;{rating.comment}&rdquo;
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {formatDateTime(rating.createdAt)}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 border-t pt-3">
          <div>
            <p className="mb-2 text-sm">
              Nilai pelayanan{" "}
              {partnerName ? (
                <span className="font-medium">{partnerName}</span>
              ) : (
                "mitra"
              )}
            </p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHovered(0)}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = hovered ? star <= hovered : star <= score
                return (
                  <button
                    key={star}
                    type="button"
                    aria-label={`${star} bintang`}
                    className="transition-transform active:scale-90"
                    onMouseEnter={() => setHovered(star)}
                    onClick={() => setScore(star)}
                  >
                    <Star
                      className={cn(
                        "size-7 transition-colors",
                        filled
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted"
                      )}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <Field>
            <FieldLabel htmlFor="ratingComment">
              Komentar (opsional)
            </FieldLabel>
            <Textarea
              id="ratingComment"
              placeholder="Ceritakan pengalamanmu…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              disabled={submitting}
            />
          </Field>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            size="lg"
            className="h-11 w-full"
            onClick={submit}
            disabled={submitting}
          >
            {submitting ? <Spinner /> : <Star className="size-4" />}
            Kirim Penilaian
          </Button>
        </div>
      )}
    </Card>
  )
}