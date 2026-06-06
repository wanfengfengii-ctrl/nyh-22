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
  NList,
  NListItem,
  NEmpty,
  NPopconfirm,
  NMessageProvider,
  useMessage,
  NRate,
  NDynamicTags,
  NSwitch,
  NScrollbar,
  NAvatar,
  NText,
  NDivider,
  NCheckbox,
  NCheckboxGroup
} from 'naive-ui'
import {
  Users,
  Crown,
  Coins,
  Ticket,
  Megaphone,
  BarChart3,
  PieChart,
  Calendar,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Gift,
  Sparkles,
  Target,
  TrendingUp,
  Bell,
  UserCheck,
  PhoneCall,
  ChevronRight,
  Star
} from 'lucide-vue-next'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart as EPieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { useMarketingStore } from '@/stores/marketing'
import { useCustomerStore } from '@/stores/customer'
import type {
  MemberLevel,
  Coupon,
  CouponType,
  MarketingCampaign,
  CampaignType,
  CampaignRegistration,
  CustomerSegment,
  MarketingReminder,
  ReminderType,
  PointRecord,
  CouponRedemption,
  CampaignVisitTrack,
  PointChangeType
} from '@/types'
import {
  memberLevelConfigs,
  memberLevelOptions,
  pointChangeTypeOptions,
  couponTypeOptions,
  campaignTypeOptions,
  campaignStatusOptions,
  marketingReminderTypeOptions,
  customerSourceOptions,
  repurchaseIntentionOptions
} from '@/types'
import { getToday, addDays, dateStrToTimestamp, timestampToDateStr } from '@/utils/storage'

use([
  CanvasRenderer,
  EPieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const marketingStore = useMarketingStore()
const customerStore = useCustomerStore()
const message = useMessage()

const activeTab = ref('overview')

onMounted(() => {
  marketingStore.initMockData()
})

const memberLevelChartOption = computed(() => {
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
      data: marketingStore.memberLevelStats.map(s => ({
        value: s.count,
        name: s.name,
        itemStyle: { color: s.color }
      }))
    }]
  }
})

const marketingEffectChartOption = computed(() => {
  const stats = marketingStore.getMarketingEffectStats(30)
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['新增会员', '活跃会员', '营收', '转化率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: stats.map(s => s.period) },
    yAxis: [
      { type: 'value', name: '人数' },
      { type: 'value', name: '金额/率', axisLabel: { formatter: '{value}' } }
    ],
    series: [
      { name: '新增会员', type: 'bar', data: stats.map(s => s.newMembers), itemStyle: { color: '#2080f0' } },
      { name: '活跃会员', type: 'bar', data: stats.map(s => s.activeMembers), itemStyle: { color: '#18a058' } },
      { name: '营收', type: 'line', yAxisIndex: 1, data: stats.map(s => s.totalRevenue), itemStyle: { color: '#d03050' } },
      { name: '转化率', type: 'line', yAxisIndex: 1, data: stats.map(s => s.conversionRate), itemStyle: { color: '#f0a020' } }
    ]
  }
})

const upcomingBirthdays = computed(() => marketingStore.getUpcomingBirthdays(7))

function getLevelColor(level: MemberLevel): string {
  const config = memberLevelConfigs.find(c => c.level === level)
  return config?.color || '#999'
}

function getLevelName(level: MemberLevel): string {
  const config = memberLevelConfigs.find(c => c.level === level)
  return config?.name || level
}

const showCouponModal = ref(false)
const couponModalMode = ref<'add' | 'edit'>('add')
const editingCoupon = ref<Coupon | null>(null)
const couponForm = ref<{
  name: string
  type: CouponType
  value: number
  minAmount: number | undefined
  totalQuantity: number
  startDate: number | null
  endDate: number | null
  applicableLevels: MemberLevel[]
  description: string
}>({
  name: '',
  type: 'fixed_amount',
  value: 0,
  minAmount: undefined,
  totalQuantity: 100,
  startDate: null,
  endDate: null,
  applicableLevels: [],
  description: ''
})

function openAddCoupon() {
  couponModalMode.value = 'add'
  editingCoupon.value = null
  couponForm.value = {
    name: '',
    type: 'fixed_amount',
    value: 0,
    minAmount: undefined,
    totalQuantity: 100,
    startDate: dateStrToTimestamp(getToday()),
    endDate: dateStrToTimestamp(addDays(getToday(), 30)),
    applicableLevels: [],
    description: ''
  }
  showCouponModal.value = true
}

function openEditCoupon(coupon: Coupon) {
  couponModalMode.value = 'edit'
  editingCoupon.value = coupon
  couponForm.value = {
    name: coupon.name,
    type: coupon.type,
    value: coupon.value,
    minAmount: coupon.minAmount,
    totalQuantity: coupon.totalQuantity,
    startDate: dateStrToTimestamp(coupon.startDate),
    endDate: dateStrToTimestamp(coupon.endDate),
    applicableLevels: [...coupon.applicableLevels],
    description: coupon.description
  }
  showCouponModal.value = true
}

function handleSaveCoupon() {
  const typeOption = couponTypeOptions.find(o => o.value === couponForm.value.type)
  const couponData = {
    name: couponForm.value.name,
    type: couponForm.value.type,
    typeLabel: typeOption?.label || couponForm.value.type,
    value: couponForm.value.value,
    minAmount: couponForm.value.minAmount,
    totalQuantity: couponForm.value.totalQuantity,
    startDate: timestampToDateStr(couponForm.value.startDate),
    endDate: timestampToDateStr(couponForm.value.endDate),
    applicableLevels: couponForm.value.applicableLevels,
    description: couponForm.value.description
  }

  if (couponModalMode.value === 'add') {
    const result = marketingStore.addCoupon(couponData as any)
    if (result.success) {
      message.success('优惠券创建成功')
      showCouponModal.value = false
    } else {
      message.error(result.message || '创建失败')
    }
  } else if (editingCoupon.value) {
    const result = marketingStore.updateCoupon(editingCoupon.value.id, couponData as any)
    if (result.success) {
      message.success('优惠券更新成功')
      showCouponModal.value = false
    } else {
      message.error(result.message || '更新失败')
    }
  }
}

function handleDeleteCoupon(id: string) {
  marketingStore.deleteCoupon(id)
  message.success('优惠券已删除')
}

const showCampaignModal = ref(false)
const campaignModalMode = ref<'add' | 'edit'>('add')
const editingCampaign = ref<MarketingCampaign | null>(null)
const campaignForm = ref<{
  name: string
  type: CampaignType
  description: string
  startDate: number | null
  endDate: number | null
  targetLevels: MemberLevel[]
  targetTags: string[]
  maxParticipants: number
  rules: string
  rewards: string
}>({
  name: '',
  type: 'promotion',
  description: '',
  startDate: null,
  endDate: null,
  targetLevels: [],
  targetTags: [],
  maxParticipants: 100,
  rules: '',
  rewards: ''
})

function openAddCampaign() {
  campaignModalMode.value = 'add'
  editingCampaign.value = null
  campaignForm.value = {
    name: '',
    type: 'promotion',
    description: '',
    startDate: dateStrToTimestamp(getToday()),
    endDate: dateStrToTimestamp(addDays(getToday(), 30)),
    targetLevels: [],
    targetTags: [],
    maxParticipants: 100,
    rules: '',
    rewards: ''
  }
  showCampaignModal.value = true
}

function openEditCampaign(campaign: MarketingCampaign) {
  campaignModalMode.value = 'edit'
  editingCampaign.value = campaign
  campaignForm.value = {
    name: campaign.name,
    type: campaign.type,
    description: campaign.description,
    startDate: dateStrToTimestamp(campaign.startDate),
    endDate: dateStrToTimestamp(campaign.endDate),
    targetLevels: [...campaign.targetLevels],
    targetTags: [...campaign.targetTags],
    maxParticipants: campaign.maxParticipants,
    rules: campaign.rules,
    rewards: campaign.rewards
  }
  showCampaignModal.value = true
}

function handleSaveCampaign() {
  const typeOption = campaignTypeOptions.find(o => o.value === campaignForm.value.type)
  const campaignData = {
    name: campaignForm.value.name,
    type: campaignForm.value.type,
    typeLabel: typeOption?.label || campaignForm.value.type,
    description: campaignForm.value.description,
    startDate: timestampToDateStr(campaignForm.value.startDate),
    endDate: timestampToDateStr(campaignForm.value.endDate),
    targetLevels: campaignForm.value.targetLevels,
    targetTags: campaignForm.value.targetTags,
    maxParticipants: campaignForm.value.maxParticipants,
    rules: campaignForm.value.rules,
    rewards: campaignForm.value.rewards
  }

  if (campaignModalMode.value === 'add') {
    const result = marketingStore.addCampaign(campaignData as any)
    if (result.success) {
      message.success('活动创建成功')
      showCampaignModal.value = false
    } else {
      message.error(result.message || '创建失败')
    }
  } else if (editingCampaign.value) {
    const result = marketingStore.updateCampaign(editingCampaign.value.id, campaignData as any)
    if (result.success) {
      message.success('活动更新成功')
      showCampaignModal.value = false
    } else {
      message.error(result.message || '更新失败')
    }
  }
}

function handleDeleteCampaign(id: string) {
  marketingStore.deleteCampaign(id)
  message.success('活动已删除')
}

function handleCampaignStatus(id: string, status: 'draft' | 'active' | 'ended' | 'cancelled') {
  marketingStore.updateCampaign(id, { status })
  message.success('活动状态已更新')
}

const showCampaignDetail = ref(false)
const selectedCampaign = ref<MarketingCampaign | null>(null)
const campaignDetailTab = ref('info')

function viewCampaignDetail(campaign: MarketingCampaign) {
  selectedCampaign.value = campaign
  campaignDetailTab.value = 'info'
  showCampaignDetail.value = true
}

const showSegmentModal = ref(false)
const segmentModalMode = ref<'add' | 'edit'>('add')
const editingSegment = ref<CustomerSegment | null>(null)
const segmentForm = ref({
  name: '',
  description: '',
  filters: {
    levels: [] as MemberLevel[],
    sources: [] as any[],
    repurchaseIntentions: [] as any[],
    minOrders: undefined as number | undefined,
    maxOrders: undefined as number | undefined,
    minAmount: undefined as number | undefined,
    maxAmount: undefined as number | undefined,
    tags: [] as string[]
  }
})

function openAddSegment() {
  segmentModalMode.value = 'add'
  editingSegment.value = null
  segmentForm.value = {
    name: '',
    description: '',
    filters: {
      levels: [],
      sources: [],
      repurchaseIntentions: [],
      minOrders: undefined,
      maxOrders: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      tags: []
    }
  }
  showSegmentModal.value = true
}

function openEditSegment(segment: CustomerSegment) {
  segmentModalMode.value = 'edit'
  editingSegment.value = segment
  segmentForm.value = {
    name: segment.name,
    description: segment.description,
    filters: {
      levels: segment.filters.levels || [],
      sources: segment.filters.sources || [],
      repurchaseIntentions: segment.filters.repurchaseIntentions || [],
      minOrders: segment.filters.minOrders,
      maxOrders: segment.filters.maxOrders,
      minAmount: segment.filters.minAmount,
      maxAmount: segment.filters.maxAmount,
      tags: segment.filters.tags || []
    }
  }
  showSegmentModal.value = true
}

function handleSaveSegment() {
  if (segmentModalMode.value === 'add') {
    marketingStore.addCustomerSegment({
      name: segmentForm.value.name,
      description: segmentForm.value.description,
      filters: segmentForm.value.filters as any
    })
    message.success('分群创建成功')
    showSegmentModal.value = false
  } else if (editingSegment.value) {
    marketingStore.updateCustomerSegment(editingSegment.value.id, {
      name: segmentForm.value.name,
      description: segmentForm.value.description,
      filters: segmentForm.value.filters as any
    })
    message.success('分群更新成功')
    showSegmentModal.value = false
  }
}

function handleDeleteSegment(id: string) {
  marketingStore.deleteCustomerSegment(id)
  message.success('分群已删除')
}

const showReminderModal = ref(false)
const reminderForm = ref<{
  type: ReminderType
  title: string
  content: string
  customerIds: string[]
  sendDate: number | null
}>({
  type: 'birthday',
  title: '',
  content: '',
  customerIds: [],
  sendDate: null
})

function openAddReminder() {
  reminderForm.value = {
    type: 'birthday',
    title: '',
    content: '',
    customerIds: [],
    sendDate: dateStrToTimestamp(getToday())
  }
  showReminderModal.value = true
}

function handleSaveReminder() {
  const typeOption = marketingReminderTypeOptions.find(o => o.value === reminderForm.value.type)
  marketingStore.addReminder({
    type: reminderForm.value.type,
    typeLabel: typeOption?.label || reminderForm.value.type,
    title: reminderForm.value.title,
    content: reminderForm.value.content,
    customerIds: reminderForm.value.customerIds,
    sendDate: timestampToDateStr(reminderForm.value.sendDate)
  })
  message.success('提醒创建成功')
  showReminderModal.value = false
}

function handleSendReminder(id: string) {
  marketingStore.sendReminder(id)
  message.success('提醒已发送')
}

function handleDeleteReminder(id: string) {
  marketingStore.deleteReminder(id)
  message.success('提醒已删除')
}

const showVisitTrackModal = ref(false)
const visitTrackForm = ref({
  campaignId: '',
  customerId: '',
  customerName: '',
  visitDate: null as number | null,
  visitType: 'phone' as const,
  visitor: '',
  feedback: '',
  satisfactionScore: 5,
  hasRepurchaseIntention: false,
  nextFollowUpDate: null as number | null
})

function openAddVisitTrack(campaignId: string) {
  visitTrackForm.value = {
    campaignId,
    customerId: '',
    customerName: '',
    visitDate: dateStrToTimestamp(getToday()),
    visitType: 'phone',
    visitor: '当前用户',
    feedback: '',
    satisfactionScore: 5,
    hasRepurchaseIntention: false,
    nextFollowUpDate: dateStrToTimestamp(addDays(getToday(), 30))
  }
  showVisitTrackModal.value = true
}

function handleCustomerSelectForVisit(customerId: string) {
  const customer = customerStore.getCustomerById(customerId)
  if (customer) {
    visitTrackForm.value.customerName = customer.name
  }
}

function handleSaveVisitTrack() {
  const campaign = marketingStore.getCampaignById(visitTrackForm.value.campaignId)
  marketingStore.addCampaignVisitTrack({
    campaignId: visitTrackForm.value.campaignId,
    campaignName: campaign?.name || '',
    customerId: visitTrackForm.value.customerId,
    customerName: visitTrackForm.value.customerName,
    visitDate: timestampToDateStr(visitTrackForm.value.visitDate),
    visitType: visitTrackForm.value.visitType,
    visitor: visitTrackForm.value.visitor,
    feedback: visitTrackForm.value.feedback,
    satisfactionScore: visitTrackForm.value.satisfactionScore,
    hasRepurchaseIntention: visitTrackForm.value.hasRepurchaseIntention,
    nextFollowUpDate: timestampToDateStr(visitTrackForm.value.nextFollowUpDate)
  })
  message.success('回访记录保存成功')
  showVisitTrackModal.value = false
}

const customerOptions = computed(() => {
  return customerStore.customers.map(c => ({
    label: `${c.name} (${c.phone})`,
    value: c.id
  }))
})

const pointRecords = computed(() => {
  return marketingStore.pointRecords
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const couponRedemptions = computed(() => {
  return marketingStore.couponRedemptions
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

function getCampaignStatusColor(status: string): string {
  const opt = campaignStatusOptions.find(o => o.value === status)
  return opt?.color || '#999'
}

function getCampaignStatusLabel(status: string): string {
  const opt = campaignStatusOptions.find(o => o.value === status)
  return opt?.label || status
}

const couponSearch = ref('')
const filteredCoupons = computed(() => {
  if (!couponSearch.value) return marketingStore.coupons
  const keyword = couponSearch.value.toLowerCase()
  return marketingStore.coupons.filter(c =>
    c.name.toLowerCase().includes(keyword) ||
    c.code.toLowerCase().includes(keyword)
  )
})

const campaignSearch = ref('')
const campaignStatusFilter = ref<string | null>(null)
const filteredCampaigns = computed(() => {
  let result = marketingStore.campaigns
  if (campaignSearch.value) {
    const keyword = campaignSearch.value.toLowerCase()
    result = result.filter(c => c.name.toLowerCase().includes(keyword))
  }
  if (campaignStatusFilter.value) {
    result = result.filter(c => c.status === campaignStatusFilter.value)
  }
  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const showPointModal = ref(false)
const pointForm = ref<{
  customerId: string
  customerName: string
  points: number
  type: PointChangeType
  description: string
}>({
  customerId: '',
  customerName: '',
  points: 0,
  type: 'adjust',
  description: ''
})

function openAddPoints() {
  pointForm.value = {
    customerId: '',
    customerName: '',
    points: 0,
    type: 'adjust',
    description: ''
  }
  showPointModal.value = true
}

function handleCustomerSelectForPoints(customerId: string) {
  const customer = customerStore.getCustomerById(customerId)
  if (customer) {
    pointForm.value.customerName = customer.name
  }
}

function handleAddPoints() {
  if (pointForm.value.points > 0) {
    marketingStore.addPoints(
      pointForm.value.customerId,
      pointForm.value.points,
      pointForm.value.type,
      pointForm.value.description
    )
    message.success('积分增加成功')
  } else if (pointForm.value.points < 0) {
    const result = marketingStore.spendPoints(
      pointForm.value.customerId,
      Math.abs(pointForm.value.points),
      pointForm.value.type,
      pointForm.value.description
    )
    if (result.success) {
      message.success('积分扣减成功')
    } else {
      message.error(result.message || '扣减失败')
      return
    }
  }
  showPointModal.value = false
}

const memberLevelColumns = computed(() => [
  { title: '等级', key: 'name', width: 120, render: (row: any) => h('span', { style: { color: row.color, fontWeight: 'bold' } }, row.name) },
  { title: '积分要求', key: 'minPoints', width: 120, render: (row: any) => row.minPoints + ' 积分' },
  { title: '折扣', key: 'discount', width: 100, render: (row: any) => (row.discount * 100) + '折' },
  { title: '会员人数', key: 'count', width: 100 },
  { title: '占比', key: 'percent', width: 200, render: (row: any) => {
    const total = customerStore.totalCustomers || 1
    const percent = Math.round((row.count / total) * 100)
    return h('div', { class: 'flex items-center gap-2' }, [
      h('div', { class: 'flex-1 bg-gray-200 rounded-full h-2' }, [
        h('div', { class: 'h-2 rounded-full', style: { width: percent + '%', backgroundColor: row.color } })
      ]),
      h('span', { class: 'text-sm text-gray-500 w-12' }, percent + '%')
    ])
  }},
  { title: '权益', key: 'benefits', render: (row: any) => h(NSpace, { size: 'small' }, {
    default: () => row.benefits.map((b: string) => h(NTag, { size: 'small', type: 'info' }, { default: () => b }))
  })}
])

const pointRecordsColumns = computed(() => [
  { title: '客户', key: 'customerName', width: 120 },
  { title: '变动类型', key: 'typeLabel', width: 120 },
  { title: '积分变动', key: 'points', width: 100, render: (row: PointRecord) => h('span', { style: { color: row.points > 0 ? '#18a058' : '#d03050', fontWeight: 'bold' } }, (row.points > 0 ? '+' : '') + row.points) },
  { title: '变动后余额', key: 'balanceAfter', width: 120 },
  { title: '说明', key: 'description' },
  { title: '时间', key: 'createdAt', width: 160, render: (row: PointRecord) => row.createdAt.slice(0, 19).replace('T', ' ') }
])

const couponColumns = computed(() => [
  { title: '优惠券名称', key: 'name', width: 150 },
  { title: '编码', key: 'code', width: 120 },
  { title: '类型', key: 'typeLabel', width: 100 },
  { title: '面值', key: 'value', width: 100, render: (row: Coupon) => row.type === 'discount' ? (row.value * 100) + '折' : '¥' + row.value },
  { title: '使用门槛', key: 'minAmount', width: 100, render: (row: Coupon) => row.minAmount ? '满' + row.minAmount + '元' : '无门槛' },
  { title: '有效期', key: 'date', width: 180, render: (row: Coupon) => row.startDate + ' ~ ' + row.endDate },
  { title: '库存', key: 'stock', width: 100, render: (row: Coupon) => (row.totalQuantity - row.usedQuantity) + '/' + row.totalQuantity },
  { title: '状态', key: 'status', width: 80, render: (row: Coupon) => h(NTag, { size: 'small', type: row.status === 'active' ? 'success' : 'default' }, { default: () => row.status === 'active' ? '生效中' : '已停用' }) },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const, render: (row: Coupon) => h(NSpace, { size: 'small' }, {
    default: () => [
      h(NButton, { size: 'small', type: 'info', quaternary: true, onClick: () => openEditCoupon(row) }, { default: () => '编辑' }),
      h(NPopconfirm, { onPositiveClick: () => handleDeleteCoupon(row.id) }, {
        default: () => '确定删除该优惠券吗？',
        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' })
      })
    ]
  })}
])

const couponRedemptionColumns = computed(() => [
  { title: '优惠券', key: 'couponName', width: 150 },
  { title: '客户', key: 'customerName', width: 120 },
  { title: '核销日期', key: 'redeemDate', width: 120 },
  { title: '核销方式', key: 'redeemMethod', width: 100, render: (row: CouponRedemption) => row.redeemMethod === 'online' ? '线上' : '线下' },
  { title: '操作员', key: 'operator', width: 100 },
  { title: '订单号', key: 'orderId', width: 180 },
  { title: '状态', key: 'status', width: 80, render: (row: CouponRedemption) => h(NTag, { size: 'small', type: row.status === 'used' ? 'success' : 'default' }, { default: () => row.status === 'used' ? '已使用' : '已取消' }) }
])

const campaignColumns = computed(() => [
  { title: '活动名称', key: 'name', width: 180 },
  { title: '类型', key: 'typeLabel', width: 100 },
  { title: '活动时间', key: 'date', width: 200, render: (row: MarketingCampaign) => row.startDate + ' ~ ' + row.endDate },
  { title: '报名人数', key: 'participantCount', width: 120, render: (row: MarketingCampaign) => row.participantCount + '/' + row.maxParticipants },
  { title: '目标人群', key: 'target', width: 150, render: (row: MarketingCampaign) => row.targetLevels.length > 0 ? row.targetLevels.map(l => getLevelName(l)).join('、') : '全部会员' },
  { title: '状态', key: 'status', width: 100, render: (row: MarketingCampaign) => h(NTag, { size: 'small', style: { backgroundColor: getCampaignStatusColor(row.status) + '20', color: getCampaignStatusColor(row.status), border: 'none' } }, { default: () => getCampaignStatusLabel(row.status) }) },
  { title: '操作', key: 'actions', width: 250, fixed: 'right' as const, render: (row: MarketingCampaign) => h(NSpace, { size: 'small' }, {
    default: () => [
      h(NButton, { size: 'small', type: 'primary', quaternary: true, onClick: () => viewCampaignDetail(row) }, { default: () => '详情' }),
      row.status === 'draft' && h(NButton, { size: 'small', type: 'success', quaternary: true, onClick: () => handleCampaignStatus(row.id, 'active') }, { default: () => '发布' }),
      row.status === 'active' && h(NButton, { size: 'small', type: 'warning', quaternary: true, onClick: () => handleCampaignStatus(row.id, 'ended') }, { default: () => '结束' }),
      h(NButton, { size: 'small', type: 'info', quaternary: true, onClick: () => openEditCampaign(row) }, { default: () => '编辑' }),
      h(NPopconfirm, { onPositiveClick: () => handleDeleteCampaign(row.id) }, {
        default: () => '确定删除该活动吗？',
        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' })
      })
    ].filter(Boolean)
  })}
])

const reminderColumns = computed(() => [
  { title: '类型', key: 'typeLabel', width: 120 },
  { title: '标题', key: 'title', width: 200 },
  { title: '内容', key: 'content', ellipsis: { tooltip: true } },
  { title: '发送时间', key: 'sendDate', width: 120 },
  { title: '接收人数', key: 'customerIds', width: 100, render: (row: MarketingReminder) => row.customerIds.length + '人' },
  { title: '状态', key: 'status', width: 100, render: (row: MarketingReminder) => h(NTag, { size: 'small', type: row.status === 'sent' ? 'success' : row.status === 'pending' ? 'warning' : 'default' }, { default: () => row.status === 'sent' ? '已发送' : row.status === 'pending' ? '待发送' : '已取消' }) },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' as const, render: (row: MarketingReminder) => h(NSpace, { size: 'small' }, {
    default: () => [
      row.status === 'pending' && h(NButton, { size: 'small', type: 'success', quaternary: true, onClick: () => handleSendReminder(row.id) }, { default: () => '发送' }),
      h(NPopconfirm, { onPositiveClick: () => handleDeleteReminder(row.id) }, {
        default: () => '确定删除该提醒吗？',
        trigger: () => h(NButton, { size: 'small', type: 'error', quaternary: true }, { default: () => '删除' })
      })
    ].filter(Boolean)
  })}
] as any[])

const registrationColumns = computed(() => [
  { title: '客户姓名', key: 'customerName', width: 120 },
  { title: '联系电话', key: 'customerPhone', width: 140 },
  { title: '报名日期', key: 'registerDate', width: 120 },
  { title: '状态', key: 'status', width: 100, render: (row: CampaignRegistration) => h(NTag, { size: 'small', type: row.status === 'attended' ? 'success' : row.status === 'registered' ? 'info' : 'default' }, { default: () => row.status === 'attended' ? '已参加' : row.status === 'registered' ? '已报名' : '已取消' }) },
  { title: '操作', key: 'actions', width: 150, render: (row: CampaignRegistration) => h(NSpace, { size: 'small' }, {
    default: () => [
      row.status === 'registered' && h(NButton, { size: 'small', type: 'success', quaternary: true, onClick: () => marketingStore.updateRegistrationStatus(row.id, 'attended') }, { default: () => '标记参加' }),
      row.status !== 'cancelled' && h(NButton, { size: 'small', type: 'warning', quaternary: true, onClick: () => marketingStore.updateRegistrationStatus(row.id, 'cancelled') }, { default: () => '取消' })
    ].filter(Boolean)
  })}
])

const visitTrackColumns = computed(() => [
  { title: '客户姓名', key: 'customerName', width: 120 },
  { title: '回访日期', key: 'visitDate', width: 120 },
  { title: '回访方式', key: 'visitType', width: 100 },
  { title: '回访人', key: 'visitor', width: 100 },
  { title: '满意度', key: 'satisfactionScore', width: 120, render: (row: CampaignVisitTrack) => h(NRate, { value: row.satisfactionScore, readonly: true, size: 'small' }) },
  { title: '复购意向', key: 'hasRepurchaseIntention', width: 100, render: (row: CampaignVisitTrack) => h(NTag, { size: 'small', type: row.hasRepurchaseIntention ? 'success' : 'default' }, { default: () => row.hasRepurchaseIntention ? '有' : '无' }) },
  { title: '回访反馈', key: 'feedback', ellipsis: { tooltip: true } }
] as any[])
</script>

<template>
  <div class="marketing-center">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">会员成长与营销活动运营</h1>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab name="overview" label="运营总览">
        <template #prefix>
          <n-icon><bar-chart-3 /></n-icon>
        </template>
      </n-tab>
      <n-tab name="members" label="会员等级">
        <template #prefix>
          <n-icon><crown /></n-icon>
        </template>
      </n-tab>
      <n-tab name="points" label="积分管理">
        <template #prefix>
          <n-icon><coins /></n-icon>
        </template>
      </n-tab>
      <n-tab name="coupons" label="优惠券管理">
        <template #prefix>
          <n-icon><ticket /></n-icon>
        </template>
      </n-tab>
      <n-tab name="campaigns" label="营销活动">
        <template #prefix>
          <n-icon><megaphone /></n-icon>
        </template>
      </n-tab>
      <n-tab name="segments" label="客户分群">
        <template #prefix>
          <n-icon><target /></n-icon>
        </template>
      </n-tab>
      <n-tab name="reminders" label="营销提醒">
        <template #prefix>
          <n-icon><bell /></n-icon>
        </template>
      </n-tab>
      <n-tab name="analytics" label="效果分析">
        <template #prefix>
          <n-icon><trending-up /></n-icon>
        </template>
      </n-tab>
    </n-tabs>

    <div v-show="activeTab === 'overview'" class="mt-4">
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card>
            <n-statistic label="会员总数" :value="customerStore.totalCustomers" value-style="color: #2080f0">
              <template #prefix>
                <n-icon size="20"><users /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="积分总数" :value="marketingStore.totalPoints" value-style="color: #f0a020">
              <template #prefix>
                <n-icon size="20"><coins /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="可用优惠券" :value="marketingStore.activeCoupons.length" value-style="color: #18a058">
              <template #prefix>
                <n-icon size="20"><ticket /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="进行中活动" :value="marketingStore.activeCampaigns.length" value-style="color: #722ed1">
              <template #prefix>
                <n-icon size="20"><megaphone /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="3" :x-gap="16" :y-gap="16" class="mt-4">
        <n-grid-item>
          <n-card title="会员等级分布" size="small">
            <v-chart :option="memberLevelChartOption" style="height: 280px" autoresize />
          </n-card>
        </n-grid-item>
        <n-grid-item :span="2">
          <n-card title="营销效果趋势" size="small">
            <v-chart :option="marketingEffectChartOption" style="height: 280px" autoresize />
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-grid :cols="2" :x-gap="16" class="mt-4">
        <n-grid-item>
          <n-card title="7天内生日会员" size="small">
            <template #header-extra>
              <n-tag type="success" size="small">{{ upcomingBirthdays.length }} 位</n-tag>
            </template>
            <n-list v-if="upcomingBirthdays.length > 0" bordered>
              <n-list-item v-for="customer in upcomingBirthdays" :key="customer.id" class="cursor-pointer hover:bg-gray-50">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                    <n-avatar :style="{ backgroundColor: getLevelColor(customer.memberLevel) }">
                      <n-icon><gift /></n-icon>
                    </n-avatar>
                    <div>
                      <div class="font-medium">{{ customer.name }}</div>
                      <div class="text-sm text-gray-500">{{ customer.birthday }}</div>
                    </div>
                  </div>
                  <n-tag size="small" :style="{ backgroundColor: getLevelColor(customer.memberLevel) + '20', color: getLevelColor(customer.memberLevel), border: 'none' }">
                    {{ getLevelName(customer.memberLevel) }}
                  </n-tag>
                </div>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无即将生日的会员" size="small" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="进行中的活动" size="small">
            <n-list v-if="marketingStore.activeCampaigns.length > 0" bordered>
              <n-list-item
                v-for="campaign in marketingStore.activeCampaigns"
                :key="campaign.id"
                class="cursor-pointer hover:bg-gray-50"
                @click="viewCampaignDetail(campaign)"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-3">
                    <n-avatar style="background-color: #722ed1">
                      <n-icon><sparkles /></n-icon>
                    </n-avatar>
                    <div>
                      <div class="font-medium">{{ campaign.name }}</div>
                      <div class="text-sm text-gray-500">{{ campaign.startDate }} ~ {{ campaign.endDate }}</div>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-medium text-purple-600">{{ campaign.participantCount }}/{{ campaign.maxParticipants }}</div>
                    <div class="text-xs text-gray-400">报名人数</div>
                  </div>
                </div>
              </n-list-item>
            </n-list>
            <n-empty v-else description="暂无进行中的活动" size="small" />
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <div v-show="activeTab === 'members'" class="mt-4">
      <n-card title="会员等级体系">
        <n-grid :cols="5" :x-gap="16" :y-gap="16">
          <n-grid-item v-for="level in memberLevelConfigs" :key="level.level">
            <n-card :bordered="false" class="text-center" :style="{ borderTop: `3px solid ${level.color}` }">
              <n-icon :size="48" :color="level.color" class="mx-auto mb-3">
                <crown />
              </n-icon>
              <h3 class="text-lg font-bold" :style="{ color: level.color }">{{ level.name }}</h3>
              <p class="text-sm text-gray-500 mt-1">{{ level.minPoints }} 积分起</p>
              <n-tag class="mt-2" :style="{ backgroundColor: level.color + '20', color: level.color, border: 'none' }">
                {{ level.discount * 100 }}折优惠
              </n-tag>
              <n-divider />
              <div class="text-left">
                <p class="text-sm font-medium mb-2">会员权益：</p>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li v-for="benefit in level.benefits" :key="benefit" class="flex items-center gap-1">
                    <n-icon size="12" color="#18a058"><star /></n-icon>
                    {{ benefit }}
                  </li>
                </ul>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-card>

      <n-card title="各等级会员统计" class="mt-4">
        <n-data-table
          :columns="memberLevelColumns"
          :data="marketingStore.memberLevelStats"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'points'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">积分明细</h3>
          <n-button type="primary" @click="openAddPoints">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            积分调整
          </n-button>
        </div>
        <n-data-table
          :columns="pointRecordsColumns"
          :data="pointRecords"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'coupons'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <n-space>
            <n-input v-model:value="couponSearch" placeholder="搜索优惠券名称/编码" style="width: 240px" clearable>
              <template #prefix>
                <n-icon><search /></n-icon>
              </template>
            </n-input>
          </n-space>
          <n-button type="primary" @click="openAddCoupon">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新增优惠券
          </n-button>
        </div>
        <n-data-table
          :columns="couponColumns"
          :data="filteredCoupons"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>

      <n-card title="优惠券核销记录" class="mt-4">
        <n-data-table
          :columns="couponRedemptionColumns"
          :data="couponRedemptions"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'campaigns'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <n-space>
            <n-input v-model:value="campaignSearch" placeholder="搜索活动名称" style="width: 240px" clearable>
              <template #prefix>
                <n-icon><search /></n-icon>
              </template>
            </n-input>
            <n-select v-model:value="campaignStatusFilter" placeholder="活动状态" clearable style="width: 140px" :options="campaignStatusOptions" />
          </n-space>
          <n-button type="primary" @click="openAddCampaign">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新增活动
          </n-button>
        </div>
        <n-data-table
          :columns="campaignColumns"
          :data="filteredCampaigns"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'segments'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">客户分群</h3>
          <n-button type="primary" @click="openAddSegment">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新建分群
          </n-button>
        </div>
        <n-grid :cols="3" :x-gap="16" :y-gap="16">
          <n-grid-item v-for="segment in marketingStore.customerSegments" :key="segment.id">
            <n-card hoverable>
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2">
                  <n-avatar style="background-color: #722ed1">
                    <n-icon><target /></n-icon>
                  </n-avatar>
                  <div>
                    <h4 class="font-medium">{{ segment.name }}</h4>
                    <p class="text-sm text-gray-500">{{ segment.customerCount }} 位客户</p>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-3">{{ segment.description }}</p>
              <n-divider style="margin: 8px 0" />
              <div class="text-xs text-gray-500 mb-3">
                <p v-if="segment.filters.levels?.length">会员等级: {{ segment.filters.levels.map(l => getLevelName(l)).join('、') }}</p>
                <p v-if="segment.filters.sources?.length">客户来源: {{ segment.filters.sources.length }}种</p>
                <p v-if="segment.filters.minOrders !== undefined">最少订单: {{ segment.filters.minOrders }}单</p>
                <p v-if="segment.filters.minAmount !== undefined">最低消费: ¥{{ segment.filters.minAmount }}</p>
              </div>
              <div class="flex justify-end gap-2">
                <n-button size="small" type="info" quaternary @click="openEditSegment(segment)">编辑</n-button>
                <n-popconfirm @positive-click="handleDeleteSegment(segment.id)">
                  <template #trigger>
                    <n-button size="small" type="error" quaternary>删除</n-button>
                  </template>
                  确定删除该分群吗？
                </n-popconfirm>
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-card>
    </div>

    <div v-show="activeTab === 'reminders'" class="mt-4">
      <n-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">营销提醒</h3>
          <n-button type="primary" @click="openAddReminder">
            <template #icon>
              <n-icon><plus /></n-icon>
            </template>
            新建提醒
          </n-button>
        </div>
        <n-data-table
          :columns="reminderColumns"
          :data="marketingStore.reminders"
          :pagination="{ pageSize: 10 }"
          bordered
          size="small"
        />
      </n-card>
    </div>

    <div v-show="activeTab === 'analytics'" class="mt-4">
      <n-grid :cols="4" :x-gap="16" :y-gap="16">
        <n-grid-item>
          <n-card>
            <n-statistic label="新增会员(30天)" :value="marketingStore.getMarketingEffectStats(30).reduce((s, i) => s + i.newMembers, 0)" value-style="color: #2080f0">
              <template #prefix>
                <n-icon size="20"><user-check /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="活跃会员(30天)" :value="marketingStore.getMarketingEffectStats(30).reduce((s, i) => s + i.activeMembers, 0)" value-style="color: #18a058">
              <template #prefix>
                <n-icon size="20"><users /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="优惠券使用数" :value="marketingStore.couponRedemptions.filter(r => r.status === 'used').length" value-style="color: #f0a020">
              <template #prefix>
                <n-icon size="20"><ticket /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card>
            <n-statistic label="活动参与人次" :value="marketingStore.campaignRegistrations.length" value-style="color: #722ed1">
              <template #prefix>
                <n-icon size="20"><users /></n-icon>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
      </n-grid>

      <n-card title="营销效果趋势图" class="mt-4">
        <v-chart :option="marketingEffectChartOption" style="height: 400px" autoresize />
      </n-card>

      <n-grid :cols="2" :x-gap="16" class="mt-4">
        <n-grid-item>
          <n-card title="会员等级分布" size="small">
            <v-chart :option="memberLevelChartOption" style="height: 300px" autoresize />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card title="活动转化统计" size="small">
            <n-list bordered>
              <n-list-item v-for="campaign in marketingStore.campaigns.slice(0, 5)" :key="campaign.id">
                <div class="flex items-center justify-between w-full">
                  <div>
                    <div class="font-medium">{{ campaign.name }}</div>
                    <div class="text-sm text-gray-500">报名: {{ campaign.participantCount }}人</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-green-600">
                      {{ campaign.participantCount > 0 ? Math.round((campaign.participantCount / campaign.maxParticipants) * 100) : 0 }}%
                    </div>
                    <div class="text-xs text-gray-400">参与率</div>
                  </div>
                </div>
              </n-list-item>
              <n-empty v-if="marketingStore.campaigns.length === 0" description="暂无活动数据" size="small" />
            </n-list>
          </n-card>
        </n-grid-item>
      </n-grid>
    </div>

    <n-modal v-model:show="showCouponModal" preset="card" :title="couponModalMode === 'add' ? '新增优惠券' : '编辑优惠券'" style="width: 600px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="优惠券名称" required>
          <n-input v-model:value="couponForm.name" placeholder="请输入优惠券名称" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="优惠券类型" required>
              <n-select v-model:value="couponForm.type" :options="couponTypeOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="面值" required>
              <n-input-number v-model:value="couponForm.value" :min="0" style="width: 100%" :placeholder="couponForm.type === 'discount' ? '折扣率，如0.8' : '金额，元'" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="使用门槛">
              <n-input-number v-model:value="couponForm.minAmount" :min="0" style="width: 100%" placeholder="最低消费金额" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="发放数量" required>
              <n-input-number v-model:value="couponForm.totalQuantity" :min="1" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="开始日期" required>
              <n-date-picker v-model:value="couponForm.startDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="结束日期" required>
              <n-date-picker v-model:value="couponForm.endDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="适用会员等级">
          <n-checkbox-group v-model:value="couponForm.applicableLevels">
            <n-space>
              <n-checkbox v-for="level in memberLevelOptions" :key="level.value" :value="level.value" :label="level.label" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>
        <n-form-item label="使用说明">
          <n-input v-model:value="couponForm.description" type="textarea" :rows="3" placeholder="请输入使用说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCouponModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveCoupon">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showCampaignModal" preset="card" :title="campaignModalMode === 'add' ? '新增活动' : '编辑活动'" style="width: 680px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="活动名称" required>
          <n-input v-model:value="campaignForm.name" placeholder="请输入活动名称" />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="活动类型" required>
              <n-select v-model:value="campaignForm.type" :options="campaignTypeOptions" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="最大参与人数" required>
              <n-input-number v-model:value="campaignForm.maxParticipants" :min="1" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="开始日期" required>
              <n-date-picker v-model:value="campaignForm.startDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="结束日期" required>
              <n-date-picker v-model:value="campaignForm.endDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="活动描述">
          <n-input v-model:value="campaignForm.description" type="textarea" :rows="2" placeholder="请输入活动描述" />
        </n-form-item>
        <n-form-item label="活动规则">
          <n-input v-model:value="campaignForm.rules" type="textarea" :rows="3" placeholder="请输入活动规则" />
        </n-form-item>
        <n-form-item label="活动奖励">
          <n-input v-model:value="campaignForm.rewards" type="textarea" :rows="2" placeholder="请输入活动奖励" />
        </n-form-item>
        <n-form-item label="目标会员等级">
          <n-checkbox-group v-model:value="campaignForm.targetLevels">
            <n-space>
              <n-checkbox v-for="level in memberLevelOptions" :key="level.value" :value="level.value" :label="level.label" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>
        <n-form-item label="目标标签">
          <n-dynamic-tags v-model:value="campaignForm.targetTags" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCampaignModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveCampaign">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showCampaignDetail" preset="card" title="活动详情" style="width: 800px">
      <div v-if="selectedCampaign">
        <div class="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
          <h3 class="text-xl font-bold text-gray-800">{{ selectedCampaign.name }}</h3>
          <div class="flex items-center gap-3 mt-2">
            <n-tag :style="{ backgroundColor: getCampaignStatusColor(selectedCampaign.status) + '20', color: getCampaignStatusColor(selectedCampaign.status), border: 'none' }">
              {{ getCampaignStatusLabel(selectedCampaign.status) }}
            </n-tag>
            <span class="text-sm text-gray-500">{{ selectedCampaign.typeLabel }}</span>
          </div>
        </div>

        <n-tabs v-model:value="campaignDetailTab" type="line" size="small">
          <n-tab name="info" label="活动信息" />
          <n-tab name="registrations" :label="'报名名单 (' + marketingStore.getRegistrationsByCampaignId(selectedCampaign.id).length + ')'" />
          <n-tab name="visits" label="回访追踪" />
        </n-tabs>

        <div v-show="campaignDetailTab === 'info'" class="mt-4">
          <n-descriptions :column="2" bordered size="small">
            <n-descriptions-item label="活动时间">{{ selectedCampaign.startDate }} ~ {{ selectedCampaign.endDate }}</n-descriptions-item>
            <n-descriptions-item label="报名人数">{{ selectedCampaign.participantCount }}/{{ selectedCampaign.maxParticipants }}</n-descriptions-item>
            <n-descriptions-item label="目标人群" :span="2">
              {{ selectedCampaign.targetLevels.length > 0 ? selectedCampaign.targetLevels.map(l => getLevelName(l)).join('、') : '全部会员' }}
            </n-descriptions-item>
            <n-descriptions-item label="活动描述" :span="2">{{ selectedCampaign.description }}</n-descriptions-item>
            <n-descriptions-item label="活动规则" :span="2">{{ selectedCampaign.rules }}</n-descriptions-item>
            <n-descriptions-item label="活动奖励" :span="2">{{ selectedCampaign.rewards }}</n-descriptions-item>
          </n-descriptions>
        </div>

        <div v-show="campaignDetailTab === 'registrations'" class="mt-4">
          <div class="flex justify-end mb-3">
            <n-button size="small" type="primary" @click="openAddVisitTrack(selectedCampaign!.id)">
              <template #icon>
                <n-icon><phone-call /></n-icon>
              </template>
              添加回访
            </n-button>
          </div>
          <n-data-table
            :columns="registrationColumns"
            :data="marketingStore.getRegistrationsByCampaignId(selectedCampaign.id)"
            :pagination="{ pageSize: 5 }"
            bordered
            size="small"
          />
        </div>

        <div v-show="campaignDetailTab === 'visits'" class="mt-4">
          <n-data-table
            :columns="visitTrackColumns"
            :data="marketingStore.getVisitTracksByCampaignId(selectedCampaign.id)"
            :pagination="{ pageSize: 5 }"
            bordered
            size="small"
          />
        </div>
      </div>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showCampaignDetail = false">关闭</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showSegmentModal" preset="card" :title="segmentModalMode === 'add' ? '新建分群' : '编辑分群'" style="width: 600px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="分群名称" required>
          <n-input v-model:value="segmentForm.name" placeholder="请输入分群名称" />
        </n-form-item>
        <n-form-item label="分群描述">
          <n-input v-model:value="segmentForm.description" type="textarea" :rows="2" placeholder="请输入分群描述" />
        </n-form-item>
        <n-divider>筛选条件</n-divider>
        <n-form-item label="会员等级">
          <n-checkbox-group v-model:value="segmentForm.filters.levels">
            <n-space>
              <n-checkbox v-for="level in memberLevelOptions" :key="level.value" :value="level.value" :label="level.label" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>
        <n-form-item label="客户来源">
          <n-checkbox-group v-model:value="segmentForm.filters.sources">
            <n-space>
              <n-checkbox v-for="source in customerSourceOptions" :key="source.value" :value="source.value" :label="source.label" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>
        <n-form-item label="复购意向">
          <n-checkbox-group v-model:value="segmentForm.filters.repurchaseIntentions">
            <n-space>
              <n-checkbox v-for="item in repurchaseIntentionOptions" :key="item.value" :value="item.value" :label="item.label" />
            </n-space>
          </n-checkbox-group>
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="最少订单">
              <n-input-number v-model:value="segmentForm.filters.minOrders" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="最多订单">
              <n-input-number v-model:value="segmentForm.filters.maxOrders" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="最少消费(元)">
              <n-input-number v-model:value="segmentForm.filters.minAmount" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="最多消费(元)">
              <n-input-number v-model:value="segmentForm.filters.maxAmount" :min="0" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="客户标签">
          <n-dynamic-tags v-model:value="segmentForm.filters.tags" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showSegmentModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveSegment">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showPointModal" preset="card" title="积分调整" style="width: 500px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="选择客户" required>
          <n-select
            v-model:value="pointForm.customerId"
            :options="customerOptions"
            placeholder="请选择客户"
            filterable
            @update:value="handleCustomerSelectForPoints"
          />
        </n-form-item>
        <n-form-item label="客户姓名">
          <n-input v-model:value="pointForm.customerName" disabled />
        </n-form-item>
        <n-form-item label="调整类型" required>
          <n-select
            v-model:value="pointForm.type"
            :options="[
              { label: '积分增加', value: 'adjust' },
              { label: '积分扣减', value: 'spend_coupon' }
            ]"
          />
        </n-form-item>
        <n-form-item label="调整积分" required>
          <n-input-number v-model:value="pointForm.points" :min="-99999" :max="99999" style="width: 100%" />
        </n-form-item>
        <n-form-item label="调整说明">
          <n-input v-model:value="pointForm.description" type="textarea" :rows="3" placeholder="请输入调整说明" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showPointModal = false">取消</n-button>
          <n-button type="primary" @click="handleAddPoints">确认调整</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showVisitTrackModal" preset="card" title="添加回访记录" style="width: 550px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="选择客户" required>
          <n-select
            v-model:value="visitTrackForm.customerId"
            :options="customerOptions"
            placeholder="请选择客户"
            filterable
            @update:value="handleCustomerSelectForVisit"
          />
        </n-form-item>
        <n-form-item label="客户姓名">
          <n-input v-model:value="visitTrackForm.customerName" disabled />
        </n-form-item>
        <n-grid :cols="2" :x-gap="12">
          <n-grid-item>
            <n-form-item label="回访日期" required>
              <n-date-picker v-model:value="visitTrackForm.visitDate" type="date" style="width: 100%" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="回访方式" required>
              <n-select
                v-model:value="visitTrackForm.visitType"
                :options="[
                  { label: '电话回访', value: 'phone' },
                  { label: '微信回访', value: 'wechat' },
                  { label: '上门回访', value: 'onsite' }
                ]"
              />
            </n-form-item>
          </n-grid-item>
        </n-grid>
        <n-form-item label="回访人">
          <n-input v-model:value="visitTrackForm.visitor" placeholder="请输入回访人姓名" />
        </n-form-item>
        <n-form-item label="满意度">
          <n-rate v-model:value="visitTrackForm.satisfactionScore" />
        </n-form-item>
        <n-form-item label="复购意向">
          <n-switch v-model:value="visitTrackForm.hasRepurchaseIntention" />
        </n-form-item>
        <n-form-item label="回访反馈">
          <n-input v-model:value="visitTrackForm.feedback" type="textarea" :rows="3" placeholder="请输入回访反馈内容" />
        </n-form-item>
        <n-form-item label="下次回访">
          <n-date-picker v-model:value="visitTrackForm.nextFollowUpDate" type="date" style="width: 100%" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showVisitTrackModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveVisitTrack">保存</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="showReminderModal" preset="card" title="新建营销提醒" style="width: 500px">
      <n-form label-placement="left" label-width="100px">
        <n-form-item label="提醒类型" required>
          <n-select
            v-model:value="reminderForm.type"
            :options="marketingReminderTypeOptions"
          />
        </n-form-item>
        <n-form-item label="提醒标题" required>
          <n-input v-model:value="reminderForm.title" placeholder="请输入提醒标题" />
        </n-form-item>
        <n-form-item label="发送日期" required>
          <n-date-picker v-model:value="reminderForm.sendDate" type="date" style="width: 100%" />
        </n-form-item>
        <n-form-item label="提醒内容" required>
          <n-input v-model:value="reminderForm.content" type="textarea" :rows="4" placeholder="请输入提醒内容" />
        </n-form-item>
        <n-form-item label="目标客户">
          <n-select
            v-model:value="reminderForm.customerIds"
            :options="customerOptions"
            multiple
            filterable
            placeholder="选择接收提醒的客户"
            max-tag-count="responsive"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showReminderModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveReminder">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.marketing-center {
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-4 {
  margin-top: 16px;
}

.flex {
  display: flex;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.justify-end {
  justify-content: flex-end;
}

.text-2xl {
  font-size: 24px;
}

.font-bold {
  font-weight: bold;
}

.text-gray-800 {
  color: #1f2937;
}

.w-full {
  width: 100%;
}

.member-level-card {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
}

.level-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  color: #fff;
  font-size: 28px;
}

.benefit-list {
  text-align: left;
  margin-top: 12px;
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #666;
}

.stat-card {
  padding: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
}

.segment-card {
  cursor: pointer;
  transition: all 0.3s;
}

.segment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reminder-item {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f5f5f5;
}

.reminder-item:hover {
  background: #e8e8e8;
}

.chart-container {
  height: 350px;
  width: 100%;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #333;
}

.birthday-list {
  max-height: 200px;
}

.birthday-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.birthday-item:last-child {
  border-bottom: none;
}
</style>