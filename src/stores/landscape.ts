import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  MicroLandscape,
  CareRecord,
  LandscapeStatus,
  CareType,
  CareRuleConfig,
  ReminderTask,
  AbnormalRecord,
  OperationLog,
  BatchImportItem,
  CareTrendData,
  TaskPriority,
  TaskStatus,
  LogActionType
} from '@/types'
import {
  getLandscapes,
  saveLandscapes,
  getCareRecords,
  saveCareRecords,
  getCareRules,
  saveCareRules,
  getReminderTasks,
  saveReminderTasks,
  getAbnormalRecords,
  saveAbnormalRecords,
  getOperationLogs,
  saveOperationLogs,
  generateId,
  getToday,
  isDateValid,
  isHumidityValid,
  isSprayIntervalValid,
  addDays,
  diffDays,
  getDateRange,
  validateBatchImportItem,
  downloadJSON
} from '@/utils/storage'

export const useLandscapeStore = defineStore('landscape', () => {
  const landscapes = ref<MicroLandscape[]>(getLandscapes())
  const careRecords = ref<CareRecord[]>(getCareRecords())
  const careRules = ref<CareRuleConfig[]>(getCareRules())
  const reminderTasks = ref<ReminderTask[]>(getReminderTasks())
  const abnormalRecords = ref<AbnormalRecord[]>(getAbnormalRecords())
  const operationLogs = ref<OperationLog[]>(getOperationLogs())

  watch(landscapes, (val) => saveLandscapes(val), { deep: true })
  watch(careRecords, (val) => saveCareRecords(val), { deep: true })
  watch(careRules, (val) => saveCareRules(val), { deep: true })
  watch(reminderTasks, (val) => saveReminderTasks(val), { deep: true })
  watch(abnormalRecords, (val) => saveAbnormalRecords(val), { deep: true })
  watch(operationLogs, (val) => saveOperationLogs(val), { deep: true })

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

  function addLog(
    action: LogActionType,
    actionLabel: string,
    targetType: 'landscape' | 'care_record' | 'rule' | 'batch',
    targetId: string,
    targetName: string,
    detail: string
  ) {
    const log: OperationLog = {
      id: generateId(),
      action,
      actionLabel,
      targetType,
      targetId,
      targetName,
      operator: '系统管理员',
      detail,
      createdAt: new Date().toISOString()
    }
    operationLogs.value.unshift(log)
  }

  function isCodeUnique(code: string, excludeId?: string): boolean {
    return !landscapes.value.some(
      l => l.code === code && l.id !== excludeId
    )
  }

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

  function addLandscape(data: Omit<MicroLandscape, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; landscape?: MicroLandscape } {
    if (!data.code.trim()) {
      return { success: false, message: '作品编号不能为空' }
    }
    if (!isCodeUnique(data.code)) {
      return { success: false, message: '作品编号已存在，请使用其他编号' }
    }
    if (!isDateValid(data.creationDate)) {
      return { success: false, message: '制作日期不能晚于当前日期' }
    }
    if (!isHumidityValid(data.humidityMin) || !isHumidityValid(data.humidityMax)) {
      return { success: false, message: '湿度值必须在 0-100 之间' }
    }
    if (data.humidityMin > data.humidityMax) {
      return { success: false, message: '最小湿度不能大于最大湿度' }
    }
    if ((data.status === 'yellowing' || data.status === 'mold') && !data.notes.trim()) {
      return { success: false, message: '出现黄化或霉斑时必须填写处理说明' }
    }

    let finalStatus = data.status
    let finalIsSold = data.isSold

    if (data.status === 'sold') {
      finalIsSold = true
    }
    if (data.isSold) {
      finalStatus = 'sold'
    }

    const now = new Date().toISOString()
    const landscape: MicroLandscape = {
      ...data,
      status: finalStatus,
      isSold: finalIsSold,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    }
    landscapes.value.push(landscape)

    addLog('landscape_create', '创建作品', 'landscape', landscape.id, landscape.code, `创建作品 ${landscape.code}`)

    if (data.status === 'yellowing' || data.status === 'mold') {
      openAbnormalRecord(landscape.id, data.status as 'yellowing' | 'mold', data.notes)
    }

    return { success: true, landscape }
  }

  function updateLandscape(id: string, data: Partial<MicroLandscape>): { success: boolean; message?: string } {
    const index = landscapes.value.findIndex(l => l.id === id)
    if (index === -1) {
      return { success: false, message: '作品不存在' }
    }

    const current = landscapes.value[index]

    if (data.code !== undefined && data.code !== current.code) {
      if (!isCodeUnique(data.code, id)) {
        return { success: false, message: '作品编号已存在，请使用其他编号' }
      }
    }

    if (data.creationDate !== undefined && !isDateValid(data.creationDate)) {
      return { success: false, message: '制作日期不能晚于当前日期' }
    }

    const newHumidityMin = data.humidityMin ?? current.humidityMin
    const newHumidityMax = data.humidityMax ?? current.humidityMax
    if (!isHumidityValid(newHumidityMin) || !isHumidityValid(newHumidityMax)) {
      return { success: false, message: '湿度值必须在 0-100 之间' }
    }
    if (newHumidityMin > newHumidityMax) {
      return { success: false, message: '最小湿度不能大于最大湿度' }
    }

    const newStatus = data.status ?? current.status
    const newNotes = data.notes ?? current.notes
    if ((newStatus === 'yellowing' || newStatus === 'mold') && !newNotes.trim()) {
      return { success: false, message: '出现黄化或霉斑时必须填写处理说明' }
    }

    let finalStatus = newStatus
    let finalIsSold = data.isSold ?? current.isSold
    let finalStatusBeforeSold = current.statusBeforeSold

    const hasStatusChange = data.status !== undefined
    const hasIsSoldChange = data.isSold !== undefined

    if (hasStatusChange) {
      if (data.status === 'sold') {
        finalIsSold = true
      } else {
        finalIsSold = false
      }
    }

    if (hasIsSoldChange) {
      if (data.isSold === true) {
        finalStatusBeforeSold = current.status
        finalStatus = 'sold'
      } else if (finalStatus === 'sold') {
        finalStatus = current.statusBeforeSold || 'healthy'
      }
    }

    const oldStatus = current.status
    const updated: MicroLandscape = {
      ...current,
      ...data,
      status: finalStatus,
      isSold: finalIsSold,
      statusBeforeSold: finalStatusBeforeSold,
      updatedAt: new Date().toISOString()
    }
    landscapes.value[index] = updated

    const changes: string[] = []
    if (data.code !== undefined && data.code !== current.code) changes.push(`编号: ${current.code} → ${data.code}`)
    if (data.status !== undefined && data.status !== current.status) changes.push(`状态: ${current.status} → ${data.status}`)
    if (data.isSold !== undefined && data.isSold !== current.isSold) changes.push(`售出: ${current.isSold} → ${data.isSold}`)
    if (changes.length > 0) {
      addLog('landscape_update', '更新作品', 'landscape', id, updated.code, changes.join('; '))
    }

    if (finalIsSold && !current.isSold) {
      addLog('landscape_sold', '作品售出', 'landscape', id, updated.code, `作品 ${updated.code} 已售出`)
    }

    if ((finalStatus === 'yellowing' || finalStatus === 'mold') && 
        (oldStatus !== 'yellowing' && oldStatus !== 'mold')) {
      openAbnormalRecord(id, finalStatus as 'yellowing' | 'mold', newNotes)
    }

    if (finalStatus === 'healthy' && (oldStatus === 'yellowing' || oldStatus === 'mold')) {
      const openRecord = abnormalRecords.value.find(
        r => r.landscapeId === id && !r.isClosed && r.type === oldStatus
      )
      if (openRecord) {
        closeAbnormalRecord(openRecord.id, '状态恢复正常')
      }
    }

    return { success: true }
  }

  function deleteLandscape(id: string): void {
    const landscape = getLandscapeById(id)
    landscapes.value = landscapes.value.filter(l => l.id !== id)
    careRecords.value = careRecords.value.filter(r => r.landscapeId !== id)
    abnormalRecords.value = abnormalRecords.value.filter(r => r.landscapeId !== id)
    reminderTasks.value = reminderTasks.value.filter(t => t.landscapeId !== id)

    if (landscape) {
      addLog('landscape_delete', '删除作品', 'landscape', id, landscape.code, `删除作品 ${landscape.code}`)
    }
  }

  function addCareRecord(
    landscapeId: string,
    data: Omit<CareRecord, 'id' | 'landscapeId' | 'createdAt'>
  ): { success: boolean; message?: string; record?: CareRecord } {
    const landscape = getLandscapeById(landscapeId)
    if (!landscape) {
      return { success: false, message: '作品不存在' }
    }
    if (landscape.isSold || landscape.status === 'sold') {
      return { success: false, message: '已售出作品不能继续新增养护记录' }
    }
    if (!isDateValid(data.careDate)) {
      return { success: false, message: '养护日期不能晚于当前日期' }
    }
    if (!isHumidityValid(data.humidity)) {
      return { success: false, message: '湿度值必须在 0-100 之间' }
    }
    if ((data.statusAfter === 'yellowing' || data.statusAfter === 'mold') && !data.notes.trim()) {
      return { success: false, message: '出现黄化或霉斑时必须填写处理说明' }
    }

    const record: CareRecord = {
      ...data,
      id: generateId(),
      landscapeId,
      createdAt: new Date().toISOString()
    }
    careRecords.value.push(record)

    const newCareDate = new Date(data.careDate).getTime()
    const currentLastCareDate = landscape.lastCareDate
      ? new Date(landscape.lastCareDate).getTime()
      : 0

    if (newCareDate >= currentLastCareDate) {
      updateLandscape(landscapeId, {
        status: data.statusAfter,
        lastCareDate: data.careDate
      })
    }

    addLog('care_record_create', '新增养护记录', 'care_record', record.id, landscape.code, 
      `养护类型: ${data.careType}, 日期: ${data.careDate}`)

    completeTasksByType(landscapeId, 'spray_due')

    return { success: true, record }
  }

  function deleteCareRecord(id: string): void {
    const record = careRecords.value.find(r => r.id === id)
    careRecords.value = careRecords.value.filter(r => r.id !== id)
    if (record) {
      const landscape = getLandscapeById(record.landscapeId)
      addLog('care_record_delete', '删除养护记录', 'care_record', id, 
        landscape?.code || '未知', `删除养护记录`)
    }
  }

  function getRecordsByDate(dateStr: string): CareRecord[] {
    return careRecords.value.filter(r => r.careDate === dateStr)
  }

  function getMossSpeciesList(): string[] {
    const species = new Set(landscapes.value.map(l => l.mossSpecies))
    return Array.from(species).sort()
  }

  function getStatusCount(status: LandscapeStatus): number {
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

  function resetAllData(): void {
    landscapes.value = []
    careRecords.value = []
    careRules.value = []
    reminderTasks.value = []
    abnormalRecords.value = []
    operationLogs.value = []
  }

  function addCareRule(data: Omit<CareRuleConfig, 'id' | 'createdAt' | 'updatedAt'>): { success: boolean; message?: string; rule?: CareRuleConfig } {
    if (!data.name.trim()) {
      return { success: false, message: '规则名称不能为空' }
    }
    if (!isSprayIntervalValid(data.sprayIntervalDays)) {
      return { success: false, message: '喷雾间隔必须在 1-30 天之间' }
    }
    if (!isHumidityValid(data.humidityWarningMin) || !isHumidityValid(data.humidityWarningMax)) {
      return { success: false, message: '湿度阈值必须在 0-100 之间' }
    }
    if (data.humidityWarningMin >= data.humidityWarningMax) {
      return { success: false, message: '湿度预警下限必须小于上限' }
    }

    if (data.isDefault) {
      careRules.value.forEach(r => r.isDefault = false)
    }

    const now = new Date().toISOString()
    const rule: CareRuleConfig = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    }
    careRules.value.push(rule)

    addLog('rule_update', '新增养护规则', 'rule', rule.id, rule.name, `新增规则: ${rule.name}`)

    return { success: true, rule }
  }

  function updateCareRule(id: string, data: Partial<CareRuleConfig>): { success: boolean; message?: string } {
    const index = careRules.value.findIndex(r => r.id === id)
    if (index === -1) {
      return { success: false, message: '规则不存在' }
    }

    const current = careRules.value[index]
    const newSprayInterval = data.sprayIntervalDays ?? current.sprayIntervalDays
    const newHumidityMin = data.humidityWarningMin ?? current.humidityWarningMin
    const newHumidityMax = data.humidityWarningMax ?? current.humidityWarningMax

    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, message: '规则名称不能为空' }
    }
    if (data.sprayIntervalDays !== undefined && !isSprayIntervalValid(data.sprayIntervalDays)) {
      return { success: false, message: '喷雾间隔必须在 1-30 天之间' }
    }
    if (data.humidityWarningMin !== undefined && !isHumidityValid(data.humidityWarningMin)) {
      return { success: false, message: '湿度阈值必须在 0-100 之间' }
    }
    if (data.humidityWarningMax !== undefined && !isHumidityValid(data.humidityWarningMax)) {
      return { success: false, message: '湿度阈值必须在 0-100 之间' }
    }
    if (newHumidityMin >= newHumidityMax) {
      return { success: false, message: '湿度预警下限必须小于上限' }
    }

    if (data.isDefault) {
      careRules.value.forEach(r => r.isDefault = false)
    }

    const updated: CareRuleConfig = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    }
    careRules.value[index] = updated

    addLog('rule_update', '更新养护规则', 'rule', id, updated.name, `更新规则: ${updated.name}`)

    return { success: true }
  }

  function deleteCareRule(id: string): void {
    const rule = careRules.value.find(r => r.id === id)
    careRules.value = careRules.value.filter(r => r.id !== id)
    if (rule) {
      addLog('rule_update', '删除养护规则', 'rule', id, rule.name, `删除规则: ${rule.name}`)
    }
  }

  function getApplicableRule(landscape: MicroLandscape): CareRuleConfig | undefined {
    return careRules.value.find(r => 
      r.isDefault || r.applicableSpecies.includes(landscape.mossSpecies)
    ) || defaultCareRule.value
  }

  function generateReminderTasks(): void {
    const today = getToday()
    const existingLandscapeIds = new Set(
      reminderTasks.value
        .filter(t => t.status !== 'completed')
        .map(t => `${t.landscapeId}-${t.type}`)
    )

    activeLandscapes.value.forEach(landscape => {
      const rule = getApplicableRule(landscape)
      if (!rule) return

      const lastCareDate = landscape.lastCareDate || landscape.creationDate
      const daysSinceCare = diffDays(lastCareDate, today)

      if (daysSinceCare >= rule.sprayIntervalDays) {
        const taskKey = `${landscape.id}-spray_due`
        if (!existingLandscapeIds.has(taskKey)) {
          addReminderTask({
            landscapeId: landscape.id,
            landscapeCode: landscape.code,
            type: 'spray_due',
            priority: daysSinceCare >= rule.sprayIntervalDays + 2 ? 'high' : 'medium',
            title: `${landscape.code} 喷雾养护到期`,
            description: `已超过 ${daysSinceCare} 天未喷雾养护，建议立即进行喷雾养护`,
            dueDate: today,
            status: 'pending'
          })
        }
      }

      const latestRecord = getRecordsByLandscapeId(landscape.id)[0]
      if (latestRecord) {
        if (latestRecord.humidity < rule.humidityWarningMin) {
          const taskKey = `${landscape.id}-humidity_low`
          if (!existingLandscapeIds.has(taskKey)) {
            addReminderTask({
              landscapeId: landscape.id,
              landscapeCode: landscape.code,
              type: 'humidity_low',
              priority: latestRecord.humidity < rule.humidityWarningMin - 10 ? 'high' : 'medium',
              title: `${landscape.code} 湿度过低`,
              description: `当前湿度 ${latestRecord.humidity}%，低于预警下限 ${rule.humidityWarningMin}%`,
              dueDate: today,
              status: 'pending'
            })
          }
        }

        if (latestRecord.humidity > rule.humidityWarningMax) {
          const taskKey = `${landscape.id}-humidity_high`
          if (!existingLandscapeIds.has(taskKey)) {
            addReminderTask({
              landscapeId: landscape.id,
              landscapeCode: landscape.code,
              type: 'humidity_high',
              priority: latestRecord.humidity > rule.humidityWarningMax + 10 ? 'high' : 'medium',
              title: `${landscape.code} 湿度过高`,
              description: `当前湿度 ${latestRecord.humidity}%，高于预警上限 ${rule.humidityWarningMax}%`,
              dueDate: today,
              status: 'pending'
            })
          }
        }
      }

      if (rule.lightRiskLevel === 'high' && landscape.lightCondition === '明亮散射光') {
        const taskKey = `${landscape.id}-light_risk`
        if (!existingLandscapeIds.has(taskKey)) {
          addReminderTask({
            landscapeId: landscape.id,
            landscapeCode: landscape.code,
            type: 'light_risk',
            priority: 'medium',
            title: `${landscape.code} 光照风险提示`,
            description: `该品种对光照敏感，建议避免强光直射`,
            dueDate: today,
            status: 'pending'
          })
        }
      }

      if (landscape.status === 'yellowing' || landscape.status === 'mold') {
        const taskKey = `${landscape.id}-abnormal`
        if (!existingLandscapeIds.has(taskKey)) {
          addReminderTask({
            landscapeId: landscape.id,
            landscapeCode: landscape.code,
            type: 'abnormal',
            priority: 'high',
            title: `${landscape.code} 异常状态待处理`,
            description: `当前状态: ${landscape.status === 'yellowing' ? '黄化' : '霉斑'}，请及时处理`,
            dueDate: today,
            status: 'pending'
          })
        }
      }
    })
  }

  function addReminderTask(data: Omit<ReminderTask, 'id' | 'createdAt'>): void {
    const task: ReminderTask = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString()
    }
    reminderTasks.value.push(task)
  }

  function updateTaskStatus(taskId: string, status: TaskStatus): void {
    const task = reminderTasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
      if (status === 'completed') {
        task.completedAt = new Date().toISOString()
      }
    }
  }

  function completeTasksByType(landscapeId: string, type: string): void {
    reminderTasks.value
      .filter(t => t.landscapeId === landscapeId && t.type === type && t.status !== 'completed')
      .forEach(t => {
        t.status = 'completed'
        t.completedAt = new Date().toISOString()
      })
  }

  function deleteTask(taskId: string): void {
    reminderTasks.value = reminderTasks.value.filter(t => t.id !== taskId)
  }

  function openAbnormalRecord(
    landscapeId: string,
    type: 'yellowing' | 'mold',
    description: string
  ): AbnormalRecord {
    const record: AbnormalRecord = {
      id: generateId(),
      landscapeId,
      type,
      foundDate: getToday(),
      description,
      treatmentMethod: '',
      isClosed: false,
      closingResult: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    abnormalRecords.value.push(record)

    const landscape = getLandscapeById(landscapeId)
    addLog('abnormal_open', '异常开启', 'landscape', landscapeId, 
      landscape?.code || '未知', 
      `发现${type === 'yellowing' ? '黄化' : '霉斑'}异常: ${description}`)

    return record
  }

  function closeAbnormalRecord(recordId: string, closingResult: string): { success: boolean; message?: string } {
    if (!closingResult.trim()) {
      return { success: false, message: '关闭异常必须填写处理结果' }
    }

    const record = abnormalRecords.value.find(r => r.id === recordId)
    if (!record) {
      return { success: false, message: '异常记录不存在' }
    }

    record.isClosed = true
    record.closedDate = getToday()
    record.closingResult = closingResult
    record.updatedAt = new Date().toISOString()

    const landscape = getLandscapeById(record.landscapeId)
    addLog('abnormal_close', '异常关闭', 'landscape', record.landscapeId,
      landscape?.code || '未知',
      `处理结果: ${closingResult}`)

    completeTasksByType(record.landscapeId, 'abnormal')

    if (landscape && !landscape.isSold) {
      const hasOpenAbnormal = abnormalRecords.value.some(
        r => r.landscapeId === record.landscapeId && !r.isClosed
      )
      if (!hasOpenAbnormal && (landscape.status === 'yellowing' || landscape.status === 'mold')) {
        const index = landscapes.value.findIndex(l => l.id === record.landscapeId)
        if (index !== -1) {
          landscapes.value[index] = {
            ...landscapes.value[index],
            status: 'healthy',
            updatedAt: new Date().toISOString()
          }
        }
      }
    }

    return { success: true }
  }

  function updateAbnormalRecord(id: string, data: Partial<AbnormalRecord>): { success: boolean; message?: string } {
    const record = abnormalRecords.value.find(r => r.id === id)
    if (!record) {
      return { success: false, message: '异常记录不存在' }
    }
    Object.assign(record, data, { updatedAt: new Date().toISOString() })
    return { success: true }
  }

  function batchUpdateStatus(ids: string[], status: LandscapeStatus, notes?: string): { success: boolean; message?: string; count: number } {
    const validIds = ids.filter(id => {
      const l = getLandscapeById(id)
      return l && !l.isSold && l.status !== 'sold'
    })

    if (validIds.length === 0) {
      return { success: false, message: '没有可操作的作品（已售出作品不能进行批量操作）', count: 0 }
    }

    if ((status === 'yellowing' || status === 'mold') && !notes?.trim()) {
      return { success: false, message: '设置异常状态时必须填写处理说明', count: 0 }
    }

    validIds.forEach(id => {
      updateLandscape(id, { status, notes })
    })

    addLog('batch_operation', '批量更新状态', 'batch', 'batch-status', 
      `共${validIds.length}个作品`, 
      `批量更新 ${validIds.length} 个作品状态为 ${status}`)

    return { success: true, count: validIds.length }
  }

  function batchMarkSold(ids: string[]): { success: boolean; message?: string; count: number } {
    const validIds = ids.filter(id => {
      const l = getLandscapeById(id)
      return l && !l.isSold && l.status !== 'sold'
    })

    if (validIds.length === 0) {
      return { success: false, message: '没有可操作的作品', count: 0 }
    }

    validIds.forEach(id => {
      updateLandscape(id, { isSold: true })
    })

    addLog('batch_operation', '批量售出', 'batch', 'batch-sold',
      `共${validIds.length}个作品`,
      `批量标记 ${validIds.length} 个作品为已售出`)

    return { success: true, count: validIds.length }
  }

  function batchAddCareRecord(
    ids: string[],
    data: { careType: CareType; humidity: number; notes: string }
  ): { success: boolean; message?: string; count: number } {
    const validIds = ids.filter(id => {
      const l = getLandscapeById(id)
      return l && !l.isSold && l.status !== 'sold'
    })

    if (validIds.length === 0) {
      return { success: false, message: '没有可操作的作品（已售出作品不能进行批量养护）', count: 0 }
    }

    if (!isHumidityValid(data.humidity)) {
      return { success: false, message: '湿度值必须在 0-100 之间', count: 0 }
    }

    const today = getToday()
    validIds.forEach(id => {
      const landscape = getLandscapeById(id)
      if (landscape) {
        addCareRecord(id, {
          careDate: today,
          careType: data.careType,
          humidity: data.humidity,
          statusBefore: landscape.status,
          statusAfter: landscape.status,
          notes: data.notes
        })
      }
    })

    addLog('batch_operation', '批量养护', 'batch', 'batch-care',
      `共${validIds.length}个作品`,
      `批量养护 ${validIds.length} 个作品，类型: ${data.careType}`)

    return { success: true, count: validIds.length }
  }

  function batchDelete(ids: string[]): { success: boolean; message?: string; count: number } {
    const validIds = ids.filter(id => {
      const l = getLandscapeById(id)
      return l && !l.isSold && l.status !== 'sold'
    })

    if (validIds.length === 0) {
      return { success: false, message: '没有可操作的作品（已售出作品不能删除）', count: 0 }
    }

    validIds.forEach(id => deleteLandscape(id))

    addLog('batch_operation', '批量删除', 'batch', 'batch-delete',
      `共${validIds.length}个作品`,
      `批量删除 ${validIds.length} 个作品`)

    return { success: true, count: validIds.length }
  }

  function batchImport(items: BatchImportItem[]): { success: boolean; message?: string; count: number; errors: string[] } {
    const allErrors: string[] = []
    let successCount = 0

    items.forEach((item, index) => {
      const validation = validateBatchImportItem(item)
      if (!validation.valid) {
        allErrors.push(`第${index + 1}行: ${validation.errors.join('; ')}`)
        return
      }

      if (!isCodeUnique(item.code)) {
        allErrors.push(`第${index + 1}行: 作品编号 ${item.code} 已存在`)
        return
      }

      const result = addLandscape({
        code: item.code,
        containerType: item.containerType,
        mossSpecies: item.mossSpecies,
        creationDate: item.creationDate,
        lightCondition: item.lightCondition,
        humidityMin: item.humidityMin,
        humidityMax: item.humidityMax,
        status: item.status,
        isSold: item.status === 'sold',
        notes: item.notes || '',
        lastCareDate: item.lastCareDate || item.creationDate
      })

      if (result.success) {
        successCount++
      } else {
        allErrors.push(`第${index + 1}行: ${result.message}`)
      }
    })

    addLog('batch_import', '批量导入', 'batch', 'batch-import',
      `成功${successCount}个`,
      `批量导入作品，成功 ${successCount} 个，失败 ${allErrors.length} 个`)

    return {
      success: successCount > 0,
      count: successCount,
      errors: allErrors,
      message: allErrors.length > 0 ? `部分导入失败` : undefined
    }
  }

  function batchExport(ids?: string[]): void {
    const data = ids && ids.length > 0
      ? landscapes.value.filter(l => ids.includes(l.id))
      : landscapes.value

    const exportData = data.map(l => ({
      code: l.code,
      containerType: l.containerType,
      mossSpecies: l.mossSpecies,
      creationDate: l.creationDate,
      lightCondition: l.lightCondition,
      humidityMin: l.humidityMin,
      humidityMax: l.humidityMax,
      status: l.status,
      isSold: l.isSold,
      lastCareDate: l.lastCareDate,
      notes: l.notes,
      careRecords: getRecordsByLandscapeId(l.id)
    }))

    const filename = `微景观数据_${getToday()}.json`
    downloadJSON(exportData, filename)

    addLog('batch_export', '批量导出', 'batch', 'batch-export',
      `共${exportData.length}个`,
      `导出 ${exportData.length} 个作品数据`)
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

  function initDefaultCareRules() {
    if (careRules.value.length === 0) {
      const defaultRules: Omit<CareRuleConfig, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: '通用养护规则',
          sprayIntervalDays: 3,
          humidityWarningMin: 50,
          humidityWarningMax: 90,
          lightRiskLevel: 'medium',
          isDefault: true,
          applicableSpecies: []
        },
        {
          name: '白发藓专用',
          sprayIntervalDays: 5,
          humidityWarningMin: 40,
          humidityWarningMax: 80,
          lightRiskLevel: 'high',
          isDefault: false,
          applicableSpecies: ['白发藓']
        },
        {
          name: '大灰藓专用',
          sprayIntervalDays: 2,
          humidityWarningMin: 60,
          humidityWarningMax: 95,
          lightRiskLevel: 'low',
          isDefault: false,
          applicableSpecies: ['大灰藓']
        }
      ]

      defaultRules.forEach(rule => addCareRule(rule))
    }
  }

  return {
    landscapes,
    careRecords,
    careRules,
    reminderTasks,
    abnormalRecords,
    operationLogs,
    soldLandscapeIds,
    activeLandscapes,
    soldLandscapes,
    openAbnormalRecords,
    pendingTasks,
    defaultCareRule,
    isCodeUnique,
    getLandscapeById,
    getRecordsByLandscapeId,
    getAbnormalRecordsByLandscapeId,
    addLandscape,
    updateLandscape,
    deleteLandscape,
    addCareRecord,
    deleteCareRecord,
    getRecordsByDate,
    getMossSpeciesList,
    getStatusCount,
    getHumidityTrendData,
    resetAllData,
    addCareRule,
    updateCareRule,
    deleteCareRule,
    getApplicableRule,
    generateReminderTasks,
    addReminderTask,
    updateTaskStatus,
    completeTasksByType,
    deleteTask,
    openAbnormalRecord,
    closeAbnormalRecord,
    updateAbnormalRecord,
    batchUpdateStatus,
    batchMarkSold,
    batchAddCareRecord,
    batchDelete,
    batchImport,
    batchExport,
    getCareTrendData,
    getTaskStats,
    getAbnormalStats,
    initDefaultCareRules,
    addLog
  }
})
