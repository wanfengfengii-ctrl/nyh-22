import { isDateValid, isHumidityValid, isSprayIntervalValid } from '@/shared/utils'
import type {
  MicroLandscape,
  CareRecord,
  CareRuleConfig,
  AbnormalRecord,
  BatchImportItem,
  LandscapeStatus
} from './types'
import type { ValidationResult } from '@/shared/utils/validation'

export function validateLandscapeCreate(data: Omit<MicroLandscape, 'id' | 'createdAt' | 'updatedAt'>, codeUniqueFn: (code: string, excludeId?: string) => boolean): ValidationResult {
  const errors: string[] = []

  if (!data.code.trim()) {
    errors.push('作品编号不能为空')
  } else if (!codeUniqueFn(data.code)) {
    errors.push('作品编号已存在，请使用其他编号')
  }

  if (!isDateValid(data.creationDate)) {
    errors.push('制作日期不能晚于当前日期')
  }

  if (!isHumidityValid(data.humidityMin) || !isHumidityValid(data.humidityMax)) {
    errors.push('湿度值必须在 0-100 之间')
  } else if (data.humidityMin > data.humidityMax) {
    errors.push('最小湿度不能大于最大湿度')
  }

  if ((data.status === 'yellowing' || data.status === 'mold') && !data.notes.trim()) {
    errors.push('出现黄化或霉斑时必须填写处理说明')
  }

  return { valid: errors.length === 0, errors }
}

export function validateLandscapeUpdate(id: string, data: Partial<MicroLandscape>, current: MicroLandscape, codeUniqueFn: (code: string, excludeId?: string) => boolean): ValidationResult {
  const errors: string[] = []

  if (data.code !== undefined && data.code !== current.code) {
    if (!codeUniqueFn(data.code, id)) {
      errors.push('作品编号已存在，请使用其他编号')
    }
  }

  if (data.creationDate !== undefined && !isDateValid(data.creationDate)) {
    errors.push('制作日期不能晚于当前日期')
  }

  const newHumidityMin = data.humidityMin ?? current.humidityMin
  const newHumidityMax = data.humidityMax ?? current.humidityMax
  if (!isHumidityValid(newHumidityMin) || !isHumidityValid(newHumidityMax)) {
    errors.push('湿度值必须在 0-100 之间')
  } else if (newHumidityMin > newHumidityMax) {
    errors.push('最小湿度不能大于最大湿度')
  }

  const newStatus = data.status ?? current.status
  const newNotes = data.notes ?? current.notes
  if ((newStatus === 'yellowing' || newStatus === 'mold') && !newNotes.trim()) {
    errors.push('出现黄化或霉斑时必须填写处理说明')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCareRecord(data: Omit<CareRecord, 'id' | 'landscapeId' | 'createdAt'>, landscapeSold: boolean): ValidationResult {
  const errors: string[] = []

  if (landscapeSold) {
    errors.push('已售出作品不能继续新增养护记录')
  }

  if (!isDateValid(data.careDate)) {
    errors.push('养护日期不能晚于当前日期')
  }

  if (!isHumidityValid(data.humidity)) {
    errors.push('湿度值必须在 0-100 之间')
  }

  if ((data.statusAfter === 'yellowing' || data.statusAfter === 'mold') && !data.notes.trim()) {
    errors.push('出现黄化或霉斑时必须填写处理说明')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCareRuleCreate(data: Omit<CareRuleConfig, 'id' | 'createdAt' | 'updatedAt'>): ValidationResult {
  const errors: string[] = []

  if (!data.name.trim()) {
    errors.push('规则名称不能为空')
  }

  if (!isSprayIntervalValid(data.sprayIntervalDays)) {
    errors.push('喷雾间隔必须在 1-30 天之间')
  }

  if (!isHumidityValid(data.humidityWarningMin) || !isHumidityValid(data.humidityWarningMax)) {
    errors.push('湿度阈值必须在 0-100 之间')
  } else if (data.humidityWarningMin >= data.humidityWarningMax) {
    errors.push('湿度预警下限必须小于上限')
  }

  return { valid: errors.length === 0, errors }
}

export function validateCareRuleUpdate(id: string, data: Partial<CareRuleConfig>, current: CareRuleConfig): ValidationResult {
  const errors: string[] = []

  if (data.name !== undefined && !data.name.trim()) {
    errors.push('规则名称不能为空')
  }

  if (data.sprayIntervalDays !== undefined && !isSprayIntervalValid(data.sprayIntervalDays)) {
    errors.push('喷雾间隔必须在 1-30 天之间')
  }

  const newHumidityMin = data.humidityWarningMin ?? current.humidityWarningMin
  const newHumidityMax = data.humidityWarningMax ?? current.humidityWarningMax
  if (data.humidityWarningMin !== undefined || data.humidityWarningMax !== undefined) {
    if (!isHumidityValid(newHumidityMin) || !isHumidityValid(newHumidityMax)) {
      errors.push('湿度阈值必须在 0-100 之间')
    } else if (newHumidityMin >= newHumidityMax) {
      errors.push('湿度预警下限必须小于上限')
    }
  }

  return { valid: errors.length === 0, errors }
}

export function validateAbnormalRecordClose(closingResult: string): ValidationResult {
  const errors: string[] = []

  if (!closingResult.trim()) {
    errors.push('关闭异常必须填写处理结果')
  }

  return { valid: errors.length === 0, errors }
}

export function validateBatchImportItem(item: BatchImportItem): ValidationResult {
  const errors: string[] = []

  if (!item.code?.trim()) {
    errors.push('作品编号不能为空')
  }
  if (!item.containerType?.trim()) {
    errors.push('容器类型不能为空')
  }
  if (!item.mossSpecies?.trim()) {
    errors.push('苔藓品种不能为空')
  }
  if (!item.creationDate) {
    errors.push('制作日期不能为空')
  } else if (!isDateValid(item.creationDate)) {
    errors.push('制作日期不能晚于当前日期')
  }
  if (!item.lightCondition?.trim()) {
    errors.push('光照条件不能为空')
  }
  if (!isHumidityValid(item.humidityMin)) {
    errors.push('最小湿度值必须在 0-100 之间')
  }
  if (!isHumidityValid(item.humidityMax)) {
    errors.push('最大湿度值必须在 0-100 之间')
  }
  if (isHumidityValid(item.humidityMin) && isHumidityValid(item.humidityMax) && item.humidityMin > item.humidityMax) {
    errors.push('最小湿度不能大于最大湿度')
  }
  if (!item.status) {
    errors.push('状态不能为空')
  }

  return { valid: errors.length === 0, errors }
}

export function validateBatchUpdateStatus(ids: string[], status: LandscapeStatus, getLandscapeById: (id: string) => MicroLandscape | undefined, notes?: string): ValidationResult & { validIds: string[] } {
  const errors: string[] = []
  const validIds = ids.filter(id => {
    const l = getLandscapeById(id)
    return l && !l.isSold && l.status !== 'sold'
  })

  if (validIds.length === 0) {
    errors.push('没有可操作的作品（已售出作品不能进行批量操作）')
  }

  if ((status === 'yellowing' || status === 'mold') && !notes?.trim()) {
    errors.push('设置异常状态时必须填写处理说明')
  }

  return { valid: errors.length === 0, errors, validIds }
}

export function validateBatchAddCareRecord(ids: string[], humidity: number, getLandscapeById: (id: string) => MicroLandscape | undefined): ValidationResult & { validIds: string[] } {
  const errors: string[] = []
  const validIds = ids.filter(id => {
    const l = getLandscapeById(id)
    return l && !l.isSold && l.status !== 'sold'
  })

  if (validIds.length === 0) {
    errors.push('没有可操作的作品（已售出作品不能进行批量养护）')
  }

  if (!isHumidityValid(humidity)) {
    errors.push('湿度值必须在 0-100 之间')
  }

  return { valid: errors.length === 0, errors, validIds }
}
