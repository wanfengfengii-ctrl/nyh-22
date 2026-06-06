import { ref, watch, type Ref } from 'vue'
import { getStorageData, setStorageData, STORAGE_KEYS } from '@/shared/storage'
import type {
  MicroLandscape,
  CareRecord,
  CareRuleConfig,
  ReminderTask,
  AbnormalRecord,
  OperationLog,
  LandscapeState
} from './types'

export function createLandscapeState(): LandscapeState {
  return {
    landscapes: getStorageData<MicroLandscape>(STORAGE_KEYS.landscapes),
    careRecords: getStorageData<CareRecord>(STORAGE_KEYS.careRecords),
    careRules: getStorageData<CareRuleConfig>(STORAGE_KEYS.careRules),
    reminderTasks: getStorageData<ReminderTask>(STORAGE_KEYS.reminderTasks),
    abnormalRecords: getStorageData<AbnormalRecord>(STORAGE_KEYS.abnormalRecords),
    operationLogs: getStorageData<OperationLog>(STORAGE_KEYS.operationLogs)
  }
}

export function createReactiveState(): {
  landscapes: Ref<MicroLandscape[]>
  careRecords: Ref<CareRecord[]>
  careRules: Ref<CareRuleConfig[]>
  reminderTasks: Ref<ReminderTask[]>
  abnormalRecords: Ref<AbnormalRecord[]>
  operationLogs: Ref<OperationLog[]>
} {
  const state = createLandscapeState()
  const landscapes = ref<MicroLandscape[]>(state.landscapes)
  const careRecords = ref<CareRecord[]>(state.careRecords)
  const careRules = ref<CareRuleConfig[]>(state.careRules)
  const reminderTasks = ref<ReminderTask[]>(state.reminderTasks)
  const abnormalRecords = ref<AbnormalRecord[]>(state.abnormalRecords)
  const operationLogs = ref<OperationLog[]>(state.operationLogs)

  watch(landscapes, (val) => setStorageData(STORAGE_KEYS.landscapes, val), { deep: true })
  watch(careRecords, (val) => setStorageData(STORAGE_KEYS.careRecords, val), { deep: true })
  watch(careRules, (val) => setStorageData(STORAGE_KEYS.careRules, val), { deep: true })
  watch(reminderTasks, (val) => setStorageData(STORAGE_KEYS.reminderTasks, val), { deep: true })
  watch(abnormalRecords, (val) => setStorageData(STORAGE_KEYS.abnormalRecords, val), { deep: true })
  watch(operationLogs, (val) => setStorageData(STORAGE_KEYS.operationLogs, val), { deep: true })

  return {
    landscapes,
    careRecords,
    careRules,
    reminderTasks,
    abnormalRecords,
    operationLogs
  }
}
