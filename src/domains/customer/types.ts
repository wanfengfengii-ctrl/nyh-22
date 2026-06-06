import type { TaskPriority } from '@/domains/landscape/types'

export type CustomerSource = 'recommendation' | 'social_media' | 'offline_store' | 'online_platform' | 'exhibition' | 'other'

export type OrderStatus = 'pending' | 'designing' | 'producing' | 'quality_check' | 'ready' | 'delivered' | 'cancelled'

export type ProductionStage = 'demand_confirm' | 'design' | 'material_prep' | 'production' | 'assembly' | 'quality_check' | 'packaging'

export type VisitStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export type RepurchaseIntention = 'high' | 'medium' | 'low' | 'none'

export interface Customer {
  id: string
  name: string
  phone: string
  wechatId?: string
  email?: string
  address?: string
  birthday?: string
  source: CustomerSource
  sourceDetail?: string
  tags: string[]
  memberLevel: MemberLevel
  points: number
  totalOrders: number
  totalAmount: number
  firstOrderDate?: string
  lastOrderDate?: string
  repurchaseIntention?: RepurchaseIntention
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CustomOrder {
  id: string
  orderNo: string
  customerId: string
  customerName: string
  landscapeIds: string[]
  demandDescription: string
  containerType: string
  mossSpecies: string
  size: string
  style: string
  budgetMin: number
  budgetMax: number
  finalPrice?: number
  appointmentDeliveryDate: string
  actualDeliveryDate?: string
  status: OrderStatus
  currentStage: ProductionStage
  progressPercent: number
  isOverdue: boolean
  isUrgent: boolean
  depositAmount?: number
  balanceAmount?: number
  paymentStatus: 'unpaid' | 'deposit_paid' | 'paid'
  designFiles: string[]
  productionNotes: string
  qualityCheckResult?: string
  deliveryMethod: 'self_pickup' | 'express' | 'local_delivery'
  trackingNumber?: string
  createdAt: string
  updatedAt: string
}

export interface ProductionProgressRecord {
  id: string
  orderId: string
  stage: ProductionStage
  stageName: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  operator: string
  startTime?: string
  endTime?: string
  description: string
  attachments: string[]
  createdAt: string
}

export interface DeliveryConfirm {
  id: string
  orderId: string
  customerId: string
  deliveryDate: string
  receiverName: string
  receiverPhone: string
  deliveryMethod: 'self_pickup' | 'express' | 'local_delivery'
  trackingNumber?: string
  packageCondition: 'good' | 'slightly_damaged' | 'damaged'
  productCondition: 'good' | 'minor_issue' | 'serious_issue'
  customerSignature?: string
  deliveryNotes: string
  isConfirmed: boolean
  confirmedAt?: string
  createdAt: string
}

export interface AfterSaleVisit {
  id: string
  orderId: string
  customerId: string
  visitDate: string
  visitType: 'phone' | 'wechat' | 'onsite'
  visitor: string
  satisfactionScore: number
  productFeedback: string
  usageFeedback: string
  suggestions: string
  issuesReported: string
  issueHandled: boolean
  handlingResult?: string
  repurchaseIntention: RepurchaseIntention
  repurchaseIntentionDetail?: string
  nextFollowUpDate?: string
  isCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface VisitTask {
  id: string
  orderId: string
  customerId: string
  customerName: string
  taskType: 'delivery_visit' | 'periodic_visit' | 'complaint_followup'
  title: string
  description: string
  plannedDate: string
  status: VisitStatus
  priority: TaskPriority
  assignedTo: string
  visitRecordId?: string
  createdAt: string
  completedAt?: string
}

export interface CustomerSourceStat {
  source: CustomerSource
  sourceLabel: string
  count: number
  amount: number
  conversionRate: number
}

export interface VisitConversionStat {
  period: string
  totalVisits: number
  satisfiedCount: number
  repurchaseCount: number
  conversionRate: number
}

export type MemberLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'

export interface MemberLevelConfig {
  level: MemberLevel
  name: string
  minPoints: number
  maxPoints: number
  discount: number
  color: string
  benefits: string[]
}

export interface CustomerState {
  customers: Customer[]
  customOrders: CustomOrder[]
  productionRecords: ProductionProgressRecord[]
  deliveryConfirms: DeliveryConfirm[]
  afterSaleVisits: AfterSaleVisit[]
  visitTasks: VisitTask[]
}
