<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { NModal, NCard, NForm, NFormItem, NInput, NSelect, NDatePicker, NInputNumber, NSwitch, NButton, NSpace } from 'naive-ui'
import { useLandscapeStore } from '@/stores/landscape'
import type { MicroLandscape, LandscapeStatus } from '@/types'
import {
  mossSpeciesOptions,
  containerTypeOptions,
  lightConditionOptions,
  landscapeStatusOptions
} from '@/types'
import { message } from '@/utils/discrete'

const props = defineProps<{
  visible: boolean
  landscape?: MicroLandscape | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}>()

const store = useLandscapeStore()

const isEdit = computed(() => !!props.landscape)
const formRef = ref<any>(null)

const formValue = ref<{
  code: string
  containerType: string
  mossSpecies: string
  creationDate: number | null
  lightCondition: string
  humidityMin: number
  humidityMax: number
  status: LandscapeStatus
  isSold: boolean
  notes: string
  lastCareDate: string
}>({
  code: '',
  containerType: '',
  mossSpecies: '',
  creationDate: new Date().getTime(),
  lightCondition: '',
  humidityMin: 60,
  humidityMax: 80,
  status: 'healthy',
  isSold: false,
  notes: '',
  lastCareDate: ''
})

function dateStrToTimestamp(dateStr: string): number {
  return new Date(dateStr).getTime()
}

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
    if (val) {
      if (props.landscape) {
        formValue.value = {
          ...props.landscape,
          creationDate: dateStrToTimestamp(props.landscape.creationDate)
        }
      } else {
        formValue.value = {
          code: '',
          containerType: '',
          mossSpecies: '',
          creationDate: new Date().getTime(),
          lightCondition: '',
          humidityMin: 60,
          humidityMax: 80,
          status: 'healthy',
          isSold: false,
          notes: '',
          lastCareDate: ''
        }
      }
    }
  }
)

function handleSubmit() {
  formRef.value?.validate((errors: any) => {
    if (errors) return

    const creationDateStr = timestampToDateStr(formValue.value.creationDate)
    const data = {
      ...formValue.value,
      creationDate: creationDateStr,
      lastCareDate: formValue.value.lastCareDate || creationDateStr
    }

    let result
    if (isEdit.value && props.landscape) {
      result = store.updateLandscape(props.landscape.id, data as any)
    } else {
      result = store.addLandscape(data as any)
    }

    if (result.success) {
      message.success(isEdit.value ? '修改成功' : '添加成功')
      emit('update:visible', false)
      emit('success')
    } else {
      message.error(result.message || '操作失败')
    }
  })
}

function validateCode(rule: any, value: string) {
  if (!value?.trim()) {
    return new Error('请输入作品编号')
  }
  if (!store.isCodeUnique(value, props.landscape?.id)) {
    return new Error('作品编号已存在')
  }
  return true
}

function validateCreationDate(rule: any, value: number | null) {
  if (!value) {
    return new Error('请选择制作日期')
  }
  const date = new Date(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  date.setHours(0, 0, 0, 0)
  if (date > today) {
    return new Error('制作日期不能晚于当前日期')
  }
  return true
}

function validateHumidityMin(rule: any, value: number) {
  if (value === null || value === undefined) {
    return new Error('请输入最小湿度')
  }
  if (value < 0 || value > 100) {
    return new Error('湿度值必须在 0-100 之间')
  }
  if (value > formValue.value.humidityMax) {
    return new Error('最小湿度不能大于最大湿度')
  }
  return true
}

function validateHumidityMax(rule: any, value: number) {
  if (value === null || value === undefined) {
    return new Error('请输入最大湿度')
  }
  if (value < 0 || value > 100) {
    return new Error('湿度值必须在 0-100 之间')
  }
  if (value < formValue.value.humidityMin) {
    return new Error('最大湿度不能小于最小湿度')
  }
  return true
}

function validateNotes(rule: any, value: string) {
  const status = formValue.value.status
  if ((status === 'yellowing' || status === 'mold') && !value?.trim()) {
    return new Error('出现黄化或霉斑时必须填写处理说明')
  }
  return true
}

const rules = {
  code: [{ required: true, validator: validateCode, trigger: ['input', 'blur'] }],
  containerType: [{ required: true, message: '请选择容器类型', trigger: 'change' }],
  mossSpecies: [{ required: true, message: '请选择苔藓品种', trigger: 'change' }],
  creationDate: [{ required: true, validator: validateCreationDate, trigger: 'change' }],
  lightCondition: [{ required: true, message: '请选择光照条件', trigger: 'change' }],
  humidityMin: [{ required: true, validator: validateHumidityMin, trigger: 'input' }],
  humidityMax: [{ required: true, validator: validateHumidityMax, trigger: 'input' }],
  notes: [{ validator: validateNotes, trigger: 'input' }]
}
</script>

<template>
  <n-modal
    :show="visible"
    :mask-closable="false"
    preset="card"
    :title="isEdit ? '编辑微景观' : '新增微景观'"
    style="width: 560px"
    @update:show="(val: boolean) => emit('update:visible', val)"
  >
    <n-form ref="formRef" :model="formValue" :rules="rules" label-placement="left" label-width="100px">
      <n-form-item label="作品编号" path="code">
        <n-input v-model:value="formValue.code" placeholder="请输入作品编号" />
      </n-form-item>

      <n-form-item label="容器类型" path="containerType">
        <n-select v-model:value="formValue.containerType" :options="containerTypeOptions.map(o => ({ label: o, value: o }))" placeholder="请选择容器类型" />
      </n-form-item>

      <n-form-item label="苔藓品种" path="mossSpecies">
        <n-select v-model:value="formValue.mossSpecies" :options="mossSpeciesOptions.map(o => ({ label: o, value: o }))" placeholder="请选择苔藓品种" />
      </n-form-item>

      <n-form-item label="制作日期" path="creationDate">
        <n-date-picker v-model:value="formValue.creationDate" type="date" style="width: 100%" />
      </n-form-item>

      <n-form-item label="光照条件" path="lightCondition">
        <n-select v-model:value="formValue.lightCondition" :options="lightConditionOptions.map(o => ({ label: o, value: o }))" placeholder="请选择光照条件" />
      </n-form-item>

      <n-form-item label="湿度区间" path="humidityMin">
        <div class="flex items-center gap-2">
          <n-input-number v-model:value="formValue.humidityMin" :min="0" :max="100" style="width: 100%" />
          <span class="text-gray-400">~</span>
          <n-input-number v-model:value="formValue.humidityMax" :min="0" :max="100" style="width: 100%" />
          <span class="text-gray-400">%</span>
        </div>
      </n-form-item>

      <n-form-item label="当前状态" path="status">
        <n-select v-model:value="formValue.status" :options="landscapeStatusOptions" placeholder="请选择状态" />
      </n-form-item>

      <n-form-item label="是否售出" path="isSold">
        <n-switch v-model:value="formValue.isSold" />
      </n-form-item>

      <n-form-item label="备注说明" path="notes">
        <n-input v-model:value="formValue.notes" type="textarea" :rows="3" placeholder="请输入备注或处理说明" />
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
