import { z } from 'zod'

// Transaction validation
export const CreateTransactionSchema = z.object({
  account_id: z.string().min(1, 'Account is required'),
  amount: z.number().positive('Amount must be positive').max(999999999.99, 'Amount too large'),
  date: z.string().datetime().or(z.date()),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  transaction_type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  category_id: z.string().optional(),
})

// Update Transaction Schema
export const UpdateTransactionSchema = z.object({
  amount: z.number().positive().max(999999999.99).optional(),
  date: z.string().datetime().or(z.date()).optional(),
  description: z.string().min(1).max(500).optional(),
  category_id: z.string().optional(),
})

// Account validation
export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'DEBT', 'CREDIT_CARD']),
  currency: z.string().default('ZAR').max(3),
  balance: z.number().default(0),
  description: z.string().optional(),
})

// Category validation
export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(30),
  color: z.string().default('gray'),
  icon: z.string().max(2).optional(),
  description: z.string().optional(),
})

// Budget validation
export const CreateBudgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  tier: z.enum(['protected', 'strategic', 'flexible']),
  monthly_amount: z.number().positive('Amount must be positive'),
  min_amount: z.number().positive().optional(),
})

// Login validation
export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Signup validation
export const SignupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
