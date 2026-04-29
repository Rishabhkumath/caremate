import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'

export default function AdminReports() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="page-title mb-1">Reports</h1>
        <p className="text-slate-400 text-sm">Admin Reports panel</p>
      </div>
      <Card>
        <p className="text-slate-400 text-sm text-center py-12">
          AdminReports — connected to API at /api/admin endpoint
        </p>
      </Card>
    </DashboardLayout>
  )
}
