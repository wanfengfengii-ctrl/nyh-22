<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NTag,
  NList,
  NListItem,
  NModal,
  NButton,
  NIcon,
  NSpace
} from 'naive-ui'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import StatusTag from '@/components/StatusTag.vue'
import type { CareRecord } from '@/types'
import { careTypeOptions } from '@/types'

const store = useLandscapeStore()

const currentDate = ref(new Date())
const selectedDate = ref<string | null>(null)
const showDetail = ref(false)

const careTypeMap = computed(() => {
  const map: Record<string, string> = {}
  careTypeOptions.forEach(opt => {
    map[opt.value] = opt.label
  })
  return map
})

const year = computed(() => currentDate.value.getFullYear())
const month = computed(() => currentDate.value.getMonth())

const weeks = computed(() => {
  const firstDay = new Date(year.value, month.value, 1)
  const lastDay = new Date(year.value, month.value + 1, 0)
  const startDay = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days: { date: Date; isCurrentMonth: boolean; dateStr: string }[] = []

  const prevMonthLastDay = new Date(year.value, month.value, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const d = new Date(year.value, month.value - 1, prevMonthLastDay - i)
    days.push({
      date: d,
      isCurrentMonth: false,
      dateStr: formatDateStr(d)
    })
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year.value, month.value, i)
    days.push({
      date: d,
      isCurrentMonth: true,
      dateStr: formatDateStr(d)
    })
  }

  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year.value, month.value + 1, i)
    days.push({
      date: d,
      isCurrentMonth: false,
      dateStr: formatDateStr(d)
    })
  }

  const result: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    result.push(days.slice(i, i + 7))
  }
  return result
})

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getRecordsByDateStr(dateStr: string): CareRecord[] {
  return store.careRecords.filter(r => r.careDate === dateStr)
}

function handlePrevMonth() {
  currentDate.value = new Date(year.value, month.value - 1, 1)
}

function handleNextMonth() {
  currentDate.value = new Date(year.value, month.value + 1, 1)
}

function handleDateClick(dateStr: string) {
  const records = getRecordsByDateStr(dateStr)
  if (records.length > 0) {
    selectedDate.value = dateStr
    showDetail.value = true
  }
}

const selectedRecords = computed(() => {
  if (!selectedDate.value) return []
  return store.careRecords
    .filter(r => r.careDate === selectedDate.value)
    .sort((a, b) => a.landscapeId.localeCompare(b.landscapeId))
})

function getLandscapeCode(landscapeId: string): string {
  const landscape = store.getLandscapeById(landscapeId)
  return landscape?.code || '未知作品'
}

function isToday(dateStr: string): boolean {
  return dateStr === formatDateStr(new Date())
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold text-gray-800">养护日历</h2>
      <p class="text-sm text-gray-500 mt-1">查看每日养护记录和安排</p>
    </div>

    <n-card>
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-800">
          {{ year }} 年 {{ month + 1 }} 月
        </h3>
        <n-space>
          <n-button size="small" @click="handlePrevMonth">
            <template #icon>
              <n-icon><ChevronLeft /></n-icon>
            </template>
          </n-button>
          <n-button size="small" @click="handleNextMonth">
            <template #icon>
              <n-icon><ChevronRight /></n-icon>
            </template>
          </n-button>
        </n-space>
      </div>

      <div class="calendar-grid">
        <div
          v-for="day in weekDays"
          :key="day"
          class="calendar-header-cell"
        >
          {{ day }}
        </div>

        <template v-for="(week, weekIndex) in weeks" :key="weekIndex">
          <div
            v-for="day in week"
            :key="day.dateStr"
            class="calendar-cell"
            :class="{
              'cursor-pointer hover:bg-green-50': getRecordsByDateStr(day.dateStr).length > 0,
              'text-gray-300': !day.isCurrentMonth,
              'bg-green-100': isToday(day.dateStr) && day.isCurrentMonth
            }"
            @click="handleDateClick(day.dateStr)"
          >
            <span
              class="day-number"
              :class="{ 'font-bold text-green-700': isToday(day.dateStr) && day.isCurrentMonth }"
            >
              {{ day.date.getDate() }}
            </span>
            <div v-if="getRecordsByDateStr(day.dateStr).length > 0" class="mt-1">
              <n-tag
                size="tiny"
                type="success"
                round
              >
                {{ getRecordsByDateStr(day.dateStr).length }}条
              </n-tag>
            </div>
          </div>
        </template>
      </div>
    </n-card>

    <n-modal
      v-model:show="showDetail"
      preset="card"
      :title="`${selectedDate} 养护记录`"
      style="width: 520px"
    >
      <div v-if="selectedRecords.length === 0" class="py-8 text-center text-gray-400">
        当日没有养护记录
      </div>
      <n-list v-else bordered>
        <n-list-item v-for="record in selectedRecords" :key="record.id">
          <div class="flex items-center justify-between w-full">
            <div class="flex-1">
              <div class="font-medium">{{ getLandscapeCode(record.landscapeId) }}</div>
              <div class="text-sm text-gray-500 mt-1">
                {{ careTypeMap[record.careType] }} · 湿度 {{ record.humidity }}%
              </div>
              <p v-if="record.notes" class="text-sm text-gray-600 mt-1">
                {{ record.notes }}
              </p>
            </div>
            <StatusTag :status="record.statusAfter" />
          </div>
        </n-list-item>
      </n-list>
    </n-modal>
  </div>
</template>

<style scoped>
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-header-cell {
  padding: 12px;
  text-align: center;
  font-weight: 500;
  color: #666;
  font-size: 14px;
}

.calendar-cell {
  padding: 12px 8px;
  text-align: center;
  border-radius: 8px;
  min-height: 80px;
  transition: background-color 0.2s;
}

.day-number {
  font-size: 14px;
}
</style>
