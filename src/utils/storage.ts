import type {
  MicroLandscape,
  CareRecord,
  CareRuleConfig,
  ReminderTask,
  AbnormalRecord,
  OperationLog,
  BatchImportItem
} from '@/types'

const LANDSCAPES_KEY = 'moss_landscapes'
const CARE_RECORDS_KEY = 'moss_care_records'
const CARE_RULES_KEY = 'moss_care_rules'
const REMINDER_TASKS_KEY = 'moss_reminder_tasks'
const ABNORMAL_RECORDS_KEY = 'moss_abnormal_records'
const OPERATION_LOGS_KEY = 'moss_operation_logs'

function getData<T>(key: string): T[] {
  const data = localStorage.getItem(key)
  if (!data) return []
  try {
    return JSON.parse(data) as T[]
  } catch {
    return []
  }
}

function saveData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function getLandscapes(): MicroLandscape[] {
  return getData<MicroLandscape>(LANDSCAPES_KEY)
}

export function saveLandscapes(landscapes: MicroLandscape[]): void {
  saveData(LANDSCAPES_KEY, landscapes)
}

export function getCareRecords(): CareRecord[] {
  return getData<CareRecord>(CARE_RECORDS_KEY)
}

export function saveCareRecords(records: CareRecord[]): void {
  saveData(CARE_RECORDS_KEY, records)
}

export function getCareRules(): CareRuleConfig[] {
  return getData<CareRuleConfig>(CARE_RULES_KEY)
}

export function saveCareRules(rules: CareRuleConfig[]): void {
  saveData(CARE_RULES_KEY, rules)
}

export function getReminderTasks(): ReminderTask[] {
  return getData<ReminderTask>(REMINDER_TASKS_KEY)
}

export function saveReminderTasks(tasks: ReminderTask[]): void {
  saveData(REMINDER_TASKS_KEY, tasks)
}

export function getAbnormalRecords(): AbnormalRecord[] {
  return getData<AbnormalRecord>(ABNORMAL_RECORDS_KEY)
}

export function saveAbnormalRecords(records: AbnormalRecord[]): void {
  saveData(ABNORMAL_RECORDS_KEY, records)
}

export function getOperationLogs(): OperationLog[] {
  return getData<OperationLog>(OPERATION_LOGS_KEY)
}

export function saveOperationLogs(logs: OperationLog[]): void {
  saveData(OPERATION_LOGS_KEY, logs)
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

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

export function diffDays(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1)
  const d2 = new Date(dateStr2)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

export function isDateValid(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return !isNaN(date.getTime()) && date <= today
}

export function isDateNotFuture(dateStr: string): boolean {
  return isDateValid(dateStr)
}

export function isHumidityValid(value: number): boolean {
  return typeof value === 'number' && value >= 0 && value <= 100
}

export function isSprayIntervalValid(days: number): boolean {
  return typeof days === 'number' && days >= 1 && days <= 30
}

export function getDateRange(days: number): string[] {
  const result: string[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    result.push(formatDate(date))
  }
  return result
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function parseCSV(csvText: string): string[][] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim())
  return lines.map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  })
}

export function validateBatchImportItem(item: BatchImportItem): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!item.code?.trim()) {
    errors.push('作品编号不能为空')
  }
  if (!item.containerType?.trim()) {
    errors.push('容器类型不能为空')
  }
  if (!item.mossSpecies?.trim()) {
    errors.push('苔藓品种不能为空')
  }
  if (!item.creationDate) {
    errors.push('制作日期不能为空')
  } else if (!isDateValid(item.creationDate)) {
    errors.push('制作日期不能晚于当前日期')
  }
  if (!item.lightCondition?.trim()) {
    errors.push('光照条件不能为空')
  }
  if (!isHumidityValid(item.humidityMin)) {
    errors.push('最小湿度值必须在 0-100 之间')
  }
  if (!isHumidityValid(item.humidityMax)) {
    errors.push('最大湿度值必须在 0-100 之间')
  }
  if (item.humidityMin > item.humidityMax) {
    errors.push('最小湿度不能大于最大湿度')
  }
  if (!item.status) {
    errors.push('状态不能为空')
  }

  return { valid: errors.length === 0, errors }
}
