import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import VitalsHistory from '../../components/vitals/VitalsHistory'
import VitalCard from '../../components/vitals/VitalCard'
import HeartRateChart from '../../components/charts/HeartRateChart'
import BloodPressureChart from '../../components/charts/BloodPressureChart'
import OxygenLevelChart from '../../components/charts/OxygenLevelChart'
import TemperatureChart from '../../components/charts/TemperatureChart'
import { useVitals } from '../../hooks/useVitals'
import { getVitalScalar, hasVitalScalar } from '../../utils/vitalValues'
import { ArrowLeft, Heart, Droplet, Wind, Thermometer } from 'lucide-react'

export default function DoctorPatientVitals() {
  const { patientId } = useParams()
  const { vitals, latest, loading } = useVitals(patientId)

  const heartRate = getVitalScalar(latest?.heartRate)
  const systolic = latest?.bloodPressure?.systolic ?? latest?.bp?.systolic ?? null
  const diastolic = latest?.bloodPressure?.diastolic ?? latest?.bp?.diastolic ?? null
  const oxygenLevel = getVitalScalar(latest?.oxygenSaturation ?? latest?.oxygenLevel)
  const temperature = getVitalScalar(latest?.temperature)
  const bpDisplay = hasVitalScalar(systolic) && hasVitalScalar(diastolic) ? `${systolic}/${diastolic}` : null

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="page-title mb-1">Patient Vitals</h1>
          <p className="text-slate-400 text-sm">Viewing the latest recorded vitals for this patient</p>
        </div>
        <Link to="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#2a7de1' }}>
          <ArrowLeft size={16} />
          Back to Patients
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <VitalCard type="heartRate" label="Heart Rate" value={heartRate} unit="bpm" icon={Heart} color="red" />
        <VitalCard type="systolic" label="Blood Pressure" value={bpDisplay} unit="mmHg" icon={Droplet} color="blue" />
        <VitalCard type="oxygenLevel" label="Oxygen Level" value={oxygenLevel} unit="%" icon={Wind} color="teal" />
        <VitalCard type="temperature" label="Temperature" value={temperature} unit="deg F" icon={Thermometer} color="orange" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[
          { title: 'Heart Rate', Chart: HeartRateChart },
          { title: 'Blood Pressure', Chart: BloodPressureChart },
          { title: 'Oxygen Level', Chart: OxygenLevelChart },
          { title: 'Temperature', Chart: TemperatureChart },
        ].map(({ title, Chart }) => (
          <Card key={title}>
            <h3 className="section-title text-base mb-4">{title} History</h3>
            <Chart data={vitals.slice(-14)} />
          </Card>
        ))}
      </div>

      <Card>
        <h3 className="section-title mb-5">{loading ? 'Loading Vitals...' : 'All Readings'}</h3>
        <VitalsHistory vitals={vitals} />
      </Card>
    </DashboardLayout>
  )
}
