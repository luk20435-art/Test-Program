"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useExpenseStore } from "@/lib/expense-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ExpenseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  userEmail: string;
};

export function ExpenseDialog({
  open,
  onOpenChange,
  editingId,
  userEmail,
}: ExpenseDialogProps) {
  // const { expenses, addExpense, updateExpense } = useExpenseStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    departmentId: "",
    categoryId: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });
 
  const [departments, setDepartments] = useState([]);
  const [expenseCategories, setCostCategories] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch("http://localhost:3001/departments", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res) throw new Error("Failed to fetch departments");

        const data = await res.json();
        console.log("Departments from server:", data);
        setDepartments(data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    const fetchCostCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/cost-categories", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res) throw new Error("Failed to fetch departments");

        const data = await res.json();
        console.log("Departments from server:", data);
        setCostCategories(data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchDepartments();
    fetchCostCategories();
  }, []);

  useEffect(() => {
    console.log("Editing ID changed:", editingId);
    if (editingId) {
      // const expense = expenses.find((e) => e.id === editingId);

      const fetchBudgets = async () => {
        try {
          const res = await fetch(
            "http://localhost:3001/budgets/" + editingId,
            {
              method: "GET",
              headers: { "Content-Type": "application/json" },
            }
          );

          if (!res) throw new Error("Failed to fetch departments");

          const data = await res.json();
          console.log("Departments from server:", data);
          setExpenses(data);

          if (data) {
            setFormData({
              departmentId: data?.department?.id,
              categoryId: String(data.category.id),
              description: data?.description,
              amount: data?.amount.toString(),
              date: data?.date,
            });
          }
        } catch (err) {
          console.error("Error fetching departments:", err);
        }
      };

      fetchBudgets();
    } else {
      setFormData({
        departmentId: "",
        categoryId: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [editingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.departmentId ||
      !formData.categoryId ||
      !formData.description ||
      !formData.amount
    ) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบทุกช่อง",
        variant: "destructive",
      });
      return;
    }

    if (!editingId) {
      const res = await fetch("http://localhost:3001/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: formData.departmentId,
          category: formData.categoryId,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          date: formData.date,
        }),
      });
      const result = await res.json(); 
      if (result.id) {
        toast({
          title: "เพิ่มสำเร็จ",
          description: "เพิ่มรายการค่าใช้จ่ายเรียบร้อยแล้ว",
        });
      }
    }else{
      const res = await fetch("http://localhost:3001/budgets/"+editingId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: formData.departmentId,
          category: formData.categoryId,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          date: formData.date,
        }),
      });
      const result = await res.json(); 
      if (result.id) {
        toast({
          title: "แก้ไขสำเร็จ",
          description: "แก้ไขรายการค่าใช้จ่ายเรียบร้อยแล้ว",
        });
      }
    } 

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingId ? "แก้ไขรายการค่าใช้จ่าย" : "เพิ่มรายการค่าใช้จ่ายใหม่"}
          </DialogTitle>
          <DialogDescription>
            กรอกข้อมูลรายการค่าใช้จ่ายของแผนก
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="department">แผนก</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departmentId: value })
                }
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
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="เลือกประเภท" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={String(cat.id)} value={String(cat.id)}>
                      {cat.name} ({cat.type === "direct" ? "ทางตรง" : "ทางอ้อม"}
                      )
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
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit">
              {editingId ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
