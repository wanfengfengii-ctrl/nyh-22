import type { MicroLandscape, CareRecord } from '@/types'

const LANDSCAPES_KEY = 'moss_landscapes'
const CARE_RECORDS_KEY = 'moss_care_records'

export function getLandscapes(): MicroLandscape[] {
  const data = localStorage.getItem(LANDSCAPES_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveLandscapes(landscapes: MicroLandscape[]): void {
  localStorage.setItem(LANDSCAPES_KEY, JSON.stringify(landscapes))
}

export function getCareRecords(): CareRecord[] {
  const data = localStorage.getItem(CARE_RECORDS_KEY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveCareRecords(records: CareRecord[]): void {
  localStorage.setItem(CARE_RECORDS_KEY, JSON.stringify(records))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getToday(): string {
  return formatDate(new Date())
}

export function isDateValid(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return !isNaN(date.getTime()) && date <= today
}

export function isHumidityValid(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100
}
