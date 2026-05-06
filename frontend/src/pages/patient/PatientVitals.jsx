import { useState } from 'react'
import DashboardLayout from '../../components/common/DashboardLayout'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Modal from '../../components/common/Modal'
import VitalsForm from '../../components/vitals/VitalsForm'
import VitalsHistory from '../../components/vitals/VitalsHistory'
import VitalCard from '../../components/vitals/VitalCard'
import HeartRateChart from '../../components/charts/HeartRateChart'
import BloodPressureChart from '../../components/charts/BloodPressureChart'
import OxygenLevelChart from '../../components/charts/OxygenLevelChart'
import TemperatureChart from '../../components/charts/TemperatureChart'
import { useVitals } from '../../hooks/useVitals'
import { getVitalScalar, hasVitalScalar } from '../../utils/vitalValues'
import { Plus, Heart, Droplet, Wind, Thermometer } from 'lucide-react'

export default function PatientVitals() {
  const { vitals, latest, logVital } = useVitals()
  const [logModal, setLogModal] = useState(false)

  const heartRate = getVitalScalar(latest?.heartRate)
  const systolic = latest?.bloodPressure?.systolic ?? latest?.bp?.systolic ?? null
  const diastolic = latest?.bloodPressure?.diastolic ?? latest?.bp?.diastolic ?? null
  const oxygenLevel = getVitalScalar(latest?.oxygenSaturation ?? latest?.oxygenLevel)
  const temperature = getVitalScalar(latest?.temperature)
  const bpDisplay = hasVitalScalar(systolic) && hasVitalScalar(diastolic) ? `${systolic}/${diastolic}` : null

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title mb-1">My Vitals</h1>
          <p className="text-slate-400 text-sm">Track and monitor your health metrics</p>
        </div>
        <Button onClick={() => setLogModal(true)} icon={Plus}>Log Vitals</Button>
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
        <h3 className="section-title mb-5">All Readings</h3>
        <VitalsHistory vitals={vitals} />
      </Card>

      <Modal isOpen={logModal} onClose={() => setLogModal(false)} title="Log Vitals">
        <VitalsForm logVital={logVital} onSuccess={() => setLogModal(false)} />
      </Modal>
    </DashboardLayout>
  )
}
