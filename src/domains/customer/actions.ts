import type { Ref } from 'vue'
import { generateId, generateOrderNo, getToday, addDays, formatDate } from '@/shared/utils'
import type {
  Customer,
  CustomOrder,
  ProductionProgressRecord,
  DeliveryConfirm,
  AfterSaleVisit,
  VisitTask,
  OrderStatus,
  ProductionStage,
  VisitStatus
} from './types'
import type { CustomerSelectors } from './selectors'
import {
  validateCustomerCreate,
  validateCustomerUpdate,
  validateCustomOrderCreate,
  validateCustomOrderUpdate,
  validateAfterSaleVisit
} from './validators'
import { productionStageOptions } from './constants'

export interface CustomerActions {
  addCustomer: (data: Omit<Customer, 'id' | 'totalOrders' | 'totalAmount' | 'memberLevel' | 'points' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; customer?: Customer }
  updateCustomer: (id: string, data: Partial<Customer>) => { success: boolean; message?: string }
  deleteCustomer: (id: string) => void
  addCustomOrder: (data: Omit<CustomOrder, 'id' | 'orderNo' | 'progressPercent' | 'isOverdue' | 'landscapeIds' | 'designFiles' | 'createdAt' | 'updatedAt'>) => { success: boolean; message?: string; order?: CustomOrder }
  updateCustomOrder: (id: string, data: Partial<CustomOrder>) => { success: boolean; message?: string }
  deleteCustomOrder: (id: string) => void
  updateCustomerStats: (customerId: string) => void
  initProductionProgress: (orderId: string) => void
  updateProductionStage: (orderId: string, stage: ProductionStage, data: Partial<ProductionProgressRecord>) => { success: boolean; message?: string }
  checkOrderOverdue: (order: CustomOrder) => void
  confirmDelivery: (orderId: string, data: Omit<DeliveryConfirm, 'id' | 'orderId' | 'customerId' | 'createdAt' | 'isConfirmed' | 'confirmedAt'>) => { success: boolean; message?: string; confirm?: DeliveryConfirm }
  addAfterSaleVisit: (data: Omit<AfterSaleVisit, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => { success: boolean; message?: string; visit?: AfterSaleVisit }
  updateAfterSaleVisit: (id: string, data: Partial<AfterSaleVisit>) => { success: boolean; message?: string }
  addVisitTask: (data: Omit<VisitTask, 'id' | 'createdAt' | 'completedAt'>) => VisitTask
  updateVisitTaskStatus: (taskId: string, status: VisitStatus) => void
  completeVisitTasksByOrderId: (orderId: string, taskType?: string) => void
  generateDeliveryVisitTask: (orderId: string, customerName: string) => void
  initMockData: () => void
}

export function createActions(
  customers: Ref<Customer[]>,
  customOrders: Ref<CustomOrder[]>,
  productionRecords: Ref<ProductionProgressRecord[]>,
  deliveryConfirms: Ref<DeliveryConfirm[]>,
  afterSaleVisits: Ref<AfterSaleVisit[]>,
  visitTasks: Ref<VisitTask[]>,
  selectors: CustomerSelectors
): CustomerActions {
  function addCustomer(data: Omit<Customer, 'id' | 'totalOrders' | 'totalAmount' | 'memberLevel' | 'points' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; customer?: Customer } {
    const validation = validateCustomerCreate(data, selectors.getCustomerByPhone)
    if (!validation.valid) {
      return { success: false, message: validation.errors[0] }
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
    const validation = validateCustomerUpdate(id, data, current, selectors.getCustomerByPhone)
    if (!validation.valid) {
      return { success: false, message: validation.errors[0] }
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
    const orderIds = customOrders.value
      .filter(o => o.customerId === id)
      .map(o => o.id)
    customOrders.value = customOrders.value.filter(o => o.customerId !== id)
    productionRecords.value = productionRecords.value.filter(r => {
      return orderIds.includes(r.orderId) === false
    })
    deliveryConfirms.value = deliveryConfirms.value.filter(d => d.customerId !== id)
    afterSaleVisits.value = afterSaleVisits.value.filter(v => v.customerId !== id)
    visitTasks.value = visitTasks.value.filter(t => t.customerId !== id)
  }

  function addCustomOrder(data: Omit<CustomOrder, 'id' | 'orderNo' | 'progressPercent' | 'isOverdue' | 'landscapeIds' | 'designFiles' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; order?: CustomOrder } {
    const validation = validateCustomOrderCreate(data, selectors.getCustomerById)
    if (!validation.valid) {
      return { success: false, message: validation.errors[0] }
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
    const validation = validateCustomOrderUpdate(id, data, current)
    if (!validation.valid) {
      return { success: false, message: validation.errors[0] }
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
    const order = selectors.getOrderById(id)
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
    const orders = selectors.getOrdersByCustomerId(customerId)
    const customer = selectors.getCustomerById(customerId)
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
    const records = selectors.getProductionRecordsByOrderId(orderId)
    const record = records.find(r => r.stage === stage)
    if (!record) {
      return { success: false, message: '进度记录不存在' }
    }

    const order = selectors.getOrderById(orderId)
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
    const order = selectors.getOrderById(orderId)
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
    const validation = validateAfterSaleVisit(data)
    if (!validation.valid) {
      return { success: false, message: validation.errors[0] }
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
    const order = selectors.getOrderById(orderId)
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
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addCustomOrder,
    updateCustomOrder,
    deleteCustomOrder,
    updateCustomerStats,
    initProductionProgress,
    updateProductionStage,
    checkOrderOverdue,
    confirmDelivery,
    addAfterSaleVisit,
    updateAfterSaleVisit,
    addVisitTask,
    updateVisitTaskStatus,
    completeVisitTasksByOrderId,
    generateDeliveryVisitTask,
    initMockData
  }
}
