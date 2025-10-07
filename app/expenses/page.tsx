"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { departments, expenseCategories } from "@/lib/mock-data";
import { useExpenseStore } from "@/lib/expense-store";
import {
  Plus,
  Filter,
  Search,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { ExpenseDialog } from "@/components/expense-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { el } from "date-fns/locale";

export default function ExpensesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { expenses, deleteExpense } = useExpenseStore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [filteredExpenses, setFilteredExpenses] = useState([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const res = await fetch("http://localhost:3001/budgets", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res) throw new Error("Failed to fetch departments");

        const data = await res.json();
        console.log("Departments from server:", data);
        setFilteredExpenses(data);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };

    fetchBudgets();
  }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch("http://localhost:3001/budgets/" + id, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    const result = await res.json();
    if (result.affected > 0) {
      deleteExpense(id);
      setDeleteId(null);
      toast({
        title: "ลบสำเร็จ",
        description: "ลบรายการค่าใช้จ่ายเรียบร้อยแล้ว",
      });
    } else {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรายการค่าใช้จ่ายได้",
        variant: "destructive",
      });
      return;
    }
  };

  const handleEdit = (id: string) => {
    setEditingExpense(id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingExpense(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            อนุมัติแล้ว
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            ไม่อนุมัติ
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            รออนุมัติ
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                บันทึกค่าใช้จ่าย
              </h1>
              <p className="text-muted-foreground mt-2">
                จัดการรายการค่าใช้จ่ายของแผนกต่างๆ
              </p>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มรายการใหม่
            </Button>
          </div>

          {/* Expenses List */}
          <Card>
            <CardHeader>
              <CardTitle>รายการค่าใช้จ่าย</CardTitle>
              <CardDescription>
                แสดงทั้งหมด {filteredExpenses.length} รายการ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredExpenses.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      ไม่พบรายการค่าใช้จ่าย
                    </p>
                  </div>
                ) : (
                  filteredExpenses.map((expense) => {
                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-medium">
                              {expense.description}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{expense?.department?.name}</span>
                            <span>•</span>
                            <span>{expense?.category?.name}</span>
                            <span>•</span>
                            <span>
                              {new Date(expense.date).toLocaleDateString(
                                "th-TH"
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold">
                              {expense.amount.toLocaleString()} ฿
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(expense.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={handleCloseDialog}
        editingId={editingExpense}
        userEmail={user.email}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบรายการค่าใช้จ่ายนี้?
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              ลบรายการ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
