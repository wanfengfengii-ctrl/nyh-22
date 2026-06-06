import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { MicroLandscape, CareRecord, LandscapeStatus, CareType } from '@/types'
import {
  getLandscapes,
  saveLandscapes,
  getCareRecords,
  saveCareRecords,
  generateId,
  getToday,
  isDateValid,
  isHumidityValid
} from '@/utils/storage'

export const useLandscapeStore = defineStore('landscape', () => {
  const landscapes = ref<MicroLandscape[]>(getLandscapes())
  const careRecords = ref<CareRecord[]>(getCareRecords())

  const soldLandscapeIds = computed(() => {
    return landscapes.value
      .filter(l => l.isSold || l.status === 'sold')
      .map(l => l.id)
  })

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

    const now = new Date().toISOString()
    const landscape: MicroLandscape = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now
    }
    landscapes.value.push(landscape)
    saveLandscapes(landscapes.value)
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

    const updated: MicroLandscape = {
      ...current,
      ...data,
      updatedAt: new Date().toISOString()
    }
    landscapes.value[index] = updated
    saveLandscapes(landscapes.value)
    return { success: true }
  }

  function deleteLandscape(id: string): void {
    landscapes.value = landscapes.value.filter(l => l.id !== id)
    careRecords.value = careRecords.value.filter(r => r.landscapeId !== id)
    saveLandscapes(landscapes.value)
    saveCareRecords(careRecords.value)
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
    saveCareRecords(careRecords.value)

    updateLandscape(landscapeId, {
      status: data.statusAfter,
      lastCareDate: data.careDate
    })

    return { success: true, record }
  }

  function deleteCareRecord(id: string): void {
    careRecords.value = careRecords.value.filter(r => r.id !== id)
    saveCareRecords(careRecords.value)
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
    saveLandscapes([])
    saveCareRecords([])
  }

  return {
    landscapes,
    careRecords,
    soldLandscapeIds,
    isCodeUnique,
    getLandscapeById,
    getRecordsByLandscapeId,
    addLandscape,
    updateLandscape,
    deleteLandscape,
    addCareRecord,
    deleteCareRecord,
    getRecordsByDate,
    getMossSpeciesList,
    getStatusCount,
    getHumidityTrendData,
    resetAllData
  }
})
