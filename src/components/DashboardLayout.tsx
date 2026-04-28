'use client'

import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">💰</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Financial Advisor</span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/transactions"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Transactions
              </Link>
              <Link
                href="/dashboard/budgets"
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Budgets
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Log out
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            © 2026 Financial Advisor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
