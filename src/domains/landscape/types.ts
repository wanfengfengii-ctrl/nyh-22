export type LandscapeStatus = 'healthy' | 'yellowing' | 'mold' | 'sold'

export type CareType = 'spray' | 'water' | 'clean' | 'prune' | 'other'

export type AbnormalStatus = 'yellowing' | 'mold'

export type TaskPriority = 'high' | 'medium' | 'low'

export type TaskStatus = 'pending' | 'in_progress' | 'completed'

export type BatchOperationType = 'status_update' | 'care_record' | 'sold' | 'delete'

export type LogActionType =
  | 'landscape_create'
  | 'landscape_update'
  | 'landscape_delete'
  | 'landscape_sold'
  | 'care_record_create'
  | 'care_record_delete'
  | 'batch_operation'
  | 'abnormal_open'
  | 'abnormal_close'
  | 'rule_update'
  | 'batch_import'
  | 'batch_export'

export interface MicroLandscape {
  id: string
  code: string
  containerType: string
  mossSpecies: string
  creationDate: string
  lightCondition: string
  humidityMin: number
  humidityMax: number
  status: LandscapeStatus
  lastCareDate: string
  isSold: boolean
  statusBeforeSold?: LandscapeStatus
  notes: string
  createdAt: string
  updatedAt: string
  abnormalRecords?: AbnormalRecord[]
}

export interface CareRecord {
  id: string
  landscapeId: string
  careDate: string
  careType: CareType
  humidity: number
  statusBefore: LandscapeStatus
  statusAfter: LandscapeStatus
  notes: string
  createdAt: string
}

export interface CareRuleConfig {
  id: string
  name: string
  sprayIntervalDays: number
  humidityWarningMin: number
  humidityWarningMax: number
  lightRiskLevel: 'low' | 'medium' | 'high'
  isDefault: boolean
  applicableSpecies: string[]
  createdAt: string
  updatedAt: string
}

export interface ReminderTask {
  id: string
  landscapeId: string
  landscapeCode: string
  type: 'spray_due' | 'humidity_low' | 'humidity_high' | 'light_risk' | 'abnormal'
  priority: TaskPriority
  title: string
  description: string
  dueDate: string
  status: TaskStatus
  createdAt: string
  completedAt?: string
}

export interface AbnormalRecord {
  id: string
  landscapeId: string
  type: AbnormalStatus
  foundDate: string
  description: string
  treatmentMethod: string
  closedDate?: string
  closingResult: string
  isClosed: boolean
  createdAt: string
  updatedAt: string
}

export interface BatchImportItem {
  code: string
  containerType: string
  mossSpecies: string
  creationDate: string
  lightCondition: string
  humidityMin: number
  humidityMax: number
  status: LandscapeStatus
  notes?: string
  lastCareDate?: string
}

export interface OperationLog {
  id: string
  action: LogActionType
  actionLabel: string
  targetType: 'landscape' | 'care_record' | 'rule' | 'batch'
  targetId: string
  targetName: string
  operator: string
  detail: string
  createdAt: string
}

export interface CareTrendData {
  date: string
  careCount: number
  abnormalCount: number
  abnormalRate: number
}

export interface LandscapeState {
  landscapes: MicroLandscape[]
  careRecords: CareRecord[]
  careRules: CareRuleConfig[]
  reminderTasks: ReminderTask[]
  abnormalRecords: AbnormalRecord[]
  operationLogs: OperationLog[]
}
