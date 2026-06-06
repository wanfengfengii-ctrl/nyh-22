import { ref, watch, type Ref } from 'vue'
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/shared/storage'
import type {
  Customer,
  CustomOrder,
  ProductionProgressRecord,
  DeliveryConfirm,
  AfterSaleVisit,
  VisitTask,
  CustomerState
} from './types'

export function createCustomerState(): CustomerState {
  return {
    customers: getStorageData<Customer>(STORAGE_KEYS.customers),
    customOrders: getStorageData<CustomOrder>(STORAGE_KEYS.customOrders),
    productionRecords: getStorageData<ProductionProgressRecord>(STORAGE_KEYS.productionRecords),
    deliveryConfirms: getStorageData<DeliveryConfirm>(STORAGE_KEYS.deliveryConfirms),
    afterSaleVisits: getStorageData<AfterSaleVisit>(STORAGE_KEYS.afterSaleVisits),
    visitTasks: getStorageData<VisitTask>(STORAGE_KEYS.visitTasks)
  }
}

export function createReactiveState(): {
  customers: Ref<Customer[]>
  customOrders: Ref<CustomOrder[]>
  productionRecords: Ref<ProductionProgressRecord[]>
  deliveryConfirms: Ref<DeliveryConfirm[]>
  afterSaleVisits: Ref<AfterSaleVisit[]>
  visitTasks: Ref<VisitTask[]>
} {
  const state = createCustomerState()
  const customers = ref<Customer[]>(state.customers)
  const customOrders = ref<CustomOrder[]>(state.customOrders)
  const productionRecords = ref<ProductionProgressRecord[]>(state.productionRecords)
  const deliveryConfirms = ref<DeliveryConfirm[]>(state.deliveryConfirms)
  const afterSaleVisits = ref<AfterSaleVisit[]>(state.afterSaleVisits)
  const visitTasks = ref<VisitTask[]>(state.visitTasks)

  watch(customers, (val) => setStorageData(STORAGE_KEYS.customers, val), { deep: true })
  watch(customOrders, (val) => setStorageData(STORAGE_KEYS.customOrders, val), { deep: true })
  watch(productionRecords, (val) => setStorageData(STORAGE_KEYS.productionRecords, val), { deep: true })
  watch(deliveryConfirms, (val) => setStorageData(STORAGE_KEYS.deliveryConfirms, val), { deep: true })
  watch(afterSaleVisits, (val) => setStorageData(STORAGE_KEYS.afterSaleVisits, val), { deep: true })
  watch(visitTasks, (val) => setStorageData(STORAGE_KEYS.visitTasks, val), { deep: true })

  return {
    customers,
    customOrders,
    productionRecords,
    deliveryConfirms,
    afterSaleVisits,
    visitTasks
  }
}
