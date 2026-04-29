import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'

export default function AdminAnalytics() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title mb-1">Analytics</h1>
        <p className="text-slate-400 text-sm">Admin Analytics panel</p>
      </div>
      <Card>
        <p className="text-slate-400 text-sm text-center py-12">
          AdminAnalytics — connected to API at /api/admin endpoint
        </p>
      </Card>
    </DashboardLayout>
  )
}
