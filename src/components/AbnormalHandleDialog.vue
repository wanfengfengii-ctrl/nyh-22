<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NButton,
  NSpace,
  NTag
} from 'naive-ui'
import { useLandscapeStore } from '@/stores/landscape'
import type { AbnormalRecord } from '@/types'
import { message as discreteMessage } from '@/utils/discrete'

const props = defineProps<{
  visible: boolean
  abnormalRecord: AbnormalRecord | null
  mode: 'view' | 'close' | 'edit'
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const store = useLandscapeStore()

const closingResult = ref('')
const description = ref('')
const treatmentMethod = ref('')

const landscape = computed(() => {
  if (!props.abnormalRecord) return null
  return store.getLandscapeById(props.abnormalRecord.landscapeId)
})

watch(() => props.visible, (val) => {
  if (val && props.abnormalRecord) {
    closingResult.value = props.abnormalRecord.closingResult || ''
    description.value = props.abnormalRecord.description || ''
    treatmentMethod.value = props.abnormalRecord.treatmentMethod || ''
  }
})

function handleClose() {
  if (!closingResult.value.trim()) {
    discreteMessage.error('关闭异常必须填写处理结果')
    return
  }
  if (!props.abnormalRecord) return

  const result = store.closeAbnormalRecord(props.abnormalRecord.id, closingResult.value)
  if (result.success) {
    discreteMessage.success('异常已关闭')
    emit('success')
    emit('update:visible', false)
  } else {
    discreteMessage.error(result.message || '操作失败')
  }
}

function handleUpdate() {
  if (!props.abnormalRecord) return
  const result = store.updateAbnormalRecord(props.abnormalRecord.id, {
    description: description.value,
    treatmentMethod: treatmentMethod.value
  })
  if (result.success) {
    discreteMessage.success('更新成功')
    emit('success')
    emit('update:visible', false)
  } else {
    discreteMessage.error(result.message || '更新失败')
  }
}

const typeLabels: Record<string, string> = {
  yellowing: '黄化',
  mold: '霉斑'
}

const typeColors: Record<string, string> = {
  yellowing: '#f0a020',
  mold: '#d03050'
}
</script>

<template>
  <n-modal
    :show="visible"
    preset="card"
    :title="mode === 'view' ? '异常详情' : mode === 'close' ? '关闭异常' : '编辑异常记录'"
    :mask-closable="false"
    style="width: 520px"
    @update:show="emit('update:visible', $event)"
  >
    <div v-if="abnormalRecord" class="space-y-4">
      <div class="flex items-center gap-4 text-sm">
        <div>
          <span class="text-gray-500">作品编号：</span>
          <span class="font-medium">{{ landscape?.code || '-' }}</span>
        </div>
        <div>
          <span class="text-gray-500">异常类型：</span>
          <n-tag :type="abnormalRecord.type === 'yellowing' ? 'warning' : 'error'" size="small">
            {{ typeLabels[abnormalRecord.type] }}
          </n-tag>
        </div>
      </div>

      <div class="flex items-center gap-4 text-sm">
        <div>
          <span class="text-gray-500">发现日期：</span>
          <span>{{ abnormalRecord.foundDate }}</span>
        </div>
        <div>
          <span class="text-gray-500">状态：</span>
          <n-tag :type="abnormalRecord.isClosed ? 'success' : 'warning'" size="small">
            {{ abnormalRecord.isClosed ? '已关闭' : '处理中' }}
          </n-tag>
        </div>
        <div v-if="abnormalRecord.closedDate">
          <span class="text-gray-500">关闭日期：</span>
          <span>{{ abnormalRecord.closedDate }}</span>
        </div>
      </div>

      <n-form label-placement="left" label-width="100px">
        <n-form-item v-if="mode !== 'view'" label="异常描述">
          <n-input
            v-model:value="description"
            type="textarea"
            :rows="2"
            placeholder="描述异常情况"
          />
        </n-form-item>
        <div v-else class="text-sm">
          <span class="text-gray-500">异常描述：</span>
          <p class="mt-1 text-gray-700">{{ abnormalRecord.description || '无' }}</p>
        </div>

        <n-form-item v-if="mode === 'edit'" label="处理方法">
          <n-input
            v-model:value="treatmentMethod"
            type="textarea"
            :rows="2"
            placeholder="当前处理方法"
          />
        </n-form-item>
        <div v-else-if="abnormalRecord.treatmentMethod" class="text-sm">
          <span class="text-gray-500">处理方法：</span>
          <p class="mt-1 text-gray-700">{{ abnormalRecord.treatmentMethod }}</p>
        </div>

        <n-form-item v-if="mode === 'close'" label="处理结果" required>
          <n-input
            v-model:value="closingResult"
            type="textarea"
            :rows="3"
            placeholder="请填写最终处理结果，关闭异常必填"
          />
        </n-form-item>
        <div v-else-if="abnormalRecord.isClosed" class="text-sm">
          <span class="text-gray-500">处理结果：</span>
          <p class="mt-1 text-gray-700">{{ abnormalRecord.closingResult || '无' }}</p>
        </div>
      </n-form>
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="emit('update:visible', false)">
          {{ mode === 'view' ? '关闭' : '取消' }}
        </n-button>
        <n-button v-if="mode === 'close'" type="primary" @click="handleClose">
          确认关闭
        </n-button>
        <n-button v-else-if="mode === 'edit'" type="primary" @click="handleUpdate">
          保存修改
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>
