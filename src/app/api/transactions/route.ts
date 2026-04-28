import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { CreateTransactionSchema } from '@/lib/validation'
import { TransactionService } from '@/services/transactionService'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
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

    // Parse request body
    const body = await request.json()

    // Validate with Zod
    const validatedData = CreateTransactionSchema.parse(body)

    // Create transaction
    const transaction = await TransactionService.createTransaction(user.id, {
      account_id: validatedData.account_id,
      amount: validatedData.amount,
      transaction_type: validatedData.transaction_type,
      description: validatedData.description,
      category_id: validatedData.category_id,
      transaction_date: new Date(validatedData.date),
    })

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        amount: parseFloat(transaction.amount.toString()),
      },
    })
  } catch (error: any) {
    console.error('Error creating transaction:', error)

    // Handle validation errors
    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create transaction',
      },
      { status: 500 }
    )
  }
}

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

    // Get recent transactions
    const transactions = await TransactionService.getRecentTransactions(user.id, 20)

    return NextResponse.json({
      success: true,
      data: transactions.map((tx) => ({
        ...tx,
        amount: parseFloat(tx.amount.toString()),
      })),
    })
  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch transactions',
      },
      { status: 500 }
    )
  }
}
