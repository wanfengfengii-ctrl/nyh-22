<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NForm, NFormItem, NDatePicker, NSelect, NInputNumber, NInput, NButton, NSpace } from 'naive-ui'
import { useLandscapeStore } from '@/stores/landscape'
import type { LandscapeStatus, CareType, MicroLandscape } from '@/types'
import { landscapeStatusOptions, careTypeOptions } from '@/types'
import { message } from '@/utils/discrete'

const props = defineProps<{
  visible: boolean
  landscapeId: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const store = useLandscapeStore()
const formRef = ref<any>(null)

const landscape = computed<MicroLandscape | undefined>(() =>
  store.getLandscapeById(props.landscapeId)
)

const formValue = ref({
  careDate: new Date().getTime() as number | null,
  careType: 'spray' as CareType,
  humidity: 70,
  statusBefore: 'healthy' as LandscapeStatus,
  statusAfter: 'healthy' as LandscapeStatus,
  notes: ''
})

function timestampToDateStr(timestamp: number | null): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(
  () => props.visible,
  (val) => {
    if (val && landscape.value) {
      formValue.value = {
        careDate: new Date().getTime(),
        careType: 'spray',
        humidity: Math.round((landscape.value.humidityMin + landscape.value.humidityMax) / 2),
        statusBefore: landscape.value.status,
        statusAfter: landscape.value.status,
        notes: ''
      }
    }
  }
)

function handleSubmit() {
  formRef.value?.validate((errors: any) => {
    if (errors) return

    const careDateStr = timestampToDateStr(formValue.value.careDate)
    const recordData = {
      ...formValue.value,
      careDate: careDateStr
    }

    const result = store.addCareRecord(props.landscapeId, recordData as any)
    if (result.success) {
      message.success('养护记录添加成功')
      emit('update:visible', false)
      emit('success')
    } else {
      message.error(result.message || '操作失败')
    }
  })
}

function validateCareDate(rule: any, value: number | null) {
  if (!value) {
    return new Error('请选择养护日期')
  }
  const date = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  if (date > today) {
    return new Error('养护日期不能晚于当前日期')
  }
  return true
}

function validateHumidity(rule: any, value: number) {
  if (value === null || value === undefined) {
    return new Error('请输入当前湿度')
  }
  if (value < 0 || value > 100) {
    return new Error('湿度值必须在 0-100 之间')
  }
  return true
}

function validateNotes(rule: any, value: string) {
  const status = formValue.value.statusAfter
  if ((status === 'yellowing' || status === 'mold') && !value?.trim()) {
    return new Error('出现黄化或霉斑时必须填写处理说明')
  }
  return true
}

const rules = {
  careDate: [{ required: true, validator: validateCareDate, trigger: 'change' }],
  careType: [{ required: true, message: '请选择养护类型', trigger: 'change' }],
  humidity: [{ required: true, validator: validateHumidity, trigger: 'input' }],
  statusBefore: [{ required: true, message: '请选择养护前状态', trigger: 'change' }],
  statusAfter: [{ required: true, message: '请选择养护后状态', trigger: 'change' }],
  notes: [{ validator: validateNotes, trigger: 'input' }]
}
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    title="新增养护记录"
    style="width: 520px"
    @update:show="(val: boolean) => emit('update:visible', val)"
  >
    <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="left" label-width="100px">
      <n-form-item label="养护日期" path="careDate">
        <n-date-picker v-model:value="formValue.careDate" type="date" style="width: 100%" />
      </n-form-item>

      <n-form-item label="养护类型" path="careType">
        <n-select v-model:value="formValue.careType" :options="careTypeOptions" placeholder="请选择养护类型" />
      </n-form-item>

      <n-form-item label="当前湿度" path="humidity">
        <div class="flex items-center gap-2">
          <n-input-number v-model:value="formValue.humidity" :min="0" :max="100" style="width: 200px" />
          <span class="text-gray-400">%</span>
        </div>
      </n-form-item>

      <n-form-item label="养护前状态" path="statusBefore">
        <n-select v-model:value="formValue.statusBefore" :options="landscapeStatusOptions" placeholder="请选择养护前状态" />
      </n-form-item>

      <n-form-item label="养护后状态" path="statusAfter">
        <n-select v-model:value="formValue.statusAfter" :options="landscapeStatusOptions" placeholder="请选择养护后状态" />
      </n-form-item>

      <n-form-item label="处理说明" path="notes">
        <n-input v-model:value="formValue.notes" type="textarea" :rows="3" placeholder="请输入处理说明或备注" />
      </n-form-item>
    </n-form>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:visible', false)">取消</n-button>
        <n-button type="primary" @click="handleSubmit">确定</n-button>
      </n-space>
    </template>
  </n-modal>
</template>
