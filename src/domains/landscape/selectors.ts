import { computed, type Ref, type ComputedRef } from 'vue'
import type {
  MicroLandscape,
  CareRecord,
  CareRuleConfig,
  ReminderTask,
  AbnormalRecord,
  TaskPriority,
  CareTrendData
} from './types'
import { getDateRange } from '@/shared/utils'

export interface LandscapeSelectors {
  soldLandscapeIds: ComputedRef<string[]>
  activeLandscapes: ComputedRef<MicroLandscape[]>
  soldLandscapes: ComputedRef<MicroLandscape[]>
  openAbnormalRecords: ComputedRef<AbnormalRecord[]>
  pendingTasks: ComputedRef<ReminderTask[]>
  defaultCareRule: ComputedRef<CareRuleConfig | undefined>
  getLandscapeById: (id: string) => MicroLandscape | undefined
  getRecordsByLandscapeId: (landscapeId: string) => CareRecord[]
  getAbnormalRecordsByLandscapeId: (landscapeId: string) => AbnormalRecord[]
  getRecordsByDate: (dateStr: string) => CareRecord[]
  getMossSpeciesList: () => string[]
  getStatusCount: (status: string) => number
  getHumidityTrendData: (landscapeId: string) => { date: string; humidity: number }[]
  getCareTrendData: (days: number) => CareTrendData[]
  getTaskStats: () => { pending: number; inProgress: number; completed: number; highPriority: number; total: number }
  getAbnormalStats: () => { open: number; closed: number; yellowingCount: number; moldCount: number; total: number }
  getApplicableRule: (landscape: MicroLandscape) => CareRuleConfig | undefined
}

export function createSelectors(
  landscapes: Ref<MicroLandscape[]>,
  careRecords: Ref<CareRecord[]>,
  careRules: Ref<CareRuleConfig[]>,
  reminderTasks: Ref<ReminderTask[]>,
  abnormalRecords: Ref<AbnormalRecord[]>
): LandscapeSelectors {
  const soldLandscapeIds = computed(() => {
    return landscapes.value
      .filter(l => l.isSold || l.status === 'sold')
      .map(l => l.id)
  })

  const activeLandscapes = computed(() => {
    return landscapes.value.filter(l => !l.isSold && l.status !== 'sold')
  })

  const soldLandscapes = computed(() => {
    return landscapes.value.filter(l => l.isSold || l.status === 'sold')
  })

  const openAbnormalRecords = computed(() => {
    return abnormalRecords.value.filter(r => !r.isClosed)
  })

  const pendingTasks = computed(() => {
    return reminderTasks.value
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        const priorityOrder: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 }
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
  })

  const defaultCareRule = computed(() => {
    return careRules.value.find(r => r.isDefault) || careRules.value[0]
  })

  function getLandscapeById(id: string): MicroLandscape | undefined {
    return landscapes.value.find(l => l.id === id)
  }

  function getRecordsByLandscapeId(landscapeId: string): CareRecord[] {
    return careRecords.value
      .filter(r => r.landscapeId === landscapeId)
      .sort((a, b) => new Date(b.careDate).getTime() - new Date(a.careDate).getTime())
  }

  function getAbnormalRecordsByLandscapeId(landscapeId: string): AbnormalRecord[] {
    return abnormalRecords.value
      .filter(r => r.landscapeId === landscapeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  function getRecordsByDate(dateStr: string): CareRecord[] {
    return careRecords.value.filter(r => r.careDate === dateStr)
  }

  function getMossSpeciesList(): string[] {
    const species = new Set(landscapes.value.map(l => l.mossSpecies))
    return Array.from(species).sort()
  }

  function getStatusCount(status: string): number {
    return landscapes.value.filter(l => l.status === status).length
  }

  function getHumidityTrendData(landscapeId: string): { date: string; humidity: number }[] {
    const records = getRecordsByLandscapeId(landscapeId)
      .sort((a, b) => new Date(a.careDate).getTime() - new Date(b.careDate).getTime())
    return records.map(r => ({
      date: r.careDate,
      humidity: r.humidity
    }))
  }

  function getCareTrendData(days: number): CareTrendData[] {
    const dateRange = getDateRange(days)
    return dateRange.map(date => {
      const dayRecords = careRecords.value.filter(r => r.careDate === date)
      const abnormalCount = dayRecords.filter(
        r => r.statusAfter === 'yellowing' || r.statusAfter === 'mold'
      ).length
      const careCount = dayRecords.length
      const abnormalRate = careCount > 0 ? Math.round((abnormalCount / careCount) * 100) : 0
      return {
        date,
        careCount,
        abnormalCount,
        abnormalRate
      }
    })
  }

  function getTaskStats() {
    const pending = reminderTasks.value.filter(t => t.status === 'pending').length
    const inProgress = reminderTasks.value.filter(t => t.status === 'in_progress').length
    const completed = reminderTasks.value.filter(t => t.status === 'completed').length
    const highPriority = reminderTasks.value.filter(t => t.priority === 'high' && t.status !== 'completed').length
    return { pending, inProgress, completed, highPriority, total: reminderTasks.value.length }
  }

  function getAbnormalStats() {
    const open = abnormalRecords.value.filter(r => !r.isClosed).length
    const closed = abnormalRecords.value.filter(r => r.isClosed).length
    const yellowingCount = abnormalRecords.value.filter(r => r.type === 'yellowing').length
    const moldCount = abnormalRecords.value.filter(r => r.type === 'mold').length
    return { open, closed, yellowingCount, moldCount, total: abnormalRecords.value.length }
  }

  function getApplicableRule(landscape: MicroLandscape): CareRuleConfig | undefined {
    return careRules.value.find(r =>
      r.isDefault || r.applicableSpecies.includes(landscape.mossSpecies)
    ) || defaultCareRule.value
  }

  return {
    soldLandscapeIds,
    activeLandscapes,
    soldLandscapes,
    openAbnormalRecords,
    pendingTasks,
    defaultCareRule,
    getLandscapeById,
    getRecordsByLandscapeId,
    getAbnormalRecordsByLandscapeId,
    getRecordsByDate,
    getMossSpeciesList,
    getStatusCount,
    getHumidityTrendData,
    getCareTrendData,
    getTaskStats,
    getAbnormalStats,
    getApplicableRule
  }
}
