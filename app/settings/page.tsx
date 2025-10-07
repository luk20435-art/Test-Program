"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SettingsIcon, User, Building2, Shield } from "lucide-react"

export default function SettingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
    if (!isLoading && user && user.role !== "manager") {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ตั้งค่า</h1>
            <p className="text-muted-foreground mt-2">จัดการการตั้งค่าระบบและข้อมูลผู้ใช้</p>
          </div>

          {/* User Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลผู้ใช้
              </CardTitle>
              <CardDescription>ข้อมูลส่วนตัวและบทบาทในระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>ชื่อ-นามสกุล</Label>
                  <Input value={user.name} disabled />
                </div>
                <div className="space-y-2">
                  <Label>อีเมล</Label>
                  <Input value={user.email} disabled />
                </div>
                <div className="space-y-2">
                  <Label>แผนก</Label>
                  <Input value={user.department} disabled />
                </div>
                <div className="space-y-2">
                  <Label>บทบาท</Label>
                  <Input
                    value={user.role === "user" ? "ผู้ใช้งานทั่วไป" : user.role === "analyst" ? "ผู้วิเคราะห์" : "ผู้จัดการ"}
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                ข้อมูลระบบ
              </CardTitle>
              <CardDescription>รายละเอียดเกี่ยวกับระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>เวอร์ชัน</Label>
                  <Input value="1.0.0" disabled />
                </div>
                <div className="space-y-2">
                  <Label>ประเภทระบบ</Label>
                  <Input value="ระบบบริหารจัดการต้นทุนและงบประมาณ" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Access Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                การควบคุมการเข้าถึง
              </CardTitle>
              <CardDescription>สิทธิ์การเข้าถึงตามบทบาท</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-2">ผู้ใช้งานทั่วไป</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>ดูภาพรวมงบประมาณ</li>
                    <li>บันทึกและจัดการค่าใช้จ่าย</li>
                    <li>ดูรายงานพื้นฐาน</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-2">ผู้วิเคราะห์</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>สิทธิ์ทั้งหมดของผู้ใช้งานทั่วไป</li>
                    <li>จัดสรรต้นทุนทางตรงและทางอ้อม</li>
                    <li>วิเคราะห์และจัดการต้นทุน</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <h4 className="font-medium mb-2">ผู้จัดการ</h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>สิทธิ์ทั้งหมดของผู้วิเคราะห์</li>
                    <li>ดู Dashboard ระดับผู้บริหาร</li>
                    <li>เข้าถึงการตั้งค่าระบบ</li>
                    <li>ส่งออกรายงานทุกประเภท</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                เกี่ยวกับระบบ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ระบบบริหารจัดการต้นทุนและงบประมาณองค์กร
                ออกแบบมาเพื่อช่วยให้องค์กรสามารถติดตามและจัดการค่าใช้จ่ายของแต่ละแผนกได้อย่างมีประสิทธิภาพ
                รวมถึงการจัดสรรต้นทุนทางตรงและทางอ้อม เพื่อให้ได้ภาพรวมต้นทุนที่แท้จริงของแต่ละแผนก
                และสามารถเปรียบเทียบกับงบประมาณที่กำหนดไว้ได้
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
