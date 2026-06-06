import { ref, watch, type Ref } from 'vue'
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/shared/storage'
import type {
  PointRecord,
  Coupon,
  CouponRedemption,
  MarketingCampaign,
  CampaignRegistration,
  MarketingReminder,
  CustomerSegment,
  CampaignVisitTrack,
  MarketingState
} from './types'

export function createMarketingState(): MarketingState {
  return {
    pointRecords: getStorageData<PointRecord>(STORAGE_KEYS.pointRecords),
    coupons: getStorageData<Coupon>(STORAGE_KEYS.coupons),
    couponRedemptions: getStorageData<CouponRedemption>(STORAGE_KEYS.couponRedemptions),
    campaigns: getStorageData<MarketingCampaign>(STORAGE_KEYS.marketingCampaigns),
    campaignRegistrations: getStorageData<CampaignRegistration>(STORAGE_KEYS.campaignRegistrations),
    reminders: getStorageData<MarketingReminder>(STORAGE_KEYS.marketingReminders),
    customerSegments: getStorageData<CustomerSegment>(STORAGE_KEYS.customerSegments),
    campaignVisitTracks: getStorageData<CampaignVisitTrack>(STORAGE_KEYS.campaignVisitTracks)
  }
}

export function createReactiveState(): {
  pointRecords: Ref<PointRecord[]>
  coupons: Ref<Coupon[]>
  couponRedemptions: Ref<CouponRedemption[]>
  campaigns: Ref<MarketingCampaign[]>
  campaignRegistrations: Ref<CampaignRegistration[]>
  reminders: Ref<MarketingReminder[]>
  customerSegments: Ref<CustomerSegment[]>
  campaignVisitTracks: Ref<CampaignVisitTrack[]>
} {
  const state = createMarketingState()
  const pointRecords = ref<PointRecord[]>(state.pointRecords)
  const coupons = ref<Coupon[]>(state.coupons)
  const couponRedemptions = ref<CouponRedemption[]>(state.couponRedemptions)
  const campaigns = ref<MarketingCampaign[]>(state.campaigns)
  const campaignRegistrations = ref<CampaignRegistration[]>(state.campaignRegistrations)
  const reminders = ref<MarketingReminder[]>(state.reminders)
  const customerSegments = ref<CustomerSegment[]>(state.customerSegments)
  const campaignVisitTracks = ref<CampaignVisitTrack[]>(state.campaignVisitTracks)

  watch(pointRecords, (val) => setStorageData(STORAGE_KEYS.pointRecords, val), { deep: true })
  watch(coupons, (val) => setStorageData(STORAGE_KEYS.coupons, val), { deep: true })
  watch(couponRedemptions, (val) => setStorageData(STORAGE_KEYS.couponRedemptions, val), { deep: true })
  watch(campaigns, (val) => setStorageData(STORAGE_KEYS.marketingCampaigns, val), { deep: true })
  watch(campaignRegistrations, (val) => setStorageData(STORAGE_KEYS.campaignRegistrations, val), { deep: true })
  watch(reminders, (val) => setStorageData(STORAGE_KEYS.marketingReminders, val), { deep: true })
  watch(customerSegments, (val) => setStorageData(STORAGE_KEYS.customerSegments, val), { deep: true })
  watch(campaignVisitTracks, (val) => setStorageData(STORAGE_KEYS.campaignVisitTracks, val), { deep: true })

  return {
    pointRecords,
    coupons,
    couponRedemptions,
    campaigns,
    campaignRegistrations,
    reminders,
    customerSegments,
    campaignVisitTracks
  }
}
