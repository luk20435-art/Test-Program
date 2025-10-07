"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { departments, expenseCategories } from "@/lib/mock-data"
import { useExpenseStore } from "@/lib/expense-store"
import { Plus, TrendingUp, PieChartIcon, Edit, Trash2 } from "lucide-react"
import { IndirectCostDialog } from "@/components/indirect-cost-dialog"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CostAllocationPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { expenses, indirectCosts, deleteIndirectCost } = useExpenseStore()
  const { toast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
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

  // Calculate direct costs by department
  const directCostsByDept = departments.map((dept) => {
    const deptExpenses = expenses.filter((e) => {
      const category = expenseCategories.find((c) => c.id === e.categoryId)
      return e.departmentId === dept.id && e.status === "approved" && category?.type === "direct"
    })
    const total = deptExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      ...dept,
      directCost: total,
    }
  })

  // Calculate total direct costs
  const totalDirectCosts = directCostsByDept.reduce((sum, d) => sum + d.directCost, 0)

  // Calculate indirect cost allocation
  const indirectCostAllocation = departments.map((dept) => {
    const deptData = directCostsByDept.find((d) => d.id === dept.id)!

    // Calculate allocated indirect costs
    let allocatedCosts = 0

    indirectCosts.forEach((cost) => {
      if (cost.allocationType === "equal") {
        // Equal allocation: divide by number of departments
        allocatedCosts += cost.amount / departments.length
      } else if (cost.allocationType === "proportional") {
        // Proportional allocation: based on direct cost ratio
        const ratio = totalDirectCosts > 0 ? deptData.directCost / totalDirectCosts : 1 / departments.length
        allocatedCosts += cost.amount * ratio
      }
    })

    return {
      ...deptData,
      allocatedIndirectCost: allocatedCosts,
      totalCost: deptData.directCost + allocatedCosts,
    }
  })

  // Calculate total indirect costs
  const totalIndirectCosts = indirectCosts.reduce((sum, c) => sum + c.amount, 0)

  const handleDelete = (id: string) => {
    deleteIndirectCost(id)
    setDeleteId(null)
    toast({
      title: "ลบสำเร็จ",
      description: "ลบรายการต้นทุนทางอ้อมเรียบร้อยแล้ว",
    })
  }

  const handleEdit = (id: string) => {
    setEditingCost(id)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingCost(null)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">จัดสรรต้นทุน</h1>
              <p className="text-muted-foreground mt-2">จัดการและจัดสรรต้นทุนทางตรงและทางอ้อมให้แต่ละแผนก</p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มต้นทุนทางอ้อม
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ต้นทุนทางตรงรวม</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDirectCosts.toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-1">จากค่าใช้จ่ายที่อนุมัติแล้ว</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ต้นทุนทางอ้อมรวม</CardTitle>
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalIndirectCosts.toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-1">รอการจัดสรร</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ต้นทุนรวมทั้งหมด</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(totalDirectCosts + totalIndirectCosts).toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-1">ต้นทุนทางตรง + ทางอ้อม</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="allocation" className="space-y-4">
            <TabsList>
              <TabsTrigger value="allocation">การจัดสรรต้นทุน</TabsTrigger>
              <TabsTrigger value="indirect">ต้นทุนทางอ้อม</TabsTrigger>
            </TabsList>

            {/* Cost Allocation Tab */}
            <TabsContent value="allocation" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>การจัดสรรต้นทุนแต่ละแผนก</CardTitle>
                  <CardDescription>แสดงต้นทุนทางตรง, ทางอ้อมที่จัดสรร และต้นทุนรวมของแต่ละแผนก</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {indirectCostAllocation.map((dept) => (
                      <div key={dept.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">{dept.name}</h3>
                          <div className="text-right">
                            <p className="text-xl font-bold">{dept.totalCost.toLocaleString()} ฿</p>
                            <p className="text-xs text-muted-foreground">ต้นทุนรวม</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-sm text-muted-foreground">ต้นทุนทางตรง</p>
                            <p className="text-lg font-semibold mt-1">{dept.directCost.toLocaleString()} ฿</p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-sm text-muted-foreground">ต้นทุนทางอ้อมที่จัดสรร</p>
                            <p className="text-lg font-semibold mt-1">
                              {dept.allocatedIndirectCost.toLocaleString()} ฿
                            </p>
                          </div>
                          <div className="rounded-lg border border-border p-4">
                            <p className="text-sm text-muted-foreground">งบประมาณ</p>
                            <p className="text-lg font-semibold mt-1">{dept.budget.toLocaleString()} ฿</p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">การใช้งบประมาณ</span>
                            <span className="font-medium">{((dept.totalCost / dept.budget) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full transition-all"
                              style={{
                                width: `${Math.min((dept.totalCost / dept.budget) * 100, 100)}%`,
                                backgroundColor:
                                  (dept.totalCost / dept.budget) * 100 > 90
                                    ? "hsl(var(--destructive))"
                                    : "hsl(var(--primary))",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Indirect Costs Tab */}
            <TabsContent value="indirect" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>รายการต้นทุนทางอ้อม</CardTitle>
                  <CardDescription>จัดการต้นทุนทางอ้อมและวิธีการจัดสรร</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {indirectCosts.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">ยังไม่มีรายการต้นทุนทางอ้อม</p>
                      </div>
                    ) : (
                      indirectCosts.map((cost) => {
                        const category = expenseCategories.find((c) => c.id === cost.categoryId)

                        return (
                          <div
                            key={cost.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-3">
                                <h3 className="font-medium">{cost.description}</h3>
                                <Badge variant="outline">
                                  {cost.allocationType === "equal" ? "จัดสรรเท่ากัน" : "จัดสรรตามสัดส่วน"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{category?.name}</span>
                                <span>•</span>
                                <span>{new Date(cost.date).toLocaleDateString("th-TH")}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-lg font-semibold">{cost.amount.toLocaleString()} ฿</p>
                                <p className="text-xs text-muted-foreground">
                                  {cost.allocationType === "equal"
                                    ? `${(cost.amount / departments.length).toLocaleString()} ฿/แผนก`
                                    : "ตามสัดส่วนต้นทุนทางตรง"}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(cost.id)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(cost.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Method Explanation */}
              <Card>
                <CardHeader>
                  <CardTitle>วิธีการจัดสรรต้นทุน</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">1. จัดสรรเท่ากัน (Equal Allocation)</h4>
                    <p className="text-sm text-muted-foreground">
                      แบ่งต้นทุนเท่าๆ กันให้ทุกแผนก เหมาะสำหรับค่าใช้จ่ายที่ทุกแผนกใช้เท่ากัน เช่น ค่าน้ำ-ไฟ ค่าบำรุงรักษาอาคาร
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">2. จัดสรรตามสัดส่วน (Proportional Allocation)</h4>
                    <p className="text-sm text-muted-foreground">
                      แบ่งต้นทุนตามสัดส่วนของต้นทุนทางตรงของแต่ละแผนก เหมาะสำหรับค่าใช้จ่ายที่เกี่ยวข้องกับขนาดการดำเนินงาน เช่น
                      เงินเดือนพนักงานทั่วไป
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <IndirectCostDialog open={isDialogOpen} onOpenChange={handleCloseDialog} editingId={editingCost} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบรายการต้นทุนทางอ้อมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>ลบรายการ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
