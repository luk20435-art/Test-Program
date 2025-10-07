// Mock Users for Authentication
export const mockUsers = [
  {
    id: "1",
    email: "user@company.com",
    password: "user123",
    name: "สมชาย ใจดี",
    role: "user" as const,
    department: "แผนกจัดซื้อ",
  },
  {
    id: "2",
    email: "analyst@company.com",
    password: "analyst123",
    name: "สมหญิง วิเคราะห์",
    role: "analyst" as const,
    department: "แผนกการเงิน",
  },
  {
    id: "3",
    email: "manager@company.com",
    password: "manager123",
    name: "ผู้จัดการ ใหญ่",
    role: "manager" as const,
    department: "ฝ่ายบริหาร",
  },
]

// Departments
export const departments = [
  { id: "purchase", name: "แผนกจัดซื้อ", budget: 5000000 },
  { id: "engineering", name: "แผนกวิศวกร", budget: 8000000 },
  { id: "operations", name: "แผนกปฏิบัติการ", budget: 6000000 },
  { id: "quality", name: "แผนกตรวจสอบคุณภาพ", budget: 3000000 },
  { id: "painting", name: "แผนกทำสี", budget: 2000000 },
]

// Expense Categories
export const expenseCategories = [
  { id: "materials", name: "วัสดุ/อุปกรณ์", type: "direct" as const },
  { id: "outsource", name: "จ้างเหมาภายนอก", type: "direct" as const },
  { id: "utilities", name: "ค่าน้ำ-ไฟ", type: "indirect" as const },
  { id: "salary", name: "ค่าจ้างพนักงาน", type: "indirect" as const },
  { id: "maintenance", name: "ค่าบำรุงรักษา", type: "indirect" as const },
  { id: "other", name: "อื่นๆ", type: "indirect" as const },
]

// Mock Expenses
export const mockExpenses = [
  {
    id: "1",
    departmentId: "purchase",
    categoryId: "materials",
    description: "ซื้อวัสดุก่อสร้าง",
    amount: 450000,
    date: "2025-01-15",
    status: "approved" as const,
    createdBy: "user@company.com",
  },
  {
    id: "2",
    departmentId: "engineering",
    categoryId: "outsource",
    description: "จ้างที่ปรึกษาโครงการ",
    amount: 800000,
    date: "2025-01-20",
    status: "approved" as const,
    createdBy: "user@company.com",
  },
  {
    id: "3",
    departmentId: "operations",
    categoryId: "materials",
    description: "อุปกรณ์เครื่องจักร",
    amount: 650000,
    date: "2025-02-01",
    status: "pending" as const,
    createdBy: "user@company.com",
  },
  {
    id: "4",
    departmentId: "quality",
    categoryId: "materials",
    description: "เครื่องมือตรวจสอบ",
    amount: 280000,
    date: "2025-02-05",
    status: "approved" as const,
    createdBy: "user@company.com",
  },
  {
    id: "5",
    departmentId: "painting",
    categoryId: "materials",
    description: "สีและอุปกรณ์ทาสี",
    amount: 180000,
    date: "2025-02-10",
    status: "approved" as const,
    createdBy: "user@company.com",
  },
]

// Mock Indirect Costs (Organization-wide)
export const mockIndirectCosts = [
  {
    id: "ic1",
    categoryId: "utilities",
    description: "ค่าไฟฟ้าประจำเดือน",
    amount: 250000,
    date: "2025-01-31",
    allocationType: "equal" as const,
  },
  {
    id: "ic2",
    categoryId: "utilities",
    description: "ค่าน้ำประปาประจำเดือน",
    amount: 80000,
    date: "2025-01-31",
    allocationType: "equal" as const,
  },
  {
    id: "ic3",
    categoryId: "salary",
    description: "เงินเดือนพนักงานทั่วไป",
    amount: 1500000,
    date: "2025-01-31",
    allocationType: "proportional" as const,
  },
  {
    id: "ic4",
    categoryId: "maintenance",
    description: "ค่าบำรุงรักษาอาคาร",
    amount: 150000,
    date: "2025-02-15",
    allocationType: "equal" as const,
  },
]

// Budget Summary
export const budgetSummary = {
  totalBudget: 24000000,
  totalSpent: 4340000,
  totalAllocated: 1980000,
  remaining: 17680000,
}
