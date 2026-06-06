import { computed, type Ref, type ComputedRef } from 'vue'
import type {
  Customer,
  CustomOrder,
  ProductionProgressRecord,
  DeliveryConfirm,
  AfterSaleVisit,
  VisitTask,
  CustomerSourceStat,
  VisitConversionStat,
  CustomerSource
} from './types'
import { customerSourceOptions, productionStageOptions, orderStatusOptions } from './constants'
import { getToday, getDateRange } from '@/shared/utils'
import type { TaskPriority } from '@/domains/landscape/types'

export interface CustomerSelectors {
  activeOrders: ComputedRef<CustomOrder[]>
  overdueOrders: ComputedRef<CustomOrder[]>
  pendingVisitTasks: ComputedRef<VisitTask[]>
  totalCustomers: ComputedRef<number>
  totalOrders: ComputedRef<number>
  completedOrders: ComputedRef<number>
  totalRevenue: ComputedRef<number>
  getCustomerById: (id: string) => Customer | undefined
  getCustomerByPhone: (phone: string) => Customer | undefined
  getOrdersByCustomerId: (customerId: string) => CustomOrder[]
  getOrderById: (id: string) => CustomOrder | undefined
  getOrderByOrderNo: (orderNo: string) => CustomOrder | undefined
  getProductionRecordsByOrderId: (orderId: string) => ProductionProgressRecord[]
  getVisitsByCustomerId: (customerId: string) => AfterSaleVisit[]
  getVisitByOrderId: (orderId: string) => AfterSaleVisit | undefined
  getDeliveryConfirmByOrderId: (orderId: string) => DeliveryConfirm | undefined
  getCustomerSourceStats: () => CustomerSourceStat[]
  getVisitConversionStats: (days?: number) => VisitConversionStat[]
  getOrderStatusStats: () => Record<string, number>
  getVisitTaskStats: () => { pending: number; inProgress: number; completed: number; highPriority: number; overdue: number; total: number }
  getRepurchaseStats: () => Record<string, number>
}

export function createSelectors(
  customers: Ref<Customer[]>,
  customOrders: Ref<CustomOrder[]>,
  productionRecords: Ref<ProductionProgressRecord[]>,
  deliveryConfirms: Ref<DeliveryConfirm[]>,
  afterSaleVisits: Ref<AfterSaleVisit[]>,
  visitTasks: Ref<VisitTask[]>
): CustomerSelectors {
  const activeOrders = computed(() => {
    return customOrders.value.filter(o => !['delivered', 'cancelled'].includes(o.status))
  })

  const overdueOrders = computed(() => {
    const today = getToday()
    return customOrders.value.filter(o => {
      if (['delivered', 'cancelled'].includes(o.status)) return false
      return o.appointmentDeliveryDate < today
    })
  })

  const pendingVisitTasks = computed(() => {
    return visitTasks.value
      .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime()
      })
  })

  const totalCustomers = computed(() => customers.value.length)
  const totalOrders = computed(() => customOrders.value.length)
  const completedOrders = computed(() => customOrders.value.filter(o => o.status === 'delivered').length)
  const totalRevenue = computed(() => {
    return customOrders.value
      .filter(o => o.status === 'delivered' && o.finalPrice)
      .reduce((sum, o) => sum + (o.finalPrice || 0), 0)
  })

  function getCustomerById(id: string): Customer | undefined {
    return customers.value.find(c => c.id === id)
  }

  function getCustomerByPhone(phone: string): Customer | undefined {
    return customers.value.find(c => c.phone === phone)
  }

  function getOrdersByCustomerId(customerId: string): CustomOrder[] {
    return customOrders.value
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getOrderById(id: string): CustomOrder | undefined {
    return customOrders.value.find(o => o.id === id)
  }

  function getOrderByOrderNo(orderNo: string): CustomOrder | undefined {
    return customOrders.value.find(o => o.orderNo === orderNo)
  }

  function getProductionRecordsByOrderId(orderId: string): ProductionProgressRecord[] {
    return productionRecords.value
      .filter(r => r.orderId === orderId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  function getVisitsByCustomerId(customerId: string): AfterSaleVisit[] {
    return afterSaleVisits.value
      .filter(v => v.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getVisitByOrderId(orderId: string): AfterSaleVisit | undefined {
    return afterSaleVisits.value.find(v => v.orderId === orderId)
  }

  function getDeliveryConfirmByOrderId(orderId: string): DeliveryConfirm | undefined {
    return deliveryConfirms.value.find(d => d.orderId === orderId)
  }

  function getCustomerSourceStats(): CustomerSourceStat[] {
    const sourceMap = new Map<CustomerSource, { count: number; amount: number }>()

    customerSourceOptions.forEach(option => {
      sourceMap.set(option.value as CustomerSource, { count: 0, amount: 0 })
    })

    customers.value.forEach(customer => {
      const stat = sourceMap.get(customer.source)
      if (stat) {
        stat.count++
        stat.amount += customer.totalAmount
      }
    })

    const total = customers.value.length

    return customerSourceOptions.map(option => {
      const stat = sourceMap.get(option.value as CustomerSource) || { count: 0, amount: 0 }
      return {
        source: option.value as CustomerSource,
        sourceLabel: option.label,
        count: stat.count,
        amount: stat.amount,
        conversionRate: total > 0 ? Math.round((stat.count / total) * 100) : 0
      }
    })
  }

  function getVisitConversionStats(days: number = 30): VisitConversionStat[] {
    const dateRange = getDateRange(days)
    const periodDays = Math.floor(days / 7) || 1

    const result: VisitConversionStat[] = []
    const periodCount = Math.ceil(days / periodDays)

    for (let i = 0; i < periodCount; i++) {
      const startIndex = i * periodDays
      const endIndex = Math.min(startIndex + periodDays - 1, dateRange.length - 1)
      if (startIndex >= dateRange.length) break

      const periodStart = dateRange[startIndex]
      const periodEnd = dateRange[endIndex]
      const periodLabel = `${periodStart.slice(5)} ~ ${periodEnd.slice(5)}`

      const periodVisits = afterSaleVisits.value.filter(v => {
        const visitDate = v.visitDate
        return visitDate >= periodStart && visitDate <= periodEnd
      })

      const totalVisits = periodVisits.length
      const satisfiedCount = periodVisits.filter(v => v.satisfactionScore >= 4).length
      const repurchaseCount = periodVisits.filter(v => ['high', 'medium'].includes(v.repurchaseIntention)).length

      result.push({
        period: periodLabel,
        totalVisits,
        satisfiedCount,
        repurchaseCount,
        conversionRate: totalVisits > 0 ? Math.round((repurchaseCount / totalVisits) * 100) : 0
      })
    }

    return result
  }

  function getOrderStatusStats() {
    const stats: Record<string, number> = {}
    orderStatusOptions.forEach(opt => {
      stats[opt.value] = 0
    })
    customOrders.value.forEach(order => {
      if (stats[order.status] !== undefined) {
        stats[order.status]++
      }
    })
    return stats
  }

  function getVisitTaskStats() {
    const pending = visitTasks.value.filter(t => t.status === 'pending').length
    const inProgress = visitTasks.value.filter(t => t.status === 'in_progress').length
    const completed = visitTasks.value.filter(t => t.status === 'completed').length
    const highPriority = visitTasks.value.filter(t => t.priority === 'high' && t.status !== 'completed').length
    const overdue = visitTasks.value.filter(t => {
      if (t.status === 'completed') return false
      return t.plannedDate < getToday()
    }).length
    return { pending, inProgress, completed, highPriority, overdue, total: visitTasks.value.length }
  }

  function getRepurchaseStats() {
    const stats: Record<string, number> = { high: 0, medium: 0, low: 0, none: 0 }
    afterSaleVisits.value.forEach(v => {
      if (stats[v.repurchaseIntention] !== undefined) {
        stats[v.repurchaseIntention]++
      }
    })
    return stats
  }

  return {
    activeOrders,
    overdueOrders,
    pendingVisitTasks,
    totalCustomers,
    totalOrders,
    completedOrders,
    totalRevenue,
    getCustomerById,
    getCustomerByPhone,
    getOrdersByCustomerId,
    getOrderById,
    getOrderByOrderNo,
    getProductionRecordsByOrderId,
    getVisitsByCustomerId,
    getVisitByOrderId,
    getDeliveryConfirmByOrderId,
    getCustomerSourceStats,
    getVisitConversionStats,
    getOrderStatusStats,
    getVisitTaskStats,
    getRepurchaseStats
  }
}
