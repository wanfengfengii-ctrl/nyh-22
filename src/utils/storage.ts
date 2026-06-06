import type {
  MicroLandscape,
  CareRecord,
  CareRuleConfig,
  ReminderTask,
  AbnormalRecord,
  OperationLog,
  BatchImportItem,
  Customer,
  CustomOrder,
  ProductionProgressRecord,
  DeliveryConfirm,
  AfterSaleVisit,
  VisitTask,
  PointRecord,
  Coupon,
  CouponRedemption,
  MarketingCampaign,
  CampaignRegistration,
  MarketingReminder,
  CustomerSegment,
  CampaignVisitTrack
} from '@/types'

const LANDSCAPES_KEY = 'moss_landscapes'
const CARE_RECORDS_KEY = 'moss_care_records'
const CARE_RULES_KEY = 'moss_care_rules'
const REMINDER_TASKS_KEY = 'moss_reminder_tasks'
const ABNORMAL_RECORDS_KEY = 'moss_abnormal_records'
const OPERATION_LOGS_KEY = 'moss_operation_logs'
const CUSTOMERS_KEY = 'moss_customers'
const CUSTOM_ORDERS_KEY = 'moss_custom_orders'
const PRODUCTION_RECORDS_KEY = 'moss_production_records'
const DELIVERY_CONFIRMS_KEY = 'moss_delivery_confirms'
const AFTER_SALE_VISITS_KEY = 'moss_after_sale_visits'
const VISIT_TASKS_KEY = 'moss_visit_tasks'
const POINT_RECORDS_KEY = 'moss_point_records'
const COUPONS_KEY = 'moss_coupons'
const COUPON_REDEMPTIONS_KEY = 'moss_coupon_redemptions'
const MARKETING_CAMPAIGNS_KEY = 'moss_marketing_campaigns'
const CAMPAIGN_REGISTRATIONS_KEY = 'moss_campaign_registrations'
const MARKETING_REMINDERS_KEY = 'moss_marketing_reminders'
const CUSTOMER_SEGMENTS_KEY = 'moss_customer_segments'
const CAMPAIGN_VISIT_TRACKS_KEY = 'moss_campaign_visit_tracks'

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

export function dateStrToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

export function timestampToDateStr(timestamp: number | null): string {
  if (!timestamp) return ''
  return formatDate(new Date(timestamp))
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

export function getCustomers(): Customer[] {
  return getData<Customer>(CUSTOMERS_KEY)
}

export function saveCustomers(customers: Customer[]): void {
  saveData(CUSTOMERS_KEY, customers)
}

export function getCustomOrders(): CustomOrder[] {
  return getData<CustomOrder>(CUSTOM_ORDERS_KEY)
}

export function saveCustomOrders(orders: CustomOrder[]): void {
  saveData(CUSTOM_ORDERS_KEY, orders)
}

export function getProductionRecords(): ProductionProgressRecord[] {
  return getData<ProductionProgressRecord>(PRODUCTION_RECORDS_KEY)
}

export function saveProductionRecords(records: ProductionProgressRecord[]): void {
  saveData(PRODUCTION_RECORDS_KEY, records)
}

export function getDeliveryConfirms(): DeliveryConfirm[] {
  return getData<DeliveryConfirm>(DELIVERY_CONFIRMS_KEY)
}

export function saveDeliveryConfirms(confirms: DeliveryConfirm[]): void {
  saveData(DELIVERY_CONFIRMS_KEY, confirms)
}

export function getAfterSaleVisits(): AfterSaleVisit[] {
  return getData<AfterSaleVisit>(AFTER_SALE_VISITS_KEY)
}

export function saveAfterSaleVisits(visits: AfterSaleVisit[]): void {
  saveData(AFTER_SALE_VISITS_KEY, visits)
}

export function getVisitTasks(): VisitTask[] {
  return getData<VisitTask>(VISIT_TASKS_KEY)
}

export function saveVisitTasks(tasks: VisitTask[]): void {
  saveData(VISIT_TASKS_KEY, tasks)
}

export function generateOrderNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `DD${year}${month}${day}${random}`
}

export function isPhoneValid(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

export function isEmailValid(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isDateNotPast(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  return !isNaN(date.getTime()) && date >= today
}

export function isBudgetValid(min: number, max: number): boolean {
  return typeof min === 'number' && typeof max === 'number' && min >= 0 && max >= min
}

export function getPointRecords(): PointRecord[] {
  return getData<PointRecord>(POINT_RECORDS_KEY)
}

export function savePointRecords(records: PointRecord[]): void {
  saveData(POINT_RECORDS_KEY, records)
}

export function getCoupons(): Coupon[] {
  return getData<Coupon>(COUPONS_KEY)
}

export function saveCoupons(coupons: Coupon[]): void {
  saveData(COUPONS_KEY, coupons)
}

export function getCouponRedemptions(): CouponRedemption[] {
  return getData<CouponRedemption>(COUPON_REDEMPTIONS_KEY)
}

export function saveCouponRedemptions(redemptions: CouponRedemption[]): void {
  saveData(COUPON_REDEMPTIONS_KEY, redemptions)
}

export function getMarketingCampaigns(): MarketingCampaign[] {
  return getData<MarketingCampaign>(MARKETING_CAMPAIGNS_KEY)
}

export function saveMarketingCampaigns(campaigns: MarketingCampaign[]): void {
  saveData(MARKETING_CAMPAIGNS_KEY, campaigns)
}

export function getCampaignRegistrations(): CampaignRegistration[] {
  return getData<CampaignRegistration>(CAMPAIGN_REGISTRATIONS_KEY)
}

export function saveCampaignRegistrations(registrations: CampaignRegistration[]): void {
  saveData(CAMPAIGN_REGISTRATIONS_KEY, registrations)
}

export function getMarketingReminders(): MarketingReminder[] {
  return getData<MarketingReminder>(MARKETING_REMINDERS_KEY)
}

export function saveMarketingReminders(reminders: MarketingReminder[]): void {
  saveData(MARKETING_REMINDERS_KEY, reminders)
}

export function getCustomerSegments(): CustomerSegment[] {
  return getData<CustomerSegment>(CUSTOMER_SEGMENTS_KEY)
}

export function saveCustomerSegments(segments: CustomerSegment[]): void {
  saveData(CUSTOMER_SEGMENTS_KEY, segments)
}

export function getCampaignVisitTracks(): CampaignVisitTrack[] {
  return getData<CampaignVisitTrack>(CAMPAIGN_VISIT_TRACKS_KEY)
}

export function saveCampaignVisitTracks(tracks: CampaignVisitTrack[]): void {
  saveData(CAMPAIGN_VISIT_TRACKS_KEY, tracks)
}

export function generateCouponCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateCampaignNo(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `ACT${year}${month}${day}${random}`
}
