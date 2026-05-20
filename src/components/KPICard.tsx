'use client'

interface KPICardProps {
  title: string
  value: number | string
  subtitle?: string
  trend?: number
  icon?: React.ReactNode
  status?: 'success' | 'warning' | 'error'
  format?: 'currency' | 'number' | 'days'
}

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon,
  status = 'success',
  format = 'currency',
}: KPICardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return `R${val.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      case 'days':
        return `${Math.floor(val)} days`
      case 'number':
      default:
        return val.toLocaleString('en-ZA')
    }
  }

  const statusColors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200 text-red-900',
  }

  return (
    <div className={`card p-6 border ${statusColors[status]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{formatValue(value)}</p>
          {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="mt-2">
              <span className={`text-xs font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
              </span>
            </div>
          )}
        </div>
        {icon && <div className="text-3xl opacity-50">{icon}</div>}
      </div>
    </div>
  )
}
