import type { LogActionType } from './types'

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
