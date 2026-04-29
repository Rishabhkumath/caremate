import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { doctorApi } from '../../api/doctorApi'
import { caregiverApi } from '../../api/caregiverApi'
import { Users, Search, Activity, Pill, Calendar } from 'lucide-react'
import { formatDate } from '../../utils/formatDate'
import toast from 'react-hot-toast'

export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [prescriptions, setPrescriptions] = useState([])
  const [caregivers, setCaregivers] = useState([])
  const [caregiverLoadError, setCaregiverLoadError] = useState('')
  const [selectedCaregivers, setSelectedCaregivers] = useState({})
  const [assigningPatientId, setAssigningPatientId] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')

  useEffect(() => {
    Promise.all([
      doctorApi.getPatients(),
      doctorApi.getPrescriptions().catch(() => ({ data: [] })),
      caregiverApi.getAll().catch((err) => ({
        data: { data: [] },
        caregiverError: err?.response?.data?.message || err?.message || 'Failed to load caregivers',
      })),
    ])
      .then(([patientRes, prescriptionRes, caregiverRes]) => {
        setPatients(patientRes.data?.data || patientRes.data || [])
        setPrescriptions(prescriptionRes.data?.data || prescriptionRes.data || [])
        setCaregivers(caregiverRes.data?.data || caregiverRes.data || [])
        setCaregiverLoadError(caregiverRes.caregiverError || '')
      })
      .catch(() => toast.error('Failed to load patients'))
      .finally(() => setLoading(false))
  }, [])

  const prescriptionsByPatient = prescriptions.reduce((acc, prescription) => {
    const patientId = prescription.patient?._id || prescription.patient
    if (!patientId) return acc

    if (!acc[patientId]) acc[patientId] = []
    acc[patientId].push(prescription)
    return acc
  }, {})

  const filtered = patients.filter(p => {
    const name  = p.user?.name  || p.name  || ''
    const email = p.user?.email || p.email || ''
    return name.toLowerCase().includes(search.toLowerCase()) ||
           email.toLowerCase().includes(search.toLowerCase())
  })

  const caregiverOptions = caregivers.map(caregiver => ({
    value: caregiver._id,
    label: `${caregiver.user?.name || 'Caregiver'}${caregiver.qualification ? ` - ${caregiver.qualification}` : ''}`,
  }))

  const handleAssignCaregiver = async (patientId) => {
    const caregiverId = selectedCaregivers[patientId]
    if (!caregiverId) return toast.error('Select a caregiver')

    setAssigningPatientId(patientId)
    try {
      const res = await doctorApi.assignCaregiver(patientId, caregiverId)
      const updatedPatient = res.data?.data || res.data
      setPatients(prev => prev.map(patient => patient._id === patientId ? updatedPatient : patient))
      setSelectedCaregivers(prev => ({ ...prev, [patientId]: '' }))
      toast.success('Caregiver assigned')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to assign caregiver')
    } finally {
      setAssigningPatientId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">My Patients</h1>
          <p className="mt-1 text-sm" style={{ color: '#64748b' }}>
            {patients.length} patient{patients.length !== 1 ? 's' : ''} under your care
          </p>
        </div>
      </div>

      {/* Search */}
      <Card padding="p-4">
        <Input
          name="search" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search patients by name or email…"
          icon={Search}
        />
      </Card>

      {/* Patient list */}
      {loading ? (
        <Card padding="p-8">
          <p className="text-center text-sm" style={{ color: '#94a3b8' }}>Loading patients…</p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card padding="p-12">
          <div className="text-center">
            <Users size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p className="font-medium" style={{ color: '#64748b' }}>
              {search ? 'No patients match your search' : 'No patients assigned yet'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(p => {
            const name  = p.user?.name  || p.name  || 'Patient'
            const email = p.user?.email || p.email || ''
            const age   = p.dateOfBirth
              ? Math.floor((new Date() - new Date(p.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
              : null
            const patientPrescriptions = (prescriptionsByPatient[p._id] || [])
              .slice()
              .sort((a, b) => new Date(b.createdAt || b.prescribedDate || 0) - new Date(a.createdAt || a.prescribedDate || 0))
            const latestPrescription = patientPrescriptions[0]

            return (
              <div key={p._id}
                   style={{ background: '#fff', border: '1px solid #e2e8f0',
                             borderRadius: 14, padding: 20,
                             transition: 'box-shadow 0.2s, transform 0.2s' }}
                   onMouseEnter={e => {
                     e.currentTarget.style.boxShadow = '0 4px 20px rgba(42,125,225,0.10)'
                     e.currentTarget.style.transform = 'translateY(-1px)'
                   }}
                   onMouseLeave={e => {
                     e.currentTarget.style.boxShadow = 'none'
                     e.currentTarget.style.transform = 'translateY(0)'
                   }}>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%',
                                background: '#e8f1fd', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontSize: 18, fontWeight: 700, color: '#2a7de1', flexShrink: 0 }}>
                    {name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14,
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                      {name}
                    </p>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0',
                                 overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {email}
                    </p>
                  </div>
                </div>

                {/* Info */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                  {age && (
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                   background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                      Age {age}
                    </span>
                  )}
                  {p.gender && (
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                   background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0',
                                   textTransform: 'capitalize' }}>
                      {p.gender}
                    </span>
                  )}
                  {p.bloodType && (
                    <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                   background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                      {p.bloodType}
                    </span>
                  )}
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 999,
                                 background: '#eef6ff', color: '#2a7de1', border: '1px solid #bfdbfe' }}>
                    {patientPrescriptions.length} prescription{patientPrescriptions.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', margin: 0 }}>
                    Prescriptions
                  </p>
                  {latestPrescription ? (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', margin: '8px 0 4px' }}>
                        {latestPrescription.name || latestPrescription.medicationName || 'Medication'}
                      </p>
                      <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                        {latestPrescription.dosage || 'Dosage not set'} • {latestPrescription.frequency || 'Frequency not set'}
                      </p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
                        Last added {formatDate(latestPrescription.createdAt || latestPrescription.prescribedDate)}
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '8px 0 0' }}>
                      No prescriptions added yet
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#64748b', margin: '0 0 10px' }}>
                    Caregiver
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
                    {(p.assignedCaregivers || []).length
                      ? `Assigned: ${(p.assignedCaregivers || []).map(c => c.user?.name || 'Caregiver').join(', ')}`
                      : 'No caregiver assigned'}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <Select
                      name={`caregiver-${p._id}`}
                      value={selectedCaregivers[p._id] || ''}
                      onChange={(e) => setSelectedCaregivers(prev => ({ ...prev, [p._id]: e.target.value }))}
                      options={caregiverOptions}
                      placeholder={caregiverLoadError || (caregiverOptions.length ? 'Select caregiver' : 'No caregivers available')}
                      disabled={!!caregiverLoadError}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAssignCaregiver(p._id)}
                      loading={assigningPatientId === p._id}
                    >
                      Assign Caregiver
                    </Button>
                  </div>
                </div>

                {/* Quick links */}
                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                  {[
                    { icon: Activity, label: 'Vitals',       href: `/doctor/patients/${p._id}/vitals`       },
                    { icon: Pill,     label: 'Medications',  href: `/doctor/patients/${p._id}/medications`  },
                    { icon: Calendar, label: 'Appointments', href: `/doctor/schedule`                       },
                  ].map(({ icon: Icon, label, href }) => (
                    <a key={label} href={href}
                       style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                                 gap: 4, padding: '8px 4px', borderRadius: 10, background: '#f8fafc',
                                 border: '1px solid #e2e8f0', textDecoration: 'none',
                                 color: '#2a7de1', fontSize: 11, fontWeight: 500,
                                 transition: 'background 0.2s' }}
                       onMouseEnter={e => e.currentTarget.style.background = '#e8f1fd'}
                       onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                      <Icon size={14} />
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </DashboardLayout>
  )
}
