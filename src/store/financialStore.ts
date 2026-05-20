import { create } from 'zustand'
import { Account, Category, Transaction, DashboardMetrics, Budget } from '@/types'

interface FinancialStore {
  // State
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  metrics: DashboardMetrics | null
  loading: boolean
  error: string | null

  // Account actions
  setAccounts: (accounts: Account[]) => void
  addAccount: (account: Account) => void

  // Category actions
  setCategories: (categories: Category[]) => void
  addCategory: (category: Category) => void

  // Transaction actions
  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  removeTransaction: (id: string) => void

  // Budget actions
  setBudgets: (budgets: Budget[]) => void
  addBudget: (budget: Budget) => void

  // Metrics actions
  setMetrics: (metrics: DashboardMetrics) => void

  // UI actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useFinancialStore = create<FinancialStore>((set) => ({
  // Initial state
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  metrics: null,
  loading: false,
  error: null,

  // Account actions
  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) =>
    set((state) => ({ accounts: [...state.accounts, account] })),

  // Category actions
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),

  // Transaction actions
  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
  removeTransaction: (id) =>
    set((state) => ({
      transactions: state.transactions.filter((tx) => tx.id !== id),
    })),

  // Budget actions
  setBudgets: (budgets) => set({ budgets }),
  addBudget: (budget) =>
    set((state) => ({ budgets: [...state.budgets, budget] })),

  // Metrics actions
  setMetrics: (metrics) => set({ metrics }),

  // UI actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      accounts: [],
      categories: [],
      transactions: [],
      budgets: [],
      metrics: null,
      loading: false,
      error: null,
    }),
}))
