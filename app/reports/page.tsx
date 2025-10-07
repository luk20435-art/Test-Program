"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { departments, expenseCategories, budgetSummary } from "@/lib/mock-data"
import { useExpenseStore } from "@/lib/expense-store"
import { Download, Filter, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
} from "recharts"

export default function ReportsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { expenses, indirectCosts } = useExpenseStore()
  const { toast } = useToast()

  // Filters
  const [filterDepartment, setFilterDepartment] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

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

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesDepartment = filterDepartment === "all" || expense.departmentId === filterDepartment
    const matchesCategory = filterCategory === "all" || expense.categoryId === filterCategory
    const matchesStartDate = !startDate || expense.date >= startDate
    const matchesEndDate = !endDate || expense.date <= endDate

    return matchesDepartment && matchesCategory && matchesStartDate && matchesEndDate && expense.status === "approved"
  })

  // Calculate statistics
  const totalDirectCosts = filteredExpenses
    .filter((e) => {
      const category = expenseCategories.find((c) => c.id === e.categoryId)
      return category?.type === "direct"
    })
    .reduce((sum, e) => sum + e.amount, 0)

  const totalIndirectCosts = indirectCosts.reduce((sum, c) => sum + c.amount, 0)

  // Department summary
  const departmentSummary = departments.map((dept) => {
    const deptExpenses = filteredExpenses.filter((e) => e.departmentId === dept.id)
    const total = deptExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      ...dept,
      spent: total,
      percentage: (total / dept.budget) * 100,
    }
  })

  // Category summary
  const categorySummary = expenseCategories.map((cat) => {
    const catExpenses = filteredExpenses.filter((e) => e.categoryId === cat.id)
    const total = catExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      ...cat,
      spent: total,
    }
  })

  // Budget vs Actual data
  const budgetVsActualData = departments.map((dept) => {
    const deptExpenses = filteredExpenses.filter((e) => e.departmentId === dept.id)
    const spent = deptExpenses.reduce((sum, e) => sum + e.amount, 0)
    return {
      name: dept.name,
      งบประมาณ: dept.budget,
      ใช้จ่ายจริง: spent,
      ส่วนต่าง: dept.budget - spent,
    }
  })

  // Approval status statistics
  const approvalStats = {
    approved: expenses.filter((e) => e.status === "approved").length,
    pending: expenses.filter((e) => e.status === "pending").length,
    rejected: expenses.filter((e) => e.status === "rejected").length,
    total: expenses.length,
  }

  const approvalAmounts = {
    approved: expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + e.amount, 0),
    pending: expenses.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.amount, 0),
    rejected: expenses.filter((e) => e.status === "rejected").reduce((sum, e) => sum + e.amount, 0),
  }

  // Monthly trend data
  const monthlyTrend = expenses.reduce(
    (acc, expense) => {
      const month = expense.date.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { month, direct: 0, indirect: 0, total: 0 }
      }
      const category = expenseCategories.find((c) => c.id === expense.categoryId)
      const amount = expense.status === "approved" ? expense.amount : 0
      if (category?.type === "direct") {
        acc[month].direct += amount
      } else {
        acc[month].indirect += amount
      }
      acc[month].total += amount
      return acc
    },
    {} as Record<string, { month: string; direct: number; indirect: number; total: number }>,
  )

  const monthlyTrendData = Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month))

  // Direct vs Indirect costs
  const directVsIndirectData = [
    { name: "ต้นทุนทางตรง", value: totalDirectCosts, fill: "#3b82f6" },
    { name: "ต้นทุนทางอ้อม", value: totalIndirectCosts, fill: "#8b5cf6" },
  ]

  // Export to CSV
  const exportToCSV = (
    type:
      | "expenses"
      | "departments"
      | "categories"
      | "budget-vs-actual"
      | "approval-status"
      | "monthly-trend"
      | "executive",
  ) => {
    let csvContent = ""
    let filename = ""

    if (type === "expenses") {
      csvContent = "รหัส,แผนก,ประเภท,รายละเอียด,จำนวนเงิน,วันที่,สถานะ,ผู้บันทึก\n"
      filteredExpenses.forEach((expense) => {
        const dept = departments.find((d) => d.id === expense.departmentId)
        const cat = expenseCategories.find((c) => c.id === expense.categoryId)
        csvContent += `${expense.id},${dept?.name},${cat?.name},${expense.description},${expense.amount},${expense.date},${expense.status},${expense.createdBy}\n`
      })
      filename = "รายงานค่าใช้จ่าย.csv"
    } else if (type === "departments") {
      csvContent = "แผนก,งบประมาณ,ใช้จ่ายแล้ว,คงเหลือ,เปอร์เซ็นต์\n"
      departmentSummary.forEach((dept) => {
        csvContent += `${dept.name},${dept.budget},${dept.spent},${dept.budget - dept.spent},${dept.percentage.toFixed(2)}%\n`
      })
      filename = "รายงานแผนก.csv"
    } else if (type === "categories") {
      csvContent = "ประเภท,ประเภทต้นทุน,ใช้จ่ายแล้ว\n"
      categorySummary.forEach((cat) => {
        csvContent += `${cat.name},${cat.type === "direct" ? "ทางตรง" : "ทางอ้อม"},${cat.spent}\n`
      })
      filename = "รายงานประเภทค่าใช้จ่าย.csv"
    } else if (type === "budget-vs-actual") {
      csvContent = "แผนก,งบประมาณ,ใช้จ่ายจริง,ส่วนต่าง,เปอร์เซ็นต์การใช้\n"
      budgetVsActualData.forEach((data) => {
        const percentage = ((data.ใช้จ่ายจริง / data.งบประมาณ) * 100).toFixed(2)
        csvContent += `${data.name},${data.งบประมาณ},${data.ใช้จ่ายจริง},${data.ส่วนต่าง},${percentage}%\n`
      })
      filename = "รายงานเปรียบเทียบงบประมาณ.csv"
    } else if (type === "approval-status") {
      csvContent = "สถานะ,จำนวนรายการ,จำนวนเงิน\n"
      csvContent += `อนุมัติแล้ว,${approvalStats.approved},${approvalAmounts.approved}\n`
      csvContent += `รออนุมัติ,${approvalStats.pending},${approvalAmounts.pending}\n`
      csvContent += `ไม่อนุมัติ,${approvalStats.rejected},${approvalAmounts.rejected}\n`
      csvContent += `รวม,${approvalStats.total},${approvalAmounts.approved + approvalAmounts.pending + approvalAmounts.rejected}\n`
      filename = "รายงานสถานะการอนุมัติ.csv"
    } else if (type === "monthly-trend") {
      csvContent = "เดือน,ต้นทุนทางตรง,ต้นทุนทางอ้อม,รวม\n"
      monthlyTrendData.forEach((data) => {
        csvContent += `${data.month},${data.direct},${data.indirect},${data.total}\n`
      })
      filename = "รายงานแนวโน้มรายเดือน.csv"
    } else if (type === "executive") {
      csvContent = "รายการ,จำนวนเงิน\n"
      csvContent += `งบประมาณรวม,${budgetSummary.totalBudget}\n`
      csvContent += `ใช้จ่ายแล้ว,${budgetSummary.totalSpent}\n`
      csvContent += `คงเหลือ,${budgetSummary.remaining}\n`
      csvContent += `ต้นทุนทางตรง,${totalDirectCosts}\n`
      csvContent += `ต้นทุนทางอ้อม,${totalIndirectCosts}\n`
      csvContent += `รายการอนุมัติแล้ว,${approvalStats.approved}\n`
      csvContent += `รายการรออนุมัติ,${approvalStats.pending}\n`
      filename = "รายงานสรุปผู้บริหาร.csv"
    }

    // Add BOM for UTF-8
    const BOM = "\uFEFF"
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "ส่งออกสำเร็จ",
      description: `ดาวน์โหลดไฟล์ ${filename} เรียบร้อยแล้ว`,
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">รายงาน</h1>
              <p className="text-muted-foreground mt-2">สรุปและส่งออกรายงานต้นทุนและงบประมาณ</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                กรองข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>แผนก</Label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกแผนก</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ประเภท</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ทุกประเภท</SelectItem>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>วันที่เริ่มต้น</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>วันที่สิ้นสุด</Label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">งบประมาณรวม</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{budgetSummary.totalBudget.toLocaleString()} ฿</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ต้นทุนทางตรง</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDirectCosts.toLocaleString()} ฿</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">ต้นทุนทางอ้อม</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalIndirectCosts.toLocaleString()} ฿</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">รวมทั้งหมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(totalDirectCosts + totalIndirectCosts).toLocaleString()} ฿</div>
              </CardContent>
            </Card>
          </div>

          {/* Reports Tabs */}
          <Tabs defaultValue="executive" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="executive">สรุปผู้บริหาร</TabsTrigger>
              <TabsTrigger value="budget-vs-actual">งบประมาณ vs จริง</TabsTrigger>
              <TabsTrigger value="direct-indirect">ต้นทุนทางตรง/อ้อม</TabsTrigger>
              <TabsTrigger value="approval">สถานะอนุมัติ</TabsTrigger>
              <TabsTrigger value="monthly-trend">แนวโน้มรายเดือน</TabsTrigger>
              <TabsTrigger value="departments">รายงานแผนก</TabsTrigger>
              <TabsTrigger value="categories">รายงานประเภท</TabsTrigger>
              <TabsTrigger value="expenses">รายการค่าใช้จ่าย</TabsTrigger>
            </TabsList>

            <TabsContent value="executive" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานสรุปผู้บริหาร</CardTitle>
                      <CardDescription>ภาพรวมสถานะองค์กรและการใช้งบประมาณ</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("executive")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-blue-500/10 border-blue-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-500">งบประมาณรวม</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{budgetSummary.totalBudget.toLocaleString()} ฿</div>
                        <p className="text-xs text-muted-foreground mt-1">งบประมาณทั้งหมดขององค์กร</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-500/10 border-green-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-green-500">ใช้จ่ายแล้ว</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(totalDirectCosts + totalIndirectCosts).toLocaleString()} ฿
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(((totalDirectCosts + totalIndirectCosts) / budgetSummary.totalBudget) * 100).toFixed(1)}%
                          ของงบประมาณ
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-purple-500/10 border-purple-500/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-purple-500">คงเหลือ</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {(budgetSummary.totalBudget - totalDirectCosts - totalIndirectCosts).toLocaleString()} ฿
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">งบประมาณที่ยังใช้ได้</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Status Overview */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">อนุมัติแล้ว</p>
                        <p className="text-2xl font-bold">{approvalStats.approved}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                      <Clock className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">รออนุมัติ</p>
                        <p className="text-2xl font-bold">{approvalStats.pending}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                      <XCircle className="h-8 w-8 text-red-500" />
                      <div>
                        <p className="text-sm text-muted-foreground">ไม่อนุมัติ</p>
                        <p className="text-2xl font-bold">{approvalStats.rejected}</p>
                      </div>
                    </div>
                  </div>

                  {/* Top Spending Departments */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">แผนกที่ใช้งบประมาณสูงสุด</h3>
                    <div className="space-y-3">
                      {departmentSummary
                        .sort((a, b) => b.spent - a.spent)
                        .slice(0, 5)
                        .map((dept) => (
                          <div
                            key={dept.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{dept.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${dept.percentage > 90 ? "bg-red-500" : dept.percentage > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                                    style={{ width: `${Math.min(dept.percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-12 text-right">
                                  {dept.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-bold">{dept.spent.toLocaleString()} ฿</p>
                              <p className="text-xs text-muted-foreground">จาก {dept.budget.toLocaleString()} ฿</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget-vs-actual" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานเปรียบเทียบงบประมาณกับค่าใช้จ่ายจริง</CardTitle>
                      <CardDescription>เปรียบเทียบงบประมาณที่ตั้งไว้กับค่าใช้จ่ายจริงของแต่ละแผนก</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("budget-vs-actual")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetVsActualData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="งบประมาณ" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="ใช้จ่ายจริง" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4 pb-2 border-b border-border font-medium text-sm">
                      <div>แผนก</div>
                      <div className="text-right">งบประมาณ</div>
                      <div className="text-right">ใช้จ่ายจริง</div>
                      <div className="text-right">ส่วนต่าง</div>
                      <div className="text-right">% การใช้</div>
                    </div>
                    {budgetVsActualData.map((data, index) => {
                      const percentage = (data.ใช้จ่ายจริง / data.งบประมาณ) * 100
                      return (
                        <div key={index} className="grid grid-cols-5 gap-4 py-2 text-sm">
                          <div className="font-medium">{data.name}</div>
                          <div className="text-right">{data.งบประมาณ.toLocaleString()} ฿</div>
                          <div className="text-right">{data.ใช้จ่ายจริง.toLocaleString()} ฿</div>
                          <div
                            className={`text-right ${data.ส่วนต่าง < 0 ? "text-red-500 font-semibold" : "text-green-500"}`}
                          >
                            {data.ส่วนต่าง.toLocaleString()} ฿
                          </div>
                          <div className="text-right">
                            <span
                              className={
                                percentage > 90
                                  ? "text-red-500 font-semibold"
                                  : percentage > 70
                                    ? "text-yellow-500"
                                    : "text-green-500"
                              }
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="direct-indirect" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานต้นทุนทางตรงและทางอ้อม</CardTitle>
                      <CardDescription>แยกแสดงต้นทุนทางตรงและทางอ้อมขององค์กร</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Pie Chart */}
                    <div className="h-[300px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={directVsIndirectData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {directVsIndirectData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border bg-blue-500/10 border-blue-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-blue-500">ต้นทุนทางตรง</h3>
                          <span className="text-2xl font-bold">{totalDirectCosts.toLocaleString()} ฿</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {((totalDirectCosts / (totalDirectCosts + totalIndirectCosts)) * 100).toFixed(1)}% ของต้นทุนรวม
                        </p>
                        <div className="mt-3 space-y-2">
                          {categorySummary
                            .filter((cat) => cat.type === "direct")
                            .map((cat) => (
                              <div key={cat.id} className="flex justify-between text-sm">
                                <span>{cat.name}</span>
                                <span className="font-medium">{cat.spent.toLocaleString()} ฿</span>
                              </div>
                            ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg border bg-purple-500/10 border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-purple-500">ต้นทุนทางอ้อม</h3>
                          <span className="text-2xl font-bold">{totalIndirectCosts.toLocaleString()} ฿</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {((totalIndirectCosts / (totalDirectCosts + totalIndirectCosts)) * 100).toFixed(1)}%
                          ของต้นทุนรวม
                        </p>
                        <div className="mt-3 space-y-2">
                          {indirectCosts.map((cost) => {
                            const cat = expenseCategories.find((c) => c.id === cost.categoryId)
                            return (
                              <div key={cost.id} className="flex justify-between text-sm">
                                <span>{cat?.name}</span>
                                <span className="font-medium">{cost.amount.toLocaleString()} ฿</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Department Breakdown */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">การกระจายต้นทุนแต่ละแผนก</h3>
                    <div className="space-y-3">
                      {departments.map((dept) => {
                        const deptDirectCosts = filteredExpenses
                          .filter((e) => {
                            const cat = expenseCategories.find((c) => c.id === e.categoryId)
                            return e.departmentId === dept.id && cat?.type === "direct"
                          })
                          .reduce((sum, e) => sum + e.amount, 0)

                        const deptIndirectCosts = totalIndirectCosts / departments.length // Simple equal allocation for display

                        return (
                          <div key={dept.id} className="p-3 rounded-lg border bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{dept.name}</span>
                              <span className="font-bold">
                                {(deptDirectCosts + deptIndirectCosts).toLocaleString()} ฿
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ทางตรง:</span>
                                <span className="text-blue-500 font-medium">{deptDirectCosts.toLocaleString()} ฿</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">ทางอ้อม:</span>
                                <span className="text-purple-500 font-medium">
                                  {deptIndirectCosts.toLocaleString()} ฿
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="approval" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานสถานะการอนุมัติ</CardTitle>
                      <CardDescription>สถิติการอนุมัติรายการค่าใช้จ่าย</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("approval-status")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          อนุมัติแล้ว
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-500">{approvalStats.approved}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {approvalAmounts.approved.toLocaleString()} ฿
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          รออนุมัติ
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">{approvalStats.pending}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {approvalAmounts.pending.toLocaleString()} ฿
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          ไม่อนุมัติ
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">{approvalStats.rejected}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {approvalAmounts.rejected.toLocaleString()} ฿
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">รวมทั้งหมด</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{approvalStats.total}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(
                            approvalAmounts.approved +
                            approvalAmounts.pending +
                            approvalAmounts.rejected
                          ).toLocaleString()}{" "}
                          ฿
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Approval Rate */}
                  <div className="p-4 rounded-lg border bg-card">
                    <h3 className="font-semibold mb-3">อัตราการอนุมัติ</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>อนุมัติแล้ว</span>
                          <span className="font-medium">
                            {((approvalStats.approved / approvalStats.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{ width: `${(approvalStats.approved / approvalStats.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>รออนุมัติ</span>
                          <span className="font-medium">
                            {((approvalStats.pending / approvalStats.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-500"
                            style={{ width: `${(approvalStats.pending / approvalStats.total) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>ไม่อนุมัติ</span>
                          <span className="font-medium">
                            {((approvalStats.rejected / approvalStats.total) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{ width: `${(approvalStats.rejected / approvalStats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* By Department */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">สถานะการอนุมัติแยกตามแผนก</h3>
                    <div className="space-y-3">
                      {departments.map((dept) => {
                        const deptExpenses = expenses.filter((e) => e.departmentId === dept.id)
                        const approved = deptExpenses.filter((e) => e.status === "approved").length
                        const pending = deptExpenses.filter((e) => e.status === "pending").length
                        const rejected = deptExpenses.filter((e) => e.status === "rejected").length
                        const total = deptExpenses.length

                        return (
                          <div key={dept.id} className="p-3 rounded-lg border bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{dept.name}</span>
                              <span className="text-sm text-muted-foreground">{total} รายการ</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="text-center p-2 rounded bg-green-500/10">
                                <div className="text-green-500 font-bold">{approved}</div>
                                <div className="text-xs text-muted-foreground">อนุมัติ</div>
                              </div>
                              <div className="text-center p-2 rounded bg-yellow-500/10">
                                <div className="text-yellow-500 font-bold">{pending}</div>
                                <div className="text-xs text-muted-foreground">รอ</div>
                              </div>
                              <div className="text-center p-2 rounded bg-red-500/10">
                                <div className="text-red-500 font-bold">{rejected}</div>
                                <div className="text-xs text-muted-foreground">ไม่อนุมัติ</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly-trend" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        รายงานแนวโน้มรายเดือน
                      </CardTitle>
                      <CardDescription>แนวโน้มค่าใช้จ่ายแยกตามเดือน</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("monthly-trend")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Line Chart */}
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="direct" stroke="#3b82f6" strokeWidth={2} name="ต้นทุนทางตรง" />
                        <Line type="monotone" dataKey="indirect" stroke="#8b5cf6" strokeWidth={2} name="ต้นทุนทางอ้อม" />
                        <Line type="monotone" dataKey="total" stroke="#10b981" strokeWidth={2} name="รวม" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Table */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4 pb-2 border-b border-border font-medium text-sm">
                      <div>เดือน</div>
                      <div className="text-right">ต้นทุนทางตรง</div>
                      <div className="text-right">ต้นทุนทางอ้อม</div>
                      <div className="text-right">รวม</div>
                    </div>
                    {monthlyTrendData.map((data) => (
                      <div key={data.month} className="grid grid-cols-4 gap-4 py-2 text-sm">
                        <div className="font-medium">{data.month}</div>
                        <div className="text-right text-blue-500">{data.direct.toLocaleString()} ฿</div>
                        <div className="text-right text-purple-500">{data.indirect.toLocaleString()} ฿</div>
                        <div className="text-right font-bold">{data.total.toLocaleString()} ฿</div>
                      </div>
                    ))}
                    {monthlyTrendData.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 pt-2 border-t border-border font-bold">
                        <div>รวมทั้งหมด</div>
                        <div className="text-right text-blue-500">
                          {monthlyTrendData.reduce((sum, d) => sum + d.direct, 0).toLocaleString()} ฿
                        </div>
                        <div className="text-right text-purple-500">
                          {monthlyTrendData.reduce((sum, d) => sum + d.indirect, 0).toLocaleString()} ฿
                        </div>
                        <div className="text-right">
                          {monthlyTrendData.reduce((sum, d) => sum + d.total, 0).toLocaleString()} ฿
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Growth Analysis */}
                  {monthlyTrendData.length >= 2 && (
                    <div className="p-4 rounded-lg border bg-card">
                      <h3 className="font-semibold mb-3">การเติบโต</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {(() => {
                          const latest = monthlyTrendData[monthlyTrendData.length - 1]
                          const previous = monthlyTrendData[monthlyTrendData.length - 2]
                          const directGrowth = ((latest.direct - previous.direct) / previous.direct) * 100
                          const indirectGrowth = ((latest.indirect - previous.indirect) / previous.indirect) * 100
                          const totalGrowth = ((latest.total - previous.total) / previous.total) * 100

                          return (
                            <>
                              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                                <p className="text-sm text-muted-foreground mb-1">ต้นทุนทางตรง</p>
                                <p
                                  className={`text-xl font-bold ${directGrowth >= 0 ? "text-red-500" : "text-green-500"}`}
                                >
                                  {directGrowth >= 0 ? "+" : ""}
                                  {directGrowth.toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-purple-500/10">
                                <p className="text-sm text-muted-foreground mb-1">ต้นทุนทางอ้อม</p>
                                <p
                                  className={`text-xl font-bold ${indirectGrowth >= 0 ? "text-red-500" : "text-green-500"}`}
                                >
                                  {indirectGrowth >= 0 ? "+" : ""}
                                  {indirectGrowth.toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-green-500/10">
                                <p className="text-sm text-muted-foreground mb-1">รวม</p>
                                <p
                                  className={`text-xl font-bold ${totalGrowth >= 0 ? "text-red-500" : "text-green-500"}`}
                                >
                                  {totalGrowth >= 0 ? "+" : ""}
                                  {totalGrowth.toFixed(1)}%
                                </p>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Department Report */}
            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานสรุปแต่ละแผนก</CardTitle>
                      <CardDescription>เปรียบเทียบงบประมาณกับค่าใช้จ่ายจริง</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("departments")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-4 pb-2 border-b border-border font-medium text-sm">
                      <div>แผนก</div>
                      <div className="text-right">งบประมาณ</div>
                      <div className="text-right">ใช้จ่ายแล้ว</div>
                      <div className="text-right">คงเหลือ</div>
                      <div className="text-right">เปอร์เซ็นต์</div>
                    </div>
                    {departmentSummary.map((dept) => (
                      <div key={dept.id} className="grid grid-cols-5 gap-4 py-2 text-sm">
                        <div className="font-medium">{dept.name}</div>
                        <div className="text-right">{dept.budget.toLocaleString()} ฿</div>
                        <div className="text-right">{dept.spent.toLocaleString()} ฿</div>
                        <div className="text-right">{(dept.budget - dept.spent).toLocaleString()} ฿</div>
                        <div className="text-right">
                          <span
                            className={
                              dept.percentage > 90 ? "text-destructive font-semibold" : "text-muted-foreground"
                            }
                          >
                            {dept.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="grid grid-cols-5 gap-4 pt-2 border-t border-border font-bold">
                      <div>รวม</div>
                      <div className="text-right">
                        {departmentSummary.reduce((sum, d) => sum + d.budget, 0).toLocaleString()} ฿
                      </div>
                      <div className="text-right">
                        {departmentSummary.reduce((sum, d) => sum + d.spent, 0).toLocaleString()} ฿
                      </div>
                      <div className="text-right">
                        {departmentSummary.reduce((sum, d) => sum + (d.budget - d.spent), 0).toLocaleString()} ฿
                      </div>
                      <div className="text-right">
                        {(
                          (departmentSummary.reduce((sum, d) => sum + d.spent, 0) /
                            departmentSummary.reduce((sum, d) => sum + d.budget, 0)) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Category Report */}
            <TabsContent value="categories" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายงานสรุปตามประเภท</CardTitle>
                      <CardDescription>แยกตามประเภทค่าใช้จ่าย</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("categories")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 pb-2 border-b border-border font-medium text-sm">
                      <div>ประเภท</div>
                      <div className="text-center">ประเภทต้นทุน</div>
                      <div className="text-right">ใช้จ่ายแล้ว</div>
                    </div>
                    {categorySummary.map((cat) => (
                      <div key={cat.id} className="grid grid-cols-3 gap-4 py-2 text-sm">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              cat.type === "direct"
                                ? "bg-blue-500/10 text-blue-500"
                                : "bg-purple-500/10 text-purple-500"
                            }`}
                          >
                            {cat.type === "direct" ? "ทางตรง" : "ทางอ้อม"}
                          </span>
                        </div>
                        <div className="text-right">{cat.spent.toLocaleString()} ฿</div>
                      </div>
                    ))}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border font-bold">
                      <div>รวม</div>
                      <div></div>
                      <div className="text-right">
                        {categorySummary.reduce((sum, c) => sum + c.spent, 0).toLocaleString()} ฿
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Report */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>รายการค่าใช้จ่ายทั้งหมด</CardTitle>
                      <CardDescription>แสดง {filteredExpenses.length} รายการ</CardDescription>
                    </div>
                    <Button onClick={() => exportToCSV("expenses")}>
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-6 gap-4 pb-2 border-b border-border font-medium text-sm">
                      <div>รหัส</div>
                      <div>แผนก</div>
                      <div>ประเภท</div>
                      <div>รายละเอียด</div>
                      <div className="text-right">จำนวนเงิน</div>
                      <div className="text-right">วันที่</div>
                    </div>
                    {filteredExpenses.slice(0, 20).map((expense) => {
                      const dept = departments.find((d) => d.id === expense.departmentId)
                      const cat = expenseCategories.find((c) => c.id === expense.categoryId)

                      return (
                        <div key={expense.id} className="grid grid-cols-6 gap-4 py-2 text-sm">
                          <div className="text-muted-foreground">{expense.id}</div>
                          <div>{dept?.name}</div>
                          <div>{cat?.name}</div>
                          <div className="truncate">{expense.description}</div>
                          <div className="text-right font-medium">{expense.amount.toLocaleString()} ฿</div>
                          <div className="text-right text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString("th-TH")}
                          </div>
                        </div>
                      )
                    })}
                    {filteredExpenses.length > 20 && (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        แสดง 20 รายการแรก จากทั้งหมด {filteredExpenses.length} รายการ
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
