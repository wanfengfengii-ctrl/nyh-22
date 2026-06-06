<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NSelect,
  NInput,
  NInputNumber,
  NButton,
  NSpace,
  NTag,
  NRadioGroup,
  NRadio
} from 'naive-ui'
import { useLandscapeStore } from '@/stores/landscape'
import { landscapeStatusOptions, careTypeOptions } from '@/types'
import type { LandscapeStatus, CareType } from '@/types'
import { message as discreteMessage } from '@/utils/discrete'

const props = defineProps<{
  visible: boolean
  selectedIds: string[]
  operationType: 'status_update' | 'care_record' | 'sold' | 'delete'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const store = useLandscapeStore()

const statusValue = ref<LandscapeStatus | null>(null)
const statusNotes = ref('')
const careType = ref<CareType>('spray')
const careHumidity = ref(70)
const careNotes = ref('')

const validCount = computed(() => {
  return props.selectedIds.filter(id => {
    const l = store.getLandscapeById(id)
    return l && !l.isSold && l.status !== 'sold'
  }).length
})

const soldCount = computed(() => {
  return props.selectedIds.length - validCount.value
})

function handleConfirm() {
  let result
  switch (props.operationType) {
    case 'status_update':
      if (statusValue.value) {
        result = store.batchUpdateStatus(props.selectedIds, statusValue.value, statusNotes.value)
      } else {
        discreteMessage.warning('请选择状态')
        return
      }
      break
    case 'care_record':
      result = store.batchAddCareRecord(props.selectedIds, {
        careType: careType.value,
        humidity: careHumidity.value,
        notes: careNotes.value
      })
      break
    case 'sold':
      result = store.batchMarkSold(props.selectedIds)
      break
    case 'delete':
        if (confirm(`确定要删除选中的 ${validCount.value} 个作品吗？`)) {
          result = store.batchDelete(props.selectedIds)
        } else {
          return
        }
      break
  }

  if (result?.success) {
    discreteMessage.success(`操作成功，共处理 ${result.count} 个作品`)
    emit('success')
    emit('update:visible', false)
  } else if (result?.message) {
    discreteMessage.error(result.message)
  }
}

function resetForm() {
  statusValue.value = null
  statusNotes.value = ''
  careType.value = 'spray'
  careHumidity.value = 70
  careNotes.value = ''
}

watch(() => props.visible, (val) => {
  if (val) {
    resetForm()
  }
})

const titles: Record<string, string> = {
  status_update: '批量更新状态',
  care_record: '批量养护',
  sold: '批量标记售出',
  delete: '批量删除'
}
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    :title="titles[operationType]"
    :mask-closable="false"
    style="width: 480px"
    @update:show="emit('update:visible', $event)"
  >
    <div class="space-y-4">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span>已选择 {{ selectedIds.length }} 个作品</span>
        <n-tag v-if="soldCount > 0" type="warning">
          其中 {{ soldCount }} 个已售出作品将被跳过
        </n-tag>
      </div>

      <div v-if="operationType === 'status_update'" class="space-y-4">
        <n-form label-placement="left" label-width="100px">
          <n-form-item label="目标状态" required>
            <n-select
              v-model:value="statusValue"
              :options="landscapeStatusOptions.filter(o => o.value !== 'sold')"
              placeholder="请选择状态"
            />
          </n-form-item>
          <n-form-item v-if="statusValue === 'yellowing' || statusValue === 'mold'" label="处理说明" required>
            <n-input
              v-model:value="statusNotes"
              type="textarea"
              :rows="3"
              placeholder="异常状态必须填写处理说明"
            />
          </n-form-item>
        </n-form>
      </div>

      <div v-if="operationType === 'care_record'" class="space-y-4">
        <n-form label-placement="left" label-width="100px">
          <n-form-item label="养护类型" required>
            <n-select
              v-model:value="careType"
              :options="careTypeOptions"
            />
          </n-form-item>
          <n-form-item label="湿度(%)" required>
            <n-input-number
              v-model:value="careHumidity"
              :min="0"
              :max="100"
              style="width: 100%"
            />
          </n-form-item>
          <n-form-item label="备注">
            <n-input
              v-model:value="careNotes"
              type="textarea"
              :rows="2"
              placeholder="养护备注信息"
            />
          </n-form-item>
        </n-form>
      </div>

      <div v-if="operationType === 'sold'" class="text-gray-600 text-sm">
        将选中的 {{ validCount }} 个未售出作品标记为已售出状态。
      </div>

      <div v-if="operationType === 'delete'" class="text-red-500 text-sm">
        此操作将删除选中的 {{ validCount }} 个作品及其所有养护记录，且不可恢复。
      </div>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:visible', false)">取消</n-button>
        <n-button type="primary" @click="handleConfirm">
          {{ operationType === 'delete' ? '确认删除' : '确认操作' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
