"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useExpenseStore } from "@/lib/expense-store"
import { departments, expenseCategories } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

type ExpenseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
  userEmail: string
}

export function ExpenseDialog({ open, onOpenChange, editingId, userEmail }: ExpenseDialogProps) {
  const { expenses, addExpense, updateExpense } = useExpenseStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    departmentId: "",
    categoryId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending" as const,
  })

  useEffect(() => {
    if (editingId) {
      const expense = expenses.find((e) => e.id === editingId)
      if (expense) {
        setFormData({
          departmentId: expense.departmentId,
          categoryId: expense.categoryId,
          description: expense.description,
          amount: expense.amount.toString(),
          date: expense.date,
          status: expense.status,
        })
      }
    } else {
      setFormData({
        departmentId: "",
        categoryId: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
      })
    }
  }, [editingId, expenses])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.departmentId || !formData.categoryId || !formData.description || !formData.amount) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        variant: "destructive",
      })
      return
    }

    const expenseData = {
      departmentId: formData.departmentId,
      categoryId: formData.categoryId,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      status: formData.status,
      createdBy: userEmail,
    }

    if (editingId) {
      updateExpense(editingId, expenseData)
      toast({
        title: "แก้ไขสำเร็จ",
        description: "แก้ไขรายการค่าใช้จ่ายเรียบร้อยแล้ว",
      })
    } else {
      addExpense(expenseData)
      toast({
        title: "เพิ่มสำเร็จ",
        description: "เพิ่มรายการค่าใช้จ่ายเรียบร้อยแล้ว",
      })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "แก้ไขรายการค่าใช้จ่าย" : "เพิ่มรายการค่าใช้จ่ายใหม่"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลรายการค่าใช้จ่ายของแผนก</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">แผนก</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="เลือกแผนก" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">ประเภทค่าใช้จ่าย</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === "direct" ? "ทางตรง" : "ทางอ้อม"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                placeholder="อธิบายรายการค่าใช้จ่าย..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">จำนวนเงิน (฿)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">วันที่</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">สถานะ</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รออนุมัติ</SelectItem>
                  <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                  <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit">{editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
