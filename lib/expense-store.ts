"use client"

import { create } from "zustand"
import { mockExpenses, mockIndirectCosts } from "./mock-data"

type Expense = {
  id: string
  departmentId: string
  categoryId: string
  description: string
  amount: number
  date: string
  status: "pending" | "approved" | "rejected"
  createdBy: string
}

type IndirectCost = {
  id: string
  categoryId: string
  description: string
  amount: number
  date: string
  allocationType: "equal" | "proportional"
}

type ExpenseStore = {
  expenses: Expense[]
  indirectCosts: IndirectCost[]
  addExpense: (expense: Omit<Expense, "id">) => void
  updateExpense: (id: string, expense: Partial<Expense>) => void
  deleteExpense: (id: string) => void
  addIndirectCost: (cost: Omit<IndirectCost, "id">) => void
  updateIndirectCost: (id: string, cost: Partial<IndirectCost>) => void
  deleteIndirectCost: (id: string) => void
}

export const useExpenseStore = create<ExpenseStore>((set) => ({
  expenses: mockExpenses,
  indirectCosts: mockIndirectCosts,

  addExpense: (expense) =>
    set((state) => ({
      expenses: [...state.expenses, { ...expense, id: `exp-${Date.now()}` }],
    })),

  updateExpense: (id, expense) =>
    set((state) => ({
      expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...expense } : e)),
    })),

  deleteExpense: (id) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== id),
    })),

  addIndirectCost: (cost) =>
    set((state) => ({
      indirectCosts: [...state.indirectCosts, { ...cost, id: `ic-${Date.now()}` }],
    })),

  updateIndirectCost: (id, cost) =>
    set((state) => ({
      indirectCosts: state.indirectCosts.map((c) => (c.id === id ? { ...c, ...cost } : c)),
    })),

  deleteIndirectCost: (id) =>
    set((state) => ({
      indirectCosts: state.indirectCosts.filter((c) => c.id !== id),
    })),
}))
