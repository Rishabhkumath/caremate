export const getVitalStatus = (type, value) => {
  const ranges = {
    heartRate: { low: 60, high: 100, unit: 'bpm' },
    oxygenLevel: { low: 95, high: 100, unit: '%' },
    temperature: { low: 97, high: 99.5, unit: '°F' },
    systolic: { low: 90, high: 120, unit: 'mmHg' },
    diastolic: { low: 60, high: 80, unit: 'mmHg' },
  }

  const range = ranges[type]
  if (!range) return { status: 'unknown', color: 'text-slate-400', bg: 'bg-slate-400/10' }

  const numVal = parseFloat(value)
  if (numVal < range.low) return { status: 'low', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Low' }
  if (numVal > range.high) return { status: 'high', color: 'text-red-400', bg: 'bg-red-400/10', label: 'High' }
  return { status: 'normal', color: 'text-teal-400', bg: 'bg-teal-400/10', label: 'Normal' }
}

export const formatBP = (systolic, diastolic) => {
  if (!systolic || !diastolic) return '—'
  return `${systolic}/${diastolic}`
}

export const getVitalUnit = (type) => {
  const units = {
    heartRate: 'bpm',
    oxygenLevel: '%',
    temperature: '°F',
    bloodPressure: 'mmHg',
  }
  return units[type] || ''
}

export const getVitalIcon = (type) => {
  const icons = {
    heartRate: '❤️',
    oxygenLevel: '🫁',
    temperature: '🌡️',
    bloodPressure: '💉',
  }
  return icons[type] || '📊'
}
