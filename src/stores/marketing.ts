import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  PointRecord,
  Coupon,
  CouponRedemption,
  MarketingCampaign,
  CampaignRegistration,
  MarketingReminder,
  CustomerSegment,
  CampaignVisitTrack,
  MemberLevel,
  PointChangeType,
  CouponType,
  CampaignType,
  CampaignStatus,
  ReminderType,
  MarketingEffectStat,
  Customer
} from '@/types'
import {
  memberLevelConfigs,
  pointChangeTypeOptions,
  couponTypeOptions,
  campaignTypeOptions,
  campaignStatusOptions,
  marketingReminderTypeOptions,
  customerSourceOptions,
  repurchaseIntentionOptions
} from '@/types'
import {
  getPointRecords,
  savePointRecords,
  getCoupons,
  saveCoupons,
  getCouponRedemptions,
  saveCouponRedemptions,
  getMarketingCampaigns,
  saveMarketingCampaigns,
  getCampaignRegistrations,
  saveCampaignRegistrations,
  getMarketingReminders,
  saveMarketingReminders,
  getCustomerSegments,
  saveCustomerSegments,
  getCampaignVisitTracks,
  saveCampaignVisitTracks,
  generateId,
  generateCouponCode,
  getToday,
  addDays,
  getDateRange,
  formatDate
} from '@/utils/storage'
import { useCustomerStore } from './customer'

export const useMarketingStore = defineStore('marketing', () => {
  const pointRecords = ref<PointRecord[]>(getPointRecords())
  const coupons = ref<Coupon[]>(getCoupons())
  const couponRedemptions = ref<CouponRedemption[]>(getCouponRedemptions())
  const campaigns = ref<MarketingCampaign[]>(getMarketingCampaigns())
  const campaignRegistrations = ref<CampaignRegistration[]>(getCampaignRegistrations())
  const reminders = ref<MarketingReminder[]>(getMarketingReminders())
  const customerSegments = ref<CustomerSegment[]>(getCustomerSegments())
  const campaignVisitTracks = ref<CampaignVisitTrack[]>(getCampaignVisitTracks())

  watch(pointRecords, (val) => savePointRecords(val), { deep: true })
  watch(coupons, (val) => saveCoupons(val), { deep: true })
  watch(couponRedemptions, (val) => saveCouponRedemptions(val), { deep: true })
  watch(campaigns, (val) => saveMarketingCampaigns(val), { deep: true })
  watch(campaignRegistrations, (val) => saveCampaignRegistrations(val), { deep: true })
  watch(reminders, (val) => saveMarketingReminders(val), { deep: true })
  watch(customerSegments, (val) => saveCustomerSegments(val), { deep: true })
  watch(campaignVisitTracks, (val) => saveCampaignVisitTracks(val), { deep: true })

  const activeCoupons = computed(() => {
    const today = getToday()
    return coupons.value.filter(c => c.status === 'active' && c.startDate <= today && c.endDate >= today)
  })

  const activeCampaigns = computed(() => {
    const today = getToday()
    return campaigns.value.filter(c => c.status === 'active' && c.startDate <= today && c.endDate >= today)
  })

  const pendingReminders = computed(() => {
    return reminders.value.filter(r => r.status === 'pending')
  })

  const totalPoints = computed(() => {
    const customerStore = useCustomerStore()
    return customerStore.customers.reduce((sum, c) => sum + c.points, 0)
  })

  const memberLevelStats = computed(() => {
    const customerStore = useCustomerStore()
    const stats: Record<MemberLevel, number> = {
      bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0
    }
    customerStore.customers.forEach(c => {
      if (stats[c.memberLevel] !== undefined) {
        stats[c.memberLevel]++
      }
    })
    return memberLevelConfigs.map(config => ({
      ...config,
      count: stats[config.level]
    }))
  })

  function getMemberLevelByPoints(points: number): MemberLevel {
    for (let i = memberLevelConfigs.length - 1; i >= 0; i--) {
      if (points >= memberLevelConfigs[i].minPoints) {
        return memberLevelConfigs[i].level
      }
    }
    return 'bronze'
  }

  function getLevelConfig(level: MemberLevel) {
    return memberLevelConfigs.find(c => c.level === level)
  }

  function addPoints(customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string): PointRecord | null {
    const customerStore = useCustomerStore()
    const customer = customerStore.getCustomerById(customerId)
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
    const newLevel = getMemberLevelByPoints(newPoints)

    customerStore.updateCustomer(customerId, {
      points: newPoints,
      memberLevel: newLevel
    })

    return record
  }

  function spendPoints(customerId: string, points: number, type: PointChangeType, description: string, relatedId?: string): { success: boolean; message?: string; record?: PointRecord } {
    const customerStore = useCustomerStore()
    const customer = customerStore.getCustomerById(customerId)
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
    const newLevel = getMemberLevelByPoints(newPoints)

    customerStore.updateCustomer(customerId, {
      points: newPoints,
      memberLevel: newLevel
    })

    return { success: true, record }
  }

  function getPointRecordsByCustomerId(customerId: string): PointRecord[] {
    return pointRecords.value
      .filter(r => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  function getCouponById(id: string): Coupon | undefined {
    return coupons.value.find(c => c.id === id)
  }

  function redeemCoupon(couponId: string, customerId: string, orderId?: string): { success: boolean; message?: string; redemption?: CouponRedemption } {
    const customerStore = useCustomerStore()
    const coupon = getCouponById(couponId)
    const customer = customerStore.getCustomerById(customerId)

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

  function getRedemptionsByCouponId(couponId: string): CouponRedemption[] {
    return couponRedemptions.value
      .filter(r => r.couponId === couponId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getRedemptionsByCustomerId(customerId: string): CouponRedemption[] {
    return couponRedemptions.value
      .filter(r => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  function getCampaignById(id: string): MarketingCampaign | undefined {
    return campaigns.value.find(c => c.id === id)
  }

  function registerCampaign(campaignId: string, customerId: string): { success: boolean; message?: string; registration?: CampaignRegistration } {
    const customerStore = useCustomerStore()
    const campaign = getCampaignById(campaignId)
    const customer = customerStore.getCustomerById(customerId)

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

  function getRegistrationsByCampaignId(campaignId: string): CampaignRegistration[] {
    return campaignRegistrations.value
      .filter(r => r.campaignId === campaignId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getRegistrationsByCustomerId(customerId: string): CampaignRegistration[] {
    return campaignRegistrations.value
      .filter(r => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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

  function getUpcomingBirthdays(days: number = 7): Customer[] {
    const customerStore = useCustomerStore()
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    return customerStore.customers.filter(customer => {
      if (!customer.birthday) return false
      const birthDate = new Date(customer.birthday)
      const birthMonth = birthDate.getMonth() + 1
      const birthDay = birthDate.getDate()

      const todayNum = todayMonth * 100 + todayDay
      const birthNum = birthMonth * 100 + birthDay
      const endNum = todayNum + days

      if (endNum > 1231) {
        return birthNum >= todayNum || birthNum <= (endNum - 1231)
      }
      return birthNum >= todayNum && birthNum <= endNum
    })
  }

  function addCustomerSegment(data: Omit<CustomerSegment, 'id' | 'customerCount' | 'createdAt'>): CustomerSegment {
    const customerStore = useCustomerStore()
    const customerCount = filterCustomersBySegment(data.filters, customerStore.customers).length

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
    const customerStore = useCustomerStore()
    const index = customerSegments.value.findIndex(s => s.id === id)
    if (index === -1) return { success: false, message: '分群不存在' }

    const filters = data.filters || customerSegments.value[index].filters
    const customerCount = filterCustomersBySegment(filters, customerStore.customers).length

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

  function getCustomersBySegment(segmentId: string): Customer[] {
    const customerStore = useCustomerStore()
    const segment = customerSegments.value.find(s => s.id === segmentId)
    if (!segment) return []
    return filterCustomersBySegment(segment.filters, customerStore.customers)
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

  function getVisitTracksByCampaignId(campaignId: string): CampaignVisitTrack[] {
    return campaignVisitTracks.value
      .filter(t => t.campaignId === campaignId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getVisitTracksByCustomerId(customerId: string): CampaignVisitTrack[] {
    return campaignVisitTracks.value
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getMarketingEffectStats(days: number = 30): MarketingEffectStat[] {
    const customerStore = useCustomerStore()
    const dateRange = getDateRange(days)
    const periodDays = Math.floor(days / 6) || 1
    const result: MarketingEffectStat[] = []
    const periodCount = Math.ceil(days / periodDays)

    for (let i = 0; i < periodCount; i++) {
      const startIndex = i * periodDays
      const endIndex = Math.min(startIndex + periodDays - 1, dateRange.length - 1)
      if (startIndex >= dateRange.length) break

      const periodStart = dateRange[startIndex]
      const periodEnd = dateRange[endIndex]
      const periodLabel = `${periodStart.slice(5)} ~ ${periodEnd.slice(5)}`

      const periodOrders = customerStore.customOrders.filter(o => {
        const orderDate = o.createdAt.slice(0, 10)
        return orderDate >= periodStart && orderDate <= periodEnd && o.status === 'delivered'
      })

      const periodNewMembers = customerStore.customers.filter(c => {
        const createDate = c.createdAt.slice(0, 10)
        return createDate >= periodStart && createDate <= periodEnd
      })

      const periodRedemptions = couponRedemptions.value.filter(r => {
        return r.redeemDate >= periodStart && r.redeemDate <= periodEnd && r.status === 'used'
      })

      const periodRegistrations = campaignRegistrations.value.filter(r => {
        return r.registerDate >= periodStart && r.registerDate <= periodEnd
      })

      const totalRevenue = periodOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0)
      const uniqueCustomers = new Set(periodOrders.map(o => o.customerId)).size

      result.push({
        period: periodLabel,
        newMembers: periodNewMembers.length,
        activeMembers: uniqueCustomers,
        totalOrders: periodOrders.length,
        totalRevenue,
        couponUsedCount: periodRedemptions.length,
        campaignParticipantCount: periodRegistrations.length,
        conversionRate: periodNewMembers.length > 0 ? Math.round((uniqueCustomers / periodNewMembers.length) * 100) : 0
      })
    }

    return result
  }

  function initMockData(): void {
    const customerStore = useCustomerStore()
    if (customerStore.customers.length === 0) {
      customerStore.initMockData()
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
    pointRecords,
    coupons,
    couponRedemptions,
    campaigns,
    campaignRegistrations,
    reminders,
    customerSegments,
    campaignVisitTracks,
    activeCoupons,
    activeCampaigns,
    pendingReminders,
    totalPoints,
    memberLevelStats,
    getMemberLevelByPoints,
    getLevelConfig,
    addPoints,
    spendPoints,
    getPointRecordsByCustomerId,
    addCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponById,
    redeemCoupon,
    getRedemptionsByCouponId,
    getRedemptionsByCustomerId,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    getCampaignById,
    registerCampaign,
    getRegistrationsByCampaignId,
    getRegistrationsByCustomerId,
    updateRegistrationStatus,
    addReminder,
    sendReminder,
    deleteReminder,
    getUpcomingBirthdays,
    addCustomerSegment,
    updateCustomerSegment,
    deleteCustomerSegment,
    filterCustomersBySegment,
    getCustomersBySegment,
    addCampaignVisitTrack,
    getVisitTracksByCampaignId,
    getVisitTracksByCustomerId,
    getMarketingEffectStats,
    initMockData
  }
})
