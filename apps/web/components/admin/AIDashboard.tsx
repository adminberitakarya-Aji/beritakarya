'use client'
import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  Users, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download
} from 'lucide-react'

interface UsageData {
  period: { start: Date; end: Date }
  overall: {
    totalCost: number
    totalRequests: number
    totalTokens: number
    avgLatency: number
  }
  byRole: Array<{ role: string; requests: number; cost: number; totalTokens: number }>
  byFeature: Array<{ action: string; requests: number; cost: number }>
  bySite: Array<{ site: string; requests: number; cost: number; activeUsers: number }>
  topUsers: Array<{ name: string; email: string; role: string; requests: number; cost: number }>
  budgetStatus: Array<{ role: string; requests: number; currentSpend: number; monthlyBudget: number; percentUsed: number }>
  dailyTrend: Array<{ date: string; requests: number; cost: number; activeUsers: number }>
  modelUsage: Array<{ modelUsed: string; requests: number; cost: number }>
}

interface QuotaData {
  roleQuotas: Array<{
    role: string
    dailyRequests: number
    dailyTokens: number
    monthlyBudget: number
    allowedFeatures: string[]
    modelRestriction: string | null
  }>
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    site: { domain: string; name: string } | null
    aiEnabled: boolean
    aiDailyLimit: number
    aiMonthlyBudget: number
    aiFeaturesAllowed: string[]
    aiModelRestriction: string | null
    currentMonthUsage: { requests: number; cost: number; tokens: number }
  }>
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function AIDashboard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [usageRes, quotaRes] = await Promise.all([
        fetch('/api/v1/admin/ai-usage', {
          headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
          }
        }),
        fetch('/api/v1/admin/quotas', {
          headers: {
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('accessToken') : ''}`,
          }
        })
      ])
      
      if (usageRes.ok) setUsageData(await usageRes.json())
      if (quotaRes.ok) setQuotaData(await quotaRes.json())
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Assistant Dashboard</h1>
          <p className="text-gray-600">
            Monitor AI usage, quotas, and costs across your organization
          </p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
          <Activity className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {['overview', 'quotas', 'users', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(usageData?.overall.totalCost || 0)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(usageData?.overall.totalRequests || 0)} requests</p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">
                    {usageData?.dailyTrend.reduce((sum, d) => sum + d.activeUsers, 0) || 0}
                  </p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                  <p className="text-2xl font-bold">{Math.round(usageData?.overall.avgLatency || 0)}ms</p>
                  <p className="text-xs text-gray-500">Response time</p>
                </div>
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                  <p className="text-2xl font-bold">{formatNumber(usageData?.overall.totalTokens || 0)}</p>
                  <p className="text-xs text-gray-500">Input + Output</p>
                </div>
                <Zap className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Simple Charts - Text-based for now */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Feature</h3>
              <div className="space-y-3">
                {(usageData?.byFeature || []).map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{feature.action}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full"
                          style={{ width: `${(feature.cost / (usageData?.byFeature[0]?.cost || 1)) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{formatCurrency(feature.cost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Budget Status by Role</h3>
              <div className="space-y-4">
                {(usageData?.budgetStatus || []).map((budget, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium capitalize">{budget.role}</span>
                      <span className={`text-sm font-semibold ${
                        budget.percentUsed > 90 ? 'text-red-600' : 
                        budget.percentUsed > 70 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {budget.percentUsed.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          budget.percentUsed > 90 ? 'bg-red-500' : 
                          budget.percentUsed > 70 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(budget.currentSpend)} / {formatCurrency(budget.monthlyBudget)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Users Table */}
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Top Users by Cost</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-right py-2">Requests</th>
                    <th className="text-right py-2">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(usageData?.topUsers || []).map((user, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 capitalize">{user.role}</td>
                      <td className="text-right py-3">{user.requests}</td>
                      <td className="text-right py-3 font-medium">{formatCurrency(user.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── QUOTAS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'quotas' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Role Quota Definitions</h3>
            <div className="space-y-4">
              {(quotaData?.roleQuotas || []).map((quota) => (
                <div key={quota.role} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold capitalize">{quota.role}</h4>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {quota.modelRestriction || 'Any model'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Daily:</span>
                      <p className="font-medium">{quota.dailyRequests} requests</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <p className="font-medium">{formatCurrency(quota.monthlyBudget)}/mo</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-gray-600">Features:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {quota.allowedFeatures.map((f) => (
                        <span key={f} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">User Quota Overrides</h3>
            <div className="space-y-4">
              {(quotaData?.users || []).slice(0, 10).map((user) => (
                <div key={user.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{user.name}</h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${user.aiEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.aiEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Limit:</span>
                      <p className="font-medium">{user.aiDailyLimit}/day</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <p className="font-medium">{formatCurrency(user.aiMonthlyBudget)}/mo</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm capitalize">{user.role}</span>
                    <span className="text-xs text-gray-500">
                      {formatCurrency(user.currentMonthUsage.cost)} used
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">All Users with AI Access</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Site</th>
                  <th className="text-right py-3 px-4">Daily Limit</th>
                  <th className="text-right py-3 px-4">Monthly Budget</th>
                  <th className="text-right py-3 px-4">This Month</th>
                  <th className="text-center py-3 px-4">Model</th>
                  <th className="text-center py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {(quotaData?.users || []).map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize">{user.role}</td>
                    <td className="py-3 px-4">{user.site?.domain || '-'}</td>
                    <td className="text-right py-3 px-4">{user.aiDailyLimit}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(user.aiMonthlyBudget)}</td>
                    <td className="text-right py-3 px-4">
                      {formatCurrency(user.currentMonthUsage.cost)}
                      <p className="text-xs text-gray-500">{user.currentMonthUsage.requests} req</p>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {user.aiModelRestriction || 'Any'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded ${user.aiEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.aiEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Export Reports</h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
                <Download className="h-4 w-4" />
                Export Monthly CSV
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Download className="h-4 w-4" />
                Export Detailed JSON
              </button>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Insights</h3>
            <div className="space-y-3">
              {usageData && (
                <>
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                    <p className="text-sm">
                      <strong>{usageData.bySite.length}</strong> active branches using AI
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-amber-600 mt-0.5" />
                    <p className="text-sm">
                      <strong>{usageData.modelUsage.length}</strong> different models in use
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                    <p className="text-sm">
                      <strong>{usageData.budgetStatus.filter(b => b.percentUsed > 80).length}</strong> roles above 80% budget
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm">
                      <strong>{usageData.byFeature.length}</strong> AI features actively used
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}