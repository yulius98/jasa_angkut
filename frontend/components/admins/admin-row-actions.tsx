"use client"

import {
  BanIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ChangeAdminRoleDialog } from "@/components/admins/change-admin-role-dialog"
import { EditAdminDialog } from "@/components/admins/edit-admin-dialog"
import { ResetAdminPasswordDialog } from "@/components/admins/reset-admin-password-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteAdmin, setAdminActive } from "@/lib/actions/admins"
import type { AdminListItem } from "@/types"

interface AdminRowActionsProps {
  admin: AdminListItem
  isSelf: boolean
}

export function AdminRowActions({ admin, isSelf }: AdminRowActionsProps) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const nextActive = !admin.isActive

  function toggleStatus() {
    startTransition(async () => {
      try {
        await setAdminActive(admin.id, nextActive)
        toast.success(nextActive ? "Admin diaktifkan" : "Admin dinonaktifkan")
        setStatusOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
      }
    })
  }

  function remove() {
    startTransition(async () => {
      try {
        await deleteAdmin(admin.id)
        toast.success("Admin berhasil dihapus")
        setDeleteOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Terjadi kesalahan")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Aksi untuk ${admin.name}`}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <PencilIcon />
            Edit Profil
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isSelf}
            onClick={() => setRoleOpen(true)}
          >
            <ShieldCheckIcon />
            Ubah Role
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setResetOpen(true)}>
            <KeyRoundIcon />
            Reset Password
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isSelf && admin.isActive}
            onClick={() => setStatusOpen(true)}
          >
            {admin.isActive ? <BanIcon /> : <CheckCircle2Icon />}
            {admin.isActive ? "Nonaktifkan" : "Aktifkan"}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={isSelf}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2Icon />
            Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditAdminDialog
        admin={admin}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {roleOpen ? (
        <ChangeAdminRoleDialog
          admin={admin}
          open
          onOpenChange={setRoleOpen}
        />
      ) : null}
      <ResetAdminPasswordDialog
        admin={admin}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      <ConfirmDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        title={nextActive ? "Aktifkan admin ini?" : "Nonaktifkan admin ini?"}
        description={
          nextActive
            ? `${admin.name} akan dapat login kembali.`
            : `${admin.name} tidak akan dapat login sampai diaktifkan kembali.`
        }
        confirmLabel={nextActive ? "Aktifkan" : "Nonaktifkan"}
        destructive={!nextActive}
        loading={pending}
        onConfirm={toggleStatus}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus akun admin ini?"
        description={`Akun ${admin.name} (${admin.email}) akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        destructive
        loading={pending}
        onConfirm={remove}
      />
    </>
  )
}
