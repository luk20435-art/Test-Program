"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const success = await login(email, password) 

    if (success) {
      router.push("/dashboard")
    } else {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl">ระบบบริหารจัดการต้นทุน</CardTitle>
            <CardDescription>เข้าสู่ระบบเพื่อจัดการงบประมาณและค่าใช้จ่ายองค์กร</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">บัญชีทดสอบ:</p>
            <div className="space-y-2 rounded-lg bg-muted p-3">
              <div>
                <p className="font-medium">ผู้ใช้งานทั่วไป:</p>
                <p>user@company.com / user123</p>
              </div>
              <div>
                <p className="font-medium">ผู้วิเคราะห์:</p>
                <p>analyst@company.com / analyst123</p>
              </div>
              <div>
                <p className="font-medium">ผู้จัดการ:</p>
                <p>manager@company.com / manager123</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
