<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NSpace,
  NDescriptions,
  NDescriptionsItem,
  NEmpty,
  NTag,
  NPopconfirm,
  NIcon,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import { ArrowLeft, Plus, Trash2, AlertTriangle } from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import StatusTag from '@/components/StatusTag.vue'
import CareRecordForm from '@/components/CareRecordForm.vue'
import type { CareRecord, CareType } from '@/types'
import { careTypeOptions } from '@/types'
import { message } from '@/utils/discrete'

const route = useRoute()
const router = useRouter()
const store = useLandscapeStore()

const landscapeId = computed(() => route.params.id as string)
const landscape = computed(() => store.getLandscapeById(landscapeId.value))
const careRecords = computed(() => store.getRecordsByLandscapeId(landscapeId.value))

const showCareForm = ref(false)
const isSold = computed(() => landscape.value?.isSold || landscape.value?.status === 'sold')

const careTypeMap: Record<CareType, { label: string; color: string }> = {
  spray: { label: '喷雾', color: 'info' },
  water: { label: '浇水', color: 'success' },
  clean: { label: '清洁', color: 'default' },
  prune: { label: '修剪', color: 'warning' },
  other: { label: '其他', color: 'default' }
}

function handleDeleteRecord(id: string) {
  store.deleteCareRecord(id)
  message.success('记录已删除')
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <n-button text @click="router.push('/')">
        <template #icon>
          <n-icon><ArrowLeft /></n-icon>
        </template>
        返回列表
      </n-button>
      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          {{ landscape?.code }} - {{ landscape?.mossSpecies }}
        </h2>
        <p class="text-sm text-gray-500 mt-1">作品详情与养护记录</p>
      </div>
    </div>

    <div v-if="landscape" class="grid grid-cols-3 gap-6">
      <div class="col-span-1">
        <n-card title="基本信息" class="sticky top-0">
          <template #header-extra>
            <StatusTag :status="landscape.status" />
          </template>
          <n-descriptions :column="1" label-placement="left" label-style="width: 100px">
            <n-descriptions-item label="作品编号">{{ landscape.code }}</n-descriptions-item>
            <n-descriptions-item label="容器类型">{{ landscape.containerType }}</n-descriptions-item>
            <n-descriptions-item label="苔藓品种">{{ landscape.mossSpecies }}</n-descriptions-item>
            <n-descriptions-item label="制作日期">{{ landscape.creationDate }}</n-descriptions-item>
            <n-descriptions-item label="光照条件">{{ landscape.lightCondition }}</n-descriptions-item>
            <n-descriptions-item label="湿度区间">
              {{ landscape.humidityMin }}% ~ {{ landscape.humidityMax }}%
            </n-descriptions-item>
            <n-descriptions-item label="最近养护">{{ landscape.lastCareDate }}</n-descriptions-item>
            <n-descriptions-item label="是否售出">
              <n-tag :type="landscape.isSold ? 'error' : 'success'" size="small">
                {{ landscape.isSold ? '已售出' : '在库' }}
              </n-tag>
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="landscape.notes" class="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div class="flex items-start gap-2">
              <n-icon size="18" class="text-amber-600 mt-0.5">
                <AlertTriangle />
              </n-icon>
              <div>
                <p class="text-sm font-medium text-amber-800">备注说明</p>
                <p class="text-sm text-amber-700 mt-1">{{ landscape.notes }}</p>
              </div>
            </div>
          </div>

          <n-button
            v-if="!isSold"
            type="primary"
            block
            class="mt-6"
            @click="showCareForm = true"
          >
            <template #icon>
              <n-icon><Plus /></n-icon>
            </template>
            新增养护记录
          </n-button>
          <n-tag v-else type="error" round class="w-full justify-center mt-6">
            已售出，无法新增养护记录
          </n-tag>
        </n-card>
      </div>

      <div class="col-span-2">
        <n-card title="养护记录">
          <template #header-extra>
            <span class="text-sm text-gray-500">共 {{ careRecords.length }} 条记录</span>
          </template>

          <div v-if="careRecords.length === 0">
            <n-empty description="暂无养护记录" />
          </div>

          <n-timeline v-else>
            <n-timeline-item
              v-for="record in careRecords"
              :key="record.id"
              :type="careTypeMap[record.careType].color as any"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-gray-800">{{ record.careDate }}</span>
                    <n-tag :type="careTypeMap[record.careType].color as any" size="small">
                      {{ careTypeMap[record.careType].label }}
                    </n-tag>
                    <span class="text-sm text-gray-500">湿度: {{ record.humidity }}%</span>
                  </div>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-sm text-gray-500">状态变化:</span>
                    <StatusTag :status="record.statusBefore" />
                    <span class="text-gray-400">→</span>
                    <StatusTag :status="record.statusAfter" />
                  </div>
                  <p v-if="record.notes" class="text-sm text-gray-600 mt-2">
                    {{ record.notes }}
                  </p>
                </div>
                <n-popconfirm @positive-click="handleDeleteRecord(record.id)">
                  <template #trigger>
                    <n-button text type="error" size="small">
                      <template #icon>
                        <n-icon size="14"><Trash2 /></n-icon>
                      </template>
                    </n-button>
                  </template>
                  确定删除这条养护记录吗？
                </n-popconfirm>
              </div>
            </n-timeline-item>
          </n-timeline>
        </n-card>
      </div>
    </div>

    <CareRecordForm
      v-model:visible="showCareForm"
      :landscape-id="landscapeId"
      @success="showCareForm = false"
    />
  </div>
</template>
