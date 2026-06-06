import type { Ref } from 'vue'
import { generateId, generateCouponCode, getToday, addDays } from '@/shared/utils'
import type {
  PointRecord,
  Coupon,
  CouponRedemption,
  MarketingCampaign,
  CampaignRegistration,
  MarketingReminder,
  CustomerSegment,
  CampaignVisitTrack,
  PointChangeType,
  CampaignType,
  ReminderType
} from './types'
import type { MarketingSelectors } from './selectors'
import type { Customer, MemberLevel } from '@/domains/customer/types'
import type { CustomOrder } from '@/domains/customer/types'
import {
  pointChangeTypeOptions,
  campaignTypeOptions,
  marketingReminderTypeOptions
} from './constants'

export interface MarketingActions {
  addPoints: (customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string) => PointRecord | null
  spendPoints: (customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string) => { success: boolean; message?: string; record?: PointRecord }
  addCoupon: (data: Omit<Coupon, 'id' | 'code' | 'usedQuantity' | 'status' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; coupon?: Coupon }
  updateCoupon: (id: string, data: Partial<Coupon>) => { success: boolean; message?: string }
  deleteCoupon: (id: string) => void
  redeemCoupon: (couponId: string, customerId: string, orderId?: string) => { success: boolean; message?: string; redemption?: CouponRedemption }
  addCampaign: (data: Omit<MarketingCampaign, 'id' | 'participantCount' | 'status' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; campaign?: MarketingCampaign }
  updateCampaign: (id: string, data: Partial<MarketingCampaign>) => { success: boolean; message?: string }
  deleteCampaign: (id: string) => void
  registerCampaign: (campaignId: string, customerId: string) => { success: boolean; message?: string; registration?: CampaignRegistration }
  updateRegistrationStatus: (id: string, status: 'registered' | 'attended' | 'cancelled') => void
  addReminder: (data: Omit<MarketingReminder, 'id' | 'status' | 'createdAt'>) => { success: boolean; message?: string; reminder?: MarketingReminder }
  sendReminder: (id: string) => { success: boolean; message?: string }
  deleteReminder: (id: string) => void
  addCustomerSegment: (data: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt'>) => CustomerSegment
  updateCustomerSegment: (id: string, data: Partial<CustomerSegment>) => { success: boolean; message?: string }
  deleteCustomerSegment: (id: string) => void
  addCampaignVisitTrack: (data: Omit<CampaignVisitTrack, 'id' | 'createdAt'>) => CampaignVisitTrack
  initMockData: () => void
}

interface ActionDeps {
  pointRecords: Ref<PointRecord[]>
  coupons: Ref<Coupon[]>
  couponRedemptions: Ref<CouponRedemption[]>
  campaigns: Ref<MarketingCampaign[]>
  campaignRegistrations: Ref<CampaignRegistration[]>
  reminders: Ref<MarketingReminder[]>
  customerSegments: Ref<CustomerSegment[]>
  campaignVisitTracks: Ref<CampaignVisitTrack[]>
  selectors: MarketingSelectors
  getCustomerById: (id: string) => Customer | undefined
  updateCustomer: (id: string, data: Partial<Customer>) => { success: boolean; message?: string }
  getCustomers: () => Customer[]
  getCustomOrders: () => CustomOrder[]
  initCustomerMockData: () => void
}

export function createActions(deps: ActionDeps): MarketingActions {
  const {
    pointRecords,
    coupons,
    couponRedemptions,
    campaigns,
    campaignRegistrations,
    reminders,
    customerSegments,
    campaignVisitTracks,
    selectors,
    getCustomerById,
    updateCustomer,
    getCustomers,
    getCustomOrders,
    initCustomerMockData
  } = deps

  function addPoints(customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string): PointRecord | null {
    const customer = getCustomerById(customerId)
    if (!customer) return null

    const typeOption = pointChangeTypeOptions.find(o => o.value === type)
    const record: PointRecord = {
      id: generateId(),
      customerId,
      customerName: customer.name,
      type,
      typeLabel: typeOption?.label || type,
      points,
      balanceAfter: customer.points + points,
      description,
      relatedId,
      createdAt: new Date().toISOString()
    }
    pointRecords.value.push(record)

    const newPoints = customer.points + points
    const newLevel = selectors.getMemberLevelByPoints(newPoints)

    updateCustomer(customerId, {
      points: newPoints,
      memberLevel: newLevel
    })

    return record
  }

  function spendPoints(customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string): { success: boolean; message?: string; record?: PointRecord } {
    const customer = getCustomerById(customerId)
    if (!customer) return { success: false, message: '客户不存在' }
    if (customer.points < points) return { success: false, message: '积分不足' }

    const typeOption = pointChangeTypeOptions.find(o => o.value === type)
    const record: PointRecord = {
      id: generateId(),
      customerId,
      customerName: customer.name,
      type,
      typeLabel: typeOption?.label || type,
      points: -points,
      balanceAfter: customer.points - points,
      description,
      relatedId,
      createdAt: new Date().toISOString()
    }
    pointRecords.value.push(record)

    const newPoints = customer.points - points
    const newLevel = selectors.getMemberLevelByPoints(newPoints)

    updateCustomer(customerId, {
      points: newPoints,
      memberLevel: newLevel
    })

    return { success: true, record }
  }

  function addCoupon(data: Omit<Coupon, 'id' | 'code' | 'usedQuantity' | 'status' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; coupon?: Coupon } {
    const coupon: Coupon = {
      ...data,
      id: generateId(),
      code: generateCouponCode(),
      usedQuantity: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    coupons.value.push(coupon)
    return { success: true, coupon }
  }

  function updateCoupon(id: string, data: Partial<Coupon>): { success: boolean; message?: string } {
    const index = coupons.value.findIndex(c => c.id === id)
    if (index === -1) return { success: false, message: '优惠券不存在' }

    coupons.value[index] = {
      ...coupons.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return { success: true }
  }

  function deleteCoupon(id: string): void {
    coupons.value = coupons.value.filter(c => c.id !== id)
  }

  function redeemCoupon(couponId: string, customerId: string, orderId?: string): { success: boolean; message?: string; redemption?: CouponRedemption } {
    const coupon = selectors.getCouponById(couponId)
    const customer = getCustomerById(customerId)

    if (!coupon) return { success: false, message: '优惠券不存在' }
    if (!customer) return { success: false, message: '客户不存在' }
    if (coupon.usedQuantity >= coupon.totalQuantity) return { success: false, message: '优惠券已领完' }
    if (coupon.status !== 'active') return { success: false, message: '优惠券不可用' }

    const today = getToday()
    if (today < coupon.startDate || today > coupon.endDate) {
      return { success: false, message: '优惠券不在有效期内' }
    }

    const redemption: CouponRedemption = {
      id: generateId(),
      couponId,
      couponName: coupon.name,
      customerId,
      customerName: customer.name,
      orderId,
      redeemDate: today,
      redeemMethod: 'online',
      operator: '系统',
      status: 'used',
      createdAt: new Date().toISOString()
    }
    couponRedemptions.value.push(redemption)

    const couponIndex = coupons.value.findIndex(c => c.id === couponId)
    if (couponIndex !== -1) {
      coupons.value[couponIndex].usedQuantity++
      coupons.value[couponIndex].updatedAt = new Date().toISOString()
    }

    return { success: true, redemption }
  }

  function addCampaign(data: Omit<MarketingCampaign, 'id' | 'participantCount' | 'status' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; campaign?: MarketingCampaign } {
    const typeOption = campaignTypeOptions.find(o => o.value === data.type)
    const campaign: MarketingCampaign = {
      ...data,
      id: generateId(),
      typeLabel: typeOption?.label || data.type,
      participantCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    campaigns.value.push(campaign)
    return { success: true, campaign }
  }

  function updateCampaign(id: string, data: Partial<MarketingCampaign>): { success: boolean; message?: string } {
    const index = campaigns.value.findIndex(c => c.id === id)
    if (index === -1) return { success: false, message: '活动不存在' }

    if (data.type) {
      const typeOption = campaignTypeOptions.find(o => o.value === data.type)
      ;(data as any).typeLabel = typeOption?.label || data.type
    }

    campaigns.value[index] = {
      ...campaigns.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return { success: true }
  }

  function deleteCampaign(id: string): void {
    campaigns.value = campaigns.value.filter(c => c.id !== id)
    campaignRegistrations.value = campaignRegistrations.value.filter(r => r.campaignId !== id)
  }

  function registerCampaign(campaignId: string, customerId: string): { success: boolean; message?: string; registration?: CampaignRegistration } {
    const campaign = selectors.getCampaignById(campaignId)
    const customer = getCustomerById(customerId)

    if (!campaign) return { success: false, message: '活动不存在' }
    if (!customer) return { success: false, message: '客户不存在' }
    if (campaign.status !== 'active') return { success: false, message: '活动未开始或已结束' }
    if (campaign.participantCount >= campaign.maxParticipants) return { success: false, message: '活动名额已满' }

    const existing = campaignRegistrations.value.find(
      r => r.campaignId === campaignId && r.customerId === customerId && r.status !== 'cancelled'
    )
    if (existing) return { success: false, message: '已报名该活动' }

    const registration: CampaignRegistration = {
      id: generateId(),
      campaignId,
      campaignName: campaign.name,
      customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      registerDate: getToday(),
      status: 'registered',
      createdAt: new Date().toISOString()
    }
    campaignRegistrations.value.push(registration)

    const campaignIndex = campaigns.value.findIndex(c => c.id === campaignId)
    if (campaignIndex !== -1) {
      campaigns.value[campaignIndex].participantCount++
      campaigns.value[campaignIndex].updatedAt = new Date().toISOString()
    }

    return { success: true, registration }
  }

  function updateRegistrationStatus(id: string, status: 'registered' | 'attended' | 'cancelled'): void {
    const registration = campaignRegistrations.value.find(r => r.id === id)
    if (registration) {
      registration.status = status
    }
  }

  function addReminder(data: Omit<MarketingReminder, 'id' | 'status' | 'createdAt'>): { success: boolean; message?: string; reminder?: MarketingReminder } {
    const typeOption = marketingReminderTypeOptions.find(o => o.value === data.type)
    const reminder: MarketingReminder = {
      ...data,
      id: generateId(),
      typeLabel: typeOption?.label || data.type,
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    reminders.value.push(reminder)
    return { success: true, reminder }
  }

  function sendReminder(id: string): { success: boolean; message?: string } {
    const index = reminders.value.findIndex(r => r.id === id)
    if (index === -1) return { success: false, message: '提醒不存在' }

    reminders.value[index].status = 'sent'
    reminders.value[index].sentAt = new Date().toISOString()
    return { success: true }
  }

  function deleteReminder(id: string): void {
    reminders.value = reminders.value.filter(r => r.id !== id)
  }

  function filterCustomersBySegment(filters: CustomerSegment['filters'], customers: Customer[]): Customer[] {
    return customers.filter(customer => {
      if (filters.levels && filters.levels.length > 0) {
        if (!filters.levels.includes(customer.memberLevel)) return false
      }
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.includes(customer.source)) return false
      }
      if (filters.repurchaseIntentions && filters.repurchaseIntentions.length > 0) {
        if (!customer.repurchaseIntention || !filters.repurchaseIntentions.includes(customer.repurchaseIntention)) return false
      }
      if (filters.minOrders !== undefined && customer.totalOrders < filters.minOrders) return false
      if (filters.maxOrders !== undefined && customer.totalOrders > filters.maxOrders) return false
      if (filters.minAmount !== undefined && customer.totalAmount < filters.minAmount) return false
      if (filters.maxAmount !== undefined && customer.totalAmount > filters.maxAmount) return false
      if (filters.tags && filters.tags.length > 0) {
        const hasTag = filters.tags.some(tag => customer.tags.includes(tag))
        if (!hasTag) return false
      }
      return true
    })
  }

  function addCustomerSegment(data: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt'>): CustomerSegment {
    const customerCount = filterCustomersBySegment(data.filters, getCustomers()).length

    const segment: CustomerSegment = {
      ...data,
      id: generateId(),
      customerCount,
      createdAt: new Date().toISOString()
    }
    customerSegments.value.push(segment)
    return segment
  }

  function updateCustomerSegment(id: string, data: Partial<CustomerSegment>): { success: boolean; message?: string } {
    const index = customerSegments.value.findIndex(s => s.id === id)
    if (index === -1) return { success: false, message: '分群不存在' }

    const filters = data.filters || customerSegments.value[index].filters
    const customerCount = filterCustomersBySegment(filters, getCustomers()).length

    customerSegments.value[index] = {
      ...customerSegments.value[index],
      ...data,
      customerCount
    }
    return { success: true }
  }

  function deleteCustomerSegment(id: string): void {
    customerSegments.value = customerSegments.value.filter(s => s.id !== id)
  }

  function addCampaignVisitTrack(data: Omit<CampaignVisitTrack, 'id' | 'createdAt'>): CampaignVisitTrack {
    const track: CampaignVisitTrack = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    campaignVisitTracks.value.push(track)
    return track
  }

  function initMockData(): void {
    if (getCustomers().length === 0) {
      initCustomerMockData()
    }

    if (coupons.value.length === 0) {
      const today = getToday()
      const mockCoupons: Omit<Coupon, 'id' | 'code' | 'usedQuantity' | 'status' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: '新会员专享券',
          type: 'fixed_amount',
          typeLabel: '满减券',
          value: 50,
          minAmount: 200,
          totalQuantity: 100,
          startDate: today,
          endDate: addDays(today, 30),
          applicableLevels: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
          description: '新会员首单满200减50'
        },
        {
          name: '生日特惠券',
          type: 'discount',
          typeLabel: '折扣券',
          value: 0.8,
          totalQuantity: 50,
          startDate: today,
          endDate: addDays(today, 90),
          applicableLevels: ['silver', 'gold', 'platinum', 'diamond'],
          description: '生日当月8折优惠'
        },
        {
          name: '包邮券',
          type: 'free_shipping',
          typeLabel: '包邮券',
          value: 0,
          totalQuantity: 200,
          startDate: today,
          endDate: addDays(today, 60),
          applicableLevels: ['gold', 'platinum', 'diamond'],
          description: '全场包邮'
        },
        {
          name: '会员日专属券',
          type: 'fixed_amount',
          typeLabel: '满减券',
          value: 100,
          minAmount: 500,
          totalQuantity: 80,
          startDate: addDays(today, -5),
          endDate: addDays(today, 5),
          applicableLevels: ['platinum', 'diamond'],
          description: '会员日满500减100'
        }
      ]
      mockCoupons.forEach(c => addCoupon(c))
    }

    if (campaigns.value.length === 0) {
      const today = getToday()
      const mockCampaigns: Omit<MarketingCampaign, 'id' | 'participantCount' | 'status' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: '春季新品发布活动',
          type: 'new_product',
          typeLabel: '新品发布',
          description: '春季新品系列发布，限时优惠',
          startDate: addDays(today, -3),
          endDate: addDays(today, 12),
          targetLevels: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
          targetTags: [],
          maxParticipants: 100,
          rules: '活动期间下单享8.5折，满500送小礼品',
          rewards: '8.5折优惠 + 精美小礼品'
        },
        {
          name: '会员日专属活动',
          type: 'membership_day',
          typeLabel: '会员日',
          description: '每月会员日，专属福利等你来',
          startDate: addDays(today, 5),
          endDate: addDays(today, 7),
          targetLevels: ['silver', 'gold', 'platinum', 'diamond'],
          targetTags: ['VIP'],
          maxParticipants: 50,
          rules: '会员日当天全场8折，积分双倍',
          rewards: '8折优惠 + 双倍积分'
        },
        {
          name: '周年庆大促',
          type: 'anniversary',
          typeLabel: '周年庆',
          description: '店庆三周年，感恩回馈',
          startDate: addDays(today, 20),
          endDate: addDays(today, 30),
          targetLevels: ['bronze', 'silver', 'gold', 'platinum', 'diamond'],
          targetTags: [],
          maxParticipants: 200,
          rules: '全场7折起，满1000减200',
          rewards: '7折优惠 + 满减 + 赠品'
        }
      ]
      mockCampaigns.forEach((c, index) => {
        const result = addCampaign(c)
        if (result.campaign && index < 2) {
          updateCampaign(result.campaign.id, { status: 'active' })
        }
      })
    }

    if (customerSegments.value.length === 0) {
      const mockSegments: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt'>[] = [
        {
          name: '高价值客户',
          description: '累计消费5000元以上的客户',
          filters: {
            minAmount: 5000
          }
        },
        {
          name: '高复购意向',
          description: '复购意向高的客户',
          filters: {
            repurchaseIntentions: ['high']
          }
        },
        {
          name: '新注册客户',
          description: '近30天注册的新客户',
          filters: {
            levels: ['bronze'],
            maxOrders: 1
          }
        },
        {
          name: 'VIP会员',
          description: '黄金及以上等级会员',
          filters: {
            levels: ['gold', 'platinum', 'diamond']
          }
        }
      ]
      mockSegments.forEach(s => addCustomerSegment(s))
    }
  }

  return {
    addPoints,
    spendPoints,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    redeemCoupon,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    registerCampaign,
    updateRegistrationStatus,
    addReminder,
    sendReminder,
    deleteReminder,
    addCustomerSegment,
    updateCustomerSegment,
    deleteCustomerSegment,
    addCampaignVisitTrack,
    initMockData
  }
}
