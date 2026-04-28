'use client'

import { useState } from 'react'
import { Account, Category, TransactionType } from '@/types'
import { format } from 'date-fns'

interface TransactionFormProps {
  accounts: Account[]
  categories: Category[]
  onSubmit: (data: {
    account_id: string
    amount: number
    date: Date
    description: string
    transaction_type: TransactionType
    category_id?: string
  }) => Promise<void>
  loading?: boolean
}

export default function TransactionForm({
  accounts,
  categories,
  onSubmit,
  loading = false,
}: TransactionFormProps) {
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [description, setDescription] = useState('')
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate
    if (!accountId) {
      setError('Please select an account')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    if (!date) {
      setError('Please select a date')
      return
    }

    // Check date is not in future
    const selectedDate = new Date(date)
    if (selectedDate > new Date()) {
      setError('Transaction date cannot be in the future')
      return
    }

    setSubmitting(true)

    try {
      await onSubmit({
        account_id: accountId,
        amount: parseFloat(amount),
        date: selectedDate,
        description: description.trim(),
        transaction_type: transactionType,
        category_id: categoryId || undefined,
      })

      // Reset form
      setAmount('')
      setDescription('')
      setAccountId('')
      setCategoryId('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setTransactionType('EXPENSE')
    } catch (err: any) {
      setError(err.message || 'Failed to create transaction')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transaction Type */}
        <div>
          <label htmlFor="type" className="label">
            Type <span aria-label="required" className="text-red-600">*</span>
          </label>
          <select
            id="type"
            className="input"
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value as TransactionType)}
            disabled={submitting || loading}
          >
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="label">
            Amount (R) <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            className="input"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={submitting || loading}
            required
          />
        </div>

        {/* Account */}
        <div>
          <label htmlFor="account" className="label">
            Account <span aria-label="required" className="text-red-600">*</span>
          </label>
          <select
            id="account"
            className="input"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            disabled={submitting || loading}
          >
            <option value="">-- Select account --</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.currency})
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="date" className="label">
            Date <span aria-label="required" className="text-red-600">*</span>
          </label>
          <input
            id="date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={submitting || loading}
            required
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="label">
          Description <span aria-label="required" className="text-red-600">*</span>
        </label>
        <input
          id="description"
          type="text"
          className="input"
          placeholder="e.g., Grocery shopping"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={submitting || loading}
          maxLength={500}
          required
        />
      </div>

      {/* Category (optional) */}
      {transactionType === 'EXPENSE' && (
        <div>
          <label htmlFor="category" className="label">
            Category
          </label>
          <select
            id="category"
            className="input"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting || loading}
          >
            <option value="">-- No category --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon || '•'} {category.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={submitting || loading}
      >
        {submitting ? 'Creating...' : 'Add Transaction'}
      </button>
    </form>
  )
}
