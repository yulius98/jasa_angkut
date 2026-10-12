"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { LifeBuoy } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { createSupportConversationAction } from "@/lib/actions/chat"

interface SupportButtonProps {
  variant?: React.ComponentProps<typeof Button>["variant"]
  className?: string
  children?: React.ReactNode
}

export function SupportButton({
  variant = "default",
  className,
  children,
}: SupportButtonProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      const result = await createSupportConversationAction()
      if (result.ok) {
        router.push(`/chat/${result.data.id}`)
        return
      }
      toast.error(result.message)
      router.push("/chat")
    })
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? <Spinner /> : <LifeBuoy className="size-4" />}
      {children ?? "Hubungi Dukungan"}
    </Button>
  )
}
