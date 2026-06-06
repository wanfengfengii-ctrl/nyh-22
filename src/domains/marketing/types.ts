import type { MemberLevel, RepurchaseIntention, CustomerSource } from '@/domains/customer/types'

export type PointChangeType = 'earn_order' | 'earn_signup' | 'earn_activity' | 'earn_birthday' | 'spend_coupon' | 'spend_product' | 'spend_activity' | 'adjust'

export type CouponType = 'discount' | 'fixed_amount' | 'free_shipping' | 'gift'

export type CouponStatus = 'active' | 'inactive' | 'expired'

export type CampaignStatus = 'draft' | 'active' | 'ended' | 'cancelled'

export type CampaignType = 'promotion' | 'membership_day' | 'festival' | 'new_product' | 'anniversary'

export type ReminderType = 'birthday' | 'festival' | 'member_day' | 'coupon_expire' | 'activity_reminder'

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

export interface MarketingState {
  pointRecords: PointRecord[]
  coupons: Coupon[]
  couponRedemptions: CouponRedemption[]
  campaigns: MarketingCampaign[]
  campaignRegistrations: CampaignRegistration[]
  reminders: MarketingReminder[]
  customerSegments: CustomerSegment[]
  campaignVisitTracks: CampaignVisitTrack[]
}
