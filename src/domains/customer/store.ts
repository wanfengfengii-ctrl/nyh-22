import { defineStore } from 'pinia'
import { createReactiveState } from './state'
import { createSelectors } from './selectors'
import { createActions } from './actions'

export const useCustomerStore = defineStore('customer', () => {
  const state = createReactiveState()
  const selectors = createSelectors(
    state.customers,
    state.customOrders,
    state.productionRecords,
    state.deliveryConfirms,
    state.afterSaleVisits,
    state.visitTasks
  )
  const actions = createActions(
    state.customers,
    state.customOrders,
    state.productionRecords,
    state.deliveryConfirms,
    state.afterSaleVisits,
    state.visitTasks,
    selectors
  )

  return {
    ...state,
    ...selectors,
    ...actions
  }
})
