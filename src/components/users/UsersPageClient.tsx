"use client"

import { useCallback, useEffect, useState } from "react"
import UserForm from "@/components/users/UserForm"
import UsersTable from "@/components/users/UsersTable"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "@/lib/icons"
import type { UserAdminApi } from "@/types"
import { toast } from "sonner"

export type UsersPageClientProps = {
  currentUserId: string
}

export default function UsersPageClient({
  currentUserId,
}: UsersPageClientProps) {
  const [users, setUsers] = useState<UserAdminApi[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/users")
      const body = (await res.json()) as {
        data?: UserAdminApi[]
        error?: string
      }
      if (!res.ok) {
        const msg = body.error ?? "Failed to load users"
        setLoadError(msg)
        setUsers([])
        toast.error(msg)
        return
      }
      setUsers(body.data ?? [])
    } catch {
      const msg = "Failed to load users"
      setLoadError(msg)
      setUsers([])
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          User Management
        </h1>
        <Button
          type="button"
          className="w-full shrink-0 gap-2 sm:w-auto"
          onClick={() => setAddOpen(true)}
        >
          <PlusIcon className="size-4" aria-hidden />
          Add User
        </Button>
      </div>

      <UsersTable
        users={users}
        currentUserId={currentUserId}
        onRefresh={loadUsers}
        loading={loading}
        loadError={loadError}
        onRetryLoad={() => void loadUsers()}
      />

      {addOpen ? (
        <UserForm
          onSuccess={() => {
            setAddOpen(false)
            void loadUsers()
          }}
          onClose={() => setAddOpen(false)}
        />
      ) : null}
    </div>
  )
}
