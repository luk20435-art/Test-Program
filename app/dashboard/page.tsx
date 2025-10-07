"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { departments, budgetSummary, expenseCategories } from "@/lib/mock-data"
import { useExpenseStore } from "@/lib/expense-store"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { expenses, indirectCosts } = useExpenseStore()

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

  // Calculate department expenses
  const departmentExpenses = departments.map((dept) => {
    const deptExpenses = expenses.filter((e) => e.departmentId === dept.id && e.status === "approved")
    const totalSpent = deptExpenses.reduce((sum, e) => sum + e.amount, 0)
    const percentage = (totalSpent / dept.budget) * 100

    return {
      id: dept.id,
      name: dept.name,
      budget: dept.budget,
      spent: totalSpent,
      remaining: dept.budget - totalSpent,
      percentage: percentage,
    }
  })

  // Calculate category expenses
  const categoryExpenses = expenseCategories.map((cat) => {
    const catExpenses = expenses.filter((e) => e.categoryId === cat.id && e.status === "approved")
    const totalSpent = catExpenses.reduce((sum, e) => sum + e.amount, 0)

    return {
      name: cat.name,
      value: totalSpent,
      type: cat.type,
    }
  })

  // Calculate total indirect costs
  const totalIndirectCosts = indirectCosts.reduce((sum, c) => sum + c.amount, 0)

  // Calculate total direct costs
  const totalDirectCosts = expenses
    .filter((e) => e.status === "approved")
    .reduce((sum, e) => {
      const category = expenseCategories.find((c) => c.id === e.categoryId)
      return category?.type === "direct" ? sum + e.amount : sum
    }, 0)

  const totalSpent = totalDirectCosts + totalIndirectCosts
  const budgetUsagePercentage = (totalSpent / budgetSummary.totalBudget) * 100

  // Chart colors

  // โทนสีธุรกิจ: สุภาพ มั่นคง และดูมืออาชีพ
  const COLORS = [
    "#1E3A8A", // น้ำเงินกรมท่า (Corporate)
    "#2563EB", // น้ำเงินสด (Professional)
    "#0EA5E9", // ฟ้าเทคโนโลยี
    "#10B981", // เขียวมินต์ (ประสิทธิภาพ)
    "#FACC15", // เหลืองทอง (มูลค่า)
    "#64748B", // เทา Slate (เสริมโทน)
  ];


  // Prepare data for cost type pie chart
  const costTypeData = [
    { name: "ต้นทุนทางตรง", value: totalDirectCosts },
    { name: "ต้นทุนทางอ้อม", value: totalIndirectCosts },
  ]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">ภาพรวมงบประมาณและค่าใช้จ่ายองค์กร</p>
          </div>

          {/* Key Metrics */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">งบประมาณทั้งหมด</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{budgetSummary.totalBudget.toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-2">งบประมาณประจำปี</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">ใช้จ่ายไปแล้ว</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{totalSpent.toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-2">{budgetUsagePercentage.toFixed(1)}% ของงบประมาณ</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">คงเหลือ</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{(budgetSummary.totalBudget - totalSpent).toLocaleString()} ฿</div>
                <p className="text-xs text-muted-foreground mt-2">{(100 - budgetUsagePercentage).toFixed(1)}% คงเหลือ</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">รายการค้างอนุมัติ</CardTitle>
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-orange-600">{expenses.filter((e) => e.status === "pending").length}</div>
                <p className="text-xs text-muted-foreground mt-2">รายการรออนุมัติ</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Department Budget vs Spent */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">งบประมาณแต่ละแผนก</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  เปรียบเทียบงบประมาณกับค่าใช้จ่ายจริง
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ChartContainer
                  config={{
                    budget: {
                      label: "งบประมาณ",
                      color: "#2563EB", // ฟ้าน้ำเงินมืออาชีพ
                    },
                    spent: {
                      label: "ใช้จ่ายแล้ว",
                      color: "#0EA5E9", // ฟ้าเทคโนโลยี
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentExpenses}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="name"
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: "hsl(var(--muted-foreground))" }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />

                      {/* งบประมาณ */}
                      <Bar
                        dataKey="budget"
                        fill="#2563EB"
                        name="งบประมาณ"
                        radius={[8, 8, 0, 0]}
                        barSize={20}
                      />

                      {/* ใช้จ่ายแล้ว */}
                      <Bar
                        dataKey="spent"
                        fill="#10B981"
                        name="ใช้จ่ายแล้ว"
                        radius={[8, 8, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>


            {/* Cost Type Distribution */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">สัดส่วนต้นทุน</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  แบ่งตามประเภทต้นทุนทางตรงและทางอ้อม
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ChartContainer
                  config={{
                    direct: {
                      label: "ต้นทุนทางตรง",
                      color: "hsl(var(--chart-1))",
                    },
                    indirect: {
                      label: "ต้นทุนทางอ้อม",
                      color: "hsl(var(--chart-3))",
                    },
                  }}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {costTypeData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

          </div>

          {/* Department Details Table */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">รายละเอียดแต่ละแผนก</CardTitle>
              <CardDescription className="text-xs sm:text-sm">สรุปการใช้งบประมาณของแต่ละแผนก</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 sm:space-y-6">
                {departmentExpenses.map((dept) => (
                  <div key={dept.id} className="space-y-2 p-3 sm:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold leading-none truncate">{dept.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {dept.spent.toLocaleString()} / {dept.budget.toLocaleString()} ฿
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs sm:text-sm font-bold ${dept.percentage > 90 ? "text-red-600" : dept.percentage > 75 ? "text-orange-600" : "text-green-600"}`}>
                          {dept.percentage.toFixed(1)}%
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">คงเหลือ {dept.remaining.toLocaleString()} ฿</p>
                      </div>
                    </div>
                    <div className="h-2.5 sm:h-3 rounded-full bg-secondary overflow-hidden shadow-inner">
                      <div
                        className="h-full transition-all duration-500 ease-out rounded-full"
                        style={{
                          width: `${Math.min(dept.percentage, 100)}%`,
                          backgroundColor: dept.percentage > 90 ? "#dc2626" : dept.percentage > 75 ? "#ea580c" : "#16a34a",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
