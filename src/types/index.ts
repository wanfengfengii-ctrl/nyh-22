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

export const landscapeStatusOptions = [
  { label: '生长正常', value: 'healthy' },
  { label: '出现黄化', value: 'yellowing' },
  { label: '出现霉斑', value: 'mold' },
  { label: '已售出', value: 'sold' }
]

export const careTypeOptions = [
  { label: '喷雾', value: 'spray' },
  { label: '浇水', value: 'water' },
  { label: '清洁', value: 'clean' },
  { label: '修剪', value: 'prune' },
  { label: '其他', value: 'other' }
]

export const mossSpeciesOptions = [
  '大灰藓',
  '白发藓',
  '短绒藓',
  '大羽藓',
  '仙鹤藓',
  '葫芦藓',
  '泥炭藓',
  '珠藓'
]

export const containerTypeOptions = [
  '玻璃圆瓶',
  '玻璃方缸',
  '陶瓷盆',
  '木质花盆',
  '悬挂玻璃瓶',
  '生态瓶'
]

export const lightConditionOptions = [
  '明亮散射光',
  '半阴环境',
  '阴暗环境',
  '人工补光'
]

export const taskPriorityOptions = [
  { label: '高优先级', value: 'high', color: '#d03050' },
  { label: '中优先级', value: 'medium', color: '#f0a020' },
  { label: '低优先级', value: 'low', color: '#18a058' }
]

export const taskStatusOptions = [
  { label: '待处理', value: 'pending' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' }
]

export const reminderTypeOptions = [
  { label: '喷雾到期', value: 'spray_due' },
  { label: '湿度过低', value: 'humidity_low' },
  { label: '湿度过高', value: 'humidity_high' },
  { label: '光照风险', value: 'light_risk' },
  { label: '异常状态', value: 'abnormal' }
]

export const lightRiskLevelOptions = [
  { label: '低风险', value: 'low' },
  { label: '中风险', value: 'medium' },
  { label: '高风险', value: 'high' }
]

export const abnormalTypeOptions = [
  { label: '黄化', value: 'yellowing' },
  { label: '霉斑', value: 'mold' }
]

export const batchOperationTypeOptions = [
  { label: '更新状态', value: 'status_update' },
  { label: '批量养护', value: 'care_record' },
  { label: '标记售出', value: 'sold' },
  { label: '批量删除', value: 'delete' }
]

export const logActionTypeOptions: { label: string; value: LogActionType }[] = [
  { label: '创建作品', value: 'landscape_create' },
  { label: '更新作品', value: 'landscape_update' },
  { label: '删除作品', value: 'landscape_delete' },
  { label: '作品售出', value: 'landscape_sold' },
  { label: '新增养护记录', value: 'care_record_create' },
  { label: '删除养护记录', value: 'care_record_delete' },
  { label: '批量操作', value: 'batch_operation' },
  { label: '异常开启', value: 'abnormal_open' },
  { label: '异常关闭', value: 'abnormal_close' },
  { label: '规则更新', value: 'rule_update' },
  { label: '批量导入', value: 'batch_import' },
  { label: '批量导出', value: 'batch_export' }
]
