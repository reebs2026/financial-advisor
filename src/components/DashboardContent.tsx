'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { useFinancialStore } from '@/store/financialStore'
import { Account, Category, Transaction, DashboardMetrics } from '@/types'
import KPICard from '@/components/KPICard'
import RecentTransactions from '@/components/RecentTransactions'
import TransactionForm from '@/components/TransactionForm'

export default function DashboardContent() {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const [user, setUser] = useState<any>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const store = useFinancialStore()

  // Fetch user and data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/login')
          return
        }

        setUser(authUser)

        // Fetch dashboard data from API
        const response = await fetch('/api/dashboard', {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const result = await response.json()
        const data = result.data

        setAccounts(data.accounts || [])
        setCategories(data.categories || [])
        setTransactions(data.transactions || [])
        setMetrics(data.metrics || null)

        store.setAccounts(data.accounts || [])
        store.setCategories(data.categories || [])
        store.setTransactions(data.transactions || [])
        store.setMetrics(data.metrics || null)
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router, supabase, store])

  const handleAddTransaction = async (data: any) => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create transaction')
      }

      const result = await response.json()
      const newTransaction = result.data

      // Update local state
      setTransactions([newTransaction, ...transactions])
      store.addTransaction(newTransaction)

      // Refresh metrics
      const metricsResponse = await fetch('/api/dashboard/metrics')
      const metricsResult = await metricsResponse.json()
      const metricsData = metricsResult.data
      setMetrics(metricsData)
      store.setMetrics(metricsData)
    } catch (err: any) {
      setError(err.message || 'Failed to add transaction')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Loading your financial overview...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-6 h-32 animate-pulse bg-gray-100"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="card p-6 bg-red-50 border border-red-200">
        <p className="text-red-700">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.email}</p>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KPICard
            title="Total Balance"
            value={metrics.totalBalance}
            icon="💼"
            status={metrics.totalBalance > 0 ? 'success' : 'error'}
          />
          <KPICard
            title="Monthly Income"
            value={metrics.monthlyIncome}
            icon="📈"
            format="currency"
          />
          <KPICard
            title="Monthly Expenses"
            value={metrics.monthlyExpenses}
            icon="📉"
            format="currency"
            status={metrics.monthlyExpenses > metrics.monthlyIncome ? 'error' : 'success'}
          />
          <KPICard
            title="Buffer"
            value={metrics.bufferDays}
            icon="🛡️"
            format="days"
            status={metrics.bufferDays >= 30 ? 'success' : metrics.bufferDays >= 7 ? 'warning' : 'error'}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Transaction Form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Add Transaction</h2>
            <TransactionForm
              accounts={accounts}
              categories={categories}
              onSubmit={handleAddTransaction}
            />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <RecentTransactions transactions={transactions} loading={loading} />
        </div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-6">
            <p className="text-sm text-gray-600">Monthly Net</p>
            <p className={`text-2xl font-bold mt-2 ${metrics.monthlyIncome - metrics.monthlyExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics.monthlyIncome - metrics.monthlyExpenses >= 0 ? '+' : '-'}R
              {Math.abs(metrics.monthlyIncome - metrics.monthlyExpenses).toLocaleString('en-ZA')}
            </p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-600">Accounts</p>
            <p className="text-2xl font-bold mt-2">{accounts.length}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-600">Categories</p>
            <p className="text-2xl font-bold mt-2">{categories.length}</p>
          </div>
        </div>
      )}
    </div>
  )
}
