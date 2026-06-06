import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  Customer,
  CustomOrder,
  ProductionProgressRecord,
  DeliveryConfirm,
  AfterSaleVisit,
  VisitTask,
  CustomerSource,
  OrderStatus,
  ProductionStage,
  VisitStatus,
  RepurchaseIntention,
  CustomerSourceStat,
  VisitConversionStat,
  TaskPriority
} from '@/types'
import {
  customerSourceOptions,
  orderStatusOptions,
  productionStageOptions,
  visitStatusOptions,
  repurchaseIntentionOptions
} from '@/types'
import {
  getCustomers,
  saveCustomers,
  getCustomOrders,
  saveCustomOrders,
  getProductionRecords,
  saveProductionRecords,
  getDeliveryConfirms,
  saveDeliveryConfirms,
  getAfterSaleVisits,
  saveAfterSaleVisits,
  getVisitTasks,
  saveVisitTasks,
  generateId,
  generateOrderNo,
  getToday,
  isPhoneValid,
  isEmailValid,
  isBudgetValid,
  isDateNotPast,
  diffDays,
  addDays,
  formatDate,
  getDateRange
} from '@/utils/storage'

export const useCustomerStore = defineStore('customer', () => {
  const customers = ref<Customer[]>(getCustomers())
  const customOrders = ref<CustomOrder[]>(getCustomOrders())
  const productionRecords = ref<ProductionProgressRecord[]>(getProductionRecords())
  const deliveryConfirms = ref<DeliveryConfirm[]>(getDeliveryConfirms())
  const afterSaleVisits = ref<AfterSaleVisit[]>(getAfterSaleVisits())
  const visitTasks = ref<VisitTask[]>(getVisitTasks())

  watch(customers, (val) => saveCustomers(val), { deep: true })
  watch(customOrders, (val) => saveCustomOrders(val), { deep: true })
  watch(productionRecords, (val) => saveProductionRecords(val), { deep: true })
  watch(deliveryConfirms, (val) => saveDeliveryConfirms(val), { deep: true })
  watch(afterSaleVisits, (val) => saveAfterSaleVisits(val), { deep: true })
  watch(visitTasks, (val) => saveVisitTasks(val), { deep: true })

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

  function addCustomer(data: Omit<Customer, 'id' | 'totalOrders' | 'totalAmount' | 'memberLevel' | 'points' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; customer?: Customer } {
    if (!data.name.trim()) {
      return { success: false, message: '客户姓名不能为空' }
    }
    if (!data.phone.trim()) {
      return { success: false, message: '手机号码不能为空' }
    }
    if (!isPhoneValid(data.phone)) {
      return { success: false, message: '请输入正确的手机号码' }
    }
    if (data.email && !isEmailValid(data.email)) {
      return { success: false, message: '请输入正确的邮箱地址' }
    }
    if (getCustomerByPhone(data.phone)) {
      return { success: false, message: '该手机号码已存在' }
    }

    const now = new Date().toISOString()
    const customer: Customer = {
      ...data,
      id: generateId(),
      memberLevel: 'bronze',
      points: 100,
      totalOrders: 0,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now
    }
    customers.value.push(customer)
    return { success: true, customer }
  }

  function updateCustomer(id: string, data: Partial<Customer>): { success: boolean; message?: string } {
    const index = customers.value.findIndex(c => c.id === id)
    if (index === -1) {
      return { success: false, message: '客户不存在' }
    }

    const current = customers.value[index]

    if (data.phone !== undefined && data.phone !== current.phone) {
      if (!isPhoneValid(data.phone)) {
        return { success: false, message: '请输入正确的手机号码' }
      }
      if (getCustomerByPhone(data.phone)) {
        return { success: false, message: '该手机号码已存在' }
      }
    }

    if (data.email !== undefined && data.email && !isEmailValid(data.email)) {
      return { success: false, message: '请输入正确的邮箱地址' }
    }

    customers.value[index] = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    }
    return { success: true }
  }

  function deleteCustomer(id: string): void {
    customers.value = customers.value.filter(c => c.id !== id)
    customOrders.value = customOrders.value.filter(o => o.customerId !== id)
    productionRecords.value = productionRecords.value.filter(r => {
      const order = customOrders.value.find(o => o.id === r.orderId)
      return order !== undefined
    })
    deliveryConfirms.value = deliveryConfirms.value.filter(d => d.customerId !== id)
    afterSaleVisits.value = afterSaleVisits.value.filter(v => v.customerId !== id)
    visitTasks.value = visitTasks.value.filter(t => t.customerId !== id)
  }

  function addCustomOrder(data: Omit<CustomOrder, 'id' | 'orderNo' | 'progressPercent' | 'isOverdue' | 'landscapeIds' | 'designFiles' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; order?: CustomOrder } {
    if (!data.customerId) {
      return { success: false, message: '请选择客户' }
    }
    if (!data.demandDescription.trim()) {
      return { success: false, message: '请填写定制需求描述' }
    }
    if (!isBudgetValid(data.budgetMin, data.budgetMax)) {
      return { success: false, message: '预算区间填写不正确' }
    }
    if (!data.appointmentDeliveryDate) {
      return { success: false, message: '请选择预约交付日期' }
    }
    if (data.appointmentDeliveryDate < getToday()) {
      return { success: false, message: '预约交付日期不能早于今天' }
    }

    const customer = getCustomerById(data.customerId)
    if (!customer) {
      return { success: false, message: '客户不存在' }
    }

    const now = new Date().toISOString()
    const order: CustomOrder = {
      ...data,
      id: generateId(),
      orderNo: generateOrderNo(),
      progressPercent: 0,
      isOverdue: false,
      landscapeIds: [],
      designFiles: [],
      createdAt: now,
      updatedAt: now
    }
    customOrders.value.push(order)

    updateCustomerStats(data.customerId)

    initProductionProgress(order.id)

    return { success: true, order }
  }

  function updateCustomOrder(id: string, data: Partial<CustomOrder>): { success: boolean; message?: string } {
    const index = customOrders.value.findIndex(o => o.id === id)
    if (index === -1) {
      return { success: false, message: '订单不存在' }
    }

    const current = customOrders.value[index]

    if (data.budgetMin !== undefined || data.budgetMax !== undefined) {
      const min = data.budgetMin ?? current.budgetMin
      const max = data.budgetMax ?? current.budgetMax
      if (!isBudgetValid(min, max)) {
        return { success: false, message: '预算区间填写不正确' }
      }
    }

    customOrders.value[index] = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    }

    checkOrderOverdue(customOrders.value[index])

    if (data.status === 'delivered') {
      const order = customOrders.value[index]
      order.actualDeliveryDate = getToday()
      updateCustomerStats(order.customerId)
      generateDeliveryVisitTask(order.id, order.customerName)
    }

    return { success: true }
  }

  function deleteCustomOrder(id: string): void {
    const order = getOrderById(id)
    customOrders.value = customOrders.value.filter(o => o.id !== id)
    productionRecords.value = productionRecords.value.filter(r => r.orderId !== id)
    deliveryConfirms.value = deliveryConfirms.value.filter(d => d.orderId !== id)
    afterSaleVisits.value = afterSaleVisits.value.filter(v => v.orderId !== id)
    visitTasks.value = visitTasks.value.filter(t => t.orderId !== id)

    if (order) {
      updateCustomerStats(order.customerId)
    }
  }

  function updateCustomerStats(customerId: string): void {
    const orders = getOrdersByCustomerId(customerId)
    const customer = getCustomerById(customerId)
    if (!customer) return

    const deliveredOrders = orders.filter(o => o.status === 'delivered')
    const totalAmount = deliveredOrders.reduce((sum, o) => sum + (o.finalPrice || 0), 0)
    const firstOrder = orders.length > 0 ? orders[orders.length - 1] : null
    const lastOrder = orders.length > 0 ? orders[0] : null

    updateCustomer(customerId, {
      totalOrders: orders.length,
      totalAmount,
      firstOrderDate: firstOrder?.createdAt ? formatDate(firstOrder.createdAt) : undefined,
      lastOrderDate: lastOrder?.createdAt ? formatDate(lastOrder.createdAt) : undefined
    })
  }

  function initProductionProgress(orderId: string): void {
    const stages = productionStageOptions
    stages.forEach((stage, index) => {
      const record: ProductionProgressRecord = {
        id: generateId(),
        orderId,
        stage: stage.value as ProductionStage,
        stageName: stage.label,
        status: index === 0 ? 'in_progress' : 'pending',
        operator: '',
        description: '',
        attachments: [],
        createdAt: new Date().toISOString()
      }
      productionRecords.value.push(record)
    })
  }

  function updateProductionStage(orderId: string, stage: ProductionStage, data: Partial<ProductionProgressRecord>): { success: boolean; message?: string } {
    const records = getProductionRecordsByOrderId(orderId)
    const record = records.find(r => r.stage === stage)
    if (!record) {
      return { success: false, message: '进度记录不存在' }
    }

    const order = getOrderById(orderId)
    if (!order) {
      return { success: false, message: '订单不存在' }
    }

    Object.assign(record, data)

    const allStages = productionStageOptions
    const currentIndex = allStages.findIndex(s => s.value === stage)
    const completedCount = records.filter(r => r.status === 'completed').length
    const totalStages = allStages.length
    const progressPercent = Math.round((completedCount / totalStages) * 100)

    let currentStageValue: ProductionStage = 'demand_confirm'
    if (completedCount === totalStages) {
      currentStageValue = 'packaging'
    } else {
      const currentStageRecord = records.find(r => r.status === 'in_progress')
      if (currentStageRecord) {
        currentStageValue = currentStageRecord.stage
      } else if (completedCount > 0 && currentIndex < totalStages - 1) {
        currentStageValue = allStages[completedCount].value as ProductionStage
        const nextRecord = records.find(r => r.stage === currentStageValue)
        if (nextRecord) {
          nextRecord.status = 'in_progress'
        }
      }
    }

    updateCustomOrder(orderId, {
      currentStage: currentStageValue,
      progressPercent
    })

    if (progressPercent === 100) {
      updateCustomOrder(orderId, { status: 'ready' })
    } else if (progressPercent > 0 && order.status === 'pending') {
      updateCustomOrder(orderId, { status: 'producing' })
    }

    return { success: true }
  }

  function checkOrderOverdue(order: CustomOrder): void {
    if (['delivered', 'cancelled'].includes(order.status)) {
      order.isOverdue = false
      return
    }
    const today = getToday()
    order.isOverdue = order.appointmentDeliveryDate < today
  }

  function confirmDelivery(orderId: string, data: Omit<DeliveryConfirm, 'id' | 'orderId' | 'customerId' | 'createdAt' | 'isConfirmed' | 'confirmedAt'>): { success: boolean; message?: string; confirm?: DeliveryConfirm } {
    const order = getOrderById(orderId)
    if (!order) {
      return { success: false, message: '订单不存在' }
    }

    const confirm: DeliveryConfirm = {
      ...data,
      id: generateId(),
      orderId,
      customerId: order.customerId,
      isConfirmed: true,
      confirmedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    deliveryConfirms.value.push(confirm)

    updateCustomOrder(orderId, {
      status: 'delivered',
      actualDeliveryDate: data.deliveryDate
    })

    generateDeliveryVisitTask(orderId, order.customerName)

    return { success: true, confirm }
  }

  function addAfterSaleVisit(data: Omit<AfterSaleVisit, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>): { success: boolean; message?: string; visit?: AfterSaleVisit } {
    if (!data.orderId) {
      return { success: false, message: '请选择订单' }
    }
    if (!data.customerId) {
      return { success: false, message: '客户信息缺失' }
    }
    if (data.satisfactionScore < 1 || data.satisfactionScore > 5) {
      return { success: false, message: '满意度评分需在1-5之间' }
    }

    const visit: AfterSaleVisit = {
      ...data,
      id: generateId(),
      isCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    afterSaleVisits.value.push(visit)

    completeVisitTasksByOrderId(data.orderId, 'delivery_visit')

    return { success: true, visit }
  }

  function updateAfterSaleVisit(id: string, data: Partial<AfterSaleVisit>): { success: boolean; message?: string } {
    const index = afterSaleVisits.value.findIndex(v => v.id === id)
    if (index === -1) {
      return { success: false, message: '回访记录不存在' }
    }

    afterSaleVisits.value[index] = {
      ...afterSaleVisits.value[index],
      ...data,
      updatedAt: new Date().toISOString()
    }
    return { success: true }
  }

  function addVisitTask(data: Omit<VisitTask, 'id' | 'createdAt' | 'completedAt'>): VisitTask {
    const task: VisitTask = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    visitTasks.value.push(task)
    return task
  }

  function updateVisitTaskStatus(taskId: string, status: VisitStatus): void {
    const task = visitTasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
      if (status === 'completed') {
        task.completedAt = new Date().toISOString()
      }
    }
  }

  function completeVisitTasksByOrderId(orderId: string, taskType?: string): void {
    visitTasks.value
      .filter(t => t.orderId === orderId && (!taskType || t.taskType === taskType) && t.status !== 'completed')
      .forEach(t => {
        t.status = 'completed'
        t.completedAt = new Date().toISOString()
      })
  }

  function generateDeliveryVisitTask(orderId: string, customerName: string): void {
    const order = getOrderById(orderId)
    if (!order) return

    const baseDate = order.actualDeliveryDate || order.appointmentDeliveryDate
    const visitDate = addDays(baseDate, 3)
    const existingTask = visitTasks.value.find(
      t => t.orderId === orderId && t.taskType === 'delivery_visit' && t.status !== 'completed'
    )
    if (existingTask) return

    addVisitTask({
      orderId,
      customerId: order.customerId,
      customerName,
      taskType: 'delivery_visit',
      title: `${customerName} - 交付后回访`,
      description: `订单 ${order.orderNo} 交付后3天回访，了解产品使用情况和满意度`,
      plannedDate: visitDate,
      status: 'pending',
      priority: 'medium',
      assignedTo: '系统自动'
    })
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

    const totalCustomers = customers.value.length

    return customerSourceOptions.map(option => {
      const stat = sourceMap.get(option.value as CustomerSource) || { count: 0, amount: 0 }
      return {
        source: option.value as CustomerSource,
        sourceLabel: option.label,
        count: stat.count,
        amount: stat.amount,
        conversionRate: totalCustomers > 0 ? Math.round((stat.count / totalCustomers) * 100) : 0
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
    const stats: Record<RepurchaseIntention, number> = { high: 0, medium: 0, low: 0, none: 0 }
    afterSaleVisits.value.forEach(v => {
      if (stats[v.repurchaseIntention] !== undefined) {
        stats[v.repurchaseIntention]++
      }
    })
    return stats
  }

  function initMockData(): void {
    if (customers.value.length > 0) return

    const today = getToday()
    const mockCustomers: Omit<Customer, 'id' | 'totalOrders' | 'totalAmount' | 'memberLevel' | 'points' | 'createdAt' | 'updatedAt'>[] = [
      { name: '张小明', phone: '13800138001', wechatId: 'zhangxm_wx', email: 'zhangxm@example.com', address: '北京市朝阳区XX小区', birthday: '1990-06-15', source: 'recommendation', sourceDetail: '朋友李华推荐', tags: ['VIP', '高消费'], repurchaseIntention: 'high', notes: '偏好日式禅意风格，对细节要求高' },
      { name: '李小红', phone: '13900139002', wechatId: 'lixh_wx', email: 'lixh@example.com', address: '上海市浦东新区XX路', birthday: '1995-08-20', source: 'social_media', sourceDetail: '小红书种草', tags: ['新客户'], repurchaseIntention: 'medium', notes: '第一次购买，需要多介绍养护知识' },
      { name: '王大伟', phone: '13700137003', wechatId: 'wangdw_wx', birthday: '1988-03-10', source: 'offline_store', tags: ['回头客'], repurchaseIntention: 'medium', notes: '喜欢简约现代风格' },
      { name: '赵小芳', phone: '13600136004', wechatId: 'zhaoxf_wx', email: 'zhaoxf@example.com', birthday: '1992-12-05', source: 'online_platform', sourceDetail: '淘宝店铺', tags: ['批量采购'], repurchaseIntention: 'low', notes: '公司采购，需要开发票' },
      { name: '刘小军', phone: '13500135005', birthday: '1985-11-28', source: 'exhibition', sourceDetail: '2024上海文创展', tags: ['展会客户'], repurchaseIntention: 'low', notes: '展会现场下单，有优惠' }
    ]

    mockCustomers.forEach(c => addCustomer(c))

    const levelPoints = [8000, 500, 1200, 30000, 2500]
    customers.value.forEach((customer, index) => {
      customer.points = levelPoints[index]
      if (levelPoints[index] >= 50000) customer.memberLevel = 'diamond'
      else if (levelPoints[index] >= 20000) customer.memberLevel = 'platinum'
      else if (levelPoints[index] >= 5000) customer.memberLevel = 'gold'
      else if (levelPoints[index] >= 1000) customer.memberLevel = 'silver'
      else customer.memberLevel = 'bronze'
    })

    if (customOrders.value.length > 0) return

    const customerIds = customers.value.map(c => c.id)

    const mockOrders: Omit<CustomOrder, 'id' | 'orderNo' | 'progressPercent' | 'isOverdue' | 'landscapeIds' | 'designFiles' | 'createdAt' | 'updatedAt'>[] = [
      { customerId: customerIds[0], customerName: '张小明', demandDescription: '日式禅意风格微景观，需要包含枯山水元素，尺寸约20cm直径', containerType: '陶瓷盆', mossSpecies: '白发藓', size: '20cm直径', style: '日式禅意', budgetMin: 800, budgetMax: 1200, finalPrice: 1080, appointmentDeliveryDate: addDays(today, 7), status: 'producing', currentStage: 'production', isUrgent: false, depositAmount: 500, balanceAmount: 580, paymentStatus: 'deposit_paid', productionNotes: '客户要求加入小石子装饰', deliveryMethod: 'express', trackingNumber: '' },
      { customerId: customerIds[1], customerName: '李小红', demandDescription: '森系自然风格，送女朋友生日礼物，希望有小鹿摆件', containerType: '玻璃圆瓶', mossSpecies: '大灰藓', size: '15cm直径', style: '森系自然', budgetMin: 300, budgetMax: 500, finalPrice: 458, appointmentDeliveryDate: addDays(today, -2), status: 'delivered', currentStage: 'packaging', isUrgent: false, depositAmount: 200, balanceAmount: 258, paymentStatus: 'paid', productionNotes: '加精美礼盒包装和贺卡', deliveryMethod: 'express', trackingNumber: 'SF1234567890' },
      { customerId: customerIds[2], customerName: '王大伟', demandDescription: '简约现代风格，办公桌摆放，不要太大', containerType: '玻璃方缸', mossSpecies: '短绒藓', size: '10x10cm', style: '简约现代', budgetMin: 200, budgetMax: 400, finalPrice: 328, appointmentDeliveryDate: addDays(today, 3), status: 'quality_check', currentStage: 'quality_check', isUrgent: true, depositAmount: 100, balanceAmount: 228, paymentStatus: 'deposit_paid', productionNotes: '加急单，客户下周三要用', deliveryMethod: 'self_pickup' },
      { customerId: customerIds[3], customerName: '赵小芳', demandDescription: '公司年会礼品，需要定制logo，共20份', containerType: '生态瓶', mossSpecies: '白发藓', size: '8cm直径', style: '简约现代', budgetMin: 2000, budgetMax: 4000, finalPrice: 3600, appointmentDeliveryDate: addDays(today, 14), status: 'pending', currentStage: 'demand_confirm', isUrgent: false, depositAmount: 1000, balanceAmount: 2600, paymentStatus: 'deposit_paid', productionNotes: '需要每瓶印公司logo，附定制卡片', deliveryMethod: 'local_delivery' },
      { customerId: customerIds[4], customerName: '刘小军', demandDescription: '中式古典风格，放在书房，要有文人气息', containerType: '陶瓷盆', mossSpecies: '大羽藓', size: '25cm直径', style: '中式古典', budgetMin: 1500, budgetMax: 2500, finalPrice: 2180, appointmentDeliveryDate: addDays(today, -5), status: 'delivered', currentStage: 'packaging', isUrgent: false, depositAmount: 1000, balanceAmount: 1180, paymentStatus: 'paid', productionNotes: '客户喜欢古文元素', deliveryMethod: 'self_pickup' }
    ]

    mockOrders.forEach(o => addCustomOrder(o))

    const deliveredOrders = customOrders.value.filter(o => o.status === 'delivered')
    deliveredOrders.forEach(order => {
      const visit: Omit<AfterSaleVisit, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'> = {
        orderId: order.id,
        customerId: order.customerId,
        visitDate: order.actualDeliveryDate || getToday(),
        visitType: 'phone',
        visitor: '客服小王',
        satisfactionScore: order.customerName === '李小红' ? 5 : 4,
        productFeedback: order.customerName === '李小红' ? '非常满意，女朋友很喜欢' : '产品质量不错，包装精美',
        usageFeedback: '养护简单，按说明喷雾即可',
        suggestions: order.customerName === '刘小军' ? '希望多推出中式风格产品' : '',
        issuesReported: '',
        issueHandled: true,
        handlingResult: '',
        repurchaseIntention: order.customerName === '张小明' ? 'high' : order.customerName === '李小红' ? 'medium' : 'low',
        repurchaseIntentionDetail: order.customerName === '张小明' ? '打算再买一个送朋友' : '',
        nextFollowUpDate: addDays(getToday(), 30)
      }
      addAfterSaleVisit(visit)
    })
  }

  return {
    customers,
    customOrders,
    productionRecords,
    deliveryConfirms,
    afterSaleVisits,
    visitTasks,
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
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomOrder,
    updateCustomOrder,
    deleteCustomOrder,
    updateProductionStage,
    confirmDelivery,
    addAfterSaleVisit,
    updateAfterSaleVisit,
    addVisitTask,
    updateVisitTaskStatus,
    completeVisitTasksByOrderId,
    generateDeliveryVisitTask,
    getCustomerSourceStats,
    getVisitConversionStats,
    getOrderStatusStats,
    getVisitTaskStats,
    getRepurchaseStats,
    initMockData
  }
})
