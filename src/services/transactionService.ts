import { prisma } from '@/lib/prisma'
import { Decimal } from 'decimal.js'
import { DashboardMetrics, MonthlyData } from '@/types'

export class TransactionService {
  static async createTransaction(
    userId: string,
    data: {
      account_id: string
      amount: number
      transaction_type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
      description: string
      category_id?: string
      transaction_date: Date
    }
  ) {
    const amount = new Decimal(data.amount)

    const transaction = await prisma.transaction.create({
      data: {
        user_id: userId,
        account_id: data.account_id,
        category_id: data.category_id,
        amount: amount,
        transaction_type: data.transaction_type.toUpperCase() as 'INCOME' | 'EXPENSE' | 'TRANSFER',
        description: data.description,
        transaction_date: data.transaction_date,
      },
    })

    const account = await prisma.account.findUnique({
      where: { id: data.account_id },
    })

    if (account) {
      let newBalance = new Decimal(account.balance)

      if (data.transaction_type === 'INCOME') {
        newBalance = newBalance.plus(amount)
      } else if (data.transaction_type === 'EXPENSE') {
        newBalance = newBalance.minus(amount)
      }

      await prisma.account.update({
        where: { id: data.account_id },
        data: { balance: newBalance },
      })
    }

    return transaction
  }

  static async getRecentTransactions(userId: string, limit: number = 10) {
    return await prisma.transaction.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { transaction_date: 'desc' },
      take: limit,
    })
  }

  static async getMonthlyTransactions(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    return await prisma.transaction.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { transaction_date: 'desc' },
    })
  }

  static async getMonthlyTotals(userId: string, year: number, month: number) {
    const transactions = await this.getMonthlyTransactions(userId, year, month)

    let income = new Decimal(0)
    let expenses = new Decimal(0)

    transactions.forEach((t) => {
      const amount = new Decimal(t.amount)
      if (t.transaction_type === 'INCOME') {
        income = income.plus(amount)
      } else if (t.transaction_type === 'EXPENSE') {
        expenses = expenses.plus(amount)
      }
    })

    return {
      income: income.toNumber(),
      expenses: expenses.toNumber(),
      net: income.minus(expenses).toNumber(),
    }
  }

  static async getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
    const accounts = await prisma.account.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
      },
    })

    let totalBalance = new Decimal(0)
    accounts.forEach((acc) => {
      totalBalance = totalBalance.plus(new Decimal(acc.balance))
    })

    const currentDate = new Date()
    const monthlyTotals = await this.getMonthlyTotals(
      userId,
      currentDate.getFullYear(),
      currentDate.getMonth() + 1
    )

    let bufferDays = 0
    if (monthlyTotals.expenses > 0) {
      const dailyExpenses = new Decimal(monthlyTotals.expenses).dividedBy(30)
      bufferDays = Math.floor(totalBalance.dividedBy(dailyExpenses).toNumber())
    }

    return {
      totalBalance: totalBalance.toNumber(),
      monthlyIncome: monthlyTotals.income,
      monthlyExpenses: monthlyTotals.expenses,
      netChange: monthlyTotals.net,
      bufferDays,
    }
  }

  static async getMonthlyDataHistory(userId: string, months: number = 6) {
    const data: MonthlyData[] = []
    const today = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1

      const totals = await this.getMonthlyTotals(userId, year, month)

      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        income: totals.income,
        expenses: totals.expenses,
        net: totals.net,
      })
    }

    return data
  }

  static async deleteTransaction(userId: string, transactionId: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    })

    if (!transaction || transaction.user_id !== userId) {
      throw new Error('Transaction not found')
    }

    const account = await prisma.account.findUnique({
      where: { id: transaction.account_id },
    })

    if (account) {
      let newBalance = new Decimal(account.balance)
      const amount = new Decimal(transaction.amount)

      if (transaction.transaction_type === 'INCOME') {
        newBalance = newBalance.minus(amount)
      } else if (transaction.transaction_type === 'EXPENSE') {
        newBalance = newBalance.plus(amount)
      }

      await prisma.account.update({
        where: { id: transaction.account_id },
        data: { balance: newBalance },
      })
    }

    return await prisma.transaction.update({
      where: { id: transactionId },
      data: { deleted_at: new Date() },
    })
  }
}
