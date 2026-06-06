<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NTab,
  NTabs,
  NList,
  NListItem,
  NButton,
  NSpace,
  NTag,
  NIcon,
  NPopover,
  NBadge,
  NSelect,
  NInput,
  NEmpty
} from 'naive-ui'
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Droplets,
  Sun,
  Bug,
  RefreshCw,
  Eye
} from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import { taskPriorityOptions, taskStatusOptions, reminderTypeOptions } from '@/types'
import type { ReminderTask, AbnormalRecord, TaskStatus } from '@/types'
import CareRuleConfig from '@/components/CareRuleConfig.vue'
import AbnormalHandleDialog from '@/components/AbnormalHandleDialog.vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { h } from 'vue'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const router = useRouter()
const store = useLandscapeStore()

const activeTab = ref('tasks')
const showRuleConfig = ref(false)
const filterPriority = ref<string | null>(null)
const filterType = ref<string | null>(null)
const filterTaskStatus = ref<TaskStatus | null>(null)

const showAbnormalDialog = ref(false)
const selectedAbnormal = ref<AbnormalRecord | null>(null)
const abnormalMode = ref<'view' | 'close' | 'edit'>('view')

onMounted(() => {
  store.initDefaultCareRules()
  store.generateReminderTasks()
})

const taskStats = computed(() => store.getTaskStats())
const abnormalStats = computed(() => store.getAbnormalStats())

const filteredTasks = computed(() => {
  let result = store.pendingTasks
  if (filterPriority.value) {
    result = result.filter(t => t.priority === filterPriority.value)
  }
  if (filterType.value) {
    result = result.filter(t => t.type === filterType.value)
  }
  if (filterTaskStatus.value) {
    result = result.filter(t => t.status === filterTaskStatus.value)
  }
  return result
})

function getTypeIcon(type: string) {
  const icons: Record<string, any> = {
    spray_due: Droplets,
    humidity_low: Droplets,
    humidity_high: Droplets,
    light_risk: Sun,
    abnormal: Bug
  }
  return icons[type] || Bell
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    spray_due: '喷雾到期',
    humidity_low: '湿度过低',
    humidity_high: '湿度过高',
    light_risk: '光照风险',
    abnormal: '异常状态'
  }
  return labels[type] || type
}

function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: '#d03050',
    medium: '#f0a020',
    low: '#18a058'
  }
  return colors[priority] || '#999'
}

function getPriorityType(priority: string): 'success' | 'warning' | 'error' | 'default' {
  const types: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
    high: 'error',
    medium: 'warning',
    low: 'success'
  }
  return types[priority] || 'default'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return labels[priority] || priority
}

function handleStartTask(taskId: string) {
  store.updateTaskStatus(taskId, 'in_progress')
}

function handleCompleteTask(taskId: string) {
  store.updateTaskStatus(taskId, 'completed')
}

function handleRefresh() {
  store.generateReminderTasks()
}

function handleViewAbnormal(record: AbnormalRecord) {
  selectedAbnormal.value = record
  abnormalMode.value = 'view'
  showAbnormalDialog.value = true
}

function handleCloseAbnormal(record: AbnormalRecord) {
  selectedAbnormal.value = record
  abnormalMode.value = 'close'
  showAbnormalDialog.value = true
}

const todayTaskCount = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return store.pendingTasks.filter(t => t.dueDate <= today).length
})

const careTrend7Days = computed(() => {
  const data = store.getCareTrendData(7)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['养护次数', '异常次数'],
      top: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5))
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '养护次数',
        type: 'bar',
        data: data.map(d => d.careCount),
        itemStyle: { color: '#2080f0' }
      },
      {
        name: '异常次数',
        type: 'bar',
        data: data.map(d => d.abnormalCount),
        itemStyle: { color: '#f0a020' }
      }
    ]
  }
})

const abnormalRate7Days = computed(() => {
  const data = store.getCareTrendData(7)
  return {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>异常率: {c}%'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.slice(5)),
      boundaryGap: false
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%' },
      max: 100
    },
    series: [
      {
        name: '异常率',
        type: 'line',
        smooth: true,
        data: data.map(d => d.abnormalRate),
        itemStyle: { color: '#d03050' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(208, 48, 80, 0.3)' },
              { offset: 1, color: 'rgba(208, 48, 80, 0.05)' }
            ]
          }
        }
      }
    ]
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">养护任务看板</h2>
        <p class="text-sm text-gray-500 mt-1">智能提醒、异常跟踪、养护任务一览</p>
      </div>
      <div class="flex items-center gap-2">
        <n-button @click="handleRefresh">
          <template #icon>
            <n-icon><RefreshCw /></n-icon>
          </template>
          刷新提醒
        </n-button>
        <n-button type="primary" @click="showRuleConfig = true">
          <template #icon>
            <n-icon><Settings /></n-icon>
          </template>
          养护规则
        </n-button>
      </div>
    </div>

    <n-grid :cols="4" :x-gap="16" :y-gap="16">
      <n-grid-item>
        <n-card>
          <n-statistic label="待处理任务" :value="taskStats.pending">
            <template #prefix>
              <n-icon :size="20" color="#f0a020"><Bell /></n-icon>
            </template>
          </n-statistic>
          <p class="text-xs text-gray-500 mt-2">今日到期: {{ todayTaskCount }} 项</p>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="高优先级" :value="taskStats.highPriority" value-style="color: #d03050">
            <template #prefix>
              <n-icon :size="20" color="#d03050"><AlertTriangle /></n-icon>
            </template>
          </n-statistic>
          <p class="text-xs text-gray-500 mt-2">需紧急处理</p>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="进行中" :value="taskStats.inProgress" value-style="color: #2080f0">
            <template #prefix>
              <n-icon :size="20" color="#2080f0"><Clock /></n-icon>
            </template>
          </n-statistic>
          <p class="text-xs text-gray-500 mt-2">正在处理中</p>
        </n-card>
      </n-grid-item>
      <n-grid-item>
        <n-card>
          <n-statistic label="未关闭异常" :value="abnormalStats.open" value-style="color: #f0a020">
            <template #prefix>
              <n-icon :size="20" color="#f0a020"><Bug /></n-icon>
            </template>
          </n-statistic>
          <p class="text-xs text-gray-500 mt-2">
            黄化 {{ abnormalStats.yellowingCount }} / 霉斑 {{ abnormalStats.moldCount }}
          </p>
        </n-card>
      </n-grid-item>
    </n-grid>

    <n-tabs v-model:value="activeTab" type="line">
      <n-tab name="tasks" tab="待办任务">
        <n-card>
          <div class="flex flex-wrap gap-4 mb-4">
            <n-select
              v-model:value="filterPriority"
              placeholder="按优先级筛选"
              :options="taskPriorityOptions.map(o => ({ label: o.label, value: o.value }))"
              style="width: 140px"
              clearable
            />
            <n-select
              v-model:value="filterType"
              placeholder="按类型筛选"
              :options="reminderTypeOptions.map(o => ({ label: o.label, value: o.value }))"
              style="width: 140px"
              clearable
            />
            <n-select
              v-model:value="filterTaskStatus"
              placeholder="按状态筛选"
              :options="taskStatusOptions.map(o => ({ label: o.label, value: o.value }))"
              style="width: 140px"
              clearable
            />
          </div>

          <div v-if="filteredTasks.length > 0" class="space-y-3">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
              @click="router.push(`/landscapes/${task.landscapeId}`)"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    :style="{ backgroundColor: getPriorityColor(task.priority) }"
                  >
                    <n-icon :size="20">
                      <component :is="getTypeIcon(task.type)" />
                    </n-icon>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-gray-800">{{ task.title }}</h4>
                      <n-tag size="small" :type="getPriorityType(task.priority)">
                        {{ getPriorityLabel(task.priority) }}
                      </n-tag>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">{{ task.description }}</p>
                    <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>到期: {{ task.dueDate }}</span>
                      <span>{{ getTypeLabel(task.type) }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2" @click.stop>
                  <n-button
                    v-if="task.status === 'pending'"
                    size="small"
                    @click="handleStartTask(task.id)"
                  >
                    开始处理
                  </n-button>
                  <n-button
                    v-if="task.status === 'in_progress'"
                    size="small"
                    type="primary"
                    @click="handleCompleteTask(task.id)"
                  >
                    完成
                  </n-button>
                  <n-button
                    v-if="task.status === 'completed'"
                    size="small"
                    type="success"
                    disabled
                  >
                    已完成
                  </n-button>
                </div>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无待处理任务" />
        </n-card>
      </n-tab>

      <n-tab name="abnormal" tab="异常管理">
        <n-card>
          <div v-if="store.abnormalRecords.length > 0" class="space-y-3">
            <div
              v-for="record in store.abnormalRecords"
              :key="record.id"
              class="p-4 border border-gray-200 rounded-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex items-start gap-3">
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    :style="{ backgroundColor: record.type === 'yellowing' ? '#f0a020' : '#d03050' }"
                  >
                    <n-icon :size="20"><Bug /></n-icon>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-medium text-gray-800">
                        {{ store.getLandscapeById(record.landscapeId)?.code || '未知作品' }}
                        - {{ record.type === 'yellowing' ? '黄化' : '霉斑' }}
                      </h4>
                      <n-tag
                        size="small"
                        :type="record.isClosed ? 'success' : 'warning'"
                      >
                        {{ record.isClosed ? '已关闭' : '处理中' }}
                      </n-tag>
                    </div>
                    <p class="text-sm text-gray-500 mt-1">{{ record.description }}</p>
                    <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>发现: {{ record.foundDate }}</span>
                      <span v-if="record.closedDate">关闭: {{ record.closedDate }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <n-button size="small" @click="handleViewAbnormal(record)">
                    <template #icon>
                      <n-icon size="14"><Eye /></n-icon>
                    </template>
                    详情
                  </n-button>
                  <n-button
                    v-if="!record.isClosed"
                    size="small"
                    type="primary"
                    @click="handleCloseAbnormal(record)"
                  >
                    关闭异常
                  </n-button>
                </div>
              </div>
            </div>
          </div>
          <n-empty v-else description="暂无异常记录" />
        </n-card>
      </n-tab>

      <n-tab name="trend" tab="养护趋势">
        <n-grid :cols="2" :x-gap="16">
          <n-grid-item>
            <n-card title="近7天养护次数">
              <v-chart :option="careTrend7Days" style="height: 300px" autoresize />
            </n-card>
          </n-grid-item>
          <n-grid-item>
            <n-card title="近7天异常率趋势">
              <v-chart :option="abnormalRate7Days" style="height: 300px" autoresize />
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-tab>
    </n-tabs>

    <CareRuleConfig v-model:visible="showRuleConfig" />

    <AbnormalHandleDialog
      v-model:visible="showAbnormalDialog"
      :abnormal-record="selectedAbnormal"
      :mode="abnormalMode"
      @success="store.generateReminderTasks()"
    />
  </div>
</template>
