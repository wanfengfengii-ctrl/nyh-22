<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NTab,
  NTabs,
  NButton,
  NSpace,
  NTag,
  NIcon,
  NBadge,
  NInput,
  NSelect,
  NDatePicker,
  NDataTable,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NDescriptions,
  NDescriptionsItem,
  NProgress,
  NList,
  NListItem,
  NEmpty,
  NPopconfirm,
  NMessageProvider,
  useMessage,
  NRate,
  NDynamicTags,
  NSteps,
  NStep,
  NSwitch
} from 'naive-ui'
import {
  Users,
  ClipboardList,
  Package,
  PhoneCall,
  BarChart3,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  ChevronRight
} from 'lucide-vue-next'
import { useCustomerStore } from '@/stores/customer'
import type {
  Customer,
  CustomOrder,
  ProductionStage,
  AfterSaleVisit,
  OrderStatus,
  CustomerSource
} from '@/types'
import {
  customerSourceOptions,
  orderStatusOptions,
  productionStageOptions,
  repurchaseIntentionOptions,
  deliveryMethodOptions,
  paymentStatusOptions,
  visitTypeOptions,
  styleOptions,
  mossSpeciesOptions,
  containerTypeOptions
} from '@/types'
import { getToday, addDays, diffDays } from '@/utils/storage'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const store = useCustomerStore()
const message = useMessage()

const activeTab = ref('overview')

const showCustomerModal = ref(false)
const customerModalMode = ref<'add' | 'edit'>('add')
const editingCustomer = ref<Customer | null>(null)
const customerForm = ref({
  name: '',
  phone: '',
  wechatId: '',
  email: '',
  address: '',
  source: 'recommendation' as CustomerSource,
  sourceDetail: '',
  tags: [] as string[],
  notes: ''
})

const showOrderModal = ref(false)
const orderModalMode = ref<'add' | 'edit'>('add')
const editingOrder = ref<CustomOrder | null>(null)
const orderForm = ref({
  customerId: '',
  customerName: '',
  demandDescription: '',
  containerType: '',
  mossSpecies: '',
  size: '',
  style: '',
  budgetMin: 0,
  budgetMax: 0,
  finalPrice: undefined as number | undefined,
  appointmentDeliveryDate: null as number | null,
  status: 'pending' as OrderStatus,
  depositAmount: undefined as number | undefined,
  balanceAmount: undefined as number | undefined,
  paymentStatus: 'unpaid' as 'unpaid' | 'deposit_paid' | 'paid',
  productionNotes: '',
  deliveryMethod: 'self_pickup' as 'self_pickup' | 'express' | 'local_delivery',
  isUrgent: false
})

const showProgressModal = ref(false)
const selectedOrder = ref<CustomOrder | null>(null)
const currentStage = ref<ProductionStage | ''>('')

const showDeliveryModal = ref(false)
const deliveryForm = ref({
  deliveryDate: null as number | null,
  receiverName: '',
  receiverPhone: '',
  deliveryMethod: 'self_pickup' as 'self_pickup' | 'express' | 'local_delivery',
  trackingNumber: '',
  packageCondition: 'good' as 'good' | 'slightly_damaged' | 'damaged',
  productCondition: 'good' as 'good' | 'minor_issue' | 'serious_issue',
  deliveryNotes: ''
})

const showVisitModal = ref(false)
const visitModalMode = ref<'add' | 'view'>('add')
const visitForm = ref({
  orderId: '',
  customerId: '',
  visitDate: null as number | null,
  visitType: 'phone' as 'phone' | 'wechat' | 'onsite',
  visitor: '',
  satisfactionScore: 5,
  productFeedback: '',
  usageFeedback: '',
  suggestions: '',
  issuesReported: '',
  issueHandled: false,
  handlingResult: '',
  repurchaseIntention: 'medium' as 'high' | 'medium' | 'low' | 'none',
  repurchaseIntentionDetail: '',
  nextFollowUpDate: null as number | null
})

const customerSearch = ref('')
const customerSourceFilter = ref<string | null>(null)

const orderSearch = ref('')
const orderStatusFilter = ref<string | null>(null)
const orderCustomerFilter = ref<string | null>(null)
const showOverdueOnly = ref(false)

const customerDetailVisible = ref(false)
const selectedCustomer = ref<Customer | null>(null)

const orderDetailVisible = ref(false)
const viewOrder = ref<CustomOrder | null>(null)

function dateStrToTimestamp(dateStr: string): number | null {
  if (!dateStr) return null
  return new Date(dateStr).getTime()
}

function timestampToDateStr(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  store.initMockData()
})

const filteredCustomers = computed(() => {
  let result = store.customers
  if (customerSearch.value) {
    const keyword = customerSearch.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(keyword) ||
      c.phone.includes(keyword) ||
      c.wechatId?.toLowerCase().includes(keyword)
    )
  }
  if (customerSourceFilter.value) {
    result = result.filter(c => c.source === customerSourceFilter.value)
  }
  return result
})

const filteredOrders = computed(() => {
  let result = store.customOrders
  if (orderSearch.value) {
    const keyword = orderSearch.value.toLowerCase()
    result = result.filter(o =>
      o.orderNo.toLowerCase().includes(keyword) ||
      o.customerName.toLowerCase().includes(keyword)
    )
  }
  if (orderStatusFilter.value) {
    result = result.filter(o => o.status === orderStatusFilter.value)
  }
  if (orderCustomerFilter.value) {
    result = result.filter(o => o.customerId === orderCustomerFilter.value)
  }
  if (showOverdueOnly.value) {
    result = result.filter(o => o.isOverdue)
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const customerOptions = computed(() => {
  return store.customers.map(c => ({
    label: `${c.name} (${c.phone})`,
    value: c.id
  }))
})

const customerSourceChartOption = computed(() => {
  const stats = store.getCustomerSourceStats()
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      data: stats.map(s => ({ value: s.count, name: s.sourceLabel }))
    }]
  }
})

const visitConversionChartOption = computed(() => {
  const stats = store.getVisitConversionStats(30)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['回访数', '满意数', '复购意向数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stats.map(s => s.period) },
    yAxis: { type: 'value' },
    series: [
      { name: '回访数', type: 'bar', data: stats.map(s => s.totalVisits), itemStyle: { color: '#2080f0' } },
      { name: '满意数', type: 'bar', data: stats.map(s => s.satisfiedCount), itemStyle: { color: '#18a058' } },
      { name: '复购意向数', type: 'line', data: stats.map(s => s.repurchaseCount), itemStyle: { color: '#f0a020' } }
    ]
  }
})

const orderStatusChartOption = computed(() => {
  const stats = store.getOrderStatusStats()
  const data = orderStatusOptions.map(opt => ({
    value: stats[opt.value] || 0,
    name: opt.label,
    itemStyle: { color: opt.color }
  }))
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
    series: [{
      type: 'pie',
      radius: '60%',
      data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }
})

const visitTaskStats = computed(() => store.getVisitTaskStats())
const overdueCount = computed(() => store.overdueOrders.length)

function openAddCustomer() {
  customerModalMode.value = 'add'
  editingCustomer.value = null
  customerForm.value = {
    name: '',
    phone: '',
    wechatId: '',
    email: '',
    address: '',
    source: 'recommendation',
    sourceDetail: '',
    tags: [],
    notes: ''
  }
  showCustomerModal.value = true
}

function openEditCustomer(customer: Customer) {
  customerModalMode.value = 'edit'
  editingCustomer.value = customer
  customerForm.value = {
    name: customer.name,
    phone: customer.phone,
    wechatId: customer.wechatId || '',
    email: customer.email || '',
    address: customer.address || '',
    source: customer.source,
    sourceDetail: customer.sourceDetail || '',
    tags: [...customer.tags],
    notes: customer.notes
  }
  showCustomerModal.value = true
}

function handleSaveCustomer() {
  if (customerModalMode.value === 'add') {
    const result = store.addCustomer(customerForm.value)
    if (result.success) {
      message.success('客户添加成功')
      showCustomerModal.value = false
    } else {
      message.error(result.message || '添加失败')
    }
  } else if (editingCustomer.value) {
    const result = store.updateCustomer(editingCustomer.value.id, customerForm.value)
    if (result.success) {
      message.success('客户信息更新成功')
      showCustomerModal.value = false
    } else {
      message.error(result.message || '更新失败')
    }
  }
}

function handleDeleteCustomer(id: string) {
  store.deleteCustomer(id)
  message.success('客户已删除')
}

function viewCustomerDetail(customer: Customer) {
  selectedCustomer.value = customer
  customerDetailVisible.value = true
}

function openAddOrder() {
  orderModalMode.value = 'add'
  editingOrder.value = null
  orderForm.value = {
    customerId: '',
    customerName: '',
    demandDescription: '',
    containerType: '',
    mossSpecies: '',
    size: '',
    style: '',
    budgetMin: 0,
    budgetMax: 0,
    finalPrice: undefined,
    appointmentDeliveryDate: dateStrToTimestamp(addDays(getToday(), 7)),
    status: 'pending',
    depositAmount: undefined,
    balanceAmount: undefined,
    paymentStatus: 'unpaid',
    productionNotes: '',
    deliveryMethod: 'self_pickup',
    isUrgent: false
  }
  showOrderModal.value = true
}

function openEditOrder(order: CustomOrder) {
  orderModalMode.value = 'edit'
  editingOrder.value = order
  orderForm.value = {
    customerId: order.customerId,
    customerName: order.customerName,
    demandDescription: order.demandDescription,
    containerType: order.containerType,
    mossSpecies: order.mossSpecies,
    size: order.size,
    style: order.style,
    budgetMin: order.budgetMin,
    budgetMax: order.budgetMax,
    finalPrice: order.finalPrice,
    appointmentDeliveryDate: dateStrToTimestamp(order.appointmentDeliveryDate),
    status: order.status,
    depositAmount: order.depositAmount,
    balanceAmount: order.balanceAmount,
    paymentStatus: order.paymentStatus,
    productionNotes: order.productionNotes,
    deliveryMethod: order.deliveryMethod,
    isUrgent: order.isUrgent
  }
  showOrderModal.value = true
}

function handleCustomerSelect(value: string) {
  const customer = store.getCustomerById(value)
  if (customer) {
    orderForm.value.customerName = customer.name
  }
}

function handleSaveOrder() {
  const orderData = {
    ...orderForm.value,
    appointmentDeliveryDate: timestampToDateStr(orderForm.value.appointmentDeliveryDate)
  }
  if (orderModalMode.value === 'add') {
    const result = store.addCustomOrder(orderData as any)
    if (result.success) {
      message.success('订单创建成功')
      showOrderModal.value = false
    } else {
      message.error(result.message || '创建失败')
    }
  } else if (editingOrder.value) {
    const result = store.updateCustomOrder(editingOrder.value.id, orderData as any)
    if (result.success) {
      message.success('订单更新成功')
      showOrderModal.value = false
    } else {
      message.error(result.message || '更新失败')
    }
  }
}

function handleDeleteOrder(id: string) {
  store.deleteCustomOrder(id)
  message.success('订单已删除')
}

function viewOrderDetail(order: CustomOrder) {
  viewOrder.value = order
  orderDetailVisible.value = true
}

function openProgressTracking(order: CustomOrder) {
  selectedOrder.value = order
  showProgressModal.value = true
}

function getStageStatus(status: string) {
  const statusMap: Record<string, 'wait' | 'process' | 'finish' | 'error'> = {
    pending: 'wait',
    in_progress: 'process',
    completed: 'finish',
    skipped: 'wait'
  }
  return statusMap[status] || 'wait'
}

function handleStageComplete(orderId: string, stage: ProductionStage) {
  const records = store.getProductionRecordsByOrderId(orderId)
  const record = records.find(r => r.stage === stage)
  if (!record) return

  store.updateProductionStage(orderId, stage, {
    status: 'completed',
    endTime: new Date().toISOString(),
    operator: '当前用户',
    description: record.description || `${record.stageName}完成`
  })
  message.success('阶段已完成')
}

function openDeliveryConfirm(order: CustomOrder) {
  selectedOrder.value = order
  deliveryForm.value = {
    deliveryDate: dateStrToTimestamp(getToday()),
    receiverName: order.customerName,
    receiverPhone: '',
    deliveryMethod: order.deliveryMethod,
    trackingNumber: order.trackingNumber || '',
    packageCondition: 'good',
    productCondition: 'good',
    deliveryNotes: ''
  }
  const customer = store.getCustomerById(order.customerId)
  if (customer) {
    deliveryForm.value.receiverPhone = customer.phone
  }
  showDeliveryModal.value = true
}

function handleConfirmDelivery() {
  if (!selectedOrder.value) return
  const deliveryData = {
    ...deliveryForm.value,
    deliveryDate: timestampToDateStr(deliveryForm.value.deliveryDate)
  }
  const result = store.confirmDelivery(selectedOrder.value.id, deliveryData as any)
  if (result.success) {
    message.success('交付确认成功')
    showDeliveryModal.value = false
  } else {
    message.error(result.message || '确认失败')
  }
}

function openAddVisit(order: CustomOrder) {
  visitModalMode.value = 'add'
  visitForm.value = {
    orderId: order.id,
    customerId: order.customerId,
    visitDate: dateStrToTimestamp(getToday()),
    visitType: 'phone',
    visitor: '当前用户',
    satisfactionScore: 5,
    productFeedback: '',
    usageFeedback: '',
    suggestions: '',
    issuesReported: '',
    issueHandled: false,
    handlingResult: '',
    repurchaseIntention: 'medium',
    repurchaseIntentionDetail: '',
    nextFollowUpDate: dateStrToTimestamp(addDays(getToday(), 30))
  }
  showVisitModal.value = true
}

function viewVisitRecord(visit: AfterSaleVisit) {
  visitModalMode.value = 'view'
  visitForm.value = {
    ...visit,
    visitDate: dateStrToTimestamp(visit.visitDate),
    nextFollowUpDate: dateStrToTimestamp(visit.nextFollowUpDate)
  } as any
  showVisitModal.value = true
}

function handleSaveVisit() {
  const visitData = {
    ...visitForm.value,
    visitDate: timestampToDateStr(visitForm.value.visitDate),
    nextFollowUpDate: timestampToDateStr(visitForm.value.nextFollowUpDate)
  }
  const result = store.addAfterSaleVisit(visitData as any)
  if (result.success) {
    message.success('回访记录保存成功')
    showVisitModal.value = false
  } else {
    message.error(result.message || '保存失败')
  }
}

function getOrderStatusColor(status: string): string {
  const opt = orderStatusOptions.find(o => o.value === status)
  return opt?.color || '#999'
}

function getOrderStatusLabel(status: string): string {
  const opt = orderStatusOptions.find(o => o.value === status)
  return opt?.label || status
}

function getSourceLabel(source: string): string {
  const opt = customerSourceOptions.find(o => o.value === source)
  return opt?.label || source
}

function getPaymentStatusLabel(status: string): string {
  const opt = paymentStatusOptions.find(o => o.value === status)
  return opt?.label || status
}

function getPaymentStatusColor(status: string): string {
  const opt = paymentStatusOptions.find(o => o.value === status)
  return opt?.color || '#999'
}

function getRepurchaseLabel(value: string): string {
  const opt = repurchaseIntentionOptions.find(o => o.value === value)
  return opt?.label || value
}

function getRepurchaseColor(value: string): string {
  const opt = repurchaseIntentionOptions.find(o => o.value === value)
  return opt?.color || '#999'
}

const customerColumns = [
  { title: '客户姓名', key: 'name', width: 100 },
  { title: '手机号', key: 'phone', width: 130 },
  { title: '微信号', key: 'wechatId', width: 120 },
  {
    title: '客户来源',
    key: 'source',
    width: 100,
    render: (row: Customer) => h(NTag, { size: 'small' }, { default: () => getSourceLabel(row.source) })
  },
  {
    title: '订单数',
    key: 'totalOrders',
    width: 80,
    render: (row: Customer) => h('span', { class: 'font-medium' }, row.totalOrders)
  },
  {
    title: '累计消费',
    key: 'totalAmount',
    width: 100,
    render: (row: Customer) => h('span', { class: 'text-green-600 font-medium' }, `¥${row.totalAmount}`)
  },
  {
    title: '标签',
    key: 'tags',
    width: 150,
    render: (row: Customer) => h(NSpace, { size: 'small' }, {
      default: () => row.tags.map(tag => h(NTag, { size: 'small', type: 'info' }, { default: () => tag }))
    })
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right' as const,
    render: (row: Customer) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => viewCustomerDetail(row) }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(Eye) }), ' 详情']
        }),
        h(NButton, { size: 'small', type: 'info', quaternary: true, onClick: () => openEditCustomer(row) }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(Edit) }), ' 编辑']
        }),
        h(NPopconfirm, { onPositiveClick: () => handleDeleteCustomer(row.id) }, {
          default: () => '确定删除该客户吗？',
          trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, {
            default: () => [h(NIcon, { size: 16 }, { default: () => h(Trash2) }), ' 删除']
          })
        })
      ]
    })
  }
]

const orderColumns = [
  { title: '订单编号', key: 'orderNo', width: 180 },
  { title: '客户姓名', key: 'customerName', width: 100 },
  {
    title: '定制需求',
    key: 'demandDescription',
    ellipsis: { tooltip: true },
    width: 200
  },
  {
    title: '预算区间',
    key: 'budget',
    width: 120,
    render: (row: CustomOrder) => h('span', null, `¥${row.budgetMin} - ¥${row.budgetMax}`)
  },
  {
    title: '成交价',
    key: 'finalPrice',
    width: 100,
    render: (row: CustomOrder) => h('span', { class: 'text-green-600 font-medium' }, row.finalPrice ? `¥${row.finalPrice}` : '待确认')
  },
  {
    title: '预约交付',
    key: 'appointmentDeliveryDate',
    width: 110,
    render: (row: CustomOrder) => h('div', { class: 'flex items-center gap-1' }, [
      row.isOverdue && h(NIcon, { size: 14, color: '#d03050' }, { default: () => h(AlertTriangle) }),
      row.appointmentDeliveryDate
    ])
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row: CustomOrder) => h(NTag, {
      size: 'small',
      style: { backgroundColor: getOrderStatusColor(row.status) + '20', color: getOrderStatusColor(row.status), border: 'none' }
    }, { default: () => getOrderStatusLabel(row.status) })
  },
  {
    title: '进度',
    key: 'progressPercent',
    width: 100,
    render: (row: CustomOrder) => h(NProgress, {
      percentage: row.progressPercent,
      type: 'line',
      height: 8,
      color: {
        '0%': '#2080f0',
        '100%': '#18a058'
      } as any
    })
  },
  {
    title: '操作',
    key: 'actions',
    width: 220,
    fixed: 'right' as const,
    render: (row: CustomOrder) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => viewOrderDetail(row) }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(Eye) }), ' 详情']
        }),
        h(NButton, { size: 'small', type: 'info', quaternary: true, onClick: () => openProgressTracking(row) }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(Clock) }), ' 进度']
        }),
        row.status !== 'delivered' && row.status !== 'cancelled' && h(NButton, {
          size: 'small', type: 'success', quaternary: true, onClick: () => openDeliveryConfirm(row)
        }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(Package) }), ' 交付']
        }),
        row.status === 'delivered' && !store.getVisitByOrderId(row.id) && h(NButton, {
          size: 'small', type: 'warning', quaternary: true, onClick: () => openAddVisit(row)
        }, {
          default: () => [h(NIcon, { size: 16 }, { default: () => h(PhoneCall) }), ' 回访']
        })
      ].filter(Boolean)
    })
  }
]
</script>

<template>
  <div class="customer-center">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">客户定制与交付回访中心</h1>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab name="overview" label="总览">
        <template #prefix>
          <n-icon><bar-chart-3 /></n-icon>
        </template>
      </n-tab>
      <n-tab name="customers" label="客户档案">
        <template #prefix>
          <n-icon><users /></n-icon>
        </template>
      </n-tab>
      <n-tab name="orders" label="定制订单">
        <template #prefix>
          <n-icon><clipboard-list /></n-icon>
        </template>
      </n-tab>
      <n-tab name="visits" label="回访管理">
        <template #prefix>
          <n-icon><phone-call /></n-icon>
        </template>
      </n-tab>
    </n-tabs>

    <div v-show="activeTab === 'overview'" class="mt-4">
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card>
            <n-statistic label="客户总数" :value="store.totalCustomers">
              <template #prefix>
                <n-icon size="20"><users /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="订单总数" :value="store.totalOrders">
              <template #prefix>
                <n-icon size="20"><clipboard-list /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="已完成订单" :value="store.completedOrders" value-style="color: #18a058">
              <template #prefix>
                <n-icon size="20"><check-circle /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="累计营收" :value="store.totalRevenue" :precision="2" prefix="¥" value-style="color: #d03050">
              <template #prefix>
                <n-icon size="20"><dollar-sign /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="3" :x-gap="16" :y-gap="16" class="mt-4">
        <n-grid-item>
          <n-card title="订单状态分布" size="small">
            <v-chart :option="orderStatusChartOption" style="height: 280px" autoresize />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="客户来源分布" size="small">
            <v-chart :option="customerSourceChartOption" style="height: 280px" autoresize />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="回访转化趋势" size="small">
            <v-chart :option="visitConversionChartOption" style="height: 280px" autoresize />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="2" :x-gap="16" class="mt-4">
        <n-grid-item>
          <n-card title="超期订单提醒" size="small">
            <template #header-extra>
              <n-badge :value="overdueCount" type="error">
                <n-tag type="error" size="small">{{ overdueCount }} 个超期</n-tag>
              </n-badge>
            </template>
            <n-list v-if="store.overdueOrders.length > 0" bordered>
              <n-list-item v-for="order in store.overdueOrders.slice(0, 5)" :key="order.id" class="cursor-pointer hover:bg-gray-50" @click="viewOrderDetail(order)">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                    <n-icon color="#d03050"><alert-triangle /></n-icon>
                    <div>
                      <div class="font-medium">{{ order.orderNo }}</div>
                      <div class="text-sm text-gray-500">{{ order.customerName }} · 超期 {{ diffDays(order.appointmentDeliveryDate, getToday()) }} 天</div>
                    </div>
                  </div>
                  <n-icon size="16" color="#999"><chevron-right /></n-icon>
                </div>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无超期订单" size="small" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="待回访任务" size="small">
            <template #header-extra>
              <n-tag type="warning" size="small">{{ visitTaskStats.pending }} 个待回访</n-tag>
            </template>
            <n-list v-if="store.pendingVisitTasks.length > 0" bordered>
              <n-list-item v-for="task in store.pendingVisitTasks.slice(0, 5)" :key="task.id">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                    <n-icon :color="task.priority === 'high' ? '#d03050' : '#f0a020'"><phone-call /></n-icon>
                    <div>
                      <div class="font-medium">{{ task.title }}</div>
                      <div class="text-sm text-gray-500">计划: {{ task.plannedDate }}</div>
                    </div>
                  </div>
                  <n-tag size="small" :type="task.plannedDate < getToday() ? 'error' : 'default'">
                    {{ task.plannedDate < getToday() ? '已逾期' : '待处理' }}
                  </n-tag>
                </div>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无待回访任务" size="small" />
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <div v-show="activeTab === 'customers'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <n-space>
            <n-input v-model:value="customerSearch" placeholder="搜索客户姓名/手机号/微信号" style="width: 280px" clearable>
              <template #prefix>
                <n-icon><search /></n-icon>
              </template>
            </n-input>
            <n-select v-model:value="customerSourceFilter" placeholder="客户来源" clearable style="width: 160px" :options="customerSourceOptions" />
          </n-space>
          <n-button type="primary" @click="openAddCustomer">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新增客户
          </n-button>
        </div>
        <n-data-table
          :columns="customerColumns as any"
          :data="filteredCustomers"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'orders'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <n-space>
            <n-input v-model:value="orderSearch" placeholder="搜索订单号/客户姓名" style="width: 240px" clearable>
              <template #prefix>
                <n-icon><search /></n-icon>
              </template>
            </n-input>
            <n-select v-model:value="orderStatusFilter" placeholder="订单状态" clearable style="width: 140px" :options="orderStatusOptions" />
            <n-select v-model:value="orderCustomerFilter" placeholder="客户筛选" clearable style="width: 180px" :options="customerOptions" />
            <n-tag v-if="showOverdueOnly" closable type="error" @close="showOverdueOnly = false">只看超期</n-tag>
            <n-button text type="error" @click="showOverdueOnly = true" v-if="!showOverdueOnly">
              <n-icon size="16"><alert-triangle /></n-icon>
              超期订单 ({{ overdueCount }})
            </n-button>
          </n-space>
          <n-button type="primary" @click="openAddOrder">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新增订单
          </n-button>
        </div>
        <n-data-table
          :columns="orderColumns as any"
          :data="filteredOrders"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'visits'" class="mt-4">
      <n-grid :cols="4" :x-gap="16" :y-gap="16" class="mb-4">
        <n-grid-item>
          <n-card>
            <n-statistic label="待回访" :value="visitTaskStats.pending" value-style="color: #f0a020">
              <template #prefix><n-icon size="20"><clock /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="进行中" :value="visitTaskStats.inProgress" value-style="color: #2080f0">
              <template #prefix><n-icon size="20"><phone-call /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="已完成" :value="visitTaskStats.completed" value-style="color: #18a058">
              <template #prefix><n-icon size="20"><check-circle /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="高优先级" :value="visitTaskStats.highPriority" value-style="color: #d03050">
              <template #prefix><n-icon size="20"><alert-triangle /></n-icon></template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card title="回访任务列表" size="small">
        <n-list bordered>
          <n-list-item v-for="task in store.pendingVisitTasks" :key="task.id">
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center gap-4">
                <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: task.priority === 'high' ? '#d03050' : task.priority === 'medium' ? '#f0a020' : '#18a058' }"></div>
                <div>
                  <div class="font-medium">{{ task.title }}</div>
                  <div class="text-sm text-gray-500">客户: {{ task.customerName }} · 计划日期: {{ task.plannedDate }}</div>
                  <div class="text-sm text-gray-400">{{ task.description }}</div>
                </div>
              </div>
              <n-space>
                <n-tag size="small" type="info">{{ task.taskType === 'delivery_visit' ? '交付回访' : task.taskType === 'periodic_visit' ? '定期回访' : '投诉跟进' }}</n-tag>
                <n-button size="small" type="primary" quaternary @click="() => { const order = store.getOrderById(task.orderId); if (order) openAddVisit(order); }">
                  去回访
                </n-button>
              </n-space>
            </div>
          </n-list-item>
          <n-empty v-if="store.pendingVisitTasks.length === 0" description="暂无待回访任务" />
        </n-list>
      </n-card>
    </div>

    <n-modal v-model:show="showCustomerModal" preset="card" :title="customerModalMode === 'add' ? '新增客户' : '编辑客户'" style="width: 600px">
      <n-form label-placement="left" label-width="90px">
        <n-form-item label="客户姓名" required>
          <n-input v-model:value="customerForm.name" placeholder="请输入客户姓名" />
        </n-form-item>
        <n-form-item label="手机号码" required>
          <n-input v-model:value="customerForm.phone" placeholder="请输入手机号码" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="微信号">
              <n-input v-model:value="customerForm.wechatId" placeholder="请输入微信号" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="邮箱">
              <n-input v-model:value="customerForm.email" placeholder="请输入邮箱" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="地址">
          <n-input v-model:value="customerForm.address" placeholder="请输入地址" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="客户来源" required>
              <n-select v-model:value="customerForm.source" :options="customerSourceOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="来源说明">
              <n-input v-model:value="customerForm.sourceDetail" placeholder="请输入来源说明" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="客户标签">
          <n-dynamic-tags v-model:value="customerForm.tags" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input v-model:value="customerForm.notes" type="textarea" :rows="3" placeholder="请输入备注信息" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCustomerModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveCustomer">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showOrderModal" preset="card" :title="orderModalMode === 'add' ? '新增订单' : '编辑订单'" style="width: 680px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="选择客户" required>
          <n-select v-model:value="orderForm.customerId" :options="customerOptions" placeholder="请选择客户" filterable @update:value="handleCustomerSelect" />
        </n-form-item>
        <n-form-item label="需求描述" required>
          <n-input v-model:value="orderForm.demandDescription" type="textarea" :rows="3" placeholder="请详细描述客户的定制需求" />
        </n-form-item>
        <n-grid :cols="3" :x-gap="12">
          <n-grid-item>
            <n-form-item label="容器类型">
              <n-select v-model:value="orderForm.containerType" :options="containerTypeOptions.map(o => ({ label: o, value: o }))" placeholder="请选择" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="苔藓品种">
              <n-select v-model:value="orderForm.mossSpecies" :options="mossSpeciesOptions.map(o => ({ label: o, value: o }))" placeholder="请选择" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="尺寸">
              <n-input v-model:value="orderForm.size" placeholder="如: 20cm直径" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="风格">
          <n-select v-model:value="orderForm.style" :options="styleOptions.map(o => ({ label: o, value: o }))" placeholder="请选择风格" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="预算下限">
              <n-input-number v-model:value="orderForm.budgetMin" :min="0" style="width: 100%" placeholder="元" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="预算上限">
              <n-input-number v-model:value="orderForm.budgetMax" :min="0" style="width: 100%" placeholder="元" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="成交价格">
              <n-input-number v-model:value="orderForm.finalPrice" :min="0" style="width: 100%" placeholder="元" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="预约交付日期" required>
              <n-date-picker v-model:value="orderForm.appointmentDeliveryDate as any" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="订单状态">
              <n-select v-model:value="orderForm.status" :options="orderStatusOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="付款状态">
              <n-select v-model:value="orderForm.paymentStatus" :options="paymentStatusOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="定金金额">
              <n-input-number v-model:value="orderForm.depositAmount" :min="0" style="width: 100%" placeholder="元" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="尾款金额">
              <n-input-number v-model:value="orderForm.balanceAmount" :min="0" style="width: 100%" placeholder="元" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="交付方式">
              <n-select v-model:value="orderForm.deliveryMethod" :options="deliveryMethodOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="加急订单">
              <n-switch v-model:value="orderForm.isUrgent" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="制作备注">
          <n-input v-model:value="orderForm.productionNotes" type="textarea" :rows="2" placeholder="请输入制作备注" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showOrderModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveOrder">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showProgressModal" preset="card" title="制作进度跟踪" style="width: 600px">
      <div v-if="selectedOrder" class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">{{ selectedOrder.orderNo }}</span>
          <n-tag :style="{ backgroundColor: getOrderStatusColor(selectedOrder.status) + '20', color: getOrderStatusColor(selectedOrder.status), border: 'none' }">
            {{ getOrderStatusLabel(selectedOrder.status) }}
          </n-tag>
        </div>
        <n-progress :percentage="selectedOrder.progressPercent" :color="{ '0%': '#2080f0', '100%': '#18a058' } as any" />
      </div>
      <div v-if="selectedOrder">
        <n-steps :current="store.getProductionRecordsByOrderId(selectedOrder.id).filter(r => r.status === 'completed').length" vertical>
          <n-step
            v-for="record in store.getProductionRecordsByOrderId(selectedOrder.id)"
            :key="record.id"
            :status="getStageStatus(record.status)"
            :title="record.stageName"
            :description="record.description || (record.status === 'completed' ? '已完成' : record.status === 'in_progress' ? '进行中' : '待处理')"
          />
        </n-steps>
      </div>
      <template #footer>
        <n-space justify="space-between">
          <n-space v-if="selectedOrder && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled'">
            <n-select
              v-model:value="currentStage"
              :options="store.getProductionRecordsByOrderId(selectedOrder.id).filter(r => r.status !== 'completed').map(r => ({ label: r.stageName, value: r.stage }))"
              placeholder="选择阶段"
              style="width: 200px"
            />
            <n-button type="primary" :disabled="!currentStage" @click="handleStageComplete(selectedOrder!.id, currentStage as ProductionStage)">
              标记阶段完成
            </n-button>
          </n-space>
          <n-button @click="showProgressModal = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showDeliveryModal" preset="card" title="交付确认" style="width: 560px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="交付日期" required>
          <n-date-picker v-model:value="deliveryForm.deliveryDate" type="date" style="width: 100%" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="收货人" required>
              <n-input v-model:value="deliveryForm.receiverName" placeholder="请输入收货人姓名" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="联系电话" required>
              <n-input v-model:value="deliveryForm.receiverPhone" placeholder="请输入联系电话" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="交付方式">
              <n-select v-model:value="deliveryForm.deliveryMethod" :options="deliveryMethodOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="快递单号">
              <n-input v-model:value="deliveryForm.trackingNumber" placeholder="请输入快递单号" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="包装状态">
              <n-select v-model:value="deliveryForm.packageCondition" :options="[
                { label: '完好', value: 'good' },
                { label: '轻微破损', value: 'slightly_damaged' },
                { label: '严重破损', value: 'damaged' }
              ]" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="产品状态">
              <n-select v-model:value="deliveryForm.productCondition" :options="[
                { label: '完好', value: 'good' },
                { label: '小问题', value: 'minor_issue' },
                { label: '严重问题', value: 'serious_issue' }
              ]" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="交付备注">
          <n-input v-model:value="deliveryForm.deliveryNotes" placeholder="请输入交付备注" :rows="2" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showDeliveryModal = false">取消</n-button>
          <n-button type="primary" @click="handleConfirmDelivery">确认交付</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showVisitModal" preset="card" :title="visitModalMode === 'add' ? '新增回访记录' : '回访记录详情'" style="width: 640px">
      <n-form v-if="visitModalMode === 'add'" label-placement="left" label-width="100px">
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="回访日期">
              <n-date-picker v-model:value="visitForm.visitDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="回访方式">
              <n-select v-model:value="visitForm.visitType" :options="visitTypeOptions" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="回访人">
          <n-input v-model:value="visitForm.visitor" placeholder="请输入回访人姓名" />
        </n-form-item>
        <n-form-item label="满意度评分">
          <n-rate v-model:value="visitForm.satisfactionScore" :max="5" />
          <span class="ml-2 text-gray-500 text-sm">{{ visitForm.satisfactionScore }} 分</span>
        </n-form-item>
        <n-form-item label="产品反馈">
          <n-input v-model:value="visitForm.productFeedback" placeholder="客户对产品的评价" :rows="2" />
        </n-form-item>
        <n-form-item label="使用反馈">
          <n-input v-model:value="visitForm.usageFeedback" placeholder="客户使用情况反馈" :rows="2" />
        </n-form-item>
        <n-form-item label="建议意见">
          <n-input v-model:value="visitForm.suggestions" placeholder="客户的建议和意见" :rows="2" />
        </n-form-item>
        <n-form-item label="问题反馈">
          <n-input v-model:value="visitForm.issuesReported" placeholder="客户反馈的问题" :rows="2" />
        </n-form-item>
        <n-form-item label="是否已处理">
          <n-switch v-model:value="visitForm.issueHandled" />
        </n-form-item>
        <n-form-item v-if="visitForm.issueHandled" label="处理结果">
          <n-input v-model:value="visitForm.handlingResult" placeholder="问题处理结果" :rows="2" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="复购意向">
              <n-select v-model:value="visitForm.repurchaseIntention" :options="repurchaseIntentionOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="下次回访">
              <n-date-picker v-model:value="visitForm.nextFollowUpDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="意向详情">
          <n-input v-model:value="visitForm.repurchaseIntentionDetail" placeholder="复购意向详细说明" :rows="2" />
        </n-form-item>
      </n-form>
      <div v-else>
        <n-descriptions :column="2" bordered size="small">
          <n-descriptions-item label="回访日期">{{ visitForm.visitDate }}</n-descriptions-item>
          <n-descriptions-item label="回访方式">
            {{ visitTypeOptions.find(o => o.value === visitForm.visitType)?.label }}
          </n-descriptions-item>
          <n-descriptions-item label="回访人">{{ visitForm.visitor }}</n-descriptions-item>
          <n-descriptions-item label="满意度">
            <n-rate :value="visitForm.satisfactionScore" readonly :max="5" size="small" />
          </n-descriptions-item>
          <n-descriptions-item label="产品反馈" :span="2">{{ visitForm.productFeedback || '-' }}</n-descriptions-item>
          <n-descriptions-item label="使用反馈" :span="2">{{ visitForm.usageFeedback || '-' }}</n-descriptions-item>
          <n-descriptions-item label="建议意见" :span="2">{{ visitForm.suggestions || '-' }}</n-descriptions-item>
          <n-descriptions-item label="问题反馈" :span="2">{{ visitForm.issuesReported || '-' }}</n-descriptions-item>
          <n-descriptions-item label="是否处理">
            {{ visitForm.issueHandled ? '已处理' : '未处理' }}
          </n-descriptions-item>
          <n-descriptions-item label="复购意向">
            <n-tag :style="{ color: getRepurchaseColor(visitForm.repurchaseIntention), borderColor: getRepurchaseColor(visitForm.repurchaseIntention) }">
              {{ getRepurchaseLabel(visitForm.repurchaseIntention) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item v-if="visitForm.handlingResult" label="处理结果" :span="2">
            {{ visitForm.handlingResult }}
          </n-descriptions-item>
        </n-descriptions>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showVisitModal = false">关闭</n-button>
          <n-button v-if="visitModalMode === 'add'" type="primary" @click="handleSaveVisit">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="customerDetailVisible" preset="card" title="客户详情" style="width: 700px">
      <div v-if="selectedCustomer">
        <div class="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div class="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center text-white text-xl font-bold">
            {{ selectedCustomer.name[0] }}
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold">{{ selectedCustomer.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <n-tag size="small" type="info">{{ getSourceLabel(selectedCustomer.source) }}</n-tag>
              <n-tag v-for="tag in selectedCustomer.tags" :key="tag" size="small" type="success">{{ tag }}</n-tag>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-green-600">¥{{ selectedCustomer.totalAmount }}</div>
            <div class="text-sm text-gray-500">累计消费</div>
          </div>
        </div>

        <n-descriptions :column="2" bordered size="small" class="mb-4">
          <n-descriptions-item label="手机号">{{ selectedCustomer.phone }}</n-descriptions-item>
          <n-descriptions-item label="微信号">{{ selectedCustomer.wechatId || '-' }}</n-descriptions-item>
          <n-descriptions-item label="邮箱">{{ selectedCustomer.email || '-' }}</n-descriptions-item>
          <n-descriptions-item label="地址">{{ selectedCustomer.address || '-' }}</n-descriptions-item>
          <n-descriptions-item label="来源说明">{{ selectedCustomer.sourceDetail || '-' }}</n-descriptions-item>
          <n-descriptions-item label="订单数">{{ selectedCustomer.totalOrders }} 单</n-descriptions-item>
          <n-descriptions-item label="首次下单">{{ selectedCustomer.firstOrderDate || '-' }}</n-descriptions-item>
          <n-descriptions-item label="最近下单">{{ selectedCustomer.lastOrderDate || '-' }}</n-descriptions-item>
          <n-descriptions-item label="备注" :span="2">{{ selectedCustomer.notes || '-' }}</n-descriptions-item>
        </n-descriptions>

        <h4 class="font-medium mb-3">历史订单</h4>
        <n-list bordered size="small">
          <n-list-item v-for="order in store.getOrdersByCustomerId(selectedCustomer.id)" :key="order.id" class="cursor-pointer hover:bg-gray-50" @click="viewOrderDetail(order)">
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="font-medium">{{ order.orderNo }}</div>
                <div class="text-sm text-gray-500">{{ order.style }} · {{ order.size }}</div>
              </div>
              <div class="text-right">
                <div class="text-green-600 font-medium">¥{{ order.finalPrice || '待定' }}</div>
                <n-tag size="small" :style="{ color: getOrderStatusColor(order.status), borderColor: getOrderStatusColor(order.status) }">
                  {{ getOrderStatusLabel(order.status) }}
                </n-tag>
              </div>
            </div>
          </n-list-item>
          <n-empty v-if="store.getOrdersByCustomerId(selectedCustomer.id).length === 0" description="暂无订单" size="small" />
        </n-list>

        <h4 class="font-medium mb-3 mt-4">回访记录</h4>
        <n-list bordered size="small">
          <n-list-item v-for="visit in store.getVisitsByCustomerId(selectedCustomer.id)" :key="visit.id" class="cursor-pointer hover:bg-gray-50" @click="viewVisitRecord(visit)">
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="font-medium">{{ visit.visitDate }} 回访</div>
                <div class="text-sm text-gray-500">{{ visitTypeOptions.find(o => o.value === visit.visitType)?.label }} · {{ visit.visitor }}</div>
              </div>
              <div class="flex items-center gap-2">
                <n-rate :value="visit.satisfactionScore" readonly :max="5" size="small" />
                <n-tag size="small" :style="{ color: getRepurchaseColor(visit.repurchaseIntention), borderColor: getRepurchaseColor(visit.repurchaseIntention) }">
                  {{ getRepurchaseLabel(visit.repurchaseIntention) }}
                </n-tag>
              </div>
            </div>
          </n-list-item>
          <n-empty v-if="store.getVisitsByCustomerId(selectedCustomer.id).length === 0" description="暂无回访记录" size="small" />
        </n-list>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="customerDetailVisible = false">关闭</n-button>
          <n-button type="primary" @click="() => { if (selectedCustomer) { openEditCustomer(selectedCustomer); customerDetailVisible = false; } }">
            编辑客户
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="orderDetailVisible" preset="card" title="订单详情" style="width: 720px">
      <div v-if="viewOrder">
        <div class="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 class="text-lg font-bold">{{ viewOrder.orderNo }}</h3>
            <div class="text-sm text-gray-500 mt-1">客户: {{ viewOrder.customerName }}</div>
          </div>
          <div class="text-right">
            <n-tag :style="{ backgroundColor: getOrderStatusColor(viewOrder.status) + '20', color: getOrderStatusColor(viewOrder.status), border: 'none' }">
              {{ getOrderStatusLabel(viewOrder.status) }}
            </n-tag>
            <div class="text-xl font-bold text-green-600 mt-2">¥{{ viewOrder.finalPrice || '待定' }}</div>
          </div>
        </div>

        <n-descriptions :column="2" bordered size="small" class="mb-4">
          <n-descriptions-item label="容器类型">{{ viewOrder.containerType || '-' }}</n-descriptions-item>
          <n-descriptions-item label="苔藓品种">{{ viewOrder.mossSpecies || '-' }}</n-descriptions-item>
          <n-descriptions-item label="尺寸">{{ viewOrder.size || '-' }}</n-descriptions-item>
          <n-descriptions-item label="风格">{{ viewOrder.style || '-' }}</n-descriptions-item>
          <n-descriptions-item label="预算区间">¥{{ viewOrder.budgetMin }} - ¥{{ viewOrder.budgetMax }}</n-descriptions-item>
          <n-descriptions-item label="付款状态">
            <n-tag :style="{ color: getPaymentStatusColor(viewOrder.paymentStatus), borderColor: getPaymentStatusColor(viewOrder.paymentStatus) }">
              {{ getPaymentStatusLabel(viewOrder.paymentStatus) }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="预约交付">{{ viewOrder.appointmentDeliveryDate }}</n-descriptions-item>
          <n-descriptions-item label="实际交付">{{ viewOrder.actualDeliveryDate || '未交付' }}</n-descriptions-item>
          <n-descriptions-item label="交付方式">{{ deliveryMethodOptions.find(o => o.value === viewOrder.deliveryMethod)?.label }}</n-descriptions-item>
          <n-descriptions-item label="是否加急">
            <n-tag v-if="viewOrder.isUrgent" type="error">加急</n-tag>
            <span v-else class="text-gray-500">否</span>
          </n-descriptions-item>
          <n-descriptions-item label="制作进度" :span="2">
            <n-progress :percentage="viewOrder.progressPercent" :color="{ '0%': '#2080f0', '100%': '#18a058' } as any" />
          </n-descriptions-item>
          <n-descriptions-item label="需求描述" :span="2">{{ viewOrder.demandDescription }}</n-descriptions-item>
          <n-descriptions-item label="制作备注" :span="2">{{ viewOrder.productionNotes || '-' }}</n-descriptions-item>
        </n-descriptions>

        <n-space class="mb-4">
          <n-button type="primary" @click="openProgressTracking(viewOrder)">
            <template #icon><n-icon><clock /></n-icon></template>
            查看进度
          </n-button>
          <n-button v-if="viewOrder.status !== 'delivered' && viewOrder.status !== 'cancelled'" type="success" @click="openDeliveryConfirm(viewOrder)">
            <template #icon><n-icon><package /></n-icon></template>
            确认交付
          </n-button>
          <n-button v-if="viewOrder.status === 'delivered' && !store.getVisitByOrderId(viewOrder.id)" type="warning" @click="openAddVisit(viewOrder)">
            <template #icon><n-icon><phone-call /></n-icon></template>
            新增回访
          </n-button>
          <n-button v-if="viewOrder.status === 'delivered' && store.getVisitByOrderId(viewOrder.id)" type="info" @click="viewVisitRecord(store.getVisitByOrderId(viewOrder.id)!)">
            <template #icon><n-icon><eye /></n-icon></template>
            查看回访
          </n-button>
        </n-space>

        <h4 class="font-medium mb-3">关联作品</h4>
        <n-empty description="暂无关联作品" size="small" v-if="viewOrder.landscapeIds.length === 0" />
        <n-list v-else bordered size="small">
          <n-list-item v-for="lid in viewOrder.landscapeIds" :key="lid">
            {{ lid }}
          </n-list-item>
        </n-list>

        <h4 class="font-medium mb-3 mt-4">回访记录</h4>
        <n-empty v-if="!store.getVisitByOrderId(viewOrder.id)" description="暂无回访记录" size="small" />
        <n-list v-else bordered size="small">
          <n-list-item class="cursor-pointer hover:bg-gray-50" @click="viewVisitRecord(store.getVisitByOrderId(viewOrder.id)!)">
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="font-medium">{{ store.getVisitByOrderId(viewOrder.id)!.visitDate }} 回访</div>
                <div class="text-sm text-gray-500">
                  {{ visitTypeOptions.find(o => o.value === store.getVisitByOrderId(viewOrder.id)!.visitType)?.label }} · 
                  {{ store.getVisitByOrderId(viewOrder.id)!.visitor }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <n-rate :value="store.getVisitByOrderId(viewOrder.id)!.satisfactionScore" readonly :max="5" size="small" />
                <n-tag size="small" :style="{ 
                  color: getRepurchaseColor(store.getVisitByOrderId(viewOrder.id)!.repurchaseIntention), 
                  borderColor: getRepurchaseColor(store.getVisitByOrderId(viewOrder.id)!.repurchaseIntention) 
                }">
                  {{ getRepurchaseLabel(store.getVisitByOrderId(viewOrder.id)!.repurchaseIntention) }}
                </n-tag>
              </div>
            </div>
          </n-list-item>
        </n-list>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="orderDetailVisible = false">关闭</n-button>
          <n-button type="primary" @click="() => { if (viewOrder) { openEditOrder(viewOrder); orderDetailVisible = false; } }">
            编辑订单
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.customer-center {
  min-height: 100%;
}
</style>