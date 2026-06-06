import { defineStore } from 'pinia'
import { createReactiveState } from './state'
import { createSelectors } from './selectors'
import { createActions } from './actions'
import { useCustomerStore } from '@/domains/customer/store'

export const useMarketingStore = defineStore('marketing', () => {
  const state = createReactiveState()
  const customerStore = useCustomerStore()

  const selectors = createSelectors({
    pointRecords: state.pointRecords,
    coupons: state.coupons,
    couponRedemptions: state.couponRedemptions,
    campaigns: state.campaigns,
    campaignRegistrations: state.campaignRegistrations,
    reminders: state.reminders,
    customerSegments: state.customerSegments,
    campaignVisitTracks: state.campaignVisitTracks,
    getCustomers: () => customerStore.customers,
    getCustomOrders: () => customerStore.customOrders as any
  })

  const actions = createActions({
    pointRecords: state.pointRecords,
    coupons: state.coupons,
    couponRedemptions: state.couponRedemptions,
    campaigns: state.campaigns,
    campaignRegistrations: state.campaignRegistrations,
    reminders: state.reminders,
    customerSegments: state.customerSegments,
    campaignVisitTracks: state.campaignVisitTracks,
    selectors,
    getCustomerById: customerStore.getCustomerById,
    updateCustomer: customerStore.updateCustomer,
    getCustomers: () => customerStore.customers,
    getCustomOrders: () => customerStore.customOrders,
    initCustomerMockData: customerStore.initMockData
  })

  return {
    ...state,
    ...selectors,
    ...actions
  }
})
