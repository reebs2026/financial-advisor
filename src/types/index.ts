export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER'

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export interface Account {
  id: string
  user_id: string
  name: string
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'DEBT' | 'CREDIT_CARD'
  balance: number
  currency: string
  description?: string
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Category {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  icon?: string
  is_default: boolean
  created_at: Date
  updated_at: Date
  deleted_at?: Date
}

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id?: string
  amount: number
  transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  description: string
  transaction_date: Date
  notes?: string
  created_at: Date
  updated_at: Date
  account?: Account
  category?: Category
}

export interface DashboardMetrics {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  netChange: number
  bufferDays: number
}

export interface Budget {
  id: string
  user_id: string
  name: string
  tier: 'protected' | 'strategic' | 'flexible'
  monthly_amount: number
  min_amount?: number
  created_at: Date
  updated_at: Date
}

export interface MonthlyData {
  month: string
  income: number
  expenses: number
  net: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string[]
}

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export interface CreateTransactionInput {
  account_id: string
  amount: number
  transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  description: string
  category_id?: string
  transaction_date: Date
}
