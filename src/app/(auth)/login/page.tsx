"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LayoutGridIcon, LoadingIcon, ReportsIcon } from "@/lib/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setEmailError(null)
    setPasswordError(null)

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setEmailError("Email is required")
      return
    }
    if (!password) {
      setPasswordError("Password is required")
      return
    }

    setLoading(true)
    try {
      const result = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      })
      if (result?.error) {
        const msg = "Invalid email or password"
        setError(msg)
        toast.error(msg)
        return
      }
      if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      } else {
        const msg = "Invalid email or password"
        setError(msg)
        toast.error(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      className={cn(
        "w-full max-w-md gap-6 border border-border bg-card p-6 text-card-foreground shadow-card",
        "rounded-lg"
      )}
    >
      <CardHeader className="space-y-4 px-0 pt-0 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-xl bg-secondary ring-1 ring-border">
          <div className="relative flex items-center justify-center">
            <LayoutGridIcon className="text-foreground" size={28} aria-hidden />
            <ReportsIcon
              className="absolute -bottom-0.5 -right-0.5 text-primary"
              size={16}
              aria-hidden
            />
          </div>
        </div>
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold tracking-tight">
            CRM System
          </CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-0 pb-0">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (emailError) setEmailError(null)
              }}
              disabled={loading}
              className="h-11 bg-input"
              aria-invalid={emailError ? true : undefined}
            />
            {emailError ? (
              <p className="text-sm text-destructive" role="alert">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (passwordError) setPasswordError(null)
              }}
              disabled={loading}
              className="h-11 bg-input"
              aria-invalid={passwordError ? true : undefined}
            />
            {passwordError ? (
              <p className="text-sm text-destructive" role="alert">
                {passwordError}
              </p>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-500/40 bg-destructive/15 px-3 py-2.5 text-sm text-destructive"
            >
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <>
                <LoadingIcon className="size-4 animate-spin" aria-hidden />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-2 font-medium text-muted-foreground">Demo accounts</p>
          <ul className="space-y-1.5 font-mono text-[11px] sm:text-xs">
            <li>admin@crm.com · admin123</li>
            <li>manager@crm.com · manager123</li>
            <li>rep@crm.com · rep123</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
