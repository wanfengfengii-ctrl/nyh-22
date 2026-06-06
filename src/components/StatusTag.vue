<script setup lang="ts">
import type { LandscapeStatus } from '@/types'

defineProps<{
  status: LandscapeStatus
}>()

const statusMap: Record<LandscapeStatus, { label: string; type: string }> = {
  healthy: { label: '生长正常', type: 'success' },
  yellowing: { label: '出现黄化', type: 'warning' },
  mold: { label: '出现霉斑', type: 'error' },
  sold: { label: '已售出', type: 'default' }
}
</script>

<template>
  <n-tag :type="statusMap[status].type" size="small" round>
    {{ statusMap[status].label }}
  </n-tag>
</template>
