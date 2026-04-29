const isRenderableScalar = (value) => typeof value === 'number' || typeof value === 'string'

export const getVitalScalar = (value) => {
  if (value == null) return null
  if (isRenderableScalar(value)) return value
  if (typeof value === 'object' && isRenderableScalar(value.value)) return value.value
  return null
}

export const hasVitalScalar = (value) => value !== null && value !== undefined && value !== ''
