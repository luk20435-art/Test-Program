"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Receipt, PieChart, FileText, Settings, LogOut, Building2 } from "lucide-react"

const navigation = {
  user: [
    { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
    { name: "บันทึกค่าใช้จ่าย", href: "/expenses", icon: Receipt },
    { name: "รายงาน", href: "/reports", icon: FileText },
  ],
  analyst: [
    { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
    { name: "บันทึกค่าใช้จ่าย", href: "/expenses", icon: Receipt },
    { name: "จัดสรรต้นทุน", href: "/cost-allocation", icon: PieChart },
    { name: "รายงาน", href: "/reports", icon: FileText },
  ],
  manager: [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "บันทึกค่าใช้จ่าย", href: "/expenses", icon: Receipt },
    { name: "จัดสรรต้นทุน", href: "/cost-allocation", icon: PieChart },
    { name: "รายงาน", href: "/reports", icon: FileText },
    { name: "ตั้งค่า", href: "/settings", icon: Settings },
  ],
}

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  if (!user) return null

  const userNavigation = navigation[user.role] || navigation.user

  return (
    <div className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">ระบบบริหารต้นทุน</h1>
          <p className="text-xs text-muted-foreground">{user.department}</p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-border px-6 py-4">
        <p className="text-sm font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
        <div className="mt-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {user.role === "user" && "ผู้ใช้งานทั่วไป"}
            {user.role === "analyst" && "ผู้วิเคราะห์"}
            {user.role === "manager" && "ผู้จัดการ"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {userNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
          <LogOut className="h-5 w-5" />
          ออกจากระบบ
        </Button>
      </div>
    </div>
  )
}
