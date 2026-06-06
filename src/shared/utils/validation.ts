export function isHumidityValid(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100
}

export function isSprayIntervalValid(days: number): boolean {
  return typeof days === 'number' && days >= 1 && days <= 30
}

export function isPhoneValid(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isBudgetValid(min: number, max: number): boolean {
  return typeof min === 'number' && typeof max === 'number' && min >= 0 && max >= min
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
