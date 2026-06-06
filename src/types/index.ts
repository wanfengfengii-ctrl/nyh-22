export type LandscapeStatus = 'healthy' | 'yellowing' | 'mold' | 'sold'

export type CareType = 'spray' | 'water' | 'clean' | 'prune' | 'other'

export type AbnormalStatus = 'yellowing' | 'mold'

export type TaskPriority = 'high' | 'medium' | 'low'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type BatchOperationType = 'status_update' | 'care_record' | 'sold' | 'delete'

export type LogActionType =
  | 'landscape_create'
  | 'landscape_update'
  | 'landscape_delete'
  | 'landscape_sold'
  | 'care_record_create'
  | 'care_record_delete'
  | 'batch_operation'
  | 'abnormal_open'
  | 'abnormal_close'
  | 'rule_update'
  | 'batch_import'
  | 'batch_export'

export interface MicroLandscape {
  id: string
  code: string
  containerType: string
  mossSpecies: string
  creationDate: string
  lightCondition: string
  humidityMin: number
  humidityMax: number
  status: LandscapeStatus
  lastCareDate: string
  isSold: boolean
  statusBeforeSold?: LandscapeStatus
  notes: string
  createdAt: string
  updatedAt: string
  abnormalRecords?: AbnormalRecord[]
}

export interface CareRecord {
  id: string
  landscapeId: string
  careDate: string
  careType: CareType
  humidity: number
  statusBefore: LandscapeStatus
  statusAfter: LandscapeStatus
  notes: string
  createdAt: string
}

export interface CareRuleConfig {
  id: string
  name: string
  sprayIntervalDays: number
  humidityWarningMin: number
  humidityWarningMax: number
  lightRiskLevel: 'low' | 'medium' | 'high'
  isDefault: boolean
  applicableSpecies: string[]
  createdAt: string
  updatedAt: string
}

export interface ReminderTask {
  id: string
  landscapeId: string
  landscapeCode: string
  type: 'spray_due' | 'humidity_low' | 'humidity_high' | 'light_risk' | 'abnormal'
  priority: TaskPriority
  title: string
  description: string
  dueDate: string
  status: TaskStatus
  createdAt: string
  completedAt?: string
}

export interface AbnormalRecord {
  id: string
  landscapeId: string
  type: AbnormalStatus
  foundDate: string
  description: string
  treatmentMethod: string
  closedDate?: string
  closingResult: string
  isClosed: boolean
  createdAt: string
  updatedAt: string
}

export interface BatchImportItem {
  code: string
  containerType: string
  mossSpecies: string
  creationDate: string
  lightCondition: string
  humidityMin: number
  humidityMax: number
  status: LandscapeStatus
  notes?: string
  lastCareDate?: string
}

export interface OperationLog {
  id: string
  action: LogActionType
  actionLabel: string
  targetType: 'landscape' | 'care_record' | 'rule' | 'batch'
  targetId: string
  targetName: string
  operator: string
  detail: string
  createdAt: string
}

export interface CareTrendData {
  date: string
  careCount: number
  abnormalCount: number
  abnormalRate: number
}

export const landscapeStatusOptions = [
  { label: '生长正常', value: 'healthy' },
  { label: '出现黄化', value: 'yellowing' },
  { label: '出现霉斑', value: 'mold' },
  { label: '已售出', value: 'sold' }
]

export const careTypeOptions = [
  { label: '喷雾', value: 'spray' },
  { label: '浇水', value: 'water' },
  { label: '清洁', value: 'clean' },
  { label: '修剪', value: 'prune' },
  { label: '其他', value: 'other' }
]

export const mossSpeciesOptions = [
  '大灰藓',
  '白发藓',
  '短绒藓',
  '大羽藓',
  '仙鹤藓',
  '葫芦藓',
  '泥炭藓',
  '珠藓'
]

export const containerTypeOptions = [
  '玻璃圆瓶',
  '玻璃方缸',
  '陶瓷盆',
  '木质花盆',
  '悬挂玻璃瓶',
  '生态瓶'
]

export const lightConditionOptions = [
  '明亮散射光',
  '半阴环境',
  '阴暗环境',
  '人工补光'
]

export const taskPriorityOptions = [
  { label: '高优先级', value: 'high', color: '#d03050' },
  { label: '中优先级', value: 'medium', color: '#f0a020' },
  { label: '低优先级', value: 'low', color: '#18a058' }
]

export const taskStatusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

export const reminderTypeOptions = [
  { label: '喷雾到期', value: 'spray_due' },
  { label: '湿度过低', value: 'humidity_low' },
  { label: '湿度过高', value: 'humidity_high' },
  { label: '光照风险', value: 'light_risk' },
  { label: '异常状态', value: 'abnormal' }
]

export const lightRiskLevelOptions = [
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' }
]

export const abnormalTypeOptions = [
  { label: '黄化', value: 'yellowing' },
  { label: '霉斑', value: 'mold' }
]

export const batchOperationTypeOptions = [
  { label: '更新状态', value: 'status_update' },
  { label: '批量养护', value: 'care_record' },
  { label: '标记售出', value: 'sold' },
  { label: '批量删除', value: 'delete' }
]

export const logActionTypeOptions: { label: string; value: LogActionType }[] = [
  { label: '创建作品', value: 'landscape_create' },
  { label: '更新作品', value: 'landscape_update' },
  { label: '删除作品', value: 'landscape_delete' },
  { label: '作品售出', value: 'landscape_sold' },
  { label: '新增养护记录', value: 'care_record_create' },
  { label: '删除养护记录', value: 'care_record_delete' },
  { label: '批量操作', value: 'batch_operation' },
  { label: '异常开启', value: 'abnormal_open' },
  { label: '异常关闭', value: 'abnormal_close' },
  { label: '规则更新', value: 'rule_update' },
  { label: '批量导入', value: 'batch_import' },
  { label: '批量导出', value: 'batch_export' }
]

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

export const customerSourceOptions = [
  { label: '老客户推荐', value: 'recommendation' },
  { label: '社交媒体', value: 'social_media' },
  { label: '线下门店', value: 'offline_store' },
  { label: '网络平台', value: 'online_platform' },
  { label: '展会活动', value: 'exhibition' },
  { label: '其他', value: 'other' }
]

export const orderStatusOptions = [
  { label: '待确认', value: 'pending', color: '#d03050' },
  { label: '设计中', value: 'designing', color: '#f0a020' },
  { label: '制作中', value: 'producing', color: '#18a058' },
  { label: '质检中', value: 'quality_check', color: '#2080f0' },
  { label: '待交付', value: 'ready', color: '#722ed1' },
  { label: '已交付', value: 'delivered', color: '#18a058' },
  { label: '已取消', value: 'cancelled', color: '#999' }
]

export const productionStageOptions = [
  { label: '需求确认', value: 'demand_confirm' },
  { label: '方案设计', value: 'design' },
  { label: '材料准备', value: 'material_prep' },
  { label: '主体制作', value: 'production' },
  { label: '组装调试', value: 'assembly' },
  { label: '质量检测', value: 'quality_check' },
  { label: '包装待发', value: 'packaging' }
]

export const visitStatusOptions = [
  { label: '待回访', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

export const repurchaseIntentionOptions = [
  { label: '高', value: 'high', color: '#d03050' },
  { label: '中', value: 'medium', color: '#f0a020' },
  { label: '低', value: 'low', color: '#18a058' },
  { label: '无', value: 'none', color: '#999' }
]

export const deliveryMethodOptions = [
  { label: '自提', value: 'self_pickup' },
  { label: '快递', value: 'express' },
  { label: '同城配送', value: 'local_delivery' }
]

export const paymentStatusOptions = [
  { label: '未付款', value: 'unpaid', color: '#d03050' },
  { label: '已付定金', value: 'deposit_paid', color: '#f0a020' },
  { label: '已付清', value: 'paid', color: '#18a058' }
]

export const visitTypeOptions = [
  { label: '电话回访', value: 'phone' },
  { label: '微信回访', value: 'wechat' },
  { label: '上门回访', value: 'onsite' }
]

export const taskTypeOptions = [
  { label: '交付回访', value: 'delivery_visit' },
  { label: '定期回访', value: 'periodic_visit' },
  { label: '投诉跟进', value: 'complaint_followup' }
]

export const budgetRangeOptions = [
  { label: '500元以下', min: 0, max: 500 },
  { label: '500-1000元', min: 500, max: 1000 },
  { label: '1000-2000元', min: 1000, max: 2000 },
  { label: '2000-5000元', min: 2000, max: 5000 },
  { label: '5000元以上', min: 5000, max: Infinity }
]

export const styleOptions = [
  '简约现代',
  '日式禅意',
  '森系自然',
  '中式古典',
  '梦幻童话',
  '极简主义',
  '复古怀旧',
  '其他'
]

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

export type PointChangeType = 'earn_order' | 'earn_signup' | 'earn_activity' | 'earn_birthday' | 'spend_coupon' | 'spend_product' | 'spend_activity' | 'adjust'

export interface PointRecord {
  id: string
  customerId: string
  customerName: string
  type: PointChangeType
  typeLabel: string
  points: number
  balanceAfter: number
  description: string
  relatedId?: string
  createdAt: string
}

export type CouponType = 'discount' | 'fixed_amount' | 'free_shipping' | 'gift'

export type CouponStatus = 'active' | 'inactive' | 'expired'

export interface Coupon {
  id: string
  name: string
  code: string
  type: CouponType
  typeLabel: string
  value: number
  minAmount?: number
  totalQuantity: number
  usedQuantity: number
  startDate: string
  endDate: string
  applicableLevels: MemberLevel[]
  description: string
  status: CouponStatus
  createdAt: string
  updatedAt: string
}

export interface CouponRedemption {
  id: string
  couponId: string
  couponName: string
  customerId: string
  customerName: string
  orderId?: string
  redeemDate: string
  redeemMethod: 'online' | 'offline'
  operator?: string
  status: 'used' | 'cancelled'
  createdAt: string
}

export type CampaignStatus = 'draft' | 'active' | 'ended' | 'cancelled'

export type CampaignType = 'promotion' | 'membership_day' | 'festival' | 'new_product' | 'anniversary'

export interface MarketingCampaign {
  id: string
  name: string
  type: CampaignType
  typeLabel: string
  description: string
  startDate: string
  endDate: string
  targetLevels: MemberLevel[]
  targetTags: string[]
  maxParticipants: number
  participantCount: number
  status: CampaignStatus
  bannerUrl?: string
  rules: string
  rewards: string
  createdAt: string
  updatedAt: string
}

export interface CampaignRegistration {
  id: string
  campaignId: string
  campaignName: string
  customerId: string
  customerName: string
  customerPhone: string
  registerDate: string
  status: 'registered' | 'attended' | 'cancelled'
  notes?: string
  createdAt: string
}

export type ReminderType = 'birthday' | 'festival' | 'member_day' | 'coupon_expire' | 'activity_reminder'

export interface MarketingReminder {
  id: string
  type: ReminderType
  typeLabel: string
  title: string
  content: string
  customerIds: string[]
  sendDate: string
  status: 'pending' | 'sent' | 'cancelled'
  createdAt: string
  sentAt?: string
}

export interface MarketingEffectStat {
  period: string
  newMembers: number
  activeMembers: number
  totalOrders: number
  totalRevenue: number
  couponUsedCount: number
  campaignParticipantCount: number
  conversionRate: number
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  filters: {
    levels?: MemberLevel[]
    sources?: CustomerSource[]
    repurchaseIntentions?: RepurchaseIntention[]
    minOrders?: number
    maxOrders?: number
    minAmount?: number
    maxAmount?: number
    tags?: string[]
  }
  customerCount: number
  createdAt: string
}

export interface CampaignVisitTrack {
  id: string
  campaignId: string
  campaignName: string
  customerId: string
  customerName: string
  visitDate: string
  visitType: 'phone' | 'wechat' | 'onsite'
  visitor: string
  feedback: string
  satisfactionScore: number
  hasRepurchaseIntention: boolean
  nextFollowUpDate?: string
  createdAt: string
}

export const memberLevelOptions = [
  { label: '青铜会员', value: 'bronze', color: '#cd7f32', minPoints: 0, discount: 1 },
  { label: '白银会员', value: 'silver', color: '#c0c0c0', minPoints: 1000, discount: 0.95 },
  { label: '黄金会员', value: 'gold', color: '#ffd700', minPoints: 5000, discount: 0.9 },
  { label: '铂金会员', value: 'platinum', color: '#e5e4e2', minPoints: 20000, discount: 0.85 },
  { label: '钻石会员', value: 'diamond', color: '#b9f2ff', minPoints: 50000, discount: 0.8 }
]

export const pointChangeTypeOptions: { label: string; value: PointChangeType; isPositive: boolean }[] = [
  { label: '消费获得', value: 'earn_order', isPositive: true },
  { label: '注册赠送', value: 'earn_signup', isPositive: true },
  { label: '活动奖励', value: 'earn_activity', isPositive: true },
  { label: '生日赠送', value: 'earn_birthday', isPositive: true },
  { label: '兑换优惠券', value: 'spend_coupon', isPositive: false },
  { label: '兑换商品', value: 'spend_product', isPositive: false },
  { label: '活动报名', value: 'spend_activity', isPositive: false },
  { label: '调整', value: 'adjust', isPositive: false }
]

export const couponTypeOptions: { label: string; value: CouponType }[] = [
  { label: '折扣券', value: 'discount' },
  { label: '满减券', value: 'fixed_amount' },
  { label: '包邮券', value: 'free_shipping' },
  { label: '赠品券', value: 'gift' }
]

export const campaignTypeOptions: { label: string; value: CampaignType }[] = [
  { label: '促销活动', value: 'promotion' },
  { label: '会员日', value: 'membership_day' },
  { label: '节日活动', value: 'festival' },
  { label: '新品发布', value: 'new_product' },
  { label: '周年庆', value: 'anniversary' }
]

export const campaignStatusOptions: { label: string; value: CampaignStatus; color: string }[] = [
  { label: '草稿', value: 'draft', color: '#999' },
  { label: '进行中', value: 'active', color: '#18a058' },
  { label: '已结束', value: 'ended', color: '#2080f0' },
  { label: '已取消', value: 'cancelled', color: '#d03050' }
]

export const marketingReminderTypeOptions: { label: string; value: ReminderType }[] = [
  { label: '生日祝福', value: 'birthday' },
  { label: '节日问候', value: 'festival' },
  { label: '会员日提醒', value: 'member_day' },
  { label: '优惠券即将过期', value: 'coupon_expire' },
  { label: '活动提醒', value: 'activity_reminder' }
]

export const memberLevelConfigs: MemberLevelConfig[] = [
  {
    level: 'bronze',
    name: '青铜会员',
    minPoints: 0,
    maxPoints: 999,
    discount: 1,
    color: '#cd7f32',
    benefits: ['注册即享', '生日积分双倍', '专属客服']
  },
  {
    level: 'silver',
    name: '白银会员',
    minPoints: 1000,
    maxPoints: 4999,
    discount: 0.95,
    color: '#c0c0c0',
    benefits: ['9.5折优惠', '生日积分双倍', '专属客服', '优先发货']
  },
  {
    level: 'gold',
    name: '黄金会员',
    minPoints: 5000,
    maxPoints: 19999,
    discount: 0.9,
    color: '#ffd700',
    benefits: ['9折优惠', '生日积分3倍', '专属客服', '优先发货', '新品优先体验']
  },
  {
    level: 'platinum',
    name: '铂金会员',
    minPoints: 20000,
    maxPoints: 49999,
    discount: 0.85,
    color: '#e5e4e2',
    benefits: ['8.5折优惠', '生日积分5倍', '1对1专属客服', '顺丰包邮', '新品优先体验', '专属活动邀请']
  },
  {
    level: 'diamond',
    name: '钻石会员',
    minPoints: 50000,
    maxPoints: Infinity,
    discount: 0.8,
    color: '#b9f2ff',
    benefits: ['8折优惠', '生日积分10倍', '1对1专属客服', '顺丰包邮', '新品优先体验', '专属活动邀请', '定制服务优先', '年度礼品']
  }
]
