<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NDataTable,
  NInput,
  NSelect,
  NCard,
  NIcon,
  NTag,
  NSpace,
  NEmpty,
  NButton
} from 'naive-ui'
import { Search, Clock, FileText } from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import { logActionTypeOptions } from '@/types'
import type { OperationLog } from '@/types'

const store = useLandscapeStore()

const searchKeyword = ref('')
const filterAction = ref<string | null>(null)
const filterTargetType = ref<string | null>(null)

const filteredLogs = computed(() => {
  let result = store.operationLogs

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      l =>
        l.targetName.toLowerCase().includes(keyword) ||
        l.detail.toLowerCase().includes(keyword) ||
        l.actionLabel.toLowerCase().includes(keyword)
    )
  }

  if (filterAction.value) {
    result = result.filter(l => l.action === filterAction.value)
  }

  if (filterTargetType.value) {
    result = result.filter(l => l.targetType === filterTargetType.value)
  }

  return result
})

const targetTypeOptions = [
  { label: '作品', value: 'landscape' },
  { label: '养护记录', value: 'care_record' },
  { label: '规则', value: 'rule' },
  { label: '批次', value: 'batch' }
]

const actionTypeColors: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  landscape_create: 'success',
  landscape_update: 'info',
  landscape_delete: 'error',
  landscape_sold: 'default',
  care_record_create: 'success',
  care_record_delete: 'error',
  batch_operation: 'warning',
  abnormal_open: 'warning',
  abnormal_close: 'success',
  rule_update: 'info',
  batch_import: 'default',
  batch_export: 'default'
}

const columns = [
  {
    title: '时间',
    key: 'createdAt',
    width: 180,
    render(row: OperationLog) {
      const date = new Date(row.createdAt)
      return date.toLocaleString('zh-CN')
    }
  },
  {
    title: '操作类型',
    key: 'actionLabel',
    width: 140,
    render(row: OperationLog) {
      return h(
        NTag,
        { type: actionTypeColors[row.action] || 'default', size: 'small' },
        { default: () => row.actionLabel }
      )
    }
  },
  {
    title: '对象类型',
    key: 'targetType',
    width: 100,
    render(row: OperationLog) {
      const labels: Record<string, string> = {
        landscape: '作品',
        care_record: '养护记录',
        rule: '规则',
        batch: '批次'
      }
      return labels[row.targetType] || row.targetType
    }
  },
  {
    title: '对象名称',
    key: 'targetName',
    width: 160
  },
  {
    title: '操作人',
    key: 'operator',
    width: 100
  },
  {
    title: '详情',
    key: 'detail',
    ellipsis: {
      tooltip: true
    }
  }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">操作日志</h2>
        <p class="text-sm text-gray-500 mt-1">查看所有系统操作记录</p>
      </div>
      <div>
        <n-tag type="info" size="large">
          共 {{ filteredLogs.length }} 条记录
        </n-tag>
      </div>
    </div>

    <n-card>
      <div class="flex flex-wrap gap-4 mb-6">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索对象名称、详情..."
          style="width: 280px"
          clearable
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>

        <n-select
          v-model:value="filterAction"
          placeholder="操作类型"
          :options="logActionTypeOptions.map(o => ({ label: o.label, value: o.value }))"
          style="width: 160px"
          clearable
        />

        <n-select
          v-model:value="filterTargetType"
          placeholder="对象类型"
          :options="targetTypeOptions"
          style="width: 140px"
          clearable
        />
      </div>

      <div class="overflow-x-auto">
        <n-data-table
          v-if="filteredLogs.length > 0"
          :columns="columns as any"
          :data="filteredLogs"
          :bordered="false"
          :single-line="false"
          striped
          style="min-width: 800px"
        />
        <n-empty v-else description="暂无操作记录" />
      </div>
    </n-card>
  </div>
</template>
