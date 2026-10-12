"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ADMIN_ROLE_OPTIONS } from "@/components/admins/admin-roles"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { updateAdmin } from "@/lib/actions/admins"
import { USER_ROLE_META } from "@/lib/format"
import { UserRole, type AdminListItem } from "@/types"

interface ChangeAdminRoleDialogProps {
  admin: AdminListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeAdminRoleDialog({
  admin,
  open,
  onOpenChange,
}: ChangeAdminRoleDialogProps) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(admin.role)
  const [pending, startTransition] = useTransition()

  const changed = role !== admin.role

  function submit() {
    if (!changed) return
    startTransition(async () => {
      try {
        await updateAdmin(admin.id, { role })
        toast.success("Role admin berhasil diperbarui")
        onOpenChange(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Role</DialogTitle>
          <DialogDescription>
            Ubah tingkat akses untuk {admin.name}.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select
              value={role}
              onValueChange={(next) => {
                if (next) setRole(next as UserRole)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {USER_ROLE_META[option].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Batal
          </Button>
          <Button onClick={submit} disabled={!changed || pending}>
            {pending ? <Spinner /> : null}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
