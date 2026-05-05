import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { TransactionService } from '@/services/transactionService'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch user data in parallel
    const [accounts, categories, transactions, metrics] = await Promise.all([
      prisma.account.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      }),
      prisma.category.findMany({
        where: { user_id: user.id },
        orderBy: { name: 'asc' },
      }),
      TransactionService.getRecentTransactions(user.id, 10),
      TransactionService.getDashboardMetrics(user.id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        accounts: accounts.map((a) => ({
          ...a,
          balance: parseFloat(a.balance.toString()),
        })),
        categories,
        transactions: transactions.map((tx) => ({
          ...tx,
          amount: parseFloat(tx.amount.toString()),
        })),
        metrics,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch dashboard data',
      },
      { status: 500 }
    )
  }
}
