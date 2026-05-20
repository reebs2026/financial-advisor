'use client'

import { Transaction } from '@/types'
import { format } from 'date-fns'

interface RecentTransactionsProps {
  transactions: Transaction[]
  loading?: boolean
}

export default function RecentTransactions({ transactions, loading = false }: RecentTransactionsProps) {
  if (loading) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        <div className="text-center py-8">
          <p className="text-gray-500">No transactions yet. Add one to get started!</p>
        </div>
      </div>
    )
  }

  const getTransactionColor = (type: string) => {
    const lowerType = type.toLowerCase()
    switch (lowerType) {
      case 'income':
        return 'text-green-600'
      case 'expense':
        return 'text-red-600'
      case 'transfer':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionSign = (type: string) => {
    const lowerType = type.toLowerCase()
    switch (lowerType) {
      case 'income':
        return '+'
      case 'expense':
        return '-'
      case 'transfer':
        return '↔'
      default:
        return ''
    }
  }

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
      <div className="space-y-3">
        {transactions.slice(0, 10).map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900">{transaction.description}</p>
              <p className="text-xs text-gray-500">
                {transaction.account?.name || 'Unknown'} • {format(new Date(transaction.transaction_date), 'MMM d, yyyy')}
              </p>
            </div>
            <div className={`text-right font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
              {getTransactionSign(transaction.transaction_type)}R{parseFloat(transaction.amount.toString()).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
