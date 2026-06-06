import { computed, type Ref, type ComputedRef } from 'vue'
import type {
  PointRecord,
  Coupon,
  CouponRedemption,
  MarketingCampaign,
  CampaignRegistration,
  MarketingReminder,
  CustomerSegment,
  CampaignVisitTrack,
  MarketingEffectStat
} from './types'
import type { Customer, MemberLevel, MemberLevelConfig } from '@/domains/customer/types'
import { memberLevelConfigs } from '@/domains/customer/constants'
import { getToday, getDateRange } from '@/shared/utils'

export interface MarketingSelectors {
  activeCoupons: ComputedRef<Coupon[]>
  activeCampaigns: ComputedRef<MarketingCampaign[]>
  pendingReminders: ComputedRef<MarketingReminder[]>
  totalPoints: ComputedRef<number>
  memberLevelStats: ComputedRef<Array<MemberLevelConfig & { count: number }>>
  getMemberLevelByPoints: (points: number) => MemberLevel
  getLevelConfig: (level: MemberLevel) => MemberLevelConfig | undefined
  getPointRecordsByCustomerId: (customerId: string) => PointRecord[]
  getCouponById: (id: string) => Coupon | undefined
  getRedemptionsByCouponId: (couponId: string) => CouponRedemption[]
  getRedemptionsByCustomerId: (customerId: string) => CouponRedemption[]
  getCampaignById: (id: string) => MarketingCampaign | undefined
  getRegistrationsByCampaignId: (campaignId: string) => CampaignRegistration[]
  getRegistrationsByCustomerId: (customerId: string) => CampaignRegistration[]
  getUpcomingBirthdays: (days?: number) => Customer[]
  getCustomersBySegment: (segmentId: string) => Customer[]
  getVisitTracksByCampaignId: (campaignId: string) => CampaignVisitTrack[]
  getVisitTracksByCustomerId: (customerId: string) => CampaignVisitTrack[]
  getMarketingEffectStats: (days?: number) => MarketingEffectStat[]
}

interface SelectorDeps {
  pointRecords: Ref<PointRecord[]>
  coupons: Ref<Coupon[]>
  couponRedemptions: Ref<CouponRedemption[]>
  campaigns: Ref<MarketingCampaign[]>
  campaignRegistrations: Ref<CampaignRegistration[]>
  reminders: Ref<MarketingReminder[]>
  customerSegments: Ref<CustomerSegment[]>
  campaignVisitTracks: Ref<CampaignVisitTrack[]>
  getCustomers: () => Customer[]
  getCustomOrders: () => Array<{ id: string; customerId: string; status: string; finalPrice?: number; createdAt: string }>
}

export function createSelectors(deps: SelectorDeps): MarketingSelectors {
  const {
    pointRecords,
    coupons,
    couponRedemptions,
    campaigns,
    campaignRegistrations,
    reminders,
    customerSegments,
    campaignVisitTracks,
    getCustomers,
    getCustomOrders
  } = deps

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
    return getCustomers().reduce((sum, c) => sum + c.points, 0)
  })

  const memberLevelStats = computed(() => {
    const stats: Record<MemberLevel, number> = {
      bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0
    }
    getCustomers().forEach(c => {
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

  function getPointRecordsByCustomerId(customerId: string): PointRecord[] {
    return pointRecords.value
      .filter(r => r.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getCouponById(id: string): Coupon | undefined {
    return coupons.value.find(c => c.id === id)
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

  function getCampaignById(id: string): MarketingCampaign | undefined {
    return campaigns.value.find(c => c.id === id)
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

  function getUpcomingBirthdays(days: number = 7): Customer[] {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    return getCustomers().filter(customer => {
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
    const segment = customerSegments.value.find(s => s.id === segmentId)
    if (!segment) return []
    return filterCustomersBySegment(segment.filters, getCustomers())
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

      const periodOrders = getCustomOrders().filter(o => {
        const orderDate = o.createdAt.slice(0, 10)
        return orderDate >= periodStart && orderDate <= periodEnd && o.status === 'delivered'
      })

      const periodNewMembers = getCustomers().filter(c => {
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

  return {
    activeCoupons,
    activeCampaigns,
    pendingReminders,
    totalPoints,
    memberLevelStats,
    getMemberLevelByPoints,
    getLevelConfig,
    getPointRecordsByCustomerId,
    getCouponById,
    getRedemptionsByCouponId,
    getRedemptionsByCustomerId,
    getCampaignById,
    getRegistrationsByCampaignId,
    getRegistrationsByCustomerId,
    getUpcomingBirthdays,
    getCustomersBySegment,
    getVisitTracksByCampaignId,
    getVisitTracksByCustomerId,
    getMarketingEffectStats
  }
}
