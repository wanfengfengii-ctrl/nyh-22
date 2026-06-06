<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NInput,
  NSelect,
  NCard,
  NIcon,
  NSpace,
  NEmpty,
  NTag,
  NPopconfirm
} from 'naive-ui'
import { Search, Eye, RotateCcw, FileText } from 'lucide-vue-next'
import { useLandscapeStore } from '@/stores/landscape'
import StatusTag from '@/components/StatusTag.vue'
import { mossSpeciesOptions, containerTypeOptions } from '@/types'
import type { MicroLandscape } from '@/types'
import { message as discreteMessage } from '@/utils/discrete'

const router = useRouter()
const store = useLandscapeStore()

const searchKeyword = ref('')
const filterSpecies = ref<string | null>(null)
const filterContainer = ref<string | null>(null)

const filteredSold = computed(() => {
  let result = store.soldLandscapes

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(
      l =>
        l.code.toLowerCase().includes(keyword) ||
        l.mossSpecies.includes(keyword) ||
        l.containerType.includes(keyword)
    )
  }

  if (filterSpecies.value) {
    result = result.filter(l => l.mossSpecies === filterSpecies.value)
  }

  if (filterContainer.value) {
    result = result.filter(l => l.containerType === filterContainer.value)
  }

  return result
})

const columns = [
  {
    title: '作品编号',
    key: 'code',
    width: 120
  },
  {
    title: '容器类型',
    key: 'containerType',
    width: 120
  },
  {
    title: '苔藓品种',
    key: 'mossSpecies',
    width: 120
  },
  {
    title: '制作日期',
    key: 'creationDate',
    width: 120
  },
  {
    title: '售出日期',
    key: 'updatedAt',
    width: 120,
    render(row: MicroLandscape) {
      return row.updatedAt ? row.updatedAt.split('T')[0] : '-'
    }
  },
  {
    title: '养护次数',
    key: 'careCount',
    width: 100,
    render(row: MicroLandscape) {
      return store.getRecordsByLandscapeId(row.id).length
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row: MicroLandscape) {
      return h(StatusTag, { status: row.status })
    }
  },
  {
    title: '备注',
    key: 'notes',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 160,
    render(row: MicroLandscape) {
      return h(NSpace, { size: 'small' }, {
        default: () => [
          h(
            NButton,
            {
              size: 'small',
              type: 'primary',
              onClick: () => router.push(`/landscapes/${row.id}`)
            },
            {
              default: () => h(NIcon, { size: 16 }, { default: () => h(Eye) })
            }
          ),
          h(
            NButton,
            {
              size: 'small',
              onClick: () => handleViewRecords(row.id)
            },
            {
              default: () => h(NIcon, { size: 16 }, { default: () => h(FileText) })
            }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleRestore(row.id)
            },
            {
              default: () => '确定要将此作品恢复为未售出状态吗？',
              trigger: () => h(
                NButton,
                { size: 'small', type: 'warning' },
                {
                  default: () => h(NIcon, { size: 16 }, { default: () => h(RotateCcw) })
                }
              )
            }
          )
        ]
      })
    }
  }
]

function handleViewRecords(id: string) {
  router.push(`/landscapes/${id}`)
}

function handleRestore(id: string) {
  const result = store.updateLandscape(id, { isSold: false })
  if (result.success) {
    discreteMessage.success('已恢复为未售出状态')
  } else {
    discreteMessage.error(result.message || '操作失败')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">已售出作品归档</h2>
        <p class="text-sm text-gray-500 mt-1">查看和管理已售出的微景观作品</p>
      </div>
      <div>
        <n-tag type="success" size="large">
          共 {{ filteredSold.length }} 件已售出作品
        </n-tag>
      </div>
    </div>

    <n-card>
      <div class="flex flex-wrap gap-4 mb-6">
        <n-input
          v-model:value="searchKeyword"
          placeholder="搜索编号、品种、容器..."
          style="width: 280px"
          clearable
        >
          <template #prefix>
            <n-icon><Search /></n-icon>
          </template>
        </n-input>

        <n-select
          v-model:value="filterSpecies"
          placeholder="筛选品种"
          :options="mossSpeciesOptions.map(o => ({ label: o, value: o }))"
          style="width: 160px"
          clearable
        />

        <n-select
          v-model:value="filterContainer"
          placeholder="筛选容器"
          :options="containerTypeOptions.map(o => ({ label: o, value: o }))"
          style="width: 160px"
          clearable
        />
      </div>

      <div class="overflow-x-auto">
        <n-data-table
          v-if="filteredSold.length > 0"
          :columns="columns as any"
          :data="filteredSold"
          :bordered="false"
          :single-line="false"
          striped
          style="min-width: 900px"
        />
        <n-empty v-else description="暂无已售出作品" />
      </div>
    </n-card>
  </div>
</template>
