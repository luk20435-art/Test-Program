"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useExpenseStore } from "@/lib/expense-store"
import { expenseCategories } from "@/lib/mock-data"
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

type IndirectCostDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingId: string | null
}

export function IndirectCostDialog({ open, onOpenChange, editingId }: IndirectCostDialogProps) {
  const { indirectCosts, addIndirectCost, updateIndirectCost } = useExpenseStore()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    categoryId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    allocationType: "equal" as "equal" | "proportional",
  })

  useEffect(() => {
    if (editingId) {
      const cost = indirectCosts.find((c) => c.id === editingId)
      if (cost) {
        setFormData({
          categoryId: cost.categoryId,
          description: cost.description,
          amount: cost.amount.toString(),
          date: cost.date,
          allocationType: cost.allocationType,
        })
      }
    } else {
      setFormData({
        categoryId: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        allocationType: "equal",
      })
    }
  }, [editingId, indirectCosts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.categoryId || !formData.description || !formData.amount) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        variant: "destructive",
      })
      return
    }

    const costData = {
      categoryId: formData.categoryId,
      description: formData.description,
      amount: Number.parseFloat(formData.amount),
      date: formData.date,
      allocationType: formData.allocationType,
    }

    if (editingId) {
      updateIndirectCost(editingId, costData)
      toast({
        title: "แก้ไขสำเร็จ",
        description: "แก้ไขรายการต้นทุนทางอ้อมเรียบร้อยแล้ว",
      })
    } else {
      addIndirectCost(costData)
      toast({
        title: "เพิ่มสำเร็จ",
        description: "เพิ่มรายการต้นทุนทางอ้อมเรียบร้อยแล้ว",
      })
    }

    onOpenChange(false)
  }

  // Filter only indirect cost categories
  const indirectCategories = expenseCategories.filter((cat) => cat.type === "indirect")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editingId ? "แก้ไขต้นทุนทางอ้อม" : "เพิ่มต้นทุนทางอ้อมใหม่"}</DialogTitle>
          <DialogDescription>กรอกข้อมูลต้นทุนทางอ้อมและเลือกวิธีการจัดสรร</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category">ประเภทต้นทุน</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {indirectCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">รายละเอียด</Label>
              <Textarea
                id="description"
                placeholder="อธิบายรายการต้นทุนทางอ้อม..."
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
              <Label htmlFor="allocationType">วิธีการจัดสรร</Label>
              <Select
                value={formData.allocationType}
                onValueChange={(value: any) => setFormData({ ...formData, allocationType: value })}
              >
                <SelectTrigger id="allocationType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equal">จัดสรรเท่ากัน (Equal)</SelectItem>
                  <SelectItem value="proportional">จัดสรรตามสัดส่วน (Proportional)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {formData.allocationType === "equal" ? "แบ่งเท่าๆ กันให้ทุกแผนก" : "แบ่งตามสัดส่วนต้นทุนทางตรงของแต่ละแผนก"}
              </p>
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
