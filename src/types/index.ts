export type LandscapeStatus = 'healthy' | 'yellowing' | 'mold' | 'sold'

export type CareType = 'spray' | 'water' | 'clean' | 'prune' | 'other'

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
  notes: string
  createdAt: string
  updatedAt: string
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
